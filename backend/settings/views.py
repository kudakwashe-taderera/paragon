from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from .models import SystemSettings, Branch
from .serializers import SystemSettingsSerializer, BranchSerializer

class IsSuperUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'SUPERUSER'

@api_view(['GET', 'PUT'])
@permission_classes([IsSuperUser])
def system_settings(request):
    settings = SystemSettings.get_settings()
    
    if request.method == 'GET':
        serializer = SystemSettingsSerializer(settings)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = SystemSettingsSerializer(settings, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class BranchViewSet(viewsets.ModelViewSet):
    queryset = Branch.objects.all()
    serializer_class = BranchSerializer
    permission_classes = [IsSuperUser]

    def perform_create(self, serializer):
        serializer.save()

    def perform_update(self, serializer):
        serializer.save()

    def perform_destroy(self, instance):
        # Check if this is the default branch
        settings = SystemSettings.get_settings()
        if settings.default_branch == instance:
            return Response(
                {"error": "Cannot delete the default branch"},
                status=status.HTTP_400_BAD_REQUEST
            )
        instance.delete()
