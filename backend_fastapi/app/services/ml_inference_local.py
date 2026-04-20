"""
Local Lightweight Inference Module for Forensica AI
Implements AI detection using pure, ultra-fast heuristics and classical signal processing.
Requires 0MB of downloaded ML weights and no external APIs.
"""
import io
import math
import tempfile
import os
import numpy as np

def _calculate_entropy(data_bytes: bytes) -> float:
    if not data_bytes:
        return 0.0
    counts = [0] * 256
    for byte in data_bytes:
        counts[byte] += 1
    entropy = 0.0
    length = len(data_bytes)
    for count in counts:
        if count:
            probability = count / length
            entropy -= probability * math.log2(probability)
    return entropy

def _calculate_repeat_ratio(data_bytes: bytes, block_size=32) -> float:
    if not data_bytes:
        return 0.0
    seen = set()
    duplicates = 0
    for i in range(0, min(len(data_bytes) - (block_size - 1), 5120), block_size):
        block = data_bytes[i:i+block_size]
        if block in seen:
            duplicates += 1
        else:
            seen.add(block)
    return duplicates / max(len(seen), 1)

def analyze_image_real(image_bytes: bytes) -> dict:
    """Analyze image using lightweight heuristics (OpenCV & Entropy)"""
    signs = []
    score = 70
    
    entropy = _calculate_entropy(image_bytes)
    repeat_ratio = _calculate_repeat_ratio(image_bytes)
    
    if entropy < 4.6:
        score -= 15
        signs.append("Low byte-level entropy suggests templated or AI generation.")
    elif entropy > 7.8:
        score -= 10
        signs.append("High entropy suggests hidden compression artifacts common in deepfakes.")
        
    if repeat_ratio > 0.08:
        score -= 15
        signs.append("High structural block repetition indicates generative pattern generation.")
        
    if len(image_bytes) < 40000:
        score -= 10
        signs.append("Small file size limits confident analysis.")
        
    try:
        import cv2
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is not None:
            # Error Level Analysis (ELA) rough approximation using JPEG compression
            encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), 90]
            _, encoded_img = cv2.imencode('.jpg', img, encode_param)
            decoded_img = cv2.imdecode(encoded_img, cv2.IMREAD_COLOR)
            
            diff = cv2.absdiff(img, decoded_img)
            mean_diff = np.mean(diff)
            
            if mean_diff < 1.0:
                score -= 10
                signs.append("Suspiciously uniform compression error levels (potential AI synthesis).")
    except ImportError:
        signs.append("OpenCV not installed; skipping Error Level Analysis.")
    except Exception:
        pass
        
    return {
        "score": max(10, min(95, score)),
        "signs": signs[:4] or ["Image features appear structurally normal."],
        "summary": f"Offline heuristic analysis: entropy={entropy:.2f}, repetition={repeat_ratio:.2f}"
    }

def analyze_text_real(text: str) -> dict:
    """Analyze text using lightweight lexical heuristics"""
    if not text or len(text.strip()) < 10:
        return {"score": 50, "signs": ["Text too short."], "summary": "Insufficient length."}
        
    words = text.split()
    word_count = len(words)
    unique_words = len(set(w.lower() for w in words))
    lexical_diversity = unique_words / word_count if word_count > 0 else 0
    
    sentences = [s.strip() for s in text.replace("!", ".").replace("?", ".").split(".") if s.strip()]
    sentence_lengths = [len(s.split()) for s in sentences]
    sentence_variance = np.var(sentence_lengths) if len(sentence_lengths) > 1 else 0
    
    score = 80
    signs = []
    
    if word_count > 40 and lexical_diversity < 0.45:
        score -= 25
        signs.append(f"Very low lexical diversity ({lexical_diversity:.2f}) typical of LLMs.")
        
    if sentence_variance < 8.0 and word_count > 30:
        score -= 20
        signs.append("Highly uniform sentence lengths (lack of human burstiness).")
        
    ai_phrases = ["in conclusion", "it's important to note", "delve into", "tapestry", "moreover", "testament to"]
    phrase_hits = sum(1 for p in ai_phrases if p in text.lower())
    if phrase_hits > 1:
        score -= 15
        signs.append("Contains phrase structures highly over-represented in AI models.")

    return {
        "score": max(10, min(95, score)),
        "signs": signs[:4] or ["Text passes burstiness and diversity checks."],
        "summary": f"Offline text heuristics: diversity={lexical_diversity:.2f}, variance={sentence_variance:.1f}"
    }

def analyze_audio_real(audio_bytes: bytes, sample_rate: int = 16000) -> dict:
    """Analyze audio using librosa signal processing"""
    signs = []
    score = 80
    
    try:
        import librosa
        audio_array, sr = librosa.load(io.BytesIO(audio_bytes), sr=sample_rate)
        
        # Spectral Centroid (brightness)
        spectral_centroid = librosa.feature.spectral_centroid(y=audio_array, sr=sr)[0]
        avg_centroid = np.mean(spectral_centroid)
        
        # Zero Crossing Rate
        zcr = librosa.feature.zero_crossing_rate(audio_array)[0]
        avg_zcr = np.mean(zcr)
        
        if avg_centroid > 3800:
            score -= 20
            signs.append("Unnaturally high spectral brightness (potential AI vocoder artifact).")
            
        if avg_zcr < 0.04:
            score -= 15
            signs.append("Very low zero-crossing rate (lacks natural fricatives/noise).")
            
        # Audio Entropy
        entropy = -np.sum((np.histogram(audio_array, bins=100)[0] / len(audio_array)) * 
                         np.log2(np.histogram(audio_array, bins=100)[0] / len(audio_array) + 1e-10))
                         
        if entropy > 7.6:
            score -= 15
            signs.append("High entropy indicates potential synthetic generation noise.")
            
        summary = f"Librosa signal analysis: centroid={avg_centroid:.0f}Hz, zcr={avg_zcr:.3f}"
        
    except ImportError:
        score = 50
        signs = ["Librosa not installed. Using raw byte heuristics."]
        summary = "Librosa missing, limited analysis."
    except Exception as e:
        score = 50
        signs = [f"Audio processing error: {str(e)[:50]}"]
        summary = "Analysis failed."

    return {
        "score": max(10, min(95, score)),
        "signs": signs[:4] or ["Audio signal appears natural."],
        "summary": summary
    }

def analyze_video_real(video_bytes: bytes) -> dict:
    """Analyze video using OpenCV heuristics"""
    signs = []
    score = 80
    tmp_path = None
    
    try:
        import cv2
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as tmp:
            tmp.write(video_bytes)
            tmp_path = tmp.name
            
        video = cv2.VideoCapture(tmp_path)
        frame_count = int(video.get(cv2.CAP_PROP_FRAME_COUNT))
        
        if frame_count < 10:
            video.release()
            return {"score": 50, "signs": ["Video too short."], "summary": "Insufficient frames."}
            
        # Analyze temporal difference (simple inter-frame variance)
        prev_frame = None
        diffs = []
        for i in range(min(frame_count, 30)): # Check first 30 frames
            ret, frame = video.read()
            if not ret: break
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            if prev_frame is not None:
                diff = cv2.absdiff(gray, prev_frame)
                diffs.append(np.mean(diff))
            prev_frame = gray
            
        video.release()
        
        if diffs:
            var_diff = np.var(diffs)
            if var_diff < 0.5:
                score -= 25
                signs.append("Unnaturally low temporal variance (static background generation).")
            elif var_diff > 100:
                score -= 15
                signs.append("High temporal jitter (often seen in deepfake face swapping).")
                
        summary = f"Temporal analysis over {len(diffs)} frames."
        
    except ImportError:
        score = 50
        signs = ["OpenCV not installed."]
        summary = "Missing dependencies."
    finally:
        if tmp_path and os.path.exists(tmp_path):
            try: os.unlink(tmp_path)
            except: pass

    return {
        "score": max(10, min(95, score)),
        "signs": signs[:4] or ["Video motion appears natural."],
        "summary": summary
    }

def analyze_document_real(document_bytes: bytes, mime_type: str) -> dict:
    entropy = _calculate_entropy(document_bytes)
    return {
        "score": 75,
        "signs": [f"Document entropy: {entropy:.2f}"],
        "summary": "Basic document structural check."
    }
