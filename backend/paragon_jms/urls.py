from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('users.urls')),
    path('api/jobs/', include('jobs.urls')),
    path('api/products/', include('products.urls')),
    path('api/settings/', include('settings.urls')),
]
