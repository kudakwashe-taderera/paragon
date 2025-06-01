from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import login
from .models import User
from .serializers import (
    UserRegistrationSerializer, 
    UserLoginSerializer, 
    UserSerializer,
    PendingUserSerializer,
    UserApprovalSerializer
)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {'message': 'User created successfully. Awaiting approval.'},
            status=status.HTTP_201_CREATED
        )


class LoginView(generics.GenericAPIView):
    serializer_class = UserLoginSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        print("Login Request Data:", request.data)  # Debug print
        serializer = self.get_serializer(data=request.data)
        
        if not serializer.is_valid():
            print("Serializer Errors:", serializer.errors)  # Debug print
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        user = serializer.validated_data['user']
        print("Authenticated User:", user)  # Debug print
        
        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data
        })


class PendingUsersView(generics.ListAPIView):
    serializer_class = PendingUserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role != 'SUPERUSER':
            return User.objects.none()
        return User.objects.filter(approved=False).order_by('-created_at')


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def approve_user(request):
    if request.user.role != 'SUPERUSER':
        return Response(
            {'error': 'Permission denied'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    serializer = UserApprovalSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    user_id = serializer.validated_data['user_id']
    role = serializer.validated_data['role']
    action = serializer.validated_data['action']
    
    try:
        user = User.objects.get(id=user_id, approved=False)
        
        if action == 'approve':
            user.approved = True
            user.role = role
            user.assigned_by = request.user
            user.save()
            return Response({'message': 'User approved successfully'})
        elif action == 'decline':
            user.delete()
            return Response({'message': 'User declined and removed'})
            
    except User.DoesNotExist:
        return Response(
            {'error': 'User not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def admin_stats(request):
    if request.user.role != 'SUPERUSER':
        return Response(
            {'error': 'Permission denied'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    from jobs.models import Job
    
    stats = {
        'pending_users': User.objects.filter(approved=False).count(),
        'pending_jobs': Job.objects.filter(status='PENDING').count(),
        'total_jobs': Job.objects.count(),
        'unpaid_jobs': Job.objects.filter(payment_status='NOT_MARKED').count(),
    }
    
    return Response(stats)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_profile(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


class AllUsersView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role != 'SUPERUSER':
            return User.objects.none()
        return User.objects.all().order_by('-created_at')
