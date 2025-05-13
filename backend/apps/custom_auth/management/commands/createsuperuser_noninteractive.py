from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from apps.staff_members.models import StaffMember
from apps.branch_location.models import Branch
from decouple import config

class Command(BaseCommand):
    help = 'Create a StaffMember superuser non-interactively'

    def handle(self, *args, **options):
        email = config('ADMIN_EMAIL', default='admin@example.com')
        password = config('ADMIN_PASSWORD', default='adminpassword123')
        username = config('ADMIN_USERNAME', default='admin')

        if StaffMember.objects.filter(email=email).exists():
            self.stdout.write(self.style.WARNING(f'StaffMember "{email}" already exists.'))
            return

        try:
            branch = Branch.objects.first()  # Get first branch or adjust
            if not branch:
                self.stdout.write(self.style.ERROR('No Branch exists. Create a Branch first.'))
                return

            user = StaffMember(
                email=email,
                username=username,
                password=make_password(password),
                is_active=True,
                is_staff=True,
                is_superuser=True,
                branch=branch,  # Required field
                role='admin'  # Adjust based on your model
            )
            user.save()
            self.stdout.write(self.style.SUCCESS(f'StaffMember superuser "{email}" created successfully.'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error creating superuser: {str(e)}'))