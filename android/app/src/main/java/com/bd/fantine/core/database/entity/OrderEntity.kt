package com.bd.fantine.core.database.entity

data class OrderEntity(
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
    val itemsSummary: String,
    val notes: String,
    val courierProvider: String = "",
    val trackingCode: String = ""
)
