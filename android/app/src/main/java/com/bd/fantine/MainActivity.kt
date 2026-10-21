package com.bd.fantine

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import androidx.navigation.compose.rememberNavController
import com.bd.fantine.core.navigation.AppNavHost
import com.bd.fantine.core.navigation.Routes
import com.bd.fantine.ui.theme.FantinebdTheme

class MainActivity : ComponentActivity() {

    private val requestNotificationPermissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { isGranted ->
            // Notification permission granted or denied
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        requestNotificationPermission()

        val app = application as FantineApplication
        val extraOrderId = intent?.getStringExtra("EXTRA_ORDER_ID")

        setContent {
            FantinebdTheme {
                val navController = rememberNavController()

                val startRoute = if (!extraOrderId.isNullOrBlank() && app.container.authRepository.hasValidSession()) {
                    Routes.orderDetail(extraOrderId)
                } else {
                    Routes.SPLASH
                }

                AppNavHost(
                    navController = navController,
                    container = app.container,
                    startDestination = startRoute
                )
            }
        }
    }

    private fun requestNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            val permission = Manifest.permission.POST_NOTIFICATIONS
            if (ContextCompat.checkSelfPermission(this, permission) != PackageManager.PERMISSION_GRANTED) {
                requestNotificationPermissionLauncher.launch(permission)
            }
        }
    }
}