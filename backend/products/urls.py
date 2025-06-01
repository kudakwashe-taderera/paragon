from django.urls import path
from . import views

urlpatterns = [
    path('product-types/', views.ProductTypeList.as_view(), name='product-type-list'),
    path('paper-types/', views.PaperTypeListCreateView.as_view(), name='paper-type-list'),
    path('product-types/<int:product_type_id>/specifications/', 
         views.get_product_specifications, 
         name='product-specifications'),
    path('paper-weights/', 
         views.PaperWeightList.as_view(),
         name='paper-weight-list'),
    path('paper-types/weights/', 
         views.get_compatible_weights, 
         name='compatible-weights'),
    path('paper-weights/sizes/', 
         views.get_compatible_sizes, 
         name='compatible-sizes'),
    path('paper-sizes/custom/',
         views.create_custom_size,
         name='create-custom-size'),
]
