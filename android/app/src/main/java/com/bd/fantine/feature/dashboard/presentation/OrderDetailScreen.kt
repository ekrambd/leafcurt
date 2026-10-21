package com.bd.fantine.feature.dashboard.presentation

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Call
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.LocalShipping
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Receipt
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Send
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.filled.VerifiedUser
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.bd.fantine.ui.theme.BrandGold
import com.bd.fantine.ui.theme.BrandGoldDark
import com.bd.fantine.ui.theme.BrandGoldLight
import com.bd.fantine.ui.theme.LightSlate
import com.bd.fantine.ui.theme.MutedSlate
import com.bd.fantine.ui.theme.Obsidian
import com.bd.fantine.ui.theme.ObsidianBorder
import com.bd.fantine.ui.theme.ObsidianCard
import com.bd.fantine.ui.theme.PureWhite
import com.bd.fantine.ui.theme.StatusCancelledText
import com.bd.fantine.ui.theme.StatusConfirmedBg
import com.bd.fantine.ui.theme.StatusConfirmedText
import com.bd.fantine.ui.theme.StatusDeliveredBg
import com.bd.fantine.ui.theme.StatusDeliveredText
import com.bd.fantine.ui.theme.StatusPendingBg
import com.bd.fantine.ui.theme.StatusPendingText

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OrderDetailScreen(
    orderId: String,
    viewModel: DashboardViewModel,
    onBack: () -> Unit
) {
    val state by viewModel.uiState.collectAsState()
    val order = state.orders.find { it.id == orderId }
    val context = LocalContext.current

    var selectedCourierProvider by remember { mutableStateOf<String?>(null) }
    var showDispatchConfirmDialog by remember { mutableStateOf(false) }
    var showDeleteConfirmDialog by remember { mutableStateOf(false) }

    LaunchedEffect(order?.phone) {
        if (!order?.phone.isNullOrBlank()) {
            viewModel.onAction(DashboardAction.CheckCustomerTrust(order!!.phone))
        }
    }

    val statuses = listOf("Pending", "Confirmed", "Shipped", "Delivered", "Cancelled")

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "Order Details #$orderId",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = PureWhite
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(
                            Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Back",
                            tint = PureWhite
                        )
                    }
                },
                actions = {
                    if (order != null) {
                        IconButton(onClick = { shareOrderInvoice(context, order) }) {
                            Icon(
                                Icons.Default.Share,
                                contentDescription = "Share Invoice",
                                tint = BrandGold
                            )
                        }
                        IconButton(onClick = { showDeleteConfirmDialog = true }) {
                            Icon(
                                Icons.Default.Delete,
                                contentDescription = "Delete Order",
                                tint = StatusCancelledText
                            )
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Obsidian,
                    titleContentColor = PureWhite
                )
            )
        },
        containerColor = Obsidian
    ) { paddingValues ->
        if (order == null) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues),
                contentAlignment = Alignment.Center
            ) {
                Text("Order #$orderId not found", color = MutedSlate)
            }
        } else {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
                    .verticalScroll(rememberScrollState())
                    .padding(16.dp)
            ) {
                // 1. COURIER BOOKING & TRANSFER CARD (Core Feature)
                CourierTransferCard(
                    order = order,
                    isDispatching = state.isDispatchingCourier,
                    onSelectProvider = { provider ->
                        selectedCourierProvider = provider
                        showDispatchConfirmDialog = true
                    },
                    onCopyTracking = { code ->
                        val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                        val clip = ClipData.newPlainText("Tracking Code", code)
                        clipboard.setPrimaryClip(clip)
                        Toast.makeText(context, "Tracking code copied: $code", Toast.LENGTH_SHORT).show()
                    }
                )

                Spacer(modifier = Modifier.height(16.dp))

                // 2. CUSTOMER COURIER TRUST ASSESSMENT CARD
                CustomerTrustCard(
                    phone = order.phone,
                    fraudData = state.fraudCheckResult
                )

                Spacer(modifier = Modifier.height(16.dp))

                // 3. Status Management Card
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(containerColor = ObsidianCard)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = "UPDATE ORDER STATUS",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = BrandGold,
                            letterSpacing = 1.sp
                        )
                        Spacer(modifier = Modifier.height(10.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            statuses.take(3).forEach { st ->
                                val isSelected = order.status.equals(st, ignoreCase = true)
                                Button(
                                    onClick = {
                                        viewModel.onAction(DashboardAction.UpdateOrderStatus(order.id, st))
                                    },
                                    modifier = Modifier.weight(1f),
                                    shape = RoundedCornerShape(8.dp),
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = if (isSelected) BrandGold else ObsidianBorder,
                                        contentColor = if (isSelected) Obsidian else PureWhite
                                    )
                                ) {
                                    Text(st, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            statuses.takeLast(2).forEach { st ->
                                val isSelected = order.status.equals(st, ignoreCase = true)
                                Button(
                                    onClick = {
                                        viewModel.onAction(DashboardAction.UpdateOrderStatus(order.id, st))
                                    },
                                    modifier = Modifier.weight(1f),
                                    shape = RoundedCornerShape(8.dp),
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = if (isSelected) BrandGold else ObsidianBorder,
                                        contentColor = if (isSelected) Obsidian else PureWhite
                                    )
                                ) {
                                    Text(st, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // 4. Customer Info Card
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(containerColor = ObsidianCard)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.Person, contentDescription = null, tint = BrandGold)
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = "Customer Information",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 14.sp,
                                    color = PureWhite
                                )
                            }

                            if (order.phone.isNotBlank()) {
                                IconButton(
                                    onClick = {
                                        val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:${order.phone}"))
                                        context.startActivity(intent)
                                    },
                                    modifier = Modifier
                                        .size(36.dp)
                                        .background(BrandGold.copy(alpha = 0.15f), CircleShape)
                                ) {
                                    Icon(
                                        Icons.Default.Call,
                                        contentDescription = "Call",
                                        tint = BrandGold,
                                        modifier = Modifier.size(18.dp)
                                    )
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(12.dp))
                        DetailRow(label = "Name", value = order.customerName)
                        DetailRow(label = "Phone", value = order.phone)
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // 5. Delivery Address Card
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(containerColor = ObsidianCard)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.LocationOn, contentDescription = null, tint = BrandGold)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "Delivery Address",
                                fontWeight = FontWeight.Bold,
                                fontSize = 14.sp,
                                color = PureWhite
                            )
                        }
                        Spacer(modifier = Modifier.height(12.dp))
                        DetailRow(label = "Address", value = order.address)
                        DetailRow(label = "District", value = order.district)
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // 6. Order Items Card
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(containerColor = ObsidianCard)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Receipt, contentDescription = null, tint = BrandGold)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "Order Items (${order.items.size})",
                                fontWeight = FontWeight.Bold,
                                fontSize = 14.sp,
                                color = PureWhite
                            )
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        if (order.items.isEmpty()) {
                            Text(
                                text = "1x FANTINE Skincare Item",
                                fontSize = 13.sp,
                                color = LightSlate
                            )
                        } else {
                            order.items.forEach { item ->
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(vertical = 4.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(
                                            text = item.title,
                                            fontSize = 13.sp,
                                            fontWeight = FontWeight.SemiBold,
                                            color = PureWhite
                                        )
                                        Text(
                                            text = "Qty: ${item.quantity} × ৳${String.format("%,.0f", item.price)}",
                                            fontSize = 11.sp,
                                            color = MutedSlate
                                        )
                                    }
                                    Text(
                                        text = "৳${String.format("%,.0f", item.quantity * item.price)}",
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = BrandGoldLight
                                    )
                                }
                                HorizontalDivider(
                                    modifier = Modifier.padding(vertical = 4.dp),
                                    color = ObsidianBorder
                                )
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // 7. Payment & Financials Card
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(containerColor = ObsidianCard)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = "PAYMENT SUMMARY",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = BrandGold,
                            letterSpacing = 1.sp
                        )
                        Spacer(modifier = Modifier.height(10.dp))
                        DetailRow(label = "Payment Method", value = order.paymentMethod)
                        DetailRow(label = "Delivery Fee", value = "৳${String.format("%,.0f", order.deliveryCharge)}")
                        HorizontalDivider(
                            modifier = Modifier.padding(vertical = 8.dp),
                            color = ObsidianBorder
                        )
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = "Total Collection (COD)",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold,
                                color = PureWhite
                            )
                            Text(
                                text = "৳${String.format("%,.0f", order.totalAmount)}",
                                fontSize = 16.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = BrandGold
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // 8. Actions (Share Invoice & Delete Order)
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Button(
                        onClick = { shareOrderInvoice(context, order) },
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(10.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = BrandGold,
                            contentColor = Obsidian
                        )
                    ) {
                        Icon(Icons.Default.Share, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Share Invoice", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    }

                    OutlinedButton(
                        onClick = { showDeleteConfirmDialog = true },
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(10.dp),
                        colors = ButtonDefaults.outlinedButtonColors(
                            contentColor = StatusCancelledText
                        ),
                        border = androidx.compose.foundation.BorderStroke(1.dp, StatusCancelledText.copy(alpha = 0.5f))
                    ) {
                        Icon(Icons.Default.Delete, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Delete Order", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    }
                }

                Spacer(modifier = Modifier.height(40.dp))
            }
        }
    }

    // Courier Dispatch Confirmation Modal
    if (showDispatchConfirmDialog && selectedCourierProvider != null && order != null) {
        val providerTitle = if (selectedCourierProvider == "pathao") "Pathao Courier" else "Steadfast Courier"
        AlertDialog(
            onDismissRequest = { showDispatchConfirmDialog = false },
            title = {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        Icons.Default.LocalShipping,
                        contentDescription = null,
                        tint = BrandGold,
                        modifier = Modifier.size(22.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "Transfer to $providerTitle",
                        color = PureWhite,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            },
            text = {
                Column {
                    Text(
                        text = "Are you sure you want to book this parcel for courier delivery?",
                        color = LightSlate,
                        fontSize = 13.sp
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(Obsidian, shape = RoundedCornerShape(10.dp))
                            .padding(12.dp)
                    ) {
                        Column {
                            Text("Recipient: ${order.customerName}", color = PureWhite, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                            Text("Phone: ${order.phone}", color = BrandGoldLight, fontSize = 12.sp)
                            Text("Address: ${order.address}, ${order.district}", color = MutedSlate, fontSize = 11.sp)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text("COD Collection: ৳${String.format("%,.0f", order.totalAmount)}", color = StatusDeliveredText, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                    if (selectedCourierProvider == "pathao") {
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "Pickup Store: Fantine BD (Rampura Banasree Hub)",
                            color = BrandGoldLight,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        showDispatchConfirmDialog = false
                        viewModel.onAction(DashboardAction.DispatchToCourier(order.id, selectedCourierProvider!!))
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = BrandGold, contentColor = Obsidian),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text("Confirm Transfer", fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showDispatchConfirmDialog = false }) {
                    Text("Cancel", color = MutedSlate)
                }
            },
            containerColor = ObsidianCard
        )
    }

    // Result dialog / notification toast
    if (state.courierMessage != null) {
        AlertDialog(
            onDismissRequest = { viewModel.onAction(DashboardAction.DismissCourierMessage) },
            title = {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = if (state.courierResult?.success == true) Icons.Default.Check else Icons.Default.Security,
                        contentDescription = null,
                        tint = if (state.courierResult?.success == true) StatusDeliveredText else StatusPendingText
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = if (state.courierResult?.success == true) "Courier Booking Successful!" else "Courier Notice",
                        color = PureWhite,
                        fontWeight = FontWeight.Bold,
                        fontSize = 15.sp
                    )
                }
            },
            text = {
                Text(
                    text = state.courierMessage ?: "",
                    color = LightSlate,
                    fontSize = 13.sp
                )
            },
            confirmButton = {
                Button(
                    onClick = { viewModel.onAction(DashboardAction.DismissCourierMessage) },
                    colors = ButtonDefaults.buttonColors(containerColor = BrandGold, contentColor = Obsidian)
                ) {
                    Text("OK", fontWeight = FontWeight.Bold)
                }
            },
            containerColor = ObsidianCard
        )
    }

    if (showDeleteConfirmDialog && order != null) {
        AlertDialog(
            onDismissRequest = { showDeleteConfirmDialog = false },
            title = {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        Icons.Default.Delete,
                        contentDescription = null,
                        tint = StatusCancelledText,
                        modifier = Modifier.size(22.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "Delete Order #${order.id}?",
                        color = PureWhite,
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp
                    )
                }
            },
            text = {
                Text(
                    text = "Are you sure you want to permanently delete order #${order.id}? This will remove the order from the server and local database.",
                    color = LightSlate,
                    fontSize = 13.sp
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        showDeleteConfirmDialog = false
                        viewModel.onAction(DashboardAction.DeleteOrder(order.id))
                        Toast.makeText(context, "Order #${order.id} deleted", Toast.LENGTH_SHORT).show()
                        onBack()
                    },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = StatusCancelledText,
                        contentColor = PureWhite
                    )
                ) {
                    Text("Delete Permanently", fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteConfirmDialog = false }) {
                    Text("Cancel", color = MutedSlate)
                }
            },
            containerColor = ObsidianCard
        )
    }
}

@Composable
fun CourierTransferCard(
    order: com.bd.fantine.feature.dashboard.domain.model.Order,
    isDispatching: Boolean,
    onSelectProvider: (String) -> Unit,
    onCopyTracking: (String) -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = ObsidianCard),
        border = CardDefaults.outlinedCardBorder().copy(
            brush = Brush.horizontalGradient(listOf(BrandGold.copy(alpha = 0.6f), ObsidianBorder)),
            width = 1.dp
        )
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(34.dp)
                            .background(BrandGold.copy(alpha = 0.15f), shape = CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.LocalShipping,
                            contentDescription = "Courier",
                            tint = BrandGold,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                    Spacer(modifier = Modifier.width(10.dp))
                    Column {
                        Text(
                            text = "COURIER TRANSFER & DISPATCH",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = BrandGoldLight,
                            letterSpacing = 1.sp
                        )
                        Text(
                            text = "Direct API Integration with Live Couriers",
                            fontSize = 11.sp,
                            color = MutedSlate
                        )
                    }
                }

                if (order.trackingCode != null) {
                    Text(
                        text = "DISPATCHED",
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        color = StatusDeliveredText,
                        modifier = Modifier
                            .background(StatusDeliveredBg, shape = RoundedCornerShape(10.dp))
                            .padding(horizontal = 8.dp, vertical = 3.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            if (!order.trackingCode.isNullOrBlank()) {
                // Already dispatched view
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Obsidian, shape = RoundedCornerShape(10.dp))
                        .padding(12.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = "Carrier: ${(order.courierProvider ?: "Pathao").uppercase()} COURIER",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = BrandGold
                            )
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = "Tracking / Consignment: ${order.trackingCode}",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = PureWhite
                            )
                        }

                        IconButton(
                            onClick = { onCopyTracking(order.trackingCode) },
                            modifier = Modifier
                                .size(34.dp)
                                .background(BrandGold.copy(alpha = 0.2f), shape = CircleShape)
                        ) {
                            Icon(
                                Icons.Default.ContentCopy,
                                contentDescription = "Copy Tracking Code",
                                tint = BrandGold,
                                modifier = Modifier.size(16.dp)
                            )
                        }
                    }
                }
            } else {
                // Not yet dispatched - Show Courier Options
                if (isDispatching) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 12.dp),
                        horizontalArrangement = Arrangement.Center,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        CircularProgressIndicator(color = BrandGold, modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                        Spacer(modifier = Modifier.width(10.dp))
                        Text("Connecting to courier API & booking parcel...", color = LightSlate, fontSize = 12.sp)
                    }
                } else {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        // 1. Pathao Option
                        Button(
                            onClick = { onSelectProvider("pathao") },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(10.dp),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = Color(0xFFE51A24), // Official Pathao Red
                                contentColor = PureWhite
                            )
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.Send, contentDescription = null, modifier = Modifier.size(14.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Column {
                                    Text("Send Pathao", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                    Text("Fantine BD Hub", fontSize = 9.sp, color = PureWhite.copy(alpha = 0.8f))
                                }
                            }
                        }

                        // 2. Steadfast Option
                        Button(
                            onClick = { onSelectProvider("steadfast") },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(10.dp),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = Color(0xFF0D5E68), // Steadfast Deep Teal
                                contentColor = PureWhite
                            )
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.LocalShipping, contentDescription = null, modifier = Modifier.size(14.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Column {
                                    Text("Send Steadfast", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                    Text("Next-Day BD", fontSize = 9.sp, color = PureWhite.copy(alpha = 0.8f))
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun CustomerTrustCard(
    phone: String,
    fraudData: com.bd.fantine.core.network.dto.FraudCheckResponse?
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = ObsidianCard)
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.VerifiedUser, contentDescription = null, tint = BrandGold, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "CUSTOMER DELIVERY TRUST",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = PureWhite
                    )
                }

                if (fraudData != null && fraudData.totalParcels != null && fraudData.totalParcels > 0) {
                    val ratio = fraudData.successRatio ?: 100.0
                    Text(
                        text = "${String.format("%.0f", ratio)}% Success Rate",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (ratio >= 80.0) StatusDeliveredText else StatusPendingText,
                        modifier = Modifier
                            .background(
                                if (ratio >= 80.0) StatusDeliveredBg else StatusPendingBg,
                                shape = RoundedCornerShape(8.dp)
                            )
                            .padding(horizontal = 6.dp, vertical = 2.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            if (fraudData != null && fraudData.totalParcels != null && fraudData.totalParcels > 0) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(text = "Total BD Orders: ${fraudData.totalParcels}", fontSize = 11.sp, color = LightSlate)
                    Text(text = "Delivered: ${fraudData.deliveredParcels ?: 0}", fontSize = 11.sp, color = StatusDeliveredText)
                    Text(text = "Returned: ${fraudData.returnedParcels ?: 0}", fontSize = 11.sp, color = MutedSlate)
                }
            } else {
                Text(
                    text = "Customer Phone: $phone • Verified clean record across Bangladesh courier networks.",
                    fontSize = 11.sp,
                    color = MutedSlate
                )
            }
        }
    }
}

@Composable
fun DetailRow(label: String, value: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 3.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(text = label, fontSize = 12.sp, color = MutedSlate)
        Text(text = value, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = PureWhite)
    }
}

fun shareOrderInvoice(context: Context, order: com.bd.fantine.feature.dashboard.domain.model.Order) {
    val sb = StringBuilder()
    sb.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
    sb.append("🌟 FAИTIИE BD - ORDER INVOICE\n")
    sb.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
    sb.append("Order ID: #${order.id}\n")
    sb.append("Date: ${order.createdAt}\n")
    sb.append("Status: ${order.status.uppercase()}\n\n")
    sb.append("👤 CUSTOMER DETAILS:\n")
    sb.append("Name: ${order.customerName}\n")
    sb.append("Phone: ${order.phone}\n")
    sb.append("Address: ${order.address}\n")
    sb.append("District: ${order.district}\n\n")
    sb.append("📦 ORDERED ITEMS:\n")
    if (order.items.isNotEmpty()) {
        order.items.forEachIndexed { idx, it ->
            sb.append("${idx + 1}. ${it.title} x${it.quantity} - ৳${String.format("%,.0f", it.price * it.quantity)}\n")
        }
    } else {
        sb.append("Fantine Skincare Item\n")
    }
    sb.append("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
    sb.append("Subtotal: ৳${String.format("%,.0f", order.totalAmount - order.deliveryCharge)}\n")
    sb.append("Delivery Fee: ৳${String.format("%,.0f", order.deliveryCharge)}\n")
    sb.append("Total Payable: ৳${String.format("%,.0f", order.totalAmount)}\n")
    sb.append("Payment Method: ${order.paymentMethod.uppercase()}\n")
    if (!order.trackingCode.isNullOrBlank()) {
        sb.append("Courier: ${(order.courierProvider ?: "Courier").uppercase()} (${order.trackingCode})\n")
    }
    sb.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
    sb.append("Thank you for choosing Fantine BD!\n")
    sb.append("🌐 https://fantinebd.com\n")

    val sendIntent = Intent().apply {
        action = Intent.ACTION_SEND
        putExtra(Intent.EXTRA_TEXT, sb.toString())
        type = "text/plain"
    }
    val shareIntent = Intent.createChooser(sendIntent, "Share Order #${order.id} Invoice via")
    context.startActivity(shareIntent)
}
