package com.bd.fantine.feature.splash.presentation

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.bd.fantine.core.navigation.Routes
import com.bd.fantine.feature.auth.domain.repository.AuthRepository
import com.bd.fantine.ui.theme.BrandGold
import com.bd.fantine.ui.theme.BrandGoldLight
import com.bd.fantine.ui.theme.MutedSlate
import com.bd.fantine.ui.theme.Obsidian
import com.bd.fantine.ui.theme.ObsidianCard
import kotlinx.coroutines.delay

@Composable
fun SplashScreen(
    authRepository: AuthRepository,
    onNavigate: (String) -> Unit
) {
    val scale = remember { Animatable(0.7f) }
    val alpha = remember { Animatable(0f) }

    LaunchedEffect(Unit) {
        alpha.animateTo(
            targetValue = 1f,
            animationSpec = tween(durationMillis = 800, easing = FastOutSlowInEasing)
        )
        scale.animateTo(
            targetValue = 1f,
            animationSpec = tween(durationMillis = 800, easing = FastOutSlowInEasing)
        )

        delay(1200)

        if (authRepository.hasValidSession()) {
            onNavigate(Routes.DASHBOARD)
        } else {
            onNavigate(Routes.LOGIN)
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = listOf(
                        Obsidian,
                        ObsidianCard,
                        Obsidian
                    )
                )
            ),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
            modifier = Modifier
                .scale(scale.value)
                .alpha(alpha.value)
                .padding(24.dp)
        ) {
            // Elegant Luxury Seal
            Box(
                modifier = Modifier
                    .size(96.dp)
                    .background(BrandGold.copy(alpha = 0.15f), shape = CircleShape)
                    .background(BrandGold.copy(alpha = 0.05f)),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "И",
                    fontSize = 44.sp,
                    fontWeight = FontWeight.Bold,
                    color = BrandGold,
                    fontFamily = FontFamily.Serif
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            Text(
                text = "F A И T I И E",
                fontSize = 28.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 6.sp,
                color = BrandGoldLight,
                fontFamily = FontFamily.Serif
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = "KOREAN HANBANG CLINICAL SKINCARE",
                fontSize = 11.sp,
                fontWeight = FontWeight.SemiBold,
                letterSpacing = 2.sp,
                color = BrandGold.copy(alpha = 0.8f)
            )

            Spacer(modifier = Modifier.height(6.dp))

            Text(
                text = "Admin Portal & Order Automation System",
                fontSize = 12.sp,
                color = MutedSlate,
                textAlign = TextAlign.Center
            )
        }
    }
}
