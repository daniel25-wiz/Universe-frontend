from django.urls import path

from . import views

urlpatterns = [
    path("auth/register", views.RegisterView.as_view()),
    path("auth/login", views.LoginView.as_view()),
    path("auth/google", views.GoogleLoginView.as_view()),
    path("auth/logout", views.LogoutView.as_view()),
    path("auth/refresh", views.RefreshView.as_view()),
    path("auth/me", views.MeView.as_view()),
    path("auth/forgot-password", views.ForgotPasswordView.as_view()),
    path("auth/verify-reset-code", views.VerifyResetCodeView.as_view()),
    path("auth/reset-password", views.ResetPasswordView.as_view()),
    path("users/me", views.UserMeView.as_view()),
    path("users/me/password", views.ChangePasswordView.as_view()),
    path("users/me/email", views.ChangeEmailView.as_view()),
    path("users/me/seller-profile", views.MySellerProfileView.as_view()),
    path("users/<uuid:user_id>/seller-profile", views.PublicSellerProfileView.as_view()),
]
