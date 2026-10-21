package com.bd.fantine.feature.dashboard.presentation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.bd.fantine.core.common.Resource
import com.bd.fantine.feature.auth.domain.repository.AuthRepository
import com.bd.fantine.feature.dashboard.domain.model.Order
import com.bd.fantine.feature.dashboard.domain.model.SalesTrendPoint
import com.bd.fantine.feature.dashboard.domain.repository.CustomerRepository
import com.bd.fantine.feature.dashboard.domain.repository.OrderRepository
import com.bd.fantine.feature.dashboard.domain.repository.ProductRepository
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

class DashboardViewModel(
    private val orderRepository: OrderRepository,
    private val authRepository: AuthRepository,
    private val productRepository: ProductRepository,
    private val customerRepository: CustomerRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(DashboardUiState(isLoading = true))
    val uiState = _uiState.asStateFlow()

    init {
        observeDatabase()
        initialSync()
        startPeriodicSyncTicker()
    }

    private fun observeDatabase() {
        viewModelScope.launch {
            orderRepository.observeOrders().collectLatest { orders ->
                val trend = computeSalesTrend(orders)
                _uiState.update { current ->
                    val filtered = applyFilter(orders, current.selectedStatusFilter, current.searchQuery)
                    current.copy(
                        orders = orders,
                        filteredOrders = filtered,
                        salesTrend = trend,
                        isLoading = false
                    )
                }
                // Enrich customers from updated orders
                loadCustomers(orders, forceRefresh = false)
            }
        }

        viewModelScope.launch {
            orderRepository.observeMetrics().collectLatest { metrics ->
                _uiState.update { it.copy(metrics = metrics) }
            }
        }
    }

    private fun initialSync() {
        viewModelScope.launch {
            _uiState.update { it.copy(isRefreshing = true) }
            orderRepository.syncOrders()
            loadProducts(forceRefresh = true)
            _uiState.update { it.copy(isRefreshing = false) }
        }
    }

    private fun loadProducts(forceRefresh: Boolean) {
        viewModelScope.launch {
            when (val res = productRepository.getProducts(forceRefresh)) {
                is Resource.Success -> {
                    _uiState.update { it.copy(products = res.data) }
                }
                is Resource.Error -> {
                    // Non-blocking
                }
                Resource.Loading -> {}
            }
        }
    }

    private fun loadCustomers(orders: List<Order>, forceRefresh: Boolean) {
        viewModelScope.launch {
            when (val res = customerRepository.getCustomers(orders, forceRefresh)) {
                is Resource.Success -> {
                    _uiState.update { it.copy(customers = res.data) }
                }
                is Resource.Error -> {
                    // Non-blocking
                }
                Resource.Loading -> {}
            }
        }
    }

    // Foreground Ticker: Checks for brand-new orders every 30 seconds and fires system notifications
    private fun startPeriodicSyncTicker() {
        viewModelScope.launch {
            while (isActive) {
                delay(30_000)
                try {
                    orderRepository.checkNewOrdersAndNotify()
                } catch (e: Exception) {
                    // non-blocking
                }
            }
        }
    }

    fun onAction(action: DashboardAction) {
        when (action) {
            is DashboardAction.SwitchTab -> {
                _uiState.update { it.copy(currentTab = action.tab) }
            }
            DashboardAction.Refresh -> refreshAllData()
            is DashboardAction.FilterSelected -> {
                _uiState.update { current ->
                    val filtered = applyFilter(current.orders, action.status, current.searchQuery)
                    current.copy(selectedStatusFilter = action.status, filteredOrders = filtered)
                }
            }
            is DashboardAction.SearchChanged -> {
                _uiState.update { current ->
                    val filtered = applyFilter(current.orders, current.selectedStatusFilter, action.query)
                    current.copy(searchQuery = action.query, filteredOrders = filtered)
                }
            }
            is DashboardAction.UpdateOrderStatus -> {
                viewModelScope.launch {
                    orderRepository.updateOrderStatus(action.orderId, action.newStatus)
                }
            }
            is DashboardAction.SelectOrder -> {
                val order = _uiState.value.orders.find { it.id == action.orderId }
                _uiState.update { it.copy(selectedOrder = order) }
            }
            is DashboardAction.DispatchToCourier -> {
                viewModelScope.launch {
                    _uiState.update { it.copy(isDispatchingCourier = true, courierMessage = null) }
                    when (val res = orderRepository.dispatchCourier(action.orderId, action.provider)) {
                        is Resource.Success -> {
                            val tracking = res.data.trackingCode ?: res.data.consignmentId ?: ""
                            val msg = res.data.message ?: "Successfully booked with ${action.provider.uppercase()}! Tracking: $tracking"
                            _uiState.update {
                                it.copy(
                                    isDispatchingCourier = false,
                                    courierResult = res.data,
                                    courierMessage = msg
                                )
                            }
                        }
                        is Resource.Error -> {
                            _uiState.update {
                                it.copy(
                                    isDispatchingCourier = false,
                                    courierMessage = "Courier Dispatch Failed: ${res.message}"
                                )
                            }
                        }
                        Resource.Loading -> {}
                    }
                }
            }
            is DashboardAction.CheckCustomerTrust -> {
                viewModelScope.launch {
                    when (val res = orderRepository.checkCustomerFraud(action.phone)) {
                        is Resource.Success -> {
                            _uiState.update { it.copy(fraudCheckResult = res.data) }
                        }
                        else -> {}
                    }
                }
            }
            DashboardAction.DismissCourierMessage -> {
                _uiState.update { it.copy(courierMessage = null, courierResult = null) }
            }
            DashboardAction.Logout -> {
                viewModelScope.launch {
                    authRepository.logout()
                }
            }
            is DashboardAction.DeleteOrder -> {
                viewModelScope.launch {
                    orderRepository.deleteOrder(action.orderId)
                }
            }
            DashboardAction.DismissError -> {
                _uiState.update { it.copy(errorMessage = null) }
            }
        }
    }

    private fun refreshAllData() {
        viewModelScope.launch {
            _uiState.update { it.copy(isRefreshing = true, errorMessage = null) }
            orderRepository.syncOrders()
            loadProducts(forceRefresh = true)
            loadCustomers(_uiState.value.orders, forceRefresh = true)
            _uiState.update { it.copy(isRefreshing = false) }
        }
    }

    private fun applyFilter(orders: List<Order>, status: String, query: String): List<Order> {
        val q = query.trim().lowercase()
        return orders.filter { order ->
            val matchesStatus = if (status == "All") true else {
                order.status.equals(status, ignoreCase = true)
            }
            val matchesQuery = if (q.isEmpty()) true else {
                order.id.lowercase().contains(q) ||
                        order.customerName.lowercase().contains(q) ||
                        order.phone.contains(q) ||
                        order.district.lowercase().contains(q)
            }
            matchesStatus && matchesQuery
        }
    }

    private fun computeSalesTrend(orders: List<Order>): List<SalesTrendPoint> {
        // Last 7 days trend
        val calendar = Calendar.getInstance()
        val dayFormat = SimpleDateFormat("EEE", Locale.US)
        val isoFormat = SimpleDateFormat("yyyy-MM-dd", Locale.US)

        val dayPoints = mutableListOf<SalesTrendPoint>()
        val todayKey = isoFormat.format(calendar.time)

        // Generate past 7 days backwards then reverse
        for (i in 6 downTo 0) {
            val cal = Calendar.getInstance()
            cal.add(Calendar.DAY_OF_YEAR, -i)
            val dateKey = isoFormat.format(cal.time)
            val label = dayFormat.format(cal.time)
            val isToday = (dateKey == todayKey)

            // Match orders on this date
            val matchingOrders = orders.filter { order ->
                order.createdAt.startsWith(dateKey)
            }

            var rev = matchingOrders.sumOf { it.totalAmount }
            var count = matchingOrders.size

            // If orders don't have historical timestamps or everything was placed recently, distribute nicely
            if (orders.isNotEmpty() && dayPoints.all { it.revenue == 0.0 } && rev == 0.0 && isToday) {
                rev = orders.sumOf { it.totalAmount }
                count = orders.size
            }

            dayPoints.add(
                SalesTrendPoint(
                    dayLabel = label,
                    revenue = rev,
                    orderCount = count,
                    isToday = isToday
                )
            )
        }

        return dayPoints
    }

    class Factory(
        private val orderRepository: OrderRepository,
        private val authRepository: AuthRepository,
        private val productRepository: ProductRepository,
        private val customerRepository: CustomerRepository
    ) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
            return DashboardViewModel(orderRepository, authRepository, productRepository, customerRepository) as T
        }
    }
}
