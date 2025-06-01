from django.db import migrations

def add_standard_paper_sizes(apps, schema_editor):
    PaperSize = apps.get_model('products', 'PaperSize')
    PaperWeight = apps.get_model('products', 'PaperWeight')
    
    # Standard A series sizes
    a_series = [
        ('A0', 841, 1189),
        ('A1', 594, 841),
        ('A2', 420, 594),
        ('A3', 297, 420),
        ('A4', 210, 297),
        ('A5', 148, 210),
        ('A6', 105, 148),
    ]
    
    # Standard B series sizes
    b_series = [
        ('B0', 1000, 1414),
        ('B1', 707, 1000),
        ('B2', 500, 707),
        ('B3', 353, 500),
        ('B4', 250, 353),
        ('B5', 176, 250),
        ('B6', 125, 176),
    ]
    
    # North American sizes
    na_series = [
        ('Letter', 216, 279),
        ('Legal', 216, 356),
        ('Tabloid', 279, 432),
        ('Executive', 184, 267),
    ]
    
    # Other common sizes
    other_sizes = [
        ('Business Card', 89, 51),
        ('DL Envelope', 110, 220),
        ('C4 Envelope', 229, 324),
        ('C5 Envelope', 162, 229),
        ('C6 Envelope', 114, 162),
        ('Square', 148, 148),
    ]
    
    def create_size(name, width, height, series):
        # Try to find existing size with these dimensions
        existing = PaperSize.objects.filter(
            width_mm=width,
            height_mm=height
        ).first()
        
        if existing:
            # Update name and series if needed
            if existing.name != name or existing.series != series:
                existing.name = name
                existing.series = series
                existing.save()
            return existing
        else:
            # Create new size
            return PaperSize.objects.create(
                name=name,
                series=series,
                width_mm=width,
                height_mm=height
            )
    
    # Create all paper sizes
    for name, width, height in a_series:
        create_size(name, width, height, 'A')
    
    for name, width, height in b_series:
        create_size(name, width, height, 'B')
    
    for name, width, height in na_series:
        create_size(name, width, height, 'NA')
    
    for name, width, height in other_sizes:
        create_size(name, width, height, 'OTHER')
    
    # Associate all sizes with all weights
    weights = PaperWeight.objects.all()
    sizes = PaperSize.objects.all()
    
    for weight in weights:
        # Get existing compatible sizes
        existing_sizes = set(weight.compatible_sizes.all().values_list('id', flat=True))
        # Add any missing sizes
        new_sizes = [size.id for size in sizes if size.id not in existing_sizes]
        if new_sizes:
            weight.compatible_sizes.add(*new_sizes)

def remove_standard_paper_sizes(apps, schema_editor):
    PaperSize = apps.get_model('products', 'PaperSize')
    PaperSize.objects.all().delete()

class Migration(migrations.Migration):
    dependencies = [
        ('products', '0002_papersize_paperweight_papertype_description_and_more'),
    ]

    operations = [
        migrations.RunPython(add_standard_paper_sizes, remove_standard_paper_sizes),
    ] 