package com.bd.fantine.core.database.dao

import com.bd.fantine.core.database.entity.OrderEntity
import kotlinx.coroutines.flow.Flow

interface OrderDao {

    fun observeOrders(): Flow<List<OrderEntity>>

    suspend fun getOrderById(id: String): OrderEntity?

    suspend fun getAllOrderIds(): List<String>

    suspend fun insertOrders(orders: List<OrderEntity>)

    suspend fun insertOrder(order: OrderEntity)

    suspend fun updateOrder(order: OrderEntity)

    suspend fun updateStatus(id: String, status: String)

    suspend fun updateCourierInfo(id: String, courierProvider: String, trackingCode: String, status: String)

    suspend fun deleteById(id: String)

    suspend fun clearAll()

    suspend fun replaceAll(orders: List<OrderEntity>)
}
