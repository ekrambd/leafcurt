package com.bd.fantine.ui.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val DarkColorScheme = darkColorScheme(
    primary = BrandGold,
    onPrimary = Obsidian,
    primaryContainer = ObsidianCard,
    onPrimaryContainer = BrandGoldLight,
    secondary = BrandGoldDark,
    background = Obsidian,
    surface = ObsidianCard,
    onBackground = SilkWhite,
    onSurface = SilkWhite
)

private val LightColorScheme = lightColorScheme(
    primary = BrandGoldDark,
    onPrimary = PureWhite,
    primaryContainer = BrandGoldLight,
    onPrimaryContainer = Obsidian,
    secondary = BrandGold,
    background = SilkWhite,
    surface = PureWhite,
    onBackground = Obsidian,
    onSurface = Obsidian
)

@Composable
fun FantinebdTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = colorScheme.background.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = !darkTheme
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}