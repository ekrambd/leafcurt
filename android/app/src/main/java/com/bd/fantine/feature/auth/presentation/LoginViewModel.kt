package com.bd.fantine.feature.auth.presentation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.bd.fantine.core.common.Resource
import com.bd.fantine.feature.auth.domain.repository.AuthRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

class LoginViewModel(
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(
        LoginUiState(
            phone = authRepository.getSavedPhone() ?: "0171141385"
        )
    )
    val uiState = _uiState.asStateFlow()

    fun onAction(action: LoginAction) {
        when (action) {
            is LoginAction.PhoneChanged -> {
                _uiState.update { it.copy(phone = action.phone, errorMessage = null) }
            }
            is LoginAction.PasswordChanged -> {
                _uiState.update { it.copy(pass = action.pass, errorMessage = null) }
            }
            is LoginAction.DismissError -> {
                _uiState.update { it.copy(errorMessage = null) }
            }
            LoginAction.Submit -> login()
        }
    }

    private fun login() {
        val phone = _uiState.value.phone.trim()
        val pass = _uiState.value.pass.trim()

        if (phone.isEmpty()) {
            _uiState.update { it.copy(errorMessage = "Please enter admin phone number") }
            return
        }
        if (pass.isEmpty()) {
            _uiState.update { it.copy(errorMessage = "Please enter admin password") }
            return
        }

        _uiState.update { it.copy(isLoading = true, errorMessage = null) }

        viewModelScope.launch {
            when (val result = authRepository.login(phone, pass)) {
                is Resource.Success -> {
                    _uiState.update { it.copy(isLoading = false, isSuccess = true) }
                }
                is Resource.Error -> {
                    _uiState.update { it.copy(isLoading = false, errorMessage = result.message) }
                }
                Resource.Loading -> {}
            }
        }
    }

    class Factory(private val authRepository: AuthRepository) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
            return LoginViewModel(authRepository) as T
        }
    }
}
