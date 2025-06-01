from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from products.models import ProductType, PaperType, PaperWeight, PaperSize, ProductTypeSpecification
from jobs.models import Job, DocketCounter
from decimal import Decimal

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed the database with initial data'

    def handle(self, *args, **options):
        self.stdout.write('🌱 Seeding database...')

        # Create superuser
        if not User.objects.filter(email='admin@paragon.com').exists():
            superuser = User.objects.create_user(
                username='admin@paragon.com',
                email='admin@paragon.com',
                full_name='System Administrator',
                password='admin123',
                role='SUPERUSER',
                approved=True
            )
            self.stdout.write('✅ Created superuser')

        # Create sample users
        users_data = [
            {
                'email': 'designer@paragon.com',
                'full_name': 'John Designer',
                'role': 'DESIGNER',
                'approved': True,
            },
            {
                'email': 'sales@paragon.com',
                'full_name': 'Jane Sales',
                'role': 'SALES_REPRESENTATIVE',
                'approved': True,
            },
            {
                'email': 'operator@paragon.com',
                'full_name': 'Mike Operator',
                'role': 'OPERATOR',
                'approved': True,
            },
            {
                'email': 'clerk@paragon.com',
                'full_name': 'Sarah Clerk',
                'role': 'CLERK',
                'approved': True,
            },
            {
                'email': 'pending@paragon.com',
                'full_name': 'Pending User',
                'role': None,
                'approved': False,
            },
        ]

        superuser = User.objects.get(email='admin@paragon.com')
        
        for user_data in users_data:
            if not User.objects.filter(email=user_data['email']).exists():
                User.objects.create_user(
                    username=user_data['email'],
                    email=user_data['email'],
                    full_name=user_data['full_name'],
                    password='password123',
                    role=user_data['role'],
                    approved=user_data['approved'],
                    assigned_by=superuser if user_data['approved'] else None
                )

        self.stdout.write('✅ Created sample users')

        # Create product types
        product_types = [
            'Business Cards', 'Flyers', 'Posters', 'Booklets', 'Banners',
            'Brochures', 'Magazines', 'Calendars', 'Labels', 'NCR Books',
            'Letterheads', 'Presentation Folders', 'Stickers', 'Menus',
            'Certificates', 'ID Cards', 'Envelopes', 'Company Profiles',
            'Diaries', 'Notepads'
        ]

        for name in product_types:
            ProductType.objects.get_or_create(name=name)

        self.stdout.write('✅ Created product types')

        # Create paper types
        paper_types = [
            'Bond Paper', 'Glossy Paper', 'Matte Paper', 'Art Paper',
            'Kraft Paper', 'Bristol Board', 'Coated Paper', 'Uncoated Paper',
            'Synthetic Paper', 'Cardstock', 'Parchment Paper', 'Recycled Paper',
            'Linen Paper', 'Vellum Paper', 'Photo Paper', 'Newsprint',
            'Watercolor Paper', 'Tracing Paper', 'Carbonless Paper (NCR)',
            'Metallic Paper'
        ]

        for name in paper_types:
            PaperType.objects.get_or_create(name=name)

        self.stdout.write('✅ Created paper types')

        # Create paper weights
        weights = [
            60, 75, 80, 90, 100, 105, 110, 120, 130, 135, 150, 170,
            200, 220, 250, 270, 300, 350, 400
        ]

        for gsm in weights:
            PaperWeight.objects.get_or_create(gsm=gsm)

        self.stdout.write('✅ Created paper weights')

        # Create paper sizes
        paper_sizes = [
            # ISO A Series
            ('A0', 'A', 841, 1189),
            ('A1', 'A', 594, 841),
            ('A2', 'A', 420, 594),
            ('A3', 'A', 297, 420),
            ('A4', 'A', 210, 297),
            ('A5', 'A', 148, 210),
            ('A6', 'A', 105, 148),
            ('A7', 'A', 74, 105),
            ('A8', 'A', 52, 74),
            ('A9', 'A', 37, 52),
            ('A10', 'A', 26, 37),
            
            # ISO B Series
            ('B0', 'B', 1000, 1414),
            ('B1', 'B', 707, 1000),
            ('B2', 'B', 500, 707),
            ('B3', 'B', 353, 500),
            ('B4', 'B', 250, 353),
            ('B5', 'B', 176, 250),
            ('B6', 'B', 125, 176),
            ('B7', 'B', 88, 125),
            ('B8', 'B', 62, 88),
            ('B9', 'B', 44, 62),
            ('B10', 'B', 31, 44),
            
            # North American Sizes
            ('Letter', 'NA', 216, 279),
            ('Legal', 'NA', 216, 356),
            ('Tabloid', 'NA', 279, 432),
            ('Ledger', 'NA', 432, 279),
            ('Executive', 'NA', 184, 267),
            
            # Other Sizes
            ('DL', 'OTHER', 110, 220),
            ('SRA3', 'OTHER', 320, 450),
            ('Business Card', 'OTHER', 90, 50),
            ('Other', 'OTHER', 0, 0),  # Special size for custom dimensions
        ]

        for name, series, width, height in paper_sizes:
            PaperSize.objects.get_or_create(
                name=name,
                series=series,
                width_mm=width,
                height_mm=height
            )

        self.stdout.write('✅ Created paper sizes')

        # Set up relationships between paper types and weights
        self.setup_paper_relationships()
        
        # Set up product type specifications
        self.setup_product_specifications()

        # Create docket counters
        DocketCounter.objects.get_or_create(
            job_type='LOCAL',
            defaults={'current_number': 0}
        )
        DocketCounter.objects.get_or_create(
            job_type='FOREIGN',
            defaults={'current_number': 0}
        )

        # Create sample jobs
        if not Job.objects.exists():
            # Get some product types
            business_cards = ProductType.objects.get(name='Business Cards')
            flyers = ProductType.objects.get(name='Flyers')
            brochures = ProductType.objects.get(name='Brochures')
            posters = ProductType.objects.get(name='Posters')
            booklets = ProductType.objects.get(name='Booklets')

            # Get paper specifications
            art_paper = PaperType.objects.get(name='Art Paper')
            glossy_paper = PaperType.objects.get(name='Glossy Paper')
            bond_paper = PaperType.objects.get(name='Bond Paper')
            
            weight_250 = PaperWeight.objects.get(gsm=250)
            weight_150 = PaperWeight.objects.get(gsm=150)
            weight_80 = PaperWeight.objects.get(gsm=80)
            
            business_card_size = PaperSize.objects.get(name='Business Card')
            a4_size = PaperSize.objects.get(name='A4')
            a3_size = PaperSize.objects.get(name='A3')

            sample_jobs = [
                # Pending Jobs
                {
                    'branch': 'BORROWDALE',
                    'job_type': 'LOCAL',
                    'docket_number': 'LOC-001',
                    'sales_rep': 'Jane Sales',
                    'order_taken_by': 'John Designer',
                    'customer': 'ABC Company',
                    'contact_person': 'John Smith',
                    'mobile_number': '+263771234567',
                    'email_address': 'john@abc.com',
                    'quantity': 1000,
                    'description': 'Company business cards with logo',
                    'product_type': business_cards,
                    'paper_type': art_paper,
                    'paper_weight': weight_250,
                    'paper_size': business_card_size,
                    'notes': 'Rush order',
                    'print_cost': Decimal('50.00'),
                    'design_cost': Decimal('25.00'),
                    'status': 'PENDING',
                    'payment_status': 'NOT_MARKED',
                },
                {
                    'branch': 'PADDINGTON',
                    'job_type': 'LOCAL',
                    'docket_number': 'LOC-002',
                    'sales_rep': 'Jane Sales',
                    'order_taken_by': 'John Designer',
                    'customer': 'XYZ Marketing',
                    'contact_person': 'Sarah Brown',
                    'mobile_number': '+263772345678',
                    'email_address': 'sarah@xyz.com',
                    'quantity': 5000,
                    'description': 'Marketing flyers for new product launch',
                    'product_type': flyers,
                    'paper_type': glossy_paper,
                    'paper_weight': weight_150,
                    'paper_size': a4_size,
                    'notes': 'Need proof before final print',
                    'print_cost': Decimal('150.00'),
                    'design_cost': Decimal('75.00'),
                    'status': 'PENDING',
                    'payment_status': 'NOT_MARKED',
                },

                # Printed Jobs
                {
                    'branch': 'BORROWDALE',
                    'job_type': 'LOCAL',
                    'docket_number': 'LOC-003',
                    'sales_rep': 'Jane Sales',
                    'order_taken_by': 'Mike Operator',
                    'customer': 'City Bank',
                    'contact_person': 'Michael Wong',
                    'mobile_number': '+263773456789',
                    'email_address': 'michael@citybank.com',
                    'quantity': 2500,
                    'description': 'Annual report booklets',
                    'product_type': booklets,
                    'paper_type': bond_paper,
                    'paper_weight': weight_80,
                    'paper_size': a4_size,
                    'notes': 'Perfect binding required',
                    'print_cost': Decimal('500.00'),
                    'design_cost': Decimal('200.00'),
                    'status': 'PRINTED',
                    'payment_status': 'NOT_MARKED',
                },
                {
                    'branch': 'PADDINGTON',
                    'job_type': 'FOREIGN',
                    'docket_number': 'FOR-001',
                    'sales_rep': 'Jane Sales',
                    'order_taken_by': 'John Designer',
                    'customer': 'Global Events',
                    'contact_person': 'David Chen',
                    'mobile_number': '+263774567890',
                    'email_address': 'david@globalevents.com',
                    'quantity': 100,
                    'description': 'Event posters A3 size',
                    'product_type': posters,
                    'paper_type': glossy_paper,
                    'paper_weight': weight_150,
                    'paper_size': a3_size,
                    'notes': 'High resolution images provided',
                    'print_cost': Decimal('300.00'),
                    'design_cost': Decimal('150.00'),
                    'status': 'PRINTED',
                    'payment_status': 'INVOICED',
                    'payment_ref': 'INV-001',
                },

                # Receipted Jobs
                {
                    'branch': 'BORROWDALE',
                    'job_type': 'LOCAL',
                    'docket_number': 'LOC-004',
                    'sales_rep': 'Jane Sales',
                    'order_taken_by': 'John Designer',
                    'customer': 'Tech Solutions',
                    'contact_person': 'Emma Davis',
                    'mobile_number': '+263775678901',
                    'email_address': 'emma@techsolutions.com',
                    'quantity': 1000,
                    'description': 'Company brochures tri-fold',
                    'product_type': brochures,
                    'paper_type': art_paper,
                    'paper_weight': weight_150,
                    'paper_size': a4_size,
                    'notes': 'Spot UV on logo',
                    'print_cost': Decimal('250.00'),
                    'design_cost': Decimal('100.00'),
                    'status': 'PRINTED',
                    'payment_status': 'RECEIPTED',
                    'payment_ref': 'REC-001',
                },
                {
                    'branch': 'PADDINGTON',
                    'job_type': 'LOCAL',
                    'docket_number': 'LOC-005',
                    'sales_rep': 'Jane Sales',
                    'order_taken_by': 'Mike Operator',
                    'customer': 'Fresh Foods',
                    'contact_person': 'Lisa Kim',
                    'mobile_number': '+263776789012',
                    'email_address': 'lisa@freshfoods.com',
                    'quantity': 10000,
                    'description': 'Product flyers double-sided',
                    'product_type': flyers,
                    'paper_type': glossy_paper,
                    'paper_weight': weight_150,
                    'paper_size': a4_size,
                    'notes': 'Food-safe inks required',
                    'print_cost': Decimal('400.00'),
                    'design_cost': Decimal('150.00'),
                    'status': 'PRINTED',
                    'payment_status': 'RECEIPTED',
                    'payment_ref': 'REC-002',
                },

                # Invoiced Jobs
                {
                    'branch': 'BORROWDALE',
                    'job_type': 'FOREIGN',
                    'docket_number': 'FOR-002',
                    'sales_rep': 'Jane Sales',
                    'order_taken_by': 'John Designer',
                    'customer': 'Education Center',
                    'contact_person': 'Robert Taylor',
                    'mobile_number': '+263777890123',
                    'email_address': 'robert@educenter.com',
                    'quantity': 500,
                    'description': 'Training manuals with tabs',
                    'product_type': booklets,
                    'paper_type': bond_paper,
                    'paper_weight': weight_80,
                    'paper_size': a4_size,
                    'notes': 'Wire binding required',
                    'print_cost': Decimal('600.00'),
                    'design_cost': Decimal('250.00'),
                    'status': 'PRINTED',
                    'payment_status': 'INVOICED',
                    'payment_ref': 'INV-002',
                },
                {
                    'branch': 'PADDINGTON',
                    'job_type': 'FOREIGN',
                    'docket_number': 'FOR-003',
                    'sales_rep': 'Jane Sales',
                    'order_taken_by': 'Mike Operator',
                    'customer': 'Global Mining Corp',
                    'contact_person': 'James Wilson',
                    'mobile_number': '+263778901234',
                    'email_address': 'james@globalmining.com',
                    'quantity': 2000,
                    'description': 'Safety procedure booklets',
                    'product_type': booklets,
                    'paper_type': bond_paper,
                    'paper_weight': weight_80,
                    'paper_size': a4_size,
                    'notes': 'Waterproof cover required',
                    'print_cost': Decimal('800.00'),
                    'design_cost': Decimal('300.00'),
                    'status': 'PRINTED',
                    'payment_status': 'INVOICED',
                    'payment_ref': 'INV-003',
                },
            ]

            for job_data in sample_jobs:
                Job.objects.create(**job_data)

        self.stdout.write('✅ Created sample jobs')
        self.stdout.write('🎉 Seeding completed!')

    def setup_paper_relationships(self):
        """Set up relationships between paper types, weights, and sizes"""
        # Example relationships - adjust based on real-world compatibility
        paper_types = PaperType.objects.all()
        weights = PaperWeight.objects.all()
        sizes = PaperSize.objects.all()

        # Common weights for different paper types
        common_weights = {
            'Bond Paper': [60, 75, 80, 90, 100],
            'Glossy Paper': [120, 150, 170, 200],
            'Art Paper': [90, 100, 120, 150, 170],
            'Cardstock': [220, 250, 270, 300],
            'Photo Paper': [200, 220, 250],
        }

        for paper_type in paper_types:
            # Assign weights based on paper type
            compatible_weights = common_weights.get(
                paper_type.name,
                [80, 100, 120, 150]  # Default weights if not specified
            )
            for weight in weights.filter(gsm__in=compatible_weights):
                paper_type.compatible_weights.add(weight)
                
                # Add compatible sizes for this weight
                if weight.gsm <= 120:
                    # Lighter weights support all sizes
                    weight.compatible_sizes.add(*sizes)
                elif weight.gsm <= 250:
                    # Medium weights support up to A3
                    weight.compatible_sizes.add(
                        *sizes.exclude(name__in=['A0', 'A1', 'B0', 'B1'])
                    )
                else:
                    # Heavy weights support only smaller sizes
                    weight.compatible_sizes.add(
                        *sizes.filter(name__in=['A4', 'A5', 'A6', 'Letter', 'Business Card'])
                    )

    def setup_product_specifications(self):
        """Set up specifications for each product type"""
        product_types = ProductType.objects.all()
        paper_types = PaperType.objects.all()
        
        # Example specifications for different product types
        for product_type in product_types:
            spec, _ = ProductTypeSpecification.objects.get_or_create(
                product_type=product_type
            )
            
            # Add compatible paper types based on product
            if product_type.name == 'Business Cards':
                spec.paper_types.add(
                    *paper_types.filter(name__in=[
                        'Art Paper', 'Cardstock', 'Glossy Paper'
                    ])
                )
                spec.paper_weights.add(
                    *PaperWeight.objects.filter(gsm__in=[250, 300, 350])
                )
                spec.paper_sizes.add(
                    *PaperSize.objects.filter(name='Business Card')
                )
            elif product_type.name in ['Flyers', 'Brochures']:
                spec.paper_types.add(
                    *paper_types.filter(name__in=[
                        'Art Paper', 'Glossy Paper', 'Matte Paper'
                    ])
                )
                spec.paper_weights.add(
                    *PaperWeight.objects.filter(gsm__in=[120, 150, 170])
                )
                spec.paper_sizes.add(
                    *PaperSize.objects.filter(name__in=['A4', 'A5', 'DL'])
                )
            else:
                # Default specifications for other products
                spec.paper_types.add(*paper_types.all())
                spec.paper_weights.add(*PaperWeight.objects.all())
                spec.paper_sizes.add(*PaperSize.objects.all())
