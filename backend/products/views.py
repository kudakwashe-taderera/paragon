from rest_framework import generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import ProductType, PaperType, PaperWeight, PaperSize, ProductTypeSpecification
from .serializers import (
    ProductTypeSerializer,
    PaperTypeSerializer,
    PaperWeightSerializer,
    PaperSizeSerializer
)
from django.db.models import Q
from decimal import Decimal


class ProductTypeListCreateView(generics.ListCreateAPIView):
    queryset = ProductType.objects.all()
    serializer_class = ProductTypeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated()]


class ProductTypeDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ProductType.objects.all()
    serializer_class = ProductTypeSerializer
    permission_classes = [permissions.IsAuthenticated]


class PaperTypeListCreateView(generics.ListCreateAPIView):
    queryset = PaperType.objects.all()
    serializer_class = PaperTypeSerializer
    permission_classes = [permissions.IsAuthenticated]


class PaperTypeDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = PaperType.objects.all()
    serializer_class = PaperTypeSerializer
    permission_classes = [permissions.IsAuthenticated]


class ProductTypeList(generics.ListAPIView):
    queryset = ProductType.objects.all()
    serializer_class = ProductTypeSerializer
    permission_classes = [permissions.IsAuthenticated]


class PaperWeightList(generics.ListAPIView):
    """Get all paper weights ordered by GSM"""
    queryset = PaperWeight.objects.all().order_by('gsm')
    serializer_class = PaperWeightSerializer
    permission_classes = [permissions.IsAuthenticated]


class PaperSizeList(generics.ListAPIView):
    """Get all paper sizes ordered by series and name"""
    queryset = PaperSize.objects.all().order_by('series', 'name')
    serializer_class = PaperSizeSerializer
    permission_classes = [permissions.IsAuthenticated]


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_product_specifications(request, product_type_id):
    """Get all valid paper specifications for a product type"""
    try:
        spec = ProductTypeSpecification.objects.get(product_type_id=product_type_id)
        return Response({
            'paper_types': PaperTypeSerializer(spec.paper_types.all(), many=True).data,
            'paper_weights': PaperWeightSerializer(spec.paper_weights.all(), many=True).data,
            'paper_sizes': PaperSizeSerializer(spec.paper_sizes.all(), many=True).data,
        })
    except ProductTypeSpecification.DoesNotExist:
        return Response({
            'paper_types': [],
            'paper_weights': [],
            'paper_sizes': [],
        })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_compatible_weights(request):
    """Get compatible paper weights for a paper type"""
    paper_type_id = request.GET.get('paper_type_id')
    if not paper_type_id:
        return Response({'error': 'paper_type_id is required'}, status=400)
    
    try:
        paper_type = PaperType.objects.get(id=paper_type_id)
        weights = paper_type.compatible_weights.all()
        return Response(PaperWeightSerializer(weights, many=True).data)
    except PaperType.DoesNotExist:
        return Response({'error': 'Paper type not found'}, status=404)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_compatible_sizes(request):
    """Get all paper sizes (no compatibility filtering)"""
    try:
        sizes = PaperSize.objects.all().order_by('series', 'name')
        return Response(PaperSizeSerializer(sizes, many=True).data)
    except Exception as e:
        return Response({'error': str(e)}, status=400)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_custom_size(request):
    """Create a new custom paper size"""
    name = request.data.get('name')
    width_mm = request.data.get('width_mm')
    height_mm = request.data.get('height_mm')
    weight_id = request.data.get('weight_id')

    if not all([name, width_mm, height_mm, weight_id]):
        return Response({
            'error': 'name, width_mm, height_mm, and weight_id are required'
        }, status=400)

    try:
        # Convert dimensions to Decimal for exact comparison
        width_mm = Decimal(str(width_mm))
        height_mm = Decimal(str(height_mm))

        # Check if size with these dimensions already exists
        existing_size = PaperSize.objects.filter(
            Q(width_mm=width_mm, height_mm=height_mm) |
            Q(width_mm=height_mm, height_mm=width_mm)  # Check rotated dimensions too
        ).first()

        if existing_size:
            # Associate with the weight if not already
            weight = PaperWeight.objects.get(id=weight_id)
            if not existing_size.paper_weights.filter(id=weight_id).exists():
                existing_size.paper_weights.add(weight)
            return Response({
                'message': 'A paper size with these dimensions already exists',
                'size': PaperSizeSerializer(existing_size).data
            }, status=200)

        # Get the weight to associate with the size
        weight = PaperWeight.objects.get(id=weight_id)

        # Create new custom size
        # If name starts with "Custom Size", increment the number
        if name.lower().startswith('custom size') or not name:
            latest_custom = PaperSize.objects.filter(
                name__istartswith='Custom Size'
            ).order_by('-name').first()
            
            if latest_custom:
                try:
                    # Extract the number from the last custom size
                    last_num = int(''.join(filter(str.isdigit, latest_custom.name)))
                    name = f'Custom Size {last_num + 1}'
                except ValueError:
                    name = 'Custom Size 1'
            else:
                name = 'Custom Size 1'

        size = PaperSize.objects.create(
            name=name,
            series='OTHER',
            width_mm=width_mm,
            height_mm=height_mm
        )
        size.paper_weights.add(weight)
        
        return Response(PaperSizeSerializer(size).data, status=201)
    
    except PaperWeight.DoesNotExist:
        return Response({'error': 'Paper weight not found'}, status=404)
    except (ValueError, TypeError) as e:
        return Response({'error': f'Invalid dimensions: {str(e)}'}, status=400)
    except Exception as e:
        return Response({'error': str(e)}, status=400)
