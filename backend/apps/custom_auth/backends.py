from django.contrib.auth.backends import ModelBackend
from apps.staff_members.models import StaffMember
from apps.student.models import Student
import logging

logger = logging.getLogger(__name__)

class MultiModelAuthBackend(ModelBackend):
    def authenticate(self, request, email=None, password=None, intake_id=None, username=None, **kwargs):
        if not email and not username:
            logger.debug("Missing email or username")
            return None
        if not password:
            logger.debug("Missing password")
            return None

        # Use email if provided, else fall back to username
        identifier = (email or username).lower().strip()
        logger.debug(f"Authenticating: identifier={identifier}, intake_id={intake_id}")

        user = None
        try:
            if intake_id:  # Student login
                logger.debug(f"Querying Student with identifier='{identifier}', intake_id={intake_id}")
                students = Student.objects.filter(email=identifier, intake_id=intake_id)
                logger.debug(f"Found {students.count()} students for identifier='{identifier}', intake_id={intake_id}")
                if students.count() > 1:
                    logger.warning(f"Multiple students found: {students.count()} records")
                    for student in students:
                        logger.debug(f" - Student ID: {student.id}, Username: {student.username}")
                user = students.first()
                if not user:
                    logger.warning(f"No student found with identifier='{identifier}', intake_id={intake_id}")
                    return None
            else:  # StaffMember (primary) or Student without intake
                logger.debug(f"Querying StaffMember with identifier='{identifier}'")
                try:
                    user = StaffMember.objects.filter(email=identifier).first()
                    if user:
                        logger.debug(f"Found StaffMember: ID={user.id}, Username={user.username}")
                    else:
                        logger.debug(f"No StaffMember found, trying Student with identifier='{identifier}'")
                        students = Student.objects.filter(email=identifier)
                        logger.debug(f"Found {students.count()} students for identifier='{identifier}'")
                        if students.count() > 1:
                            logger.warning(f"Multiple students found: {students.count()} records")
                            for student in students:
                                logger.debug(f" - Student ID: {student.id}, Username: {student.username}")
                        user = students.first()
                        if user:
                            logger.debug(f"Found Student: ID={user.id}, Username={user.username}")
                except Exception as e:
                    logger.error(f"Error querying models for identifier='{identifier}': {str(e)}")
                    return None

            if user and user.check_password(password) and self.user_can_authenticate(user):
                logger.debug(f"Authentication successful: ID={user.id}, Type={'student' if isinstance(user, Student) else 'staff'}")
                return user
            else:
                logger.debug(f"Authentication failed: invalid password or inactive user for identifier={identifier}")
        except Exception as e:
            logger.error(f"Authentication error for identifier='{identifier}': {str(e)}")
            return None

        logger.debug(f"Authentication failed for identifier={identifier}")
        return None

    def user_can_authenticate(self, user):
        """
        Allow authentication if user is active, required for admin login.
        """
        is_active = getattr(user, 'is_active', False)
        logger.debug(f"Checking if user can authenticate: is_active={is_active}")
        return is_active