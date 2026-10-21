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
import androidx.compose.material.icons.filled.Category
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Inventory2
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.bd.fantine.feature.dashboard.domain.model.AdminProduct
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
fun ProductsView(
    products: List<AdminProduct>,
    isLoading: Boolean,
    modifier: Modifier = Modifier
) {
    var searchQuery by remember { mutableStateOf("") }
    var selectedCategory by remember { mutableStateOf("All") }

    val categories = remember(products) {
        listOf("All") + products.map { it.category }.filter { it.isNotBlank() }.distinct()
    }

    val filteredProducts = remember(products, searchQuery, selectedCategory) {
        products.filter { product ->
            val matchesCategory = selectedCategory == "All" || product.category.equals(selectedCategory, ignoreCase = true)
            val matchesSearch = searchQuery.isBlank() ||
                    product.title.contains(searchQuery, ignoreCase = true) ||
                    product.category.contains(searchQuery, ignoreCase = true) ||
                    product.sku.contains(searchQuery, ignoreCase = true)
            matchesCategory && matchesSearch
        }
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(Obsidian)
    ) {
        // Search field
        OutlinedTextField(
            value = searchQuery,
            onValueChange = { searchQuery = it },
            placeholder = { Text("Search products by name or SKU...", color = MutedSlate, fontSize = 13.sp) },
            leadingIcon = { Icon(Icons.Default.Search, contentDescription = "Search", tint = BrandGold) },
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 8.dp),
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

        // Category filter chips
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState())
                .padding(horizontal = 16.dp, vertical = 4.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            categories.forEach { category ->
                val isSelected = selectedCategory == category
                FilterChip(
                    selected = isSelected,
                    onClick = { selectedCategory = category },
                    label = {
                        Text(
                            text = category,
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

        // Stats summary bar
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 6.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "${filteredProducts.size} Products Found",
                fontSize = 12.sp,
                fontWeight = FontWeight.SemiBold,
                color = MutedSlate
            )

            Text(
                text = "Total Stock: ${filteredProducts.sumOf { it.stock }} units",
                fontSize = 12.sp,
                color = BrandGoldLight
            )
        }

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
                        imageVector = Icons.Default.Category,
                        contentDescription = null,
                        tint = MutedSlate,
                        modifier = Modifier.size(48.dp)
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = "No products found",
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
                    ProductCard(product = product)
                }
                item { Spacer(modifier = Modifier.height(80.dp)) }
            }
        }
    }
}

@Composable
fun ProductCard(product: AdminProduct) {
    Card(
        modifier = Modifier.fillMaxWidth(),
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
            // Icon placeholder / badge
            Box(
                modifier = Modifier
                    .size(50.dp)
                    .background(BrandGold.copy(alpha = 0.12f), shape = RoundedCornerShape(10.dp)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.Inventory2,
                    contentDescription = null,
                    tint = BrandGold,
                    modifier = Modifier.size(26.dp)
                )
            }

            Spacer(modifier = Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = product.category.uppercase(),
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        color = BrandGoldLight,
                        letterSpacing = 1.sp
                    )

                    // Stock status badge
                    val (badgeBg, badgeText, badgeLabel) = when {
                        product.isOutOfStock -> Triple(StatusCancelledBg, StatusCancelledText, "Out of Stock")
                        product.isLowStock -> Triple(StatusPendingBg, StatusPendingText, "Low Stock (${product.stock})")
                        else -> Triple(StatusDeliveredBg, StatusDeliveredText, "${product.stock} in stock")
                    }

                    Text(
                        text = badgeLabel,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = badgeText,
                        modifier = Modifier
                            .background(badgeBg, shape = RoundedCornerShape(12.dp))
                            .padding(horizontal = 8.dp, vertical = 2.dp)
                    )
                }

                Spacer(modifier = Modifier.height(4.dp))

                Text(
                    text = product.title,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = PureWhite,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )

                Spacer(modifier = Modifier.height(6.dp))

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = "৳${String.format("%,.0f", product.price)}",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = BrandGold
                    )

                    if (product.regularPrice > product.price) {
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "৳${String.format("%,.0f", product.regularPrice)}",
                            fontSize = 12.sp,
                            color = MutedSlate,
                            textDecoration = TextDecoration.LineThrough
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "-${product.discountPercentage}%",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            color = StatusDeliveredText
                        )
                    }
                }
            }
        }
    }
}
