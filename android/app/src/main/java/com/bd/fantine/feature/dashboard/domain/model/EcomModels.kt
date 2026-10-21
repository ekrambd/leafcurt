package com.bd.fantine.feature.dashboard.domain.model

data class AdminProduct(
    val id: String,
    val title: String,
    val price: Double,
    val regularPrice: Double,
    val costPrice: Double,
    val stock: Int,
    val category: String,
    val series: String,
    val brand: String,
    val image: String,
    val description: String,
    val isAvailable: Boolean,
    val sku: String
) {
    val isLowStock: Boolean
        get() = stock in 1..15

    val isOutOfStock: Boolean
        get() = stock <= 0

    val discountPercentage: Int
        get() = if (regularPrice > price && regularPrice > 0) {
            (((regularPrice - price) / regularPrice) * 100).toInt()
        } else 0
}

data class AdminCustomer(
    val id: String,
    val name: String,
    val phone: String,
    val email: String,
    val address: String,
    val district: String,
    val orderCount: Int,
    val totalSpent: Double,
    val lastOrderDate: String
)

data class SalesTrendPoint(
    val dayLabel: String,
    val revenue: Double,
    val orderCount: Int,
    val isToday: Boolean = false
)

data class InventorySummary(
    val totalProducts: Int = 0,
    val totalStockUnits: Int = 0,
    val totalStockValuation: Double = 0.0,
    val lowStockCount: Int = 0,
    val outOfStockCount: Int = 0
)
