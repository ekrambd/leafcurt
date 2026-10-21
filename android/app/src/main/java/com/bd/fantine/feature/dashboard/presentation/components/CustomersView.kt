package com.bd.fantine.feature.dashboard.presentation.components

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Call
import androidx.compose.material.icons.filled.Message
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.bd.fantine.feature.dashboard.domain.model.AdminCustomer
import com.bd.fantine.ui.theme.BrandGold
import com.bd.fantine.ui.theme.BrandGoldDark
import com.bd.fantine.ui.theme.BrandGoldLight
import com.bd.fantine.ui.theme.LightSlate
import com.bd.fantine.ui.theme.MutedSlate
import com.bd.fantine.ui.theme.Obsidian
import com.bd.fantine.ui.theme.ObsidianBorder
import com.bd.fantine.ui.theme.ObsidianCard
import com.bd.fantine.ui.theme.PureWhite
import com.bd.fantine.ui.theme.StatusDeliveredBg
import com.bd.fantine.ui.theme.StatusDeliveredText

@Composable
fun CustomersView(
    customers: List<AdminCustomer>,
    isLoading: Boolean,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    var searchQuery by remember { mutableStateOf("") }

    val filteredCustomers = remember(customers, searchQuery) {
        if (searchQuery.isBlank()) customers
        else {
            customers.filter {
                it.name.contains(searchQuery, ignoreCase = true) ||
                        it.phone.contains(searchQuery) ||
                        it.address.contains(searchQuery, ignoreCase = true) ||
                        it.district.contains(searchQuery, ignoreCase = true)
            }
        }
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(Obsidian)
    ) {
        // Search bar
        OutlinedTextField(
            value = searchQuery,
            onValueChange = { searchQuery = it },
            placeholder = { Text("Search by customer name, phone, city...", color = MutedSlate, fontSize = 13.sp) },
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

        // Summary counts
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 6.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "${filteredCustomers.size} Customers in CRM",
                fontSize = 12.sp,
                fontWeight = FontWeight.SemiBold,
                color = MutedSlate
            )
            Text(
                text = "Total Spent: ৳${String.format("%,.0f", filteredCustomers.sumOf { it.totalSpent })}",
                fontSize = 12.sp,
                color = BrandGoldLight
            )
        }

        if (isLoading && customers.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = BrandGold)
            }
        } else if (filteredCustomers.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(32.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(
                        imageVector = Icons.Default.People,
                        contentDescription = null,
                        tint = MutedSlate,
                        modifier = Modifier.size(48.dp)
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = "No customers found",
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
                items(filteredCustomers, key = { it.phone.ifEmpty { it.id } }) { customer ->
                    CustomerCard(
                        customer = customer,
                        onCall = {
                            if (customer.phone.isNotBlank()) {
                                val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:${customer.phone}"))
                                context.startActivity(intent)
                            }
                        },
                        onSms = {
                            if (customer.phone.isNotBlank()) {
                                val intent = Intent(Intent.ACTION_VIEW, Uri.parse("sms:${customer.phone}"))
                                context.startActivity(intent)
                            }
                        }
                    )
                }
                item { Spacer(modifier = Modifier.height(80.dp)) }
            }
        }
    }
}

@Composable
fun CustomerCard(
    customer: AdminCustomer,
    onCall: () -> Unit,
    onSms: () -> Unit
) {
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
            // Customer avatar circle with initial
            val initial = customer.name.firstOrNull()?.uppercase() ?: "C"
            Box(
                modifier = Modifier
                    .size(46.dp)
                    .background(BrandGold.copy(alpha = 0.15f), shape = CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = initial,
                    color = BrandGold,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold
                )
            }

            Spacer(modifier = Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = customer.name,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = PureWhite,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )

                Spacer(modifier = Modifier.height(2.dp))

                Text(
                    text = customer.phone.ifEmpty { "No phone recorded" },
                    fontSize = 12.sp,
                    color = BrandGoldLight
                )

                if (customer.address.isNotBlank()) {
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = "${customer.address}, ${customer.district}",
                        fontSize = 11.sp,
                        color = MutedSlate,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }

                Spacer(modifier = Modifier.height(6.dp))

                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "${customer.orderCount} Orders",
                        fontSize = 11.sp,
                        color = LightSlate,
                        modifier = Modifier
                            .background(Obsidian, shape = RoundedCornerShape(8.dp))
                            .padding(horizontal = 6.dp, vertical = 2.dp)
                    )

                    Text(
                        text = "Spent: ৳${String.format("%,.0f", customer.totalSpent)}",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = StatusDeliveredText,
                        modifier = Modifier
                            .background(StatusDeliveredBg, shape = RoundedCornerShape(8.dp))
                            .padding(horizontal = 6.dp, vertical = 2.dp)
                    )
                }
            }

            // Quick actions: Call & SMS
            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton(
                    onClick = onCall,
                    modifier = Modifier
                        .size(36.dp)
                        .background(BrandGold.copy(alpha = 0.15f), shape = CircleShape)
                ) {
                    Icon(
                        imageVector = Icons.Default.Call,
                        contentDescription = "Call Customer",
                        tint = BrandGold,
                        modifier = Modifier.size(18.dp)
                    )
                }

                Spacer(modifier = Modifier.width(6.dp))

                IconButton(
                    onClick = onSms,
                    modifier = Modifier
                        .size(36.dp)
                        .background(Obsidian, shape = CircleShape)
                ) {
                    Icon(
                        imageVector = Icons.Default.Message,
                        contentDescription = "Message Customer",
                        tint = LightSlate,
                        modifier = Modifier.size(18.dp)
                    )
                }
            }
        }
    }
}
