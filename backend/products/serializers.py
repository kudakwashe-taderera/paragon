from rest_framework import serializers
from .models import ProductType, PaperType, PaperWeight, PaperSize


class ProductTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductType
        fields = ['id', 'name', 'description']


class PaperTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaperType
        fields = ['id', 'name', 'description']


class PaperWeightSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaperWeight
        fields = ['id', 'gsm']


class PaperSizeSerializer(serializers.ModelSerializer):
    dimensions = serializers.CharField(read_only=True)
    
    class Meta:
        model = PaperSize
        fields = ['id', 'name', 'series', 'width_mm', 'height_mm', 'dimensions']
