package com.bd.fantine.feature.auth.presentation

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusDirection
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.bd.fantine.core.navigation.Routes
import com.bd.fantine.ui.theme.BrandGold
import com.bd.fantine.ui.theme.BrandGoldDark
import com.bd.fantine.ui.theme.BrandGoldLight
import com.bd.fantine.ui.theme.LightSlate
import com.bd.fantine.ui.theme.MutedSlate
import com.bd.fantine.ui.theme.Obsidian
import com.bd.fantine.ui.theme.ObsidianBorder
import com.bd.fantine.ui.theme.ObsidianCard
import com.bd.fantine.ui.theme.PureWhite
import com.bd.fantine.ui.theme.StatusCancelledBg
import com.bd.fantine.ui.theme.StatusCancelledText

@Composable
fun LoginScreen(
    viewModel: LoginViewModel,
    onLoginSuccess: () -> Unit
) {
    val state by viewModel.uiState.collectAsState()
    val focusManager = LocalFocusManager.current
    var isPasswordVisible by remember { mutableStateOf(false) }

    LaunchedEffect(state.isSuccess) {
        if (state.isSuccess) {
            onLoginSuccess()
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = listOf(
                        Obsidian,
                        ObsidianCard,
                        Obsidian
                    )
                )
            )
            .padding(24.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            // Header Luxury Seal
            Box(
                modifier = Modifier
                    .size(76.dp)
                    .background(BrandGold.copy(alpha = 0.12f), shape = CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "FAИ",
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Bold,
                    color = BrandGold,
                    fontFamily = FontFamily.Serif
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            Text(
                text = "FAИTIИE ADMIN",
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 4.sp,
                color = BrandGoldLight,
                fontFamily = FontFamily.Serif
            )

            Text(
                text = "Log in to manage orders, inventory & live sales",
                fontSize = 12.sp,
                color = MutedSlate,
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(top = 4.dp, bottom = 28.dp)
            )

            // Form Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(
                    containerColor = ObsidianCard
                ),
                border = CardDefaults.outlinedCardBorder().copy(
                    brush = Brush.verticalGradient(
                        listOf(BrandGold.copy(alpha = 0.35f), ObsidianBorder)
                    )
                )
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(20.dp)
                ) {
                    Text(
                        text = "Phone Number / Identifier",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = LightSlate
                    )

                    Spacer(modifier = Modifier.height(6.dp))

                    OutlinedTextField(
                        value = state.phone,
                        onValueChange = { viewModel.onAction(LoginAction.PhoneChanged(it)) },
                        modifier = Modifier.fillMaxWidth(),
                        placeholder = { Text("0171141385", color = MutedSlate) },
                        leadingIcon = {
                            Icon(Icons.Default.Phone, contentDescription = "Phone", tint = BrandGold)
                        },
                        keyboardOptions = KeyboardOptions(
                            keyboardType = KeyboardType.Phone,
                            imeAction = ImeAction.Next
                        ),
                        keyboardActions = KeyboardActions(
                            onNext = { focusManager.moveFocus(FocusDirection.Down) }
                        ),
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = BrandGold,
                            unfocusedBorderColor = ObsidianBorder,
                            focusedTextColor = PureWhite,
                            unfocusedTextColor = PureWhite,
                            cursorColor = BrandGold
                        ),
                        shape = RoundedCornerShape(12.dp)
                    )

                    Spacer(modifier = Modifier.height(18.dp))

                    Text(
                        text = "Password",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = LightSlate
                    )

                    Spacer(modifier = Modifier.height(6.dp))

                    OutlinedTextField(
                        value = state.pass,
                        onValueChange = { viewModel.onAction(LoginAction.PasswordChanged(it)) },
                        modifier = Modifier.fillMaxWidth(),
                        placeholder = { Text("Enter password", color = MutedSlate) },
                        leadingIcon = {
                            Icon(Icons.Default.Lock, contentDescription = "Password", tint = BrandGold)
                        },
                        trailingIcon = {
                            IconButton(onClick = { isPasswordVisible = !isPasswordVisible }) {
                                Icon(
                                    imageVector = if (isPasswordVisible) Icons.Default.Visibility else Icons.Default.VisibilityOff,
                                    contentDescription = "Toggle password visibility",
                                    tint = MutedSlate
                                )
                            }
                        },
                        visualTransformation = if (isPasswordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                        keyboardOptions = KeyboardOptions(
                            keyboardType = KeyboardType.Password,
                            imeAction = ImeAction.Done
                        ),
                        keyboardActions = KeyboardActions(
                            onDone = {
                                focusManager.clearFocus()
                                viewModel.onAction(LoginAction.Submit)
                            }
                        ),
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = BrandGold,
                            unfocusedBorderColor = ObsidianBorder,
                            focusedTextColor = PureWhite,
                            unfocusedTextColor = PureWhite,
                            cursorColor = BrandGold
                        ),
                        shape = RoundedCornerShape(12.dp)
                    )

                    // Error Message
                    if (state.errorMessage != null) {
                        Spacer(modifier = Modifier.height(14.dp))
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(StatusCancelledBg, shape = RoundedCornerShape(8.dp))
                                .padding(12.dp)
                        ) {
                            Text(
                                text = state.errorMessage ?: "",
                                color = StatusCancelledText,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Medium
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(24.dp))

                    Button(
                        onClick = {
                            focusManager.clearFocus()
                            viewModel.onAction(LoginAction.Submit)
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(50.dp),
                        enabled = !state.isLoading,
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = BrandGold,
                            contentColor = Obsidian
                        )
                    ) {
                        if (state.isLoading) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(24.dp),
                                color = Obsidian,
                                strokeWidth = 2.5.dp
                            )
                        } else {
                            Text(
                                text = "LOGIN TO DASHBOARD",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 1.sp
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            Text(
                text = "Protected by Brandini Co., Ltd. • Seoul, Korea",
                fontSize = 11.sp,
                color = MutedSlate
            )
        }
    }
}
