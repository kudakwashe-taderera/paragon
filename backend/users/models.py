from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class UserRole(models.TextChoices):
        SUPERUSER = 'SUPERUSER', 'Superuser'
        DESIGNER = 'DESIGNER', 'Designer'
        SALES_REPRESENTATIVE = 'SALES_REPRESENTATIVE', 'Sales Representative'
        OPERATOR = 'OPERATOR', 'Operator'
        CLERK = 'CLERK', 'Clerk'

    full_name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    role = models.CharField(
        max_length=20,
        choices=UserRole.choices,
        null=True,
        blank=True
    )
    approved = models.BooleanField(default=False)
    assigned_by = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_users'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'full_name']

    def __str__(self):
        return f"{self.full_name} ({self.email})"

    class Meta:
        db_table = 'users'
