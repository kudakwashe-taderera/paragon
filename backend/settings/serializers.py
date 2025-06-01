from rest_framework import serializers
from .models import Branch, SystemSettings

class BranchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = ['id', 'name', 'code', 'is_active']

class SystemSettingsSerializer(serializers.ModelSerializer):
    branches = BranchSerializer(many=True, read_only=True, source='branch_set')
    
    class Meta:
        model = SystemSettings
        fields = [
            'id',
            'company_name',
            'default_branch',
            'branches',
            'auto_approve_users',
            'email_notifications',
            'system_maintenance',
            'maintenance_message',
            'job_number_prefix',
            'job_number_suffix',
            'tax_rate',
            'currency',
            'business_hours',
            'contact_info',
            'updated_at'
        ]
        read_only_fields = ['id', 'updated_at']

    def validate_business_hours(self, value):
        if not isinstance(value, dict) or 'start' not in value or 'end' not in value:
            raise serializers.ValidationError("Business hours must include 'start' and 'end' times")
        return value

    def validate_contact_info(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError("Contact info must be a dictionary")
        required_fields = ['phone', 'email', 'address']
        for field in required_fields:
            if field not in value:
                value[field] = ""
        return value 