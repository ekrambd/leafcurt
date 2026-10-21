package com.bd.fantine.core.navigation

import androidx.compose.runtime.Composable
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import com.bd.fantine.core.di.AppContainer
import com.bd.fantine.feature.auth.presentation.LoginScreen
import com.bd.fantine.feature.auth.presentation.LoginViewModel
import com.bd.fantine.feature.dashboard.presentation.DashboardScreen
import com.bd.fantine.feature.dashboard.presentation.DashboardViewModel
import com.bd.fantine.feature.dashboard.presentation.OrderDetailScreen
import com.bd.fantine.feature.splash.presentation.SplashScreen

@Composable
fun AppNavHost(
    navController: NavHostController,
    container: AppContainer,
    startDestination: String = Routes.SPLASH
) {
    NavHost(
        navController = navController,
        startDestination = startDestination
    ) {
        // 1. Splash Screen
        composable(Routes.SPLASH) {
            SplashScreen(
                authRepository = container.authRepository,
                onNavigate = { route ->
                    navController.navigate(route) {
                        popUpTo(Routes.SPLASH) { inclusive = true }
                    }
                }
            )
        }

        // 2. Login Screen
        composable(Routes.LOGIN) {
            val loginViewModel: LoginViewModel = viewModel(
                factory = LoginViewModel.Factory(container.authRepository)
            )

            LoginScreen(
                viewModel = loginViewModel,
                onLoginSuccess = {
                    container.scheduleOrderNotificationWorker()
                    navController.navigate(Routes.DASHBOARD) {
                        popUpTo(Routes.LOGIN) { inclusive = true }
                    }
                }
            )
        }

        // 3. Admin Dashboard
        composable(Routes.DASHBOARD) {
            val dashboardViewModel: DashboardViewModel = viewModel(
                factory = DashboardViewModel.Factory(
                    container.orderRepository,
                    container.authRepository,
                    container.productRepository,
                    container.customerRepository
                )
            )

            DashboardScreen(
                viewModel = dashboardViewModel,
                onOrderClick = { orderId ->
                    navController.navigate(Routes.orderDetail(orderId))
                },
                onLogoutNav = {
                    navController.navigate(Routes.LOGIN) {
                        popUpTo(Routes.DASHBOARD) { inclusive = true }
                    }
                }
            )
        }

        // 4. Order Details
        composable(
            route = Routes.ORDER_DETAIL,
            arguments = listOf(navArgument("orderId") { type = NavType.StringType })
        ) { backStackEntry ->
            val orderId = backStackEntry.arguments?.getString("orderId") ?: ""
            val dashboardViewModel: DashboardViewModel = viewModel(
                factory = DashboardViewModel.Factory(
                    container.orderRepository,
                    container.authRepository,
                    container.productRepository,
                    container.customerRepository
                )
            )

            OrderDetailScreen(
                orderId = orderId,
                viewModel = dashboardViewModel,
                onBack = { navController.popBackStack() }
            )
        }
    }
}
