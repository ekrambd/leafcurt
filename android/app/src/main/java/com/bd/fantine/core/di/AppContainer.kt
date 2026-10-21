package com.bd.fantine.core.di

import android.content.Context
import androidx.work.Constraints
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.NetworkType
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import com.bd.fantine.core.common.Constants
import com.bd.fantine.core.common.DefaultDispatcherProvider
import com.bd.fantine.core.common.DispatcherProvider
import com.bd.fantine.core.database.AppDatabase
import com.bd.fantine.core.network.NetworkClient
import com.bd.fantine.core.notification.NotificationHelper
import com.bd.fantine.core.notification.OrderSyncWorker
import com.bd.fantine.feature.auth.data.local.AdminPreferences
import com.bd.fantine.feature.auth.data.repository.AuthRepositoryImpl
import com.bd.fantine.feature.auth.domain.repository.AuthRepository
import com.bd.fantine.feature.dashboard.data.repository.OrderRepositoryImpl
import com.bd.fantine.feature.dashboard.domain.repository.OrderRepository
import java.util.concurrent.TimeUnit

class AppContainer(private val context: Context) {

    val dispatchers: DispatcherProvider by lazy { DefaultDispatcherProvider() }

    val adminPreferences: AdminPreferences by lazy { AdminPreferences(context) }

    val notificationHelper: NotificationHelper by lazy { NotificationHelper(context) }

    val networkClient: NetworkClient by lazy {
        NetworkClient(tokenProvider = { adminPreferences.getToken() })
    }

    val database: AppDatabase by lazy { AppDatabase.getInstance(context) }

    val authRepository: AuthRepository by lazy {
        AuthRepositoryImpl(
            apiService = networkClient.apiService,
            preferences = adminPreferences
        )
    }

    val orderRepository: OrderRepository by lazy {
        OrderRepositoryImpl(
            apiService = networkClient.apiService,
            orderDao = database.orderDao(),
            notificationHelper = notificationHelper
        )
    }

    val productRepository: com.bd.fantine.feature.dashboard.domain.repository.ProductRepository by lazy {
        com.bd.fantine.feature.dashboard.data.repository.ProductRepositoryImpl(
            apiService = networkClient.apiService
        )
    }

    val customerRepository: com.bd.fantine.feature.dashboard.domain.repository.CustomerRepository by lazy {
        com.bd.fantine.feature.dashboard.data.repository.CustomerRepositoryImpl(
            apiService = networkClient.apiService
        )
    }


    fun scheduleOrderNotificationWorker() {
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()

        val periodicSyncRequest = PeriodicWorkRequestBuilder<OrderSyncWorker>(15, TimeUnit.MINUTES)
            .setConstraints(constraints)
            .build()

        WorkManager.getInstance(context).enqueueUniquePeriodicWork(
            Constants.ORDER_SYNC_WORK_NAME,
            ExistingPeriodicWorkPolicy.KEEP,
            periodicSyncRequest
        )
    }
}
