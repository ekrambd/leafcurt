package com.bd.fantine.feature.dashboard.presentation.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AutoGraph
import androidx.compose.material.icons.filled.TrendingUp
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.bd.fantine.feature.dashboard.domain.model.SalesTrendPoint
import com.bd.fantine.ui.theme.BrandGold
import com.bd.fantine.ui.theme.BrandGoldDark
import com.bd.fantine.ui.theme.BrandGoldLight
import com.bd.fantine.ui.theme.MutedSlate
import com.bd.fantine.ui.theme.ObsidianBorder
import com.bd.fantine.ui.theme.ObsidianCard
import com.bd.fantine.ui.theme.PureWhite
import com.bd.fantine.ui.theme.StatusDeliveredText

@Composable
fun SalesTrendChart(
    trendPoints: List<SalesTrendPoint>,
    totalSales: Double,
    modifier: Modifier = Modifier
) {
    val maxRevenue = (trendPoints.maxOfOrNull { it.revenue } ?: 1.0).coerceAtLeast(100.0)
    val bestDay = trendPoints.maxByOrNull { it.revenue }

    Card(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp),
        colors = CardDefaults.cardColors(containerColor = ObsidianCard),
        shape = RoundedCornerShape(16.dp),
        border = CardDefaults.outlinedCardBorder().copy(
            brush = Brush.horizontalGradient(
                listOf(BrandGold.copy(alpha = 0.4f), ObsidianBorder)
            ),
            width = 1.dp
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            // Header: Title and Trend indicator
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
                            imageVector = Icons.Default.AutoGraph,
                            contentDescription = "Analytics",
                            tint = BrandGold,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                    Spacer(modifier = Modifier.width(10.dp))
                    Column {
                        Text(
                            text = "SALES REVENUE TREND",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 1.2.sp,
                            color = BrandGoldLight
                        )
                        Text(
                            text = "7-Day Performance",
                            fontSize = 12.sp,
                            color = MutedSlate
                        )
                    }
                }

                // Growth pill
                Row(
                    modifier = Modifier
                        .background(StatusDeliveredText.copy(alpha = 0.15f), shape = RoundedCornerShape(20.dp))
                        .padding(horizontal = 8.dp, vertical = 4.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.TrendingUp,
                        contentDescription = "Trend",
                        tint = StatusDeliveredText,
                        modifier = Modifier.size(14.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = "Live",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = StatusDeliveredText
                    )
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Revenue headline
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Bottom
            ) {
                Column {
                    Text(
                        text = "৳${String.format("%,.0f", totalSales)}",
                        fontSize = 24.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = PureWhite
                    )
                    Text(
                        text = "Total Active Period Revenue",
                        fontSize = 11.sp,
                        color = MutedSlate
                    )
                }

                if (bestDay != null && bestDay.revenue > 0) {
                    Column(horizontalAlignment = Alignment.End) {
                        Text(
                            text = "Peak: ${bestDay.dayLabel}",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = BrandGold
                        )
                        Text(
                            text = "৳${String.format("%,.0f", bestDay.revenue)}",
                            fontSize = 12.sp,
                            color = PureWhite
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Canvas Chart
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(140.dp)
            ) {
                Canvas(modifier = Modifier.matchParentSize()) {
                    val canvasWidth = size.width
                    val canvasHeight = size.height - 24.dp.toPx() // leave room for labels
                    val pointCount = trendPoints.size
                    if (pointCount == 0) return@Canvas

                    val barSpacing = canvasWidth / pointCount
                    val barWidth = (barSpacing * 0.48f).coerceIn(12f, 40f)

                    // Draw faint horizontal guide lines (0%, 50%, 100%)
                    for (ratio in listOf(0.2f, 0.5f, 0.85f)) {
                        val y = canvasHeight * (1f - ratio)
                        drawLine(
                            color = ObsidianBorder.copy(alpha = 0.35f),
                            start = Offset(0f, y),
                            end = Offset(canvasWidth, y),
                            strokeWidth = 1.dp.toPx()
                        )
                    }

                    trendPoints.forEachIndexed { index, point ->
                        val centerX = (index * barSpacing) + (barSpacing / 2f)
                        val barHeightFraction = (point.revenue / maxRevenue).toFloat().coerceIn(0.04f, 1f)
                        val barHeight = canvasHeight * barHeightFraction
                        val topY = canvasHeight - barHeight

                        val barBrush = if (point.isToday || point == bestDay) {
                            Brush.verticalGradient(
                                colors = listOf(BrandGoldLight, BrandGold, BrandGoldDark)
                            )
                        } else {
                            Brush.verticalGradient(
                                colors = listOf(BrandGold.copy(alpha = 0.7f), BrandGoldDark.copy(alpha = 0.4f))
                            )
                        }

                        // Draw Rounded Bar
                        drawRoundRect(
                            brush = barBrush,
                            topLeft = Offset(centerX - (barWidth / 2f), topY),
                            size = Size(barWidth, barHeight),
                            cornerRadius = CornerRadius(6.dp.toPx(), 6.dp.toPx())
                        )

                        // Highlight border for top/today
                        if (point == bestDay && point.revenue > 0) {
                            drawRoundRect(
                                color = BrandGoldLight,
                                topLeft = Offset(centerX - (barWidth / 2f), topY),
                                size = Size(barWidth, barHeight),
                                cornerRadius = CornerRadius(6.dp.toPx(), 6.dp.toPx()),
                                style = Stroke(width = 1.5.dp.toPx())
                            )
                        }

                        // Value text above bar if revenue > 0
                        if (point.revenue > 0) {
                            val revenueFormatted = if (point.revenue >= 1000) {
                                String.format("%.1fk", point.revenue / 1000.0)
                            } else {
                                String.format("%.0f", point.revenue)
                            }

                            drawContext.canvas.nativeCanvas.apply {
                                val paint = android.graphics.Paint().apply {
                                    color = if (point == bestDay) android.graphics.Color.WHITE else android.graphics.Color.LTGRAY
                                    textSize = 24f
                                    textAlign = android.graphics.Paint.Align.CENTER
                                    isAntiAlias = true
                                    isFakeBoldText = point == bestDay
                                }
                                drawText(
                                    revenueFormatted,
                                    centerX,
                                    (topY - 8f).coerceAtLeast(24f),
                                    paint
                                )
                            }
                        }

                        // Day label below bar
                        drawContext.canvas.nativeCanvas.apply {
                            val labelPaint = android.graphics.Paint().apply {
                                color = if (point.isToday) android.graphics.Color.parseColor("#E5C378") else android.graphics.Color.GRAY
                                textSize = 26f
                                textAlign = android.graphics.Paint.Align.CENTER
                                isAntiAlias = true
                                isFakeBoldText = point.isToday
                            }
                            drawText(
                                point.dayLabel,
                                centerX,
                                size.height - 4f,
                                labelPaint
                            )
                        }
                    }
                }
            }
        }
    }
}
