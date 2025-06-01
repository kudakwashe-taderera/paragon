from django.contrib import admin
from .models import Job, DocketCounter


@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = (
        'job_id', 'customer', 'branch', 'job_type', 'status', 
        'payment_status', 'total_cost', 'created_at'
    )
    list_filter = ('status', 'payment_status', 'branch', 'job_type', 'created_at')
    search_fields = ('customer', 'docket_number', 'description')
    readonly_fields = ('job_id', 'total_cost', 'created_at', 'updated_at')
    ordering = ('-created_at',)


@admin.register(DocketCounter)
class DocketCounterAdmin(admin.ModelAdmin):
    list_display = ('job_type', 'current_number')
