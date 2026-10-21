package com.bd.fantine.feature.dashboard.data.repository

import com.bd.fantine.core.common.Resource
import com.bd.fantine.core.network.ApiService
import com.bd.fantine.core.network.dto.CustomerDto
import com.bd.fantine.feature.dashboard.domain.model.AdminCustomer
import com.bd.fantine.feature.dashboard.domain.model.Order
import com.bd.fantine.feature.dashboard.domain.repository.CustomerRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class CustomerRepositoryImpl(
    private val apiService: ApiService
) : CustomerRepository {

    private var cachedCustomers: List<AdminCustomer>? = null

    override suspend fun getCustomers(orders: List<Order>, forceRefresh: Boolean): Resource<List<AdminCustomer>> =
        withContext(Dispatchers.IO) {
            if (!forceRefresh && cachedCustomers != null && cachedCustomers!!.isNotEmpty()) {
                return@withContext Resource.Success(cachedCustomers!!)
            }

            try {
                // 1. Fetch from backend API
                val apiCustomers = try {
                    val res = apiService.getCustomers()
                    if (res.isSuccessful && res.body() != null) res.body()!! else emptyList()
                } catch (e: Exception) {
                    emptyList<CustomerDto>()
                }

                // 2. Aggregate and enrich from Orders history (deduplicated by phone number)
                val customerMap = mutableMapOf<String, AdminCustomer>()

                // Populate from backend API customer records first
                for (dto in apiCustomers) {
                    val key = dto.phone?.trim() ?: dto.id ?: continue
                    customerMap[key] = AdminCustomer(
                        id = dto.id ?: "cust-${customerMap.size + 1}",
                        name = dto.name ?: "Unknown Customer",
                        phone = dto.phone ?: "",
                        email = dto.email ?: "",
                        address = dto.address ?: "",
                        district = dto.district ?: "Dhaka",
                        orderCount = dto.ordersCount ?: 0,
                        totalSpent = dto.totalSpent ?: 0.0,
                        lastOrderDate = dto.createdAt ?: ""
                    )
                }

                // Merge and enrich with actual live orders (so guest checkouts are fully visible CRM entries)
                for (order in orders) {
                    val phoneKey = order.phone.trim()
                    if (phoneKey.isEmpty()) continue

                    val existing = customerMap[phoneKey]
                    if (existing != null) {
                        val bestAddress = if (existing.address.isNotBlank()) existing.address else order.address
                        val bestName = if (existing.name != "Unknown Customer" && existing.name.isNotBlank()) existing.name else order.customerName

                        customerMap[phoneKey] = existing.copy(
                            name = bestName,
                            address = bestAddress,
                            district = if (existing.district.isNotBlank()) existing.district else order.district,
                            orderCount = existing.orderCount + 1,
                            totalSpent = existing.totalSpent + order.totalAmount,
                            lastOrderDate = if (order.createdAt > existing.lastOrderDate) order.createdAt else existing.lastOrderDate
                        )
                    } else {
                        customerMap[phoneKey] = AdminCustomer(
                            id = "cust-${order.id}",
                            name = if (order.customerName.isNotBlank()) order.customerName else "Customer ($phoneKey)",
                            phone = phoneKey,
                            email = "",
                            address = order.address,
                            district = order.district,
                            orderCount = 1,
                            totalSpent = order.totalAmount,
                            lastOrderDate = order.createdAt
                        )
                    }
                }

                val resultList = customerMap.values.sortedByDescending { it.totalSpent }
                cachedCustomers = resultList
                Resource.Success(resultList)
            } catch (e: Exception) {
                cachedCustomers?.let { return@withContext Resource.Success(it) }
                Resource.Error(e.message ?: "Failed to load customers", e)
            }
        }
}
