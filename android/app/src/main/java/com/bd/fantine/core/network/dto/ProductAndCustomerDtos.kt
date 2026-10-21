package com.bd.fantine.core.network.dto

import com.google.gson.annotations.SerializedName

data class ProductDto(
    @SerializedName("id") val id: String,
    @SerializedName("title") val title: String? = null,
    @SerializedName("price") val price: Double? = null,
    @SerializedName("regularPrice") val regularPrice: Double? = null,
    @SerializedName("costPrice") val costPrice: Double? = null,
    @SerializedName("stockQuantity") val stockQuantity: Int? = null,
    @SerializedName("stock") val stock: Int? = null,
    @SerializedName("category") val category: String? = null,
    @SerializedName("series") val series: String? = null,
    @SerializedName("brand") val brand: String? = null,
    @SerializedName("coverImage") val coverImage: String? = null,
    @SerializedName("image") val image: String? = null,
    @SerializedName("description") val description: String? = null,
    @SerializedName("isAvailable") val isAvailable: Boolean? = null,
    @SerializedName("sku") val sku: String? = null
)

data class CustomerDto(
    @SerializedName("id") val id: String? = null,
    @SerializedName("name") val name: String? = null,
    @SerializedName("phone") val phone: String? = null,
    @SerializedName("email") val email: String? = null,
    @SerializedName("address") val address: String? = null,
    @SerializedName("district") val district: String? = null,
    @SerializedName("ordersCount") val ordersCount: Int? = null,
    @SerializedName("totalSpent") val totalSpent: Double? = null,
    @SerializedName("createdAt") val createdAt: String? = null
)
