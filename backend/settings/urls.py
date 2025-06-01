from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'branches', views.BranchViewSet)

urlpatterns = [
    path('', views.system_settings, name='system_settings'),
    path('', include(router.urls)),
] 