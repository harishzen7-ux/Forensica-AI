"""
Gemini API Inference Module for Forensica AI
Implements high-performance cloud AI detection using Google Gemini 1.5 Flash.
Replaces bulky local Hugging Face models with a single fast API call.
"""
import os
import json
import google.generativeai as genai

# Try to load from .env file if running locally outside of docker
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# Setup Gemini API key
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
else:
    print("[Forensica] Warning: GEMINI_API_KEY environment variable not set. Gemini API will fail.")

# Model configuration
model_name = "gemini-flash-latest"
generation_config = {
    "temperature": 0.2,
    "top_p": 0.95,
    "top_k": 64,
    "max_output_tokens": 1024,
    "response_mime_type": "application/json",
}

# The expected JSON schema for responses
SYSTEM_INSTRUCTION = """
You are an expert digital forensics analyst specializing in deepfake and AI-generated content detection.
Your goal is to determine if the provided content (text, image, audio, or video) is real/authentic or AI-generated.
Analyze the content for common AI artifacts (e.g., inconsistencies, lack of natural variance, deepfake traits).

You MUST return a JSON object with the following exact structure:
{
  "score": <integer from 0 to 100, where 100 means definitely real, and 0 means definitely AI>,
  "signs": [<list of 1-4 short strings describing the specific artifacts or traits you observed>],
  "summary": "<a 1-sentence summary of your overall conclusion>"
}
"""

def _call_gemini(contents) -> dict:
    if not GEMINI_API_KEY:
        return {
            "score": 50,
            "signs": ["GEMINI_API_KEY is not set."],
            "summary": "Could not analyze content because API key is missing. Set GEMINI_API_KEY environment variable."
        }
    
    try:
        model = genai.GenerativeModel(
            model_name=model_name,
            generation_config=generation_config,
            system_instruction=SYSTEM_INSTRUCTION
        )
        response = model.generate_content(contents)
        result = json.loads(response.text)
        
        # Validate output
        score = result.get("score", 50)
        score = max(0, min(100, int(score)))
        
        return {
            "score": score,
            "signs": result.get("signs", [])[:4],
            "summary": result.get("summary", "Analysis completed.")
        }
    except Exception as e:
        error_msg = str(e)
        print(f"[Forensica] Gemini API error: {error_msg}")
        if "429" in error_msg or "ResourceExhausted" in error_msg or "Quota" in error_msg:
            raise Exception("RATE_LIMIT_EXCEEDED")
            
        return {
            "score": 50,
            "signs": ["Error communicating with Gemini API."],
            "summary": f"API error: {error_msg[:100]}"
        }

def analyze_image_real(image_bytes: bytes) -> dict:
    """Analyze image using Gemini API"""
    contents = [
        {"mime_type": "image/jpeg", "data": image_bytes},
        "Analyze this image for signs of AI generation (e.g., Midjourney, DALL-E, Stable Diffusion). Look for weird fingers, impossible geometry, over-smoothing, or inconsistent lighting."
    ]
    return _call_gemini(contents)

def analyze_text_real(text: str) -> dict:
    """Analyze text using Gemini API"""
    if not text or len(text.strip()) < 10:
        return {
            "score": 50,
            "signs": ["Text too short for reliable analysis."],
            "summary": "Insufficient text length."
        }
    contents = [
        "Analyze the following text for signs of AI generation (e.g., ChatGPT, Claude). Look for lack of lexical diversity, robotic tone, lack of burstiness/perplexity, and typical AI phrases.",
        f"TEXT TO ANALYZE:\\n{text}"
    ]
    return _call_gemini(contents)

def analyze_audio_real(audio_bytes: bytes, sample_rate: int = 16000) -> dict:
    """Analyze audio using Gemini API"""
    contents = [
        {"mime_type": "audio/wav", "data": audio_bytes},
        "Analyze this audio for signs of being AI-generated (e.g., ElevenLabs, voice cloning). Look for unnatural cadence, metallic artifacts, lack of breathing, or emotionless delivery."
    ]
    return _call_gemini(contents)

def analyze_video_real(video_bytes: bytes) -> dict:
    """Analyze video using Gemini API"""
    contents = [
        {"mime_type": "video/mp4", "data": video_bytes},
        "Analyze this video for deepfake artifacts. Look for temporal inconsistencies, unnatural blinking, face edge blurring, or strange physics."
    ]
    return _call_gemini(contents)

def analyze_document_real(document_bytes: bytes, mime_type: str) -> dict:
    """Analyze document using Gemini API"""
    if mime_type == "application/pdf":
        contents = [
            {"mime_type": mime_type, "data": document_bytes},
            "Analyze this document. Is the structure or content indicative of being wholly AI-generated?"
        ]
        return _call_gemini(contents)
    else:
        return {
            "score": 70,
            "signs": ["Document format not fully supported for deep ML analysis."],
            "summary": "Limited analysis possible for this file type."
        }
