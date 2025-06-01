from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from .models import User


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('full_name', 'email', 'password', 'confirm_password')

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError("Passwords don't match")
        return attrs

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        user = User.objects.create_user(
            username=validated_data['email'],
            email=validated_data['email'],
            full_name=validated_data['full_name'],
            password=validated_data['password'],
            approved=False
        )
        return user


class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        if not email:
            raise serializers.ValidationError({'email': 'Email is required'})
        if not password:
            raise serializers.ValidationError({'password': 'Password is required'})

        user = authenticate(username=email, password=password)
        if not user:
            raise serializers.ValidationError({'detail': 'Invalid email or password'})
        if not user.approved:
            raise serializers.ValidationError({'detail': 'Your account is not approved yet'})
            
        attrs['user'] = user
        return attrs


class UserSerializer(serializers.ModelSerializer):
    assigned_by_name = serializers.CharField(source='assigned_by.full_name', read_only=True)

    class Meta:
        model = User
        fields = (
            'id', 'full_name', 'email', 'role', 'approved', 
            'assigned_by', 'assigned_by_name', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')


class PendingUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'full_name', 'email', 'created_at')


class UserApprovalSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
    role = serializers.ChoiceField(choices=User.UserRole.choices)
    action = serializers.ChoiceField(choices=['approve', 'decline'])

    def validate_user_id(self, value):
        try:
            user = User.objects.get(id=value, approved=False)
            return value
        except User.DoesNotExist:
            raise serializers.ValidationError("User not found or already processed")
