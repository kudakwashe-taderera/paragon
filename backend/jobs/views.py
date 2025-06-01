from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count, Q, Max, Sum, F
from django.db.models.functions import TruncDate, ExtractMonth
from django.utils import timezone
from datetime import datetime, timedelta
from .models import Job, DocketCounter
from .serializers import (
    JobSerializer, 
    JobCreateSerializer, 
    JobUpdateSerializer,
    JobStatusUpdateSerializer,
    JobPaymentUpdateSerializer,
    DocketCounterSerializer
)
from products.models import PaperSize


class JobListCreateView(generics.ListCreateAPIView):
    queryset = Job.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'payment_status', 'branch', 'job_type']
    search_fields = ['customer', 'docket_number', 'description']
    ordering_fields = ['date', 'job_id', 'customer']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return JobCreateSerializer
        return JobSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = Job.objects.select_related(
            'product_type',
            'paper_type',
            'paper_weight',
            'paper_size'
        )
        
        if user.role == 'SALES_REPRESENTATIVE':
            queryset = queryset.filter(sales_rep=user.full_name)
        elif user.role == 'CLERK':
            queryset = queryset.filter(payment_status='NOT_MARKED')
        elif user.role in ['DESIGNER', 'OPERATOR']:
            queryset = queryset.filter(status='PENDING')

        return queryset

    def perform_create(self, serializer):
        user = self.request.user

        # Prevent Clerk and Operator from adding jobs
        if user.role in ['CLERK', 'OPERATOR']:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You are not allowed to create jobs.")

        validated_data = serializer.validated_data

        # Auto-calculate total_cost
        print_cost = validated_data.get("print_cost", 0) or 0
        design_cost = validated_data.get("design_cost", 0) or 0
        validated_data["total_cost"] = print_cost + design_cost

        try:
            serializer.save()
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error saving job: {e}")
            raise

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        
        # Re-serialize the instance with the full JobSerializer
        instance = serializer.instance
        response_serializer = JobSerializer(instance)
        
        return Response(
            response_serializer.data,
            status=status.HTTP_201_CREATED,
            headers=headers
        )


class JobDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Job.objects.select_related(
        'product_type',
        'paper_type',
        'paper_weight',
        'paper_size'
    )
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'job_id'

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return JobUpdateSerializer
        return JobSerializer

    def check_edit_permission(self, job):
        user = self.request.user
        
        # Can't edit printed jobs
        if job.status == 'PRINTED':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Cannot edit a printed job.")
            
        # Superuser can edit any job that's not printed
        if user.role == 'SUPERUSER':
            return True
            
        # Creator can edit their own jobs if not printed
        if job.order_taken_by == user.full_name:
            return True
            
        raise PermissionDenied("You don't have permission to edit this job.")

    def update(self, request, *args, **kwargs):
        job = self.get_object()
        self.check_edit_permission(job)
        return super().update(request, *args, **kwargs)

    def perform_update(self, serializer):
        # Auto-calculate total_cost
        validated_data = serializer.validated_data
        print_cost = validated_data.get("print_cost", 0) or 0
        design_cost = validated_data.get("design_cost", 0) or 0
        validated_data["total_cost"] = print_cost + design_cost
        
        serializer.save()


@api_view(['PATCH'])
@permission_classes([permissions.IsAuthenticated])
def update_job_status(request, job_id):
    user = request.user
    
    # Check permissions
    if user.role not in ['SUPERUSER', 'DESIGNER', 'OPERATOR']:
        return Response(
            {'error': 'Permission denied'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        job = Job.objects.get(job_id=job_id)
    except Job.DoesNotExist:
        return Response(
            {'error': 'Job not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    serializer = JobStatusUpdateSerializer(job, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    
    return Response(JobSerializer(job).data)


@api_view(['PATCH'])
@permission_classes([permissions.IsAuthenticated])
def update_job_payment(request, job_id):
    user = request.user
    
    # Only clerks and superusers can update payment status
    if user.role not in ['SUPERUSER', 'CLERK']:
        return Response(
            {'error': 'Permission denied'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        job = Job.objects.get(job_id=job_id)
    except Job.DoesNotExist:
        return Response(
            {'error': 'Job not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    serializer = JobPaymentUpdateSerializer(job, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    
    return Response(JobSerializer(job).data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def pending_jobs(request):
    jobs = Job.objects.filter(status='PENDING').select_related(
        'product_type',
        'paper_type',
        'paper_weight',
        'paper_size'
    )
    serializer = JobSerializer(jobs, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def docket_counter(request):
    job_type = request.GET.get('type', 'LOCAL')
    
    # Get the current counter
    counter, created = DocketCounter.objects.get_or_create(
        job_type=job_type,
        defaults={'current_number': 0}
    )
    
    # Find the highest existing docket number for LOCAL jobs
    if job_type == 'LOCAL':
        # Get all LOCAL job docket numbers
        existing_numbers = Job.objects.filter(
            job_type='LOCAL',
            docket_number__startswith='LOC-'
        ).values_list('docket_number', flat=True)
        
        # Extract the highest number from existing docket numbers
        highest_number = 0
        for docket_number in existing_numbers:
            try:
                num = int(docket_number.split('-')[1])
                highest_number = max(highest_number, num)
            except (IndexError, ValueError):
                continue
        
        # Update counter if it's behind the highest existing number
        if highest_number >= counter.current_number:
            counter.current_number = highest_number
            counter.save()
    
    serializer = DocketCounterSerializer(counter)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def job_analytics(request):
    if request.user.role != 'SUPERUSER':
        return Response(
            {'error': 'Permission denied'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Get the date range (last 30 days)
    end_date = timezone.now().date()
    start_date = end_date - timedelta(days=30)
    
    # User performance
    user_performance = Job.objects.values('order_taken_by').annotate(
        jobs_created=Count('job_id'),
        jobs_printed=Count('job_id', filter=Q(status='PRINTED')),
        jobs_paid=Count('job_id', filter=Q(payment_status__in=['RECEIPTED', 'INVOICED']))
    ).order_by('-jobs_created')[:10]
    
    # Branch performance with profits
    branch_performance = Job.objects.values('branch').annotate(
        job_count=Count('job_id'),
        total_profit=Sum('total_cost', filter=Q(payment_status__in=['RECEIPTED', 'INVOICED']))
    ).order_by('-job_count')
    
    # Popular product types with revenue
    product_performance = Job.objects.values('product_type__name').annotate(
        job_count=Count('job_id'),
        total_revenue=Sum('total_cost', filter=Q(payment_status__in=['RECEIPTED', 'INVOICED']))
    ).order_by('-job_count')[:10]
    
    # Financial stats
    financial_stats = {
        'total_receipted': Job.objects.filter(payment_status='RECEIPTED').count(),
        'total_invoiced': Job.objects.filter(payment_status='INVOICED').count(),
        'total_unpaid': Job.objects.filter(payment_status='NOT_MARKED').count(),
    }
    
    # Daily profits for the last 30 days
    daily_profits = Job.objects.filter(
        created_at__date__gte=start_date,
        created_at__date__lte=end_date,
        payment_status__in=['RECEIPTED', 'INVOICED']
    ).annotate(
        created_date=TruncDate('created_at')
    ).values('created_date').annotate(
        total_profit=Sum('total_cost')
    ).order_by('created_date')
    
    # Monthly branch profits
    monthly_branch_profits = Job.objects.filter(
        payment_status__in=['RECEIPTED', 'INVOICED']
    ).annotate(
        month=ExtractMonth('created_at')
    ).values('month', 'branch').annotate(
        total_profit=Sum('total_cost')
    ).order_by('month', 'branch')
    
    return Response({
        'user_performance': user_performance,
        'branch_performance': branch_performance,
        'product_performance': product_performance,
        'financial_stats': financial_stats,
        'daily_profits': daily_profits,
        'monthly_branch_profits': monthly_branch_profits,
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def designer_stats(request):
    if request.user.role not in ['DESIGNER', 'SUPERUSER']:
        return Response(
            {'error': 'Permission denied'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Get today's date
    today = timezone.now().date()
    
    # Calculate stats
    stats = {
        'jobs_today': Job.objects.filter(
            created_at__date=today
        ).count(),
        'pending_jobs': Job.objects.filter(
            status='PENDING'
        ).count(),
        'completed_today': Job.objects.filter(
            status='PRINTED',
            updated_at__date=today
        ).count(),
    }
    
    return Response(stats)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_branches(request):
    """Get a list of all unique branches from jobs."""
    branches = Job.objects.values_list('branch', flat=True).distinct().order_by('branch')
    return Response(list(branches))


class JobCreateView(generics.CreateAPIView):
    serializer_class = JobSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        # Handle custom size if provided
        custom_size_data = request.data.get('custom_size')
        if custom_size_data:
            try:
                # Create or get the custom size
                custom_size, created = PaperSize.objects.get_or_create(
                    name=custom_size_data['name'],
                    width_mm=custom_size_data['width_mm'],
                    height_mm=custom_size_data['height_mm'],
                    defaults={'series': 'OTHER'}
                )
                # Update the request data to use the custom size ID
                mutable_data = request.data.copy()
                mutable_data['paper_size'] = custom_size.id
                request.data = mutable_data
            except Exception as e:
                return Response(
                    {'error': f'Failed to create custom size: {str(e)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        return super().create(request, *args, **kwargs)
