from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid

class Branch(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, unique=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} ({self.code})"

    class Meta:
        ordering = ['name']

class SystemSettings(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company_name = models.CharField(max_length=200)
    default_branch = models.ForeignKey(Branch, on_delete=models.SET_NULL, null=True, blank=True, related_name='default_for')
    auto_approve_users = models.BooleanField(default=False)
    email_notifications = models.BooleanField(default=True)
    system_maintenance = models.BooleanField(default=False)
    maintenance_message = models.TextField(blank=True)
    job_number_prefix = models.CharField(max_length=20, blank=True)
    job_number_suffix = models.CharField(max_length=20, blank=True)
    tax_rate = models.DecimalField(
        max_digits=5, 
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        default=15.00
    )
    currency = models.CharField(max_length=3, default='USD')
    business_hours = models.JSONField(default=dict)
    contact_info = models.JSONField(default=dict)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'System Settings'
        verbose_name_plural = 'System Settings'

    def __str__(self):
        return f"System Settings - {self.company_name}"

    def save(self, *args, **kwargs):
        # Ensure only one instance exists
        if not self.pk and SystemSettings.objects.exists():
            return SystemSettings.objects.first()
        return super().save(*args, **kwargs)

    @classmethod
    def get_settings(cls):
        settings = cls.objects.first()
        if not settings:
            settings = cls.objects.create(
                company_name="Paragon Job Management",
                business_hours={
                    "start": "08:00",
                    "end": "17:00"
                },
                contact_info={
                    "phone": "",
                    "email": "",
                    "address": ""
                }
            )
        return settings
