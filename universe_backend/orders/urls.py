from django.urls import path

from . import views

urlpatterns = [
    path("orders", views.OrderListCreateView.as_view()),
    path("orders/<uuid:pk>", views.OrderDetailView.as_view()),
    path("seller/orders", views.SellerOrdersView.as_view()),
]
