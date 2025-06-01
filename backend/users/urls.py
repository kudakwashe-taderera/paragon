from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('pending-users/', views.PendingUsersView.as_view(), name='pending_users'),
    path('approve-user/', views.approve_user, name='approve_user'),
    path('admin/stats/', views.admin_stats, name='admin_stats'),
    path('profile/', views.user_profile, name='user_profile'),
    path('users/', views.AllUsersView.as_view(), name='all_users'),
    path('check-users/', views.check_users),
]
