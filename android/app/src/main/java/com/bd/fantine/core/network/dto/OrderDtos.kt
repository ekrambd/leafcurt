package com.bd.fantine.core.network.dto

import com.google.gson.annotations.SerializedName

data class OrderDto(
    @SerializedName("id") val id: String,
    @SerializedName("customerName") val customerName: String? = null,
    @SerializedName("name") val name: String? = null,
    @SerializedName("phone") val phone: String? = null,
    @SerializedName("customerPhone") val customerPhone: String? = null,
    @SerializedName("address") val address: String? = null,
    @SerializedName("district") val district: String? = null,
    @SerializedName("totalPrice") val totalPrice: Double? = null,
    @SerializedName("totalAmount") val totalAmount: Double? = null,
    @SerializedName("price") val price: Double? = null,
    @SerializedName("deliveryCharge") val deliveryCharge: Double? = null,
    @SerializedName("paymentMethod") val paymentMethod: String? = null,
    @SerializedName("status") val status: String? = null,
    @SerializedName("createdAt") val createdAt: String? = null,
    @SerializedName("orderDate") val orderDate: String? = null,
    @SerializedName("items") val items: List<OrderItemDto>? = null,
    @SerializedName("notes") val notes: String? = null,
    @SerializedName("productTitle") val productTitle: String? = null,
    @SerializedName("courierProvider") val courierProvider: String? = null,
    @SerializedName("steadfastTrackingCode") val steadfastTrackingCode: String? = null,
    @SerializedName("pathaoConsignmentId") val pathaoConsignmentId: String? = null,
    @SerializedName("pathaoTrackingCode") val pathaoTrackingCode: String? = null,
    @SerializedName("trackingCode") val trackingCode: String? = null
)

data class OrderItemDto(
    @SerializedName("id") val id: String? = null,
    @SerializedName("productId") val productId: String? = null,
    @SerializedName("productTitle") val productTitle: String? = null,
    @SerializedName("title") val title: String? = null,
    @SerializedName("quantity") val quantity: Int = 1,
    @SerializedName("price") val price: Double = 0.0,
    @SerializedName("variantName") val variantName: String? = null
)
