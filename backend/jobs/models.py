from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from products.models import ProductType, PaperType, PaperWeight, PaperSize


class Job(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('PRINTED', 'Printed'),
        ('CANCELLED', 'Cancelled'),
    ]
    
    PAYMENT_STATUS_CHOICES = [
        ('NOT_MARKED', 'Not Marked'),
        ('RECEIPTED', 'Receipted'),
        ('INVOICED', 'Invoiced'),
    ]
    
    BRANCH_CHOICES = [
        ('BORROWDALE', 'Borrowdale'),
        ('EASTLEA', 'Eastlea'),
        ('BELGRAVIA', 'Belgravia'),
        ('AVONDALE', 'Avondale'),
        ('MSASA', 'Msasa'),
        ('CHITUNGWIZA', 'Chitungwiza'),
    ]
    
    JOB_TYPE_CHOICES = [
        ('LOCAL', 'Local'),
        ('FOREIGN', 'Foreign'),
    ]

    # Job Identification
    job_id = models.AutoField(primary_key=True)
    date = models.DateTimeField(auto_now_add=True)
    branch = models.CharField(max_length=50, choices=BRANCH_CHOICES)
    job_type = models.CharField(max_length=10, choices=JOB_TYPE_CHOICES)
    docket_number = models.CharField(max_length=20, unique=True)
    
    # Personnel
    sales_rep = models.CharField(max_length=100)
    order_taken_by = models.CharField(max_length=100)
    
    # Customer Information
    customer = models.CharField(max_length=200)
    contact_person = models.CharField(max_length=100)
    mobile_number = models.CharField(max_length=20)
    email_address = models.EmailField()
    
    # Job Details
    quantity = models.IntegerField(validators=[MinValueValidator(1)])
    description = models.TextField()
    
    # Product Specifications
    product_type = models.ForeignKey(
        ProductType,
        on_delete=models.PROTECT,
        related_name='jobs'
    )
    paper_type = models.ForeignKey(
        PaperType,
        on_delete=models.PROTECT,
        related_name='jobs',
        null=True,
        blank=True
    )
    paper_weight = models.ForeignKey(
        PaperWeight,
        on_delete=models.PROTECT,
        related_name='jobs',
        null=True,
        blank=True
    )
    paper_size = models.ForeignKey(
        PaperSize,
        on_delete=models.PROTECT,
        related_name='jobs',
        null=True,
        blank=True
    )
    
    # Additional Information
    notes = models.TextField(blank=True)
    
    # Costs
    print_cost = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    design_cost = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        default=0
    )
    total_cost = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='PENDING'
    )
    payment_status = models.CharField(
        max_length=20,
        choices=PAYMENT_STATUS_CHOICES,
        default='NOT_MARKED'
    )
    payment_ref = models.CharField(max_length=50, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        # Auto-calculate total_cost
        self.total_cost = self.print_cost + self.design_cost
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.docket_number} - {self.customer}"

    class Meta:
        db_table = 'jobs'
        ordering = ['-created_at']


class DocketCounter(models.Model):
    JOB_TYPE_CHOICES = [
        ('LOCAL', 'Local'),
        ('FOREIGN', 'Foreign'),
    ]
    
    job_type = models.CharField(max_length=10, choices=JOB_TYPE_CHOICES, unique=True)
    current_number = models.IntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.job_type} Counter: {self.current_number}"

    class Meta:
        db_table = 'docket_counters'
