package com.bd.fantine.feature.dashboard.domain.model

data class Order(
    val id: String,
    val customerName: String,
    val phone: String,
    val address: String,
    val district: String,
    val totalAmount: Double,
    val deliveryCharge: Double,
    val paymentMethod: String,
    val status: String,
    val createdAt: String,
    val items: List<OrderItem>,
    val notes: String,
    val courierProvider: String? = null,
    val trackingCode: String? = null
)

data class OrderItem(
    val id: String,
    val title: String,
    val quantity: Int,
    val price: Double
)

data class DashboardMetrics(
    val totalRevenue: Double = 0.0,
    val totalOrders: Int = 0,
    val pendingOrders: Int = 0,
    val confirmedOrders: Int = 0,
    val shippedOrders: Int = 0,
    val deliveredOrders: Int = 0,
    val cancelledOrders: Int = 0
)
