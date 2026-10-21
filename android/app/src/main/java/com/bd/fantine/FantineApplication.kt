package com.bd.fantine

import android.app.Application
import com.bd.fantine.core.di.AppContainer

class FantineApplication : Application() {

    lateinit var container: AppContainer
        private set

    override fun onCreate() {
        super.onCreate()
        container = AppContainer(this)

        // Schedule periodic background order notification sync
        container.scheduleOrderNotificationWorker()
    }
}
