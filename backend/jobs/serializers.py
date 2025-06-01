from rest_framework import serializers
from django.db import transaction
from .models import Job, DocketCounter
from products.serializers import (
    ProductTypeSerializer,
    PaperTypeSerializer,
    PaperWeightSerializer,
    PaperSizeSerializer
)


class JobSerializer(serializers.ModelSerializer):
    product_type = ProductTypeSerializer(read_only=True)
    paper_type = PaperTypeSerializer(read_only=True)
    paper_weight = PaperWeightSerializer(read_only=True)
    paper_size = PaperSizeSerializer(read_only=True)
    branch_display = serializers.CharField(source='get_branch_display', read_only=True)
    job_type_display = serializers.CharField(source='get_job_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_status_display = serializers.CharField(source='get_payment_status_display', read_only=True)

    class Meta:
        model = Job
        fields = [
            'job_id', 'date', 'branch', 'job_type', 'docket_number',
            'sales_rep', 'order_taken_by', 'customer', 'contact_person',
            'mobile_number', 'email_address', 'quantity', 'description',
            'product_type', 'paper_type', 'paper_weight', 'paper_size',
            'notes', 'print_cost', 'design_cost', 'total_cost',
            'status', 'payment_status', 'payment_ref',
            'created_at', 'updated_at',
            'branch_display', 'job_type_display', 'status_display',
            'payment_status_display'
        ]
        read_only_fields = ('job_id', 'date', 'total_cost', 'created_at', 'updated_at')

    def validate(self, attrs):
        # Auto-calculate total cost
        print_cost = attrs.get('print_cost', 0)
        design_cost = attrs.get('design_cost', 0)
        attrs['total_cost'] = print_cost + design_cost
        return attrs


class JobCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Job
        fields = [
            'job_id', 'branch', 'job_type', 'sales_rep', 'order_taken_by',
            'customer', 'contact_person', 'mobile_number', 'email_address',
            'quantity', 'description', 'product_type', 'paper_type',
            'paper_weight', 'paper_size', 'notes', 'print_cost',
            'design_cost'
        ]
        read_only_fields = ('job_id',)

    def _generate_unique_docket_number(self, counter):
        """
        Generate a unique docket number by checking against existing numbers.
        Returns tuple of (docket_number, new_counter_value)
        """
        base_number = counter.current_number + 1
        while True:
            docket_number = f"LOC-{base_number:03d}"
            if not Job.objects.filter(docket_number=docket_number).exists():
                return docket_number, base_number
            base_number += 1

    def create(self, validated_data):
        # Only handle docket number generation for LOCAL jobs
        if validated_data['job_type'] == 'LOCAL':
            try:
                with transaction.atomic():
                    # Lock the counter row to prevent concurrent access
                    counter = DocketCounter.objects.select_for_update().get(job_type='LOCAL')
                    
                    # Generate a unique docket number
                    docket_number, new_counter_value = self._generate_unique_docket_number(counter)
                    
                    # Update the counter with the new value
                    counter.current_number = new_counter_value
                    counter.save()
                    
                    # Set the docket number in validated data
                    validated_data['docket_number'] = docket_number
                    
                    # Calculate total cost
                    print_cost = validated_data.get('print_cost', 0)
                    design_cost = validated_data.get('design_cost', 0)
                    validated_data['total_cost'] = print_cost + design_cost
                    
                    # Create the job with the generated docket number
                    return super().create(validated_data)
            except DocketCounter.DoesNotExist:
                # If counter doesn't exist, create it and retry
                DocketCounter.objects.create(job_type='LOCAL', current_number=0)
                return self.create(validated_data)
        
        # For FOREIGN jobs, just create the job with the provided docket number
        return super().create(validated_data)


class JobUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Job
        fields = [
            'branch', 'customer', 'contact_person', 'mobile_number',
            'email_address', 'quantity', 'description', 'product_type',
            'paper_type', 'paper_weight', 'paper_size', 'notes',
            'print_cost', 'design_cost'
        ]


class JobStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Job
        fields = ['status']


class JobPaymentUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Job
        fields = ['payment_status', 'payment_ref']

    def validate(self, attrs):
        payment_status = attrs.get('payment_status')
        payment_ref = attrs.get('payment_ref')
        
        if payment_status in ['RECEIPTED', 'INVOICED'] and not payment_ref:
            raise serializers.ValidationError(
                "Payment reference is required for receipted or invoiced jobs"
            )
        return attrs


class DocketCounterSerializer(serializers.ModelSerializer):
    next_number = serializers.SerializerMethodField()

    class Meta:
        model = DocketCounter
        fields = ['job_type', 'current_number', 'next_number']

    def get_next_number(self, obj):
        if obj.job_type == 'LOCAL':
            base_number = obj.current_number + 1
            while True:
                docket_number = f"LOC-{base_number:03d}"
                if not Job.objects.filter(docket_number=docket_number).exists():
                    return base_number
                base_number += 1
        return obj.current_number + 1
