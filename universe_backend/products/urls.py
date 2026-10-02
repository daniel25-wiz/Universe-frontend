from django.urls import path

from . import views

urlpatterns = [
    path("products", views.ProductListCreateView.as_view()),
    path("products/<uuid:pk>", views.ProductDetailView.as_view()),
]
