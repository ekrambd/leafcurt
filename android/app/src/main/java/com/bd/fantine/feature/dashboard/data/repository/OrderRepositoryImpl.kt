package com.bd.fantine.feature.dashboard.data.repository

import com.bd.fantine.core.common.Resource
import com.bd.fantine.core.database.dao.OrderDao
import com.bd.fantine.core.network.ApiService
import com.bd.fantine.core.notification.NotificationHelper
import com.bd.fantine.feature.dashboard.data.mapper.OrderMapper
import com.bd.fantine.feature.dashboard.domain.model.DashboardMetrics
import com.bd.fantine.feature.dashboard.domain.model.Order
import com.bd.fantine.feature.dashboard.domain.repository.OrderRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

class OrderRepositoryImpl(
    private val apiService: ApiService,
    private val orderDao: OrderDao,
    private val notificationHelper: NotificationHelper
) : OrderRepository {

    override fun observeOrders(): Flow<List<Order>> {
        return orderDao.observeOrders().map { entities ->
            entities.map { OrderMapper.entityToDomain(it) }
        }
    }

    override fun observeMetrics(): Flow<DashboardMetrics> {
        return orderDao.observeOrders().map { entities ->
            var totalRevenue = 0.0
            var pending = 0
            var confirmed = 0
            var shipped = 0
            var delivered = 0
            var cancelled = 0

            for (entity in entities) {
                totalRevenue += entity.totalAmount
                when (entity.status.lowercase()) {
                    "pending" -> pending++
                    "confirmed", "packaging", "ready for shipment" -> confirmed++
                    "shipped" -> shipped++
                    "delivered" -> delivered++
                    "cancelled", "return" -> cancelled++
                    else -> pending++
                }
            }

            DashboardMetrics(
                totalRevenue = totalRevenue,
                totalOrders = entities.size,
                pendingOrders = pending,
                confirmedOrders = confirmed,
                shippedOrders = shipped,
                deliveredOrders = delivered,
                cancelledOrders = cancelled
            )
        }
    }

    override suspend fun syncOrders(): Resource<List<Order>> {
        return try {
            val response = apiService.getOrders()
            if (response.isSuccessful && response.body() != null) {
                val dts = response.body()!!
                val entities = dts.map { OrderMapper.dtoToEntity(it) }
                orderDao.replaceAll(entities)
                val domainList = entities.map { OrderMapper.entityToDomain(it) }
                Resource.Success(domainList)
            } else {
                Resource.Error("Failed to fetch orders from server: ${response.message()}")
            }
        } catch (e: Exception) {
            Resource.Error(e.localizedMessage ?: "Network connection error")
        }
    }

    override suspend fun getOrderById(id: String): Order? {
        val entity = orderDao.getOrderById(id) ?: return null
        return OrderMapper.entityToDomain(entity)
    }

    override suspend fun updateOrderStatus(id: String, newStatus: String): Resource<Unit> {
        return try {
            // Optimistic update in Room database
            orderDao.updateStatus(id, newStatus)

            // Sync with backend API
            val response = apiService.updateOrderStatus(id, mapOf("status" to newStatus))
            if (response.isSuccessful) {
                Resource.Success(Unit)
            } else {
                Resource.Error("Server update failed: ${response.message()}")
            }
        } catch (e: Exception) {
            Resource.Error(e.localizedMessage ?: "Failed to update order status")
        }
    }

    override suspend fun checkNewOrdersAndNotify(): Int {
        return try {
            val existingIds = orderDao.getAllOrderIds().toSet()
            val response = apiService.getOrders()
            if (!response.isSuccessful || response.body() == null) return 0

            val remoteOrders = response.body()!!
            val newOrders = remoteOrders.filter { !existingIds.contains(it.id) }

            if (newOrders.isNotEmpty()) {
                val newEntities = newOrders.map { OrderMapper.dtoToEntity(it) }
                orderDao.insertOrders(newEntities)

                // Trigger Android system notification for each newly arrived order
                for (dto in newOrders.take(3)) {
                    val entity = OrderMapper.dtoToEntity(dto)
                    notificationHelper.showNewOrderNotification(
                        orderId = entity.id,
                        customerName = entity.customerName,
                        amount = entity.totalAmount,
                        phone = entity.phone,
                        district = entity.district
                    )
                }
            }
            newOrders.size
        } catch (e: Exception) {
            0
        }
    }

    override suspend fun dispatchCourier(
        orderId: String,
        provider: String
    ): Resource<com.bd.fantine.core.network.dto.CourierDispatchResponse> {
        val entity = orderDao.getOrderById(orderId)
            ?: return Resource.Error("Order not found in local database")
        val order = OrderMapper.entityToDomain(entity)

        return try {
            val orderMap = mutableMapOf<String, Any?>(
                "id" to order.id,
                "customerName" to order.customerName,
                "phone" to order.phone,
                "address" to order.address,
                "district" to order.district,
                "totalPrice" to order.totalAmount,
                "status" to order.status,
                "paymentMethod" to order.paymentMethod,
                "productTitle" to if (order.items.isNotEmpty()) {
                    order.items.joinToString(", ") { "${it.title} x${it.quantity}" }
                } else "FANTINE Skincare Item"
            )

            val request = com.bd.fantine.core.network.dto.CourierDispatchRequest(
                order = orderMap,
                storeId = 461309L, // Active 'Fantine BD' store
                itemWeight = 0.5,
                itemQuantity = if (order.items.isNotEmpty()) order.items.sumOf { it.quantity } else 1,
                specialInstruction = "Handle with care - Premium Korean Skincare"
            )

            val response = if (provider.equals("pathao", ignoreCase = true)) {
                apiService.dispatchPathao(request)
            } else {
                apiService.dispatchSteadfast(request)
            }

            if (response.isSuccessful && response.body() != null) {
                val body = response.body()!!
                if (body.success) {
                    val tracking = body.trackingCode ?: body.consignmentId ?: ""
                    // Optimistic update in SQLite
                    orderDao.updateCourierInfo(order.id, provider.lowercase(), tracking, "Shipped")
                    // Notify backend of status change
                    try {
                        apiService.updateOrderStatus(
                            order.id,
                            mapOf("status" to "Shipped")
                        )
                    } catch (e: Exception) {
                        // non-blocking
                    }
                    Resource.Success(body)
                } else {
                    Resource.Error(body.message ?: body.error ?: "Courier booking failed")
                }
            } else {
                Resource.Error("Courier API error: ${response.code()} ${response.message()}")
            }
        } catch (e: Exception) {
            Resource.Error(e.localizedMessage ?: "Failed to connect to courier server")
        }
    }

    override suspend fun checkCustomerFraud(phone: String): Resource<com.bd.fantine.core.network.dto.FraudCheckResponse> {
        return try {
            val response = apiService.checkSteadfastFraud(phone)
            if (response.isSuccessful && response.body() != null) {
                Resource.Success(response.body()!!)
            } else {
                Resource.Error(response.message())
            }
        } catch (e: Exception) {
            Resource.Error(e.localizedMessage ?: "Fraud check failed")
        }
    }

    override suspend fun deleteOrder(id: String): Resource<Unit> {
        return try {
            // 1. Immediately delete from local SQLite database (reactive Flow updates UI instantly)
            orderDao.deleteById(id)

            // 2. Delete from server
            val response = apiService.deleteOrder(id)
            if (response.isSuccessful) {
                Resource.Success(Unit)
            } else {
                Resource.Error("Server error: ${response.message()}")
            }
        } catch (e: Exception) {
            Resource.Error(e.localizedMessage ?: "Failed to delete order from server")
        }
    }
}
