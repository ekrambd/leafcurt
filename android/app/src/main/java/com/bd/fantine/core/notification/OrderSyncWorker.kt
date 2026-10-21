package com.bd.fantine.core.notification

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.bd.fantine.FantineApplication

class OrderSyncWorker(
    appContext: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(appContext, workerParams) {

    override suspend fun doWork(): Result {
        return try {
            val app = applicationContext as? FantineApplication ?: return Result.failure()
            val orderRepository = app.container.orderRepository
            val authRepository = app.container.authRepository

            // Only sync and notify if admin is logged in
            if (authRepository.hasValidSession()) {
                orderRepository.checkNewOrdersAndNotify()
            }
            Result.success()
        } catch (e: Exception) {
            Result.retry()
        }
    }
}
