package com.bd.fantine.core.navigation

object Routes {
    const val SPLASH = "splash"
    const val LOGIN = "login"
    const val DASHBOARD = "dashboard"
    const val ORDER_DETAIL = "order_detail/{orderId}"

    fun orderDetail(orderId: String) = "order_detail/$orderId"
}
