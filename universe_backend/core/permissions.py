from rest_framework.permissions import BasePermission


class IsSeller(BasePermission):
    message = "Only seller accounts can do this."

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.account_type == "seller")
