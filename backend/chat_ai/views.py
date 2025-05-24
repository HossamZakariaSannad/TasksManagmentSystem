import json
import os
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from together import Together
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Together AI Client
TOGETHER_API_KEY = os.getenv("TOGETHER_API_KEY")
if not TOGETHER_API_KEY:
    raise ValueError("TOGETHER_API_KEY is not set in environment variables")
client = Together(api_key=TOGETHER_API_KEY)

# Define allowed models
ALLOWED_MODELS = [
    "deepseek-ai/DeepSeek-V3",
    "meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8",
    "deepseek-ai/DeepSeek-R1",
    "Qwen/Qwen2.5-VL-72B-Instruct",
    "meta-llama/Llama-4-Scout-17B-16E-Instruct"
]

@csrf_exempt
def chat_with_together(request):
    if request.method == 'POST':
        try:
            # Check if request body is empty
            if not request.body:
                return JsonResponse({"error": "Request body is empty"}, status=400)

            # Parse JSON body
            try:
                data = json.loads(request.body.decode('utf-8'))
            except json.JSONDecodeError as e:
                return JsonResponse({"error": f"Invalid JSON format: {str(e)}"}, status=400)

            user_message = data.get('message')
            model = data.get('model', ALLOWED_MODELS[0])  # Default to first model if not provided

            if not user_message:
                return JsonResponse({"error": "Message is required"}, status=400)

            # Validate model
            if model not in ALLOWED_MODELS:
                return JsonResponse({"error": f"Invalid model. Choose from: {', '.join(ALLOWED_MODELS)}"}, status=400)

            # Validate parameters
            top_p = 0.9
            temperature = 0.7
            max_tokens = 500

            if not (0.0 < top_p < 1.0):
                return JsonResponse({"error": "Invalid top_p: must be > 0.0 and < 1.0"}, status=400)
            if not (0.1 <= temperature <= 2.0):
                return JsonResponse({"error": "Invalid temperature: must be between 0.1 and 2.0"}, status=400)

            # Prepare messages
            messages = [{"role": "user", "content": user_message}]

            # Check if image_url is provided (for multimodal models like Qwen2.5-VL)
            image_url = data.get('image_url')
            if image_url:
                if model not in ["Qwen/Qwen2.5-VL-72B-Instruct"]:  # Add other multimodal models if applicable
                    return JsonResponse({"error": f"Model {model} does not support image inputs"}, status=400)
                messages[0]["content"] = [
                    {"type": "text", "text": user_message},
                    {"type": "image_url", "image_url": {"url": image_url}}
                ]

            # Send request to Together AI API
            response = client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                top_p=top_p
            )

            # Extract the response message
            response_message = response.choices[0].message.content
            return JsonResponse({"response": response_message, "model_used": model}, status=200)

        except Exception as e:
            return JsonResponse({"error": f"API error: {str(e)}"}, status=500)

    return JsonResponse({"error": "Invalid method"}, status=405)