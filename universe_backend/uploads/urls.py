from django.urls import path

from . import views

urlpatterns = [
    path("uploads/images", views.UploadImageView.as_view()),
]
