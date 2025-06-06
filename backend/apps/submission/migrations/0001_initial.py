# Generated by Django 5.2 on 2025-05-04 13:22

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("assignments", "0003_initial"),
        ("courses", "0002_initial"),
        ("student", "0001_initial"),
        ("tracks", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="AssignmentSubmission",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "file",
                    models.FileField(blank=True, null=True, upload_to="submissions/"),
                ),
                ("file_url", models.URLField(blank=True, null=True)),
                ("submitted", models.BooleanField(default=False)),
                ("submission_date", models.DateTimeField(auto_now_add=True)),
                (
                    "assignment",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="assignments.assignment",
                    ),
                ),
                (
                    "course",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, to="courses.course"
                    ),
                ),
                (
                    "student",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="submissions",
                        to="student.student",
                    ),
                ),
                (
                    "track",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        to="tracks.track",
                    ),
                ),
            ],
            options={
                "ordering": ["-submission_date"],
            },
        ),
    ]
