package com.bd.fantine.feature.dashboard.presentation.components

import androidx.compose.foundation.background
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
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountBalanceWallet
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Inventory2
import androidx.compose.material.icons.filled.PriorityHigh
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.bd.fantine.feature.dashboard.domain.model.AdminProduct
import com.bd.fantine.feature.dashboard.domain.model.InventorySummary
import com.bd.fantine.ui.theme.BrandGold
import com.bd.fantine.ui.theme.BrandGoldDark
import com.bd.fantine.ui.theme.BrandGoldLight
import com.bd.fantine.ui.theme.LightSlate
import com.bd.fantine.ui.theme.MutedSlate
import com.bd.fantine.ui.theme.Obsidian
import com.bd.fantine.ui.theme.ObsidianBorder
import com.bd.fantine.ui.theme.ObsidianCard
import com.bd.fantine.ui.theme.PureWhite
import com.bd.fantine.ui.theme.StatusCancelledBg
import com.bd.fantine.ui.theme.StatusCancelledText
import com.bd.fantine.ui.theme.StatusDeliveredBg
import com.bd.fantine.ui.theme.StatusDeliveredText
import com.bd.fantine.ui.theme.StatusPendingBg
import com.bd.fantine.ui.theme.StatusPendingText

@Composable
fun InventoryView(
    products: List<AdminProduct>,
    isLoading: Boolean,
    modifier: Modifier = Modifier
) {
    var stockFilter by remember { mutableStateOf("All") }

    val summary = remember(products) {
        val totalUnits = products.sumOf { it.stock }
        val valuation = products.sumOf { it.stock * it.price }
        val lowStock = products.count { it.isLowStock }
        val outOfStock = products.count { it.isOutOfStock }
        InventorySummary(
            totalProducts = products.size,
            totalStockUnits = totalUnits,
            totalStockValuation = valuation,
            lowStockCount = lowStock,
            outOfStockCount = outOfStock
        )
    }

    val filteredProducts = remember(products, stockFilter) {
        when (stockFilter) {
            "Low Stock" -> products.filter { it.isLowStock }
            "Out of Stock" -> products.filter { it.isOutOfStock }
            "In Stock" -> products.filter { it.stock > 15 }
            else -> products
        }
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(Obsidian)
    ) {
        // Inventory Overview Card
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 8.dp),
            colors = CardDefaults.cardColors(containerColor = ObsidianCard),
            shape = RoundedCornerShape(16.dp),
            border = CardDefaults.outlinedCardBorder().copy(
                brush = Brush.horizontalGradient(listOf(BrandGold.copy(alpha = 0.5f), ObsidianBorder)),
                width = 1.dp
            )
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(36.dp)
                                .background(BrandGold.copy(alpha = 0.15f), shape = CircleShape),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.AccountBalanceWallet,
                                contentDescription = "Inventory",
                                tint = BrandGold,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                        Spacer(modifier = Modifier.width(10.dp))
                        Column {
                            Text(
                                text = "TOTAL INVENTORY VALUE",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 1.2.sp,
                                color = BrandGoldLight
                            )
                            Text(
                                text = "Live Stock Valuation",
                                fontSize = 12.sp,
                                color = MutedSlate
                            )
                        }
                    }

                    Text(
                        text = "${summary.totalStockUnits} Units",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = StatusDeliveredText,
                        modifier = Modifier
                            .background(StatusDeliveredBg, shape = RoundedCornerShape(12.dp))
                            .padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }

                Spacer(modifier = Modifier.height(14.dp))

                Text(
                    text = "৳${String.format("%,.0f", summary.totalStockValuation)}",
                    fontSize = 24.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = PureWhite
                )

                Spacer(modifier = Modifier.height(14.dp))

                // Mini counters
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    InventoryStatPill(
                        label = "Products",
                        count = "${summary.totalProducts}",
                        tint = BrandGoldLight,
                        modifier = Modifier.weight(1f)
                    )
                    InventoryStatPill(
                        label = "Low Stock",
                        count = "${summary.lowStockCount}",
                        tint = if (summary.lowStockCount > 0) StatusPendingText else MutedSlate,
                        modifier = Modifier.weight(1f)
                    )
                    InventoryStatPill(
                        label = "Out of Stock",
                        count = "${summary.outOfStockCount}",
                        tint = if (summary.outOfStockCount > 0) StatusCancelledText else MutedSlate,
                        modifier = Modifier.weight(1f)
                    )
                }
            }
        }

        // Filter chips
        val filterOptions = listOf("All", "Low Stock", "In Stock", "Out of Stock")
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState())
                .padding(horizontal = 16.dp, vertical = 4.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            filterOptions.forEach { filter ->
                val isSelected = stockFilter == filter
                FilterChip(
                    selected = isSelected,
                    onClick = { stockFilter = filter },
                    label = {
                        Text(
                            text = filter,
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

        Spacer(modifier = Modifier.height(6.dp))

        if (isLoading && products.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = BrandGold)
            }
        } else if (filteredProducts.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(32.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(
                        imageVector = Icons.Default.CheckCircle,
                        contentDescription = null,
                        tint = StatusDeliveredText,
                        modifier = Modifier.size(48.dp)
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = "No products in this stock category",
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
                items(filteredProducts, key = { it.id }) { product ->
                    InventoryItemCard(product = product)
                }
                item { Spacer(modifier = Modifier.height(80.dp)) }
            }
        }
    }
}

@Composable
fun InventoryStatPill(
    label: String,
    count: String,
    tint: Color,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .background(Obsidian, shape = RoundedCornerShape(10.dp))
            .padding(vertical = 8.dp, horizontal = 10.dp)
    ) {
        Column {
            Text(text = label, fontSize = 10.sp, color = MutedSlate)
            Spacer(modifier = Modifier.height(2.dp))
            Text(text = count, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = tint)
        }
    }
}

@Composable
fun InventoryItemCard(product: AdminProduct) {
    Card(
        modifier = Modifier.fillMaxWidth(),
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
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = product.title,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = PureWhite,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Text(
                        text = "SKU: ${product.sku} • ${product.category}",
                        fontSize = 11.sp,
                        color = MutedSlate
                    )
                }

                val (badgeBg, badgeText, badgeLabel) = when {
                    product.isOutOfStock -> Triple(StatusCancelledBg, StatusCancelledText, "0 left")
                    product.isLowStock -> Triple(StatusPendingBg, StatusPendingText, "${product.stock} units left")
                    else -> Triple(StatusDeliveredBg, StatusDeliveredText, "${product.stock} units")
                }

                Text(
                    text = badgeLabel,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = badgeText,
                    modifier = Modifier
                        .background(badgeBg, shape = RoundedCornerShape(10.dp))
                        .padding(horizontal = 8.dp, vertical = 3.dp)
                )
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Linear stock indicator
            val progress = (product.stock / 100f).coerceIn(0f, 1f)
            LinearProgressIndicator(
                progress = { progress },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(6.dp),
                color = when {
                    product.isOutOfStock -> StatusCancelledText
                    product.isLowStock -> StatusPendingText
                    else -> BrandGold
                },
                trackColor = Obsidian
            )

            Spacer(modifier = Modifier.height(10.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Unit: ৳${String.format("%,.0f", product.price)}",
                    fontSize = 12.sp,
                    color = LightSlate
                )

                Text(
                    text = "Asset Value: ৳${String.format("%,.0f", product.stock * product.price)}",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = BrandGoldLight
                )
            }
        }
    }
}
