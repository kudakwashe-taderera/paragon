from django.db import models


class ProductType(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'product_types'
        ordering = ['name']


class PaperType(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'paper_types'
        ordering = ['name']


class PaperWeight(models.Model):
    gsm = models.IntegerField(unique=True)
    paper_types = models.ManyToManyField(PaperType, related_name='compatible_weights')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.gsm} GSM"

    class Meta:
        ordering = ['gsm']


class PaperSize(models.Model):
    SERIES_CHOICES = [
        ('A', 'ISO A Series'),
        ('B', 'ISO B Series'),
        ('NA', 'North American'),
        ('OTHER', 'Other')
    ]

    name = models.CharField(max_length=100)
    series = models.CharField(max_length=10, choices=SERIES_CHOICES)
    width_mm = models.DecimalField(max_digits=8, decimal_places=2)
    height_mm = models.DecimalField(max_digits=8, decimal_places=2)
    paper_weights = models.ManyToManyField(PaperWeight, related_name='compatible_sizes')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['width_mm', 'height_mm']
        ordering = ['series', 'name']

    def __str__(self):
        return f"{self.name} ({self.width_mm}×{self.height_mm}mm)"

    @property
    def dimensions(self):
        return f"{self.width_mm}×{self.height_mm}mm"


class ProductTypeSpecification(models.Model):
    """Defines which paper types, weights, and sizes are valid for each product type"""
    product_type = models.OneToOneField(ProductType, on_delete=models.CASCADE, related_name='specifications')
    paper_types = models.ManyToManyField(PaperType, related_name='product_types')
    paper_weights = models.ManyToManyField(PaperWeight, related_name='product_types')
    paper_sizes = models.ManyToManyField(PaperSize, related_name='product_types')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Specifications for {self.product_type.name}"
