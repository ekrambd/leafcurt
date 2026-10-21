package com.bd.fantine.feature.auth.data.local

import android.content.Context
import android.content.SharedPreferences
import com.bd.fantine.core.common.Constants

class AdminPreferences(context: Context) {
    private val prefs: SharedPreferences =
        context.getSharedPreferences(Constants.PREFS_NAME, Context.MODE_PRIVATE)

    fun saveSession(token: String, phone: String) {
        prefs.edit()
            .putString(Constants.KEY_AUTH_TOKEN, token)
            .putString(Constants.KEY_ADMIN_PHONE, phone)
            .apply()
    }

    fun getToken(): String? = prefs.getString(Constants.KEY_AUTH_TOKEN, null)

    fun getPhone(): String? = prefs.getString(Constants.KEY_ADMIN_PHONE, null)

    fun isLoggedIn(): Boolean = !getToken().isNullOrBlank()

    fun clearSession() {
        prefs.edit()
            .remove(Constants.KEY_AUTH_TOKEN)
            .remove(Constants.KEY_ADMIN_PHONE)
            .apply()
    }
}
