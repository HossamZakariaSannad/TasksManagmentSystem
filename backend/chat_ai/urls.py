from django.urls import path
from .views import chat_with_together

urlpatterns = [
    path('chatAI/', chat_with_together, name='chat_with_hf'),
]
