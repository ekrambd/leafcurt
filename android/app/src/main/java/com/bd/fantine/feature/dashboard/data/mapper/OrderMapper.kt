package com.bd.fantine.feature.dashboard.data.mapper

import com.bd.fantine.core.database.entity.OrderEntity
import com.bd.fantine.core.network.dto.OrderDto
import com.bd.fantine.feature.dashboard.domain.model.Order
import com.bd.fantine.feature.dashboard.domain.model.OrderItem
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken

object OrderMapper {

    private val gson = Gson()

    fun dtoToEntity(dto: OrderDto): OrderEntity {
        val customer = dto.customerName ?: dto.name ?: "Guest Customer"
        val phoneNum = dto.phone ?: dto.customerPhone ?: ""
        val total = dto.totalPrice ?: dto.totalAmount ?: dto.price ?: 0.0
        val delivery = dto.deliveryCharge ?: 60.0
        val itemsList = dto.items?.map { item ->
            OrderItem(
                id = item.id ?: item.productId ?: "",
                title = item.productTitle ?: item.title ?: "Korean Skincare Item",
                quantity = item.quantity,
                price = item.price
            )
        } ?: if (!dto.productTitle.isNullOrBlank()) {
            listOf(OrderItem(id = "1", title = dto.productTitle, quantity = 1, price = total))
        } else emptyList()

        val itemsJson = gson.toJson(itemsList)

        val courier = dto.courierProvider ?: ""
        val track = dto.trackingCode ?: dto.steadfastTrackingCode ?: dto.pathaoTrackingCode ?: dto.pathaoConsignmentId ?: ""

        return OrderEntity(
            id = dto.id,
            customerName = customer,
            phone = phoneNum,
            address = dto.address ?: "Dhaka, Bangladesh",
            district = dto.district ?: "Dhaka",
            totalAmount = total,
            deliveryCharge = delivery,
            paymentMethod = dto.paymentMethod ?: "COD",
            status = dto.status ?: "Pending",
            createdAt = dto.createdAt ?: dto.orderDate ?: System.currentTimeMillis().toString(),
            itemsSummary = itemsJson,
            notes = dto.notes ?: "",
            courierProvider = courier,
            trackingCode = track
        )
    }

    fun entityToDomain(entity: OrderEntity): Order {
        val items: List<OrderItem> = try {
            val type = object : TypeToken<List<OrderItem>>() {}.type
            gson.fromJson(entity.itemsSummary, type) ?: emptyList()
        } catch (e: Exception) {
            emptyList()
        }

        return Order(
            id = entity.id,
            customerName = entity.customerName,
            phone = entity.phone,
            address = entity.address,
            district = entity.district,
            totalAmount = entity.totalAmount,
            deliveryCharge = entity.deliveryCharge,
            paymentMethod = entity.paymentMethod,
            status = entity.status,
            createdAt = entity.createdAt,
            items = items,
            notes = entity.notes,
            courierProvider = entity.courierProvider.ifEmpty { null },
            trackingCode = entity.trackingCode.ifEmpty { null }
        )
    }
}
