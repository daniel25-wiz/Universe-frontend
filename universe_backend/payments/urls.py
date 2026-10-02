from django.urls import path

from . import views

urlpatterns = [
    path("payments/initialize", views.InitializePaymentView.as_view()),
    path("payments/verify/<str:reference>", views.VerifyPaymentView.as_view()),
    path("payments/webhook", views.PaystackWebhookView.as_view()),
]
