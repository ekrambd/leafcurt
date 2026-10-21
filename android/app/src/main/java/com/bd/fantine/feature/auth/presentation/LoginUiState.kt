package com.bd.fantine.feature.auth.presentation

data class LoginUiState(
    val phone: String = "",
    val pass: String = "",
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val isSuccess: Boolean = false
)

sealed interface LoginAction {
    data class PhoneChanged(val phone: String) : LoginAction
    data class PasswordChanged(val pass: String) : LoginAction
    data object Submit : LoginAction
    data object DismissError : LoginAction
}
