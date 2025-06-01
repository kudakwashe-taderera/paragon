from django.urls import path
from . import views

urlpatterns = [
    path('', views.JobListCreateView.as_view(), name='job-list'),
    path('<int:job_id>/', views.JobDetailView.as_view(), name='job-detail'),
    path('<int:job_id>/status/', views.update_job_status, name='job-status-update'),
    path('<int:job_id>/payment/', views.update_job_payment, name='job-payment-update'),
    path('branches/', views.get_branches, name='branch-list'),
    path('pending/', views.pending_jobs, name='pending_jobs'),
    path('docket-counter/', views.docket_counter, name='docket_counter'),
    path('analytics/', views.job_analytics, name='job_analytics'),
    path('designer-stats/', views.designer_stats, name='designer_stats'),
]
