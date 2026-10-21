package com.bd.fantine.feature.dashboard.presentation

import com.bd.fantine.core.network.dto.CourierDispatchResponse
import com.bd.fantine.core.network.dto.FraudCheckResponse
import com.bd.fantine.feature.dashboard.domain.model.AdminCustomer
import com.bd.fantine.feature.dashboard.domain.model.AdminProduct
import com.bd.fantine.feature.dashboard.domain.model.DashboardMetrics
import com.bd.fantine.feature.dashboard.domain.model.Order
import com.bd.fantine.feature.dashboard.domain.model.SalesTrendPoint

enum class DashboardTab(val title: String) {
    OVERVIEW("Dashboard"),
    ORDERS("Orders"),
    PRODUCTS("Products"),
    CUSTOMERS("Customers"),
    INVENTORY("Inventory")
}

data class DashboardUiState(
    val currentTab: DashboardTab = DashboardTab.OVERVIEW,
    val orders: List<Order> = emptyList(),
    val filteredOrders: List<Order> = emptyList(),
    val metrics: DashboardMetrics = DashboardMetrics(),
    val salesTrend: List<SalesTrendPoint> = emptyList(),
    val products: List<AdminProduct> = emptyList(),
    val customers: List<AdminCustomer> = emptyList(),
    val selectedStatusFilter: String = "All",
    val searchQuery: String = "",
    val isLoading: Boolean = false,
    val isRefreshing: Boolean = false,
    val errorMessage: String? = null,
    val selectedOrder: Order? = null,
    val isDispatchingCourier: Boolean = false,
    val courierResult: CourierDispatchResponse? = null,
    val courierMessage: String? = null,
    val fraudCheckResult: FraudCheckResponse? = null
)

sealed interface DashboardAction {
    data class SwitchTab(val tab: DashboardTab) : DashboardAction
    data object Refresh : DashboardAction
    data class FilterSelected(val status: String) : DashboardAction
    data class SearchChanged(val query: String) : DashboardAction
    data class UpdateOrderStatus(val orderId: String, val newStatus: String) : DashboardAction
    data class DispatchToCourier(val orderId: String, val provider: String) : DashboardAction
    data class CheckCustomerTrust(val phone: String) : DashboardAction
    data object DismissCourierMessage : DashboardAction
    data class SelectOrder(val orderId: String) : DashboardAction
    data class DeleteOrder(val orderId: String) : DashboardAction
    data object Logout : DashboardAction
    data object DismissError : DashboardAction
}
