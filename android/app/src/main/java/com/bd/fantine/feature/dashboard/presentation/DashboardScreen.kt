package com.bd.fantine.feature.dashboard.presentation

import android.content.Intent
import android.net.Uri
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Analytics
import androidx.compose.material.icons.filled.ArrowForwardIos
import androidx.compose.material.icons.filled.Call
import androidx.compose.material.icons.filled.Category
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Dashboard
import androidx.compose.material.icons.filled.ExitToApp
import androidx.compose.material.icons.filled.Inventory2
import androidx.compose.material.icons.filled.LocalShipping
import androidx.compose.material.icons.filled.PendingActions
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.ShoppingCart
import androidx.compose.material.icons.filled.TrendingUp
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.bd.fantine.feature.dashboard.domain.model.Order
import com.bd.fantine.feature.dashboard.presentation.components.CustomersView
import com.bd.fantine.feature.dashboard.presentation.components.InventoryView
import com.bd.fantine.feature.dashboard.presentation.components.ProductsView
import com.bd.fantine.feature.dashboard.presentation.components.SalesTrendChart
import com.bd.fantine.ui.theme.BrandGold
import com.bd.fantine.ui.theme.BrandGoldDark
import com.bd.fantine.ui.theme.BrandGoldLight
import com.bd.fantine.ui.theme.LightSlate
import com.bd.fantine.ui.theme.MutedSlate
import com.bd.fantine.ui.theme.Obsidian
import com.bd.fantine.ui.theme.ObsidianBorder
import com.bd.fantine.ui.theme.ObsidianCard
import com.bd.fantine.ui.theme.PureWhite
import com.bd.fantine.ui.theme.SilkWhite
import com.bd.fantine.ui.theme.StatusCancelledBg
import com.bd.fantine.ui.theme.StatusCancelledText
import com.bd.fantine.ui.theme.StatusConfirmedBg
import com.bd.fantine.ui.theme.StatusConfirmedText
import com.bd.fantine.ui.theme.StatusDeliveredBg
import com.bd.fantine.ui.theme.StatusDeliveredText
import com.bd.fantine.ui.theme.StatusPendingBg
import com.bd.fantine.ui.theme.StatusPendingText
import com.bd.fantine.ui.theme.StatusShippedBg
import com.bd.fantine.ui.theme.StatusShippedText

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    viewModel: DashboardViewModel,
    onOrderClick: (String) -> Unit,
    onLogoutNav: () -> Unit
) {
    val state by viewModel.uiState.collectAsState()
    val context = LocalContext.current
    var showLogoutDialog by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(34.dp)
                                .background(BrandGold.copy(alpha = 0.2f), shape = CircleShape),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "И",
                                color = BrandGold,
                                fontWeight = FontWeight.Bold,
                                fontSize = 17.sp,
                                fontFamily = FontFamily.Serif
                            )
                        }
                        Spacer(modifier = Modifier.width(10.dp))
                        Column {
                            Text(
                                text = "FAИTIИE ADMIN",
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 2.sp,
                                color = BrandGoldLight
                            )
                            Text(
                                text = when (state.currentTab) {
                                    DashboardTab.OVERVIEW -> "Executive Overview & Sales Chart"
                                    DashboardTab.ORDERS -> "Live Orders Management"
                                    DashboardTab.PRODUCTS -> "Product Catalog (/api/products)"
                                    DashboardTab.CUSTOMERS -> "Customer CRM (/api/customers)"
                                    DashboardTab.INVENTORY -> "Warehouse Stock Valuation"
                                },
                                fontSize = 10.sp,
                                color = MutedSlate
                            )
                        }
                    }
                },
                actions = {
                    IconButton(
                        onClick = { viewModel.onAction(DashboardAction.Refresh) }
                    ) {
                        if (state.isRefreshing) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(20.dp),
                                color = BrandGold,
                                strokeWidth = 2.dp
                            )
                        } else {
                            Icon(Icons.Default.Refresh, contentDescription = "Refresh", tint = BrandGold)
                        }
                    }

                    IconButton(
                        onClick = { showLogoutDialog = true }
                    ) {
                        Icon(Icons.Default.ExitToApp, contentDescription = "Logout", tint = MutedSlate)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Obsidian,
                    titleContentColor = PureWhite
                )
            )
        },
        bottomBar = {
            NavigationBar(
                containerColor = ObsidianCard,
                tonalElevation = 8.dp
            ) {
                NavigationBarItem(
                    selected = state.currentTab == DashboardTab.OVERVIEW,
                    onClick = { viewModel.onAction(DashboardAction.SwitchTab(DashboardTab.OVERVIEW)) },
                    icon = { Icon(Icons.Default.Dashboard, contentDescription = "Dashboard") },
                    label = { Text("Dashboard", fontSize = 10.sp) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = Obsidian,
                        selectedTextColor = BrandGold,
                        indicatorColor = BrandGold,
                        unselectedIconColor = MutedSlate,
                        unselectedTextColor = MutedSlate
                    )
                )

                NavigationBarItem(
                    selected = state.currentTab == DashboardTab.ORDERS,
                    onClick = { viewModel.onAction(DashboardAction.SwitchTab(DashboardTab.ORDERS)) },
                    icon = { Icon(Icons.Default.ShoppingCart, contentDescription = "Orders") },
                    label = { Text("Orders", fontSize = 10.sp) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = Obsidian,
                        selectedTextColor = BrandGold,
                        indicatorColor = BrandGold,
                        unselectedIconColor = MutedSlate,
                        unselectedTextColor = MutedSlate
                    )
                )

                NavigationBarItem(
                    selected = state.currentTab == DashboardTab.PRODUCTS,
                    onClick = { viewModel.onAction(DashboardAction.SwitchTab(DashboardTab.PRODUCTS)) },
                    icon = { Icon(Icons.Default.Inventory2, contentDescription = "Products") },
                    label = { Text("Products", fontSize = 10.sp) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = Obsidian,
                        selectedTextColor = BrandGold,
                        indicatorColor = BrandGold,
                        unselectedIconColor = MutedSlate,
                        unselectedTextColor = MutedSlate
                    )
                )

                NavigationBarItem(
                    selected = state.currentTab == DashboardTab.CUSTOMERS,
                    onClick = { viewModel.onAction(DashboardAction.SwitchTab(DashboardTab.CUSTOMERS)) },
                    icon = { Icon(Icons.Default.People, contentDescription = "Customers") },
                    label = { Text("Customers", fontSize = 10.sp) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = Obsidian,
                        selectedTextColor = BrandGold,
                        indicatorColor = BrandGold,
                        unselectedIconColor = MutedSlate,
                        unselectedTextColor = MutedSlate
                    )
                )

                NavigationBarItem(
                    selected = state.currentTab == DashboardTab.INVENTORY,
                    onClick = { viewModel.onAction(DashboardAction.SwitchTab(DashboardTab.INVENTORY)) },
                    icon = { Icon(Icons.Default.Analytics, contentDescription = "Inventory") },
                    label = { Text("Inventory", fontSize = 10.sp) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = Obsidian,
                        selectedTextColor = BrandGold,
                        indicatorColor = BrandGold,
                        unselectedIconColor = MutedSlate,
                        unselectedTextColor = MutedSlate
                    )
                )
            }
        },
        containerColor = Obsidian
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            PullToRefreshBox(
                isRefreshing = state.isRefreshing,
                onRefresh = { viewModel.onAction(DashboardAction.Refresh) },
                modifier = Modifier.fillMaxSize()
            ) {
                when (state.currentTab) {
                    DashboardTab.OVERVIEW -> {
                        OverviewTabContent(
                            state = state,
                            onSwitchTab = { tab -> viewModel.onAction(DashboardAction.SwitchTab(tab)) },
                            onOrderClick = onOrderClick,
                            onCallCustomer = { phone ->
                                if (phone.isNotBlank()) {
                                    val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:$phone"))
                                    context.startActivity(intent)
                                }
                            }
                        )
                    }

                    DashboardTab.ORDERS -> {
                        OrdersTabContent(
                            state = state,
                            onFilterSelected = { status -> viewModel.onAction(DashboardAction.FilterSelected(status)) },
                            onSearchChanged = { query -> viewModel.onAction(DashboardAction.SearchChanged(query)) },
                            onStatusChange = { orderId, newStatus ->
                                viewModel.onAction(DashboardAction.UpdateOrderStatus(orderId, newStatus))
                            },
                            onOrderClick = onOrderClick,
                            onCallCustomer = { phone ->
                                if (phone.isNotBlank()) {
                                    val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:$phone"))
                                    context.startActivity(intent)
                                }
                            }
                        )
                    }

                    DashboardTab.PRODUCTS -> {
                        ProductsView(
                            products = state.products,
                            isLoading = state.isLoading
                        )
                    }

                    DashboardTab.CUSTOMERS -> {
                        CustomersView(
                            customers = state.customers,
                            isLoading = state.isLoading
                        )
                    }

                    DashboardTab.INVENTORY -> {
                        InventoryView(
                            products = state.products,
                            isLoading = state.isLoading
                        )
                    }
                }
            }
        }
    }

    if (showLogoutDialog) {
        AlertDialog(
            onDismissRequest = { showLogoutDialog = false },
            title = { Text("Log Out?", color = PureWhite, fontWeight = FontWeight.Bold) },
            text = { Text("You will need your admin credentials to log back in.", color = LightSlate) },
            confirmButton = {
                TextButton(
                    onClick = {
                        showLogoutDialog = false
                        viewModel.onAction(DashboardAction.Logout)
                        onLogoutNav()
                    }
                ) {
                    Text("Log Out", color = StatusCancelledText, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showLogoutDialog = false }) {
                    Text("Cancel", color = MutedSlate)
                }
            },
            containerColor = ObsidianCard
        )
    }
}

@Composable
fun OverviewTabContent(
    state: DashboardUiState,
    onSwitchTab: (DashboardTab) -> Unit,
    onOrderClick: (String) -> Unit,
    onCallCustomer: (String) -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
    ) {
        // 1. TOP SUMMARY CHART
        SalesTrendChart(
            trendPoints = state.salesTrend,
            totalSales = state.metrics.totalRevenue
        )

        // 2. SUMMARY METRICS ROW
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState())
                .padding(horizontal = 16.dp, vertical = 6.dp),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            MetricCard(
                title = "Total Orders",
                value = "${state.metrics.totalOrders}",
                icon = Icons.Default.ShoppingCart,
                tint = BrandGold
            )
            MetricCard(
                title = "Pending Action",
                value = "${state.metrics.pendingOrders}",
                icon = Icons.Default.PendingActions,
                tint = StatusPendingText
            )
            MetricCard(
                title = "Delivered",
                value = "${state.metrics.deliveredOrders}",
                icon = Icons.Default.CheckCircle,
                tint = StatusDeliveredText
            )
            MetricCard(
                title = "Total In Catalog",
                value = "${state.products.size} Items",
                icon = Icons.Default.Inventory2,
                tint = BrandGoldLight
            )
        }

        Spacer(modifier = Modifier.height(14.dp))

        // 3. SECTION SHORTCUT CARDS (Cards for Dashboard, Orders, Products, Customers, Inventory)
        Text(
            text = "STORE MANAGEMENT SECTIONS",
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
            letterSpacing = 1.2.sp,
            color = MutedSlate,
            modifier = Modifier.padding(horizontal = 16.dp)
        )

        Spacer(modifier = Modifier.height(10.dp))

        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            SectionNavCard(
                title = "Orders Manager",
                subtitle = "${state.orders.size} Total • ${state.metrics.pendingOrders} Pending Action",
                icon = Icons.Default.ShoppingCart,
                tint = BrandGold,
                onClick = { onSwitchTab(DashboardTab.ORDERS) }
            )

            SectionNavCard(
                title = "Product Catalog",
                subtitle = "${state.products.size} Products Live • Synchronized with Web Store",
                icon = Icons.Default.Inventory2,
                tint = BrandGoldLight,
                onClick = { onSwitchTab(DashboardTab.PRODUCTS) }
            )

            SectionNavCard(
                title = "Customer CRM",
                subtitle = "${state.customers.size} Recorded Customers • 1-Click Dial & SMS",
                icon = Icons.Default.People,
                tint = StatusDeliveredText,
                onClick = { onSwitchTab(DashboardTab.CUSTOMERS) }
            )

            SectionNavCard(
                title = "Inventory & Stock",
                subtitle = "${state.products.sumOf { it.stock }} Total Stock Units • Low Stock Alerts",
                icon = Icons.Default.Analytics,
                tint = StatusPendingText,
                onClick = { onSwitchTab(DashboardTab.INVENTORY) }
            )
        }

        Spacer(modifier = Modifier.height(20.dp))

        // 4. RECENT ORDERS PREVIEW
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "RECENT ORDERS",
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 1.2.sp,
                color = MutedSlate
            )
            Text(
                text = "View All (${state.orders.size})",
                fontSize = 12.sp,
                fontWeight = FontWeight.SemiBold,
                color = BrandGold,
                modifier = Modifier.clickable { onSwitchTab(DashboardTab.ORDERS) }
            )
        }

        Spacer(modifier = Modifier.height(10.dp))

        val recentList = state.orders.take(5)
        if (recentList.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(32.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(text = "No orders received yet", color = MutedSlate, fontSize = 13.sp)
            }
        } else {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                recentList.forEach { order ->
                    OrderCard(
                        order = order,
                        onClick = { onOrderClick(order.id) },
                        onStatusChange = { _ -> },
                        onCall = { onCallCustomer(order.phone) }
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(40.dp))
    }
}

@Composable
fun SectionNavCard(
    title: String,
    subtitle: String,
    icon: ImageVector,
    tint: Color,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        colors = CardDefaults.cardColors(containerColor = ObsidianCard),
        shape = RoundedCornerShape(12.dp),
        border = CardDefaults.outlinedCardBorder().copy(
            brush = androidx.compose.ui.graphics.SolidColor(ObsidianBorder),
            width = 1.dp
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .background(tint.copy(alpha = 0.15f), shape = RoundedCornerShape(10.dp)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = tint,
                    modifier = Modifier.size(24.dp)
                )
            }

            Spacer(modifier = Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = title,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = PureWhite
                )
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = subtitle,
                    fontSize = 11.sp,
                    color = MutedSlate,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }

            Icon(
                imageVector = Icons.Default.ArrowForwardIos,
                contentDescription = null,
                tint = MutedSlate,
                modifier = Modifier.size(14.dp)
            )
        }
    }
}

@Composable
fun OrdersTabContent(
    state: DashboardUiState,
    onFilterSelected: (String) -> Unit,
    onSearchChanged: (String) -> Unit,
    onStatusChange: (String, String) -> Unit,
    onOrderClick: (String) -> Unit,
    onCallCustomer: (String) -> Unit
) {
    val filterOptions = listOf("All", "Pending", "Confirmed", "Shipped", "Delivered", "Cancelled")

    Column(modifier = Modifier.fillMaxSize()) {
        // Search bar
        OutlinedTextField(
            value = state.searchQuery,
            onValueChange = onSearchChanged,
            placeholder = { Text("Search by ID, name, phone, city...", color = MutedSlate, fontSize = 13.sp) },
            leadingIcon = { Icon(Icons.Default.Search, contentDescription = "Search", tint = BrandGold) },
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 6.dp),
            singleLine = true,
            colors = OutlinedTextFieldDefaults.colors(
                focusedContainerColor = ObsidianCard,
                unfocusedContainerColor = ObsidianCard,
                focusedBorderColor = BrandGold,
                unfocusedBorderColor = ObsidianBorder,
                focusedTextColor = PureWhite,
                unfocusedTextColor = PureWhite
            ),
            shape = RoundedCornerShape(12.dp)
        )

        // Filter chips
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState())
                .padding(horizontal = 16.dp, vertical = 4.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            filterOptions.forEach { status ->
                val isSelected = state.selectedStatusFilter == status
                FilterChip(
                    selected = isSelected,
                    onClick = { onFilterSelected(status) },
                    label = {
                        Text(
                            text = status,
                            fontSize = 12.sp,
                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                            color = if (isSelected) Obsidian else LightSlate
                        )
                    },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = BrandGold,
                        containerColor = ObsidianCard
                    ),
                    border = FilterChipDefaults.filterChipBorder(
                        enabled = true,
                        selected = isSelected,
                        borderColor = if (isSelected) BrandGold else ObsidianBorder
                    )
                )
            }
        }

        // Orders List
        if (state.isLoading && state.orders.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = BrandGold)
            }
        } else if (state.filteredOrders.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(32.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(
                        imageVector = Icons.Default.ShoppingCart,
                        contentDescription = null,
                        tint = MutedSlate,
                        modifier = Modifier.size(48.dp)
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = if (state.searchQuery.isNotBlank()) "No orders match '${state.searchQuery}'" else "No orders found",
                        color = MutedSlate,
                        fontSize = 14.sp
                    )
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                items(state.filteredOrders, key = { it.id }) { order ->
                    OrderCard(
                        order = order,
                        onClick = { onOrderClick(order.id) },
                        onStatusChange = { newStatus -> onStatusChange(order.id, newStatus) },
                        onCall = { onCallCustomer(order.phone) }
                    )
                }
                item { Spacer(modifier = Modifier.height(80.dp)) }
            }
        }
    }
}

@Composable
fun MetricCard(
    title: String,
    value: String,
    icon: ImageVector,
    tint: Color
) {
    Card(
        modifier = Modifier.width(135.dp),
        colors = CardDefaults.cardColors(containerColor = ObsidianCard),
        shape = RoundedCornerShape(12.dp),
        border = CardDefaults.outlinedCardBorder().copy(
            brush = androidx.compose.ui.graphics.SolidColor(ObsidianBorder),
            width = 1.dp
        )
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(text = title, fontSize = 10.sp, color = MutedSlate)
                Icon(imageVector = icon, contentDescription = null, tint = tint, modifier = Modifier.size(16.dp))
            }
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = value,
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                color = PureWhite
            )
        }
    }
}

@Composable
fun OrderCard(
    order: Order,
    onClick: () -> Unit,
    onStatusChange: (String) -> Unit,
    onCall: () -> Unit
) {
    var dropdownExpanded by remember { mutableStateOf(false) }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        colors = CardDefaults.cardColors(containerColor = ObsidianCard),
        shape = RoundedCornerShape(12.dp),
        border = CardDefaults.outlinedCardBorder().copy(
            brush = androidx.compose.ui.graphics.SolidColor(ObsidianBorder),
            width = 1.dp
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "#${order.id}",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    color = BrandGoldLight
                )

                Row(verticalAlignment = Alignment.CenterVertically) {
                    if (!order.trackingCode.isNullOrBlank()) {
                        val prov = (order.courierProvider ?: "Courier").uppercase()
                        Text(
                            text = "🚚 $prov",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            color = StatusDeliveredText,
                            modifier = Modifier
                                .background(StatusDeliveredBg, shape = RoundedCornerShape(8.dp))
                                .padding(horizontal = 6.dp, vertical = 2.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                    }

                    Box {
                        val (bg, fg) = statusColors(order.status)
                        Text(
                            text = order.status.uppercase(),
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            color = fg,
                            modifier = Modifier
                                .background(bg, shape = RoundedCornerShape(12.dp))
                                .clickable { dropdownExpanded = true }
                                .padding(horizontal = 8.dp, vertical = 4.dp)
                        )

                        DropdownMenu(
                            expanded = dropdownExpanded,
                            onDismissRequest = { dropdownExpanded = false },
                            modifier = Modifier.background(ObsidianCard)
                        ) {
                            listOf("Pending", "Confirmed", "Shipped", "Delivered", "Cancelled").forEach { statusOption ->
                                DropdownMenuItem(
                                    text = { Text(statusOption, color = PureWhite, fontSize = 13.sp) },
                                    onClick = {
                                        dropdownExpanded = false
                                        onStatusChange(statusOption)
                                    }
                                )
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = order.customerName,
                fontSize = 14.sp,
                fontWeight = FontWeight.SemiBold,
                color = PureWhite
            )

            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = "${order.phone} • ${order.district}",
                    fontSize = 12.sp,
                    color = MutedSlate
                )

                if (order.phone.isNotBlank()) {
                    IconButton(
                        onClick = onCall,
                        modifier = Modifier.size(28.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Call,
                            contentDescription = "Call",
                            tint = BrandGold,
                            modifier = Modifier.size(16.dp)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(6.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "${order.items.size} item(s)",
                    fontSize = 11.sp,
                    color = LightSlate
                )

                Text(
                    text = "৳${String.format("%,.0f", order.totalAmount)}",
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold,
                    color = BrandGold
                )
            }
        }
    }
}

fun statusColors(status: String): Pair<Color, Color> = when (status.lowercase()) {
    "pending" -> StatusPendingBg to StatusPendingText
    "confirmed" -> StatusConfirmedBg to StatusConfirmedText
    "shipped" -> StatusShippedBg to StatusShippedText
    "delivered" -> StatusDeliveredBg to StatusDeliveredText
    "cancelled" -> StatusCancelledBg to StatusCancelledText
    else -> Obsidian to LightSlate
}
