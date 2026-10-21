package com.bd.fantine.core.common

object Constants {
    const val BASE_URL = "https://fantinebd.com/"
    const val PREFS_NAME = "fantine_admin_prefs"
    const val KEY_AUTH_TOKEN = "key_auth_token"
    const val KEY_ADMIN_PHONE = "key_admin_phone"
    const val KEY_LAST_ORDER_ID = "key_last_order_id"
    const val KEY_LAST_SYNC_TIME = "key_last_sync_time"

    // Notifications
    const val NOTIFICATION_CHANNEL_ID = "fantine_orders_channel"
    const val NOTIFICATION_CHANNEL_NAME = "Fantine Order Alerts"
    const val NOTIFICATION_CHANNEL_DESC = "Instant notifications for incoming customer orders"
    const val NOTIFICATION_ID_BASE = 1001

    // WorkManager
    const val ORDER_SYNC_WORK_NAME = "FantineOrderSyncWork"
}
