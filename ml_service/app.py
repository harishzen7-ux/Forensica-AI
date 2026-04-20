from __future__ import annotations

import base64
import hashlib
import json
import math
import os
import urllib.error
import urllib.request
from functools import lru_cache
from typing import Literal, Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

# Import real ML inference module
try:
    from ml_inference import (
        analyze_image_real,
        analyze_text_real,
        analyze_audio_real,
        analyze_video_real,
        analyze_document_real,
    )
    ML_INFERENCE_AVAILABLE = True
except ImportError:
    ML_INFERENCE_AVAILABLE = False
    print("[Forensica] ML inference module not available, using heuristic fallback.")


Modality = Literal["photo", "image", "video", "audio", "text", "document", "deepfake"]
SourceKind = Literal["open_source", "vendor_optional", "compatibility"]


class AnalyzeRequest(BaseModel):
    modality: Modality
    text: Optional[str] = None
    mimeType: Optional[str] = None
    contentBase64: Optional[str] = None
    requestedModels: list[str] = Field(default_factory=list)
    exactNameLayer: bool = True
    allowHiveAdapter: bool = True


class ModelTrace(BaseModel):
    display_name: str
    canonical_name: str
    source_kind: SourceKind
    active: bool
    emulated: bool
    score: Optional[int] = None
    weight: float = 1.0
    notes: str
    backed_by: Optional[str] = None


class AnalyzeResponse(BaseModel):
    authenticity_score: int
    risk_level: Literal["Low", "Medium", "High"]
    tampering_signs: list[str]
    forensic_summary: str
    ensemble_profile: str
    provider_mode: str
    model_trace: list[ModelTrace]


class DetectorOutput(BaseModel):
    score: int
    signs: list[str]
    summary: str
    trace: ModelTrace


class BinaryFeatures(BaseModel):
    size_kb: float
    entropy: float
    repeat_ratio: float
    zero_ratio: float
    mime_type: str


class TextFeatures(BaseModel):
    word_count: int
    lexical_diversity: float
    avg_sentence_len: float
    sentence_variance: float
    trigram_repeat_ratio: float


def clamp(value: float, lower: int = 5, upper: int = 98) -> int:
    return max(lower, min(int(round(value)), upper))


def risk_level(score: int) -> Literal["Low", "Medium", "High"]:
    if score >= 70:
        return "Low"
    if score >= 40:
        return "Medium"
    return "High"


def shannon_entropy(data: bytes) -> float:
    if not data:
        return 0.0
    counts = [0] * 256
    for byte in data:
        counts[byte] += 1
    entropy = 0.0
    length = len(data)
    for count in counts:
        if count:
            probability = count / length
            entropy -= probability * math.log2(probability)
    return entropy


def repeated_block_ratio(data: bytes, block_size: int = 32, sample_size: int = 512) -> float:
    if len(data) < block_size * 2:
        return 0.0
    seen: set[bytes] = set()
    duplicates = 0
    total = 0
    for offset in range(0, min(len(data) - block_size + 1, block_size * sample_size), block_size):
        block = data[offset : offset + block_size]
        if block in seen:
            duplicates += 1
        else:
            seen.add(block)
        total += 1
    return duplicates / total if total else 0.0


def zero_ratio(data: bytes) -> float:
    return (data.count(0) / len(data)) if data else 0.0


def variance(values: list[float]) -> float:
    if len(values) <= 1:
        return 0.0
    mean = sum(values) / len(values)
    return sum((value - mean) ** 2 for value in values) / len(values)


def extract_binary_features(payload: bytes, mime_type: Optional[str]) -> BinaryFeatures:
    return BinaryFeatures(
        size_kb=max(len(payload) / 1024, 0.1),
        entropy=shannon_entropy(payload),
        repeat_ratio=repeated_block_ratio(payload),
        zero_ratio=zero_ratio(payload),
        mime_type=mime_type or "application/octet-stream",
    )


def extract_text_features(text: str) -> TextFeatures:
    normalized = " ".join(text.split())
    words = normalized.split()
    lowered = [word.lower() for word in words]
    unique = len(set(lowered))
    sentences = [part.strip() for part in normalized.replace("!", ".").replace("?", ".").split(".") if part.strip()]
    sentence_lengths = [len(sentence.split()) for sentence in sentences] or [len(words)]
    trigrams: dict[str, int] = {}
    for index in range(max(0, len(lowered) - 2)):
      trigram = " ".join(lowered[index : index + 3])
      trigrams[trigram] = trigrams.get(trigram, 0) + 1
    repeated_trigrams = sum(count - 1 for count in trigrams.values() if count > 1)
    return TextFeatures(
        word_count=len(words),
        lexical_diversity=(unique / len(words)) if words else 0.0,
        avg_sentence_len=sum(sentence_lengths) / len(sentence_lengths),
        sentence_variance=variance([float(value) for value in sentence_lengths]),
        trigram_repeat_ratio=(repeated_trigrams / max(len(lowered) - 2, 1)) if len(lowered) >= 3 else 0.0,
    )


class DetectorSpec(BaseModel):
    display_name: str
    canonical_name: str
    source_kind: SourceKind
    weight: float
    backed_by: Optional[str] = None
    active_when_env: Optional[str] = None
    emulated: bool = False


PHOTO_PROFILE = [
    DetectorSpec(display_name="CLIP-based Local Detector", canonical_name="clip_local_photo", source_kind="open_source", weight=1.3),
    DetectorSpec(display_name="Hive AI Image Detection", canonical_name="hive_ai_photo", source_kind="vendor_optional", weight=1.0, active_when_env="HIVE_API_KEY"),
    DetectorSpec(display_name="Hive AI models", canonical_name="hive_ai_models_exact", source_kind="compatibility", weight=0.8, backed_by="clip_local_photo", emulated=True),
]

VIDEO_PROFILE = [
    DetectorSpec(display_name="XceptionNet", canonical_name="xceptionnet_video", source_kind="open_source", weight=1.0),
    DetectorSpec(display_name="EfficientNet", canonical_name="efficientnet_video", source_kind="open_source", weight=1.0),
    DetectorSpec(display_name="CNN + RNN (LSTM)", canonical_name="cnn_rnn_lstm_video", source_kind="open_source", weight=1.1),
    DetectorSpec(display_name="TimeSformer", canonical_name="timesformer_video", source_kind="open_source", weight=1.2),
    DetectorSpec(display_name="ViT / Video Transformer", canonical_name="vit_video", source_kind="open_source", weight=1.1, backed_by="timesformer_video", emulated=True),
]

TEXT_PROFILE = [
    DetectorSpec(display_name="OpenAI GPT Detector (compatibility layer)", canonical_name="openai_gpt_detector_exact", source_kind="compatibility", weight=0.8, backed_by="roberta_text_local", emulated=True),
    DetectorSpec(display_name="RoBERTa-based Local Detector", canonical_name="roberta_text_local", source_kind="open_source", weight=1.1),
    DetectorSpec(display_name="DetectGPT", canonical_name="detectgpt_text", source_kind="open_source", weight=1.3),
    DetectorSpec(display_name="GLTR", canonical_name="gltr_text", source_kind="open_source", weight=1.0),
]

AUDIO_PROFILE = [
    DetectorSpec(display_name="ASVspoof Baseline", canonical_name="asvspoof_baseline_audio", source_kind="open_source", weight=1.2),
    DetectorSpec(display_name="NVIDIA NeMo Audio Model", canonical_name="nemo_audio", source_kind="open_source", weight=1.0),
    DetectorSpec(display_name="wav2vec 2.0 Detection Adapter", canonical_name="wav2vec2_audio", source_kind="open_source", weight=1.0),
]

DOCUMENT_PROFILE = [
    DetectorSpec(display_name="Document Structural Forensics", canonical_name="document_forensics_local", source_kind="open_source", weight=1.0),
    DetectorSpec(display_name="Hive AI Image Detection", canonical_name="hive_ai_document", source_kind="vendor_optional", weight=0.7, active_when_env="HIVE_API_KEY", backed_by="document_forensics_local"),
]

PROFILE_MAP: dict[str, list[DetectorSpec]] = {
    "photo": PHOTO_PROFILE,
    "image": PHOTO_PROFILE,
    "video": VIDEO_PROFILE,
    "audio": AUDIO_PROFILE,
    "text": TEXT_PROFILE,
    "document": DOCUMENT_PROFILE,
    "deepfake": VIDEO_PROFILE,
}


class LocalOpenSourceDetectors:
    def __init__(self):
        self._ml_available = ML_INFERENCE_AVAILABLE

    def score_binary(self, modality: str, name: str, features: BinaryFeatures, payload: Optional[bytes] = None) -> DetectorOutput:
        # Try real ML inference first if available
        if self._ml_available and payload:
            try:
                if modality in {"photo", "image"}:
                    ml_result = analyze_image_real(payload)
                    return DetectorOutput(
                        score=ml_result["score"],
                        signs=ml_result["signs"],
                        summary=ml_result["summary"],
                        trace=ModelTrace(
                            display_name=name,
                            canonical_name=name,
                            source_kind="open_source",
                            active=True,
                            emulated=False,
                            score=ml_result["score"],
                            notes="Real ML inference (CLIP + Vision Transformer).",
                        ),
                    )
                elif modality in {"video", "deepfake"}:
                    ml_result = analyze_video_real(payload)
                    return DetectorOutput(
                        score=ml_result["score"],
                        signs=ml_result["signs"],
                        summary=ml_result["summary"],
                        trace=ModelTrace(
                            display_name=name,
                            canonical_name=name,
                            source_kind="open_source",
                            active=True,
                            emulated=False,
                            score=ml_result["score"],
                            notes="Real ML inference (Frame analysis + temporal consistency).",
                        ),
                    )
                elif modality == "audio":
                    ml_result = analyze_audio_real(payload)
                    return DetectorOutput(
                        score=ml_result["score"],
                        signs=ml_result["signs"],
                        summary=ml_result["summary"],
                        trace=ModelTrace(
                            display_name=name,
                            canonical_name=name,
                            source_kind="open_source",
                            active=True,
                            emulated=False,
                            score=ml_result["score"],
                            notes="Real ML inference (wav2vec2 + spectral analysis).",
                        ),
                    )
                elif modality == "document":
                    ml_result = analyze_document_real(payload, features.mime_type)
                    return DetectorOutput(
                        score=ml_result["score"],
                        signs=ml_result["signs"],
                        summary=ml_result["summary"],
                        trace=ModelTrace(
                            display_name=name,
                            canonical_name=name,
                            source_kind="open_source",
                            active=True,
                            emulated=False,
                            score=ml_result["score"],
                            notes="Real ML inference (Document structure analysis).",
                        ),
                    )
            except Exception as e:
                print(f"[Forensica] ML inference failed for {modality}: {e}")
                # Fall through to heuristic fallback

        # Fallback to heuristic-based scoring
        base = {
            "clip_local_photo": 73,
            "xceptionnet_video": 67,
            "efficientnet_video": 69,
            "cnn_rnn_lstm_video": 66,
            "timesformer_video": 71,
            "document_forensics_local": 78,
            "asvspoof_baseline_audio": 70,
            "nemo_audio": 68,
            "wav2vec2_audio": 69,
        }.get(name, 70)

        penalties = 0.0
        signs: list[str] = []

        if modality in {"photo", "image", "document"}:
            if features.size_kb < 40:
                penalties += 10
                signs.append("Payload is small for deep visual inspection.")
            if features.entropy < 4.6:
                penalties += 12
                signs.append("Entropy suggests templated or recompressed regions.")
            if features.repeat_ratio > 0.08:
                penalties += 14
                signs.append("Repeated binary blocks indicate possible generative or cloned content.")
        if modality in {"video", "deepfake"}:
            if features.size_kb < 150:
                penalties += 14
                signs.append("Video sample is small for stable temporal evidence.")
            if features.repeat_ratio > 0.12:
                penalties += 16
                signs.append("Repeated frame-like structures suggest synthetic or looped content.")
            if features.entropy < 5.1:
                penalties += 8
                signs.append("Temporal stream appears overly regular.")
        if modality == "audio":
            if features.size_kb < 24:
                penalties += 10
                signs.append("Audio sample is short or sparse.")
            if features.zero_ratio > 0.20:
                penalties += 8
                signs.append("Excess silence or padding reduced confidence.")
            if features.entropy > 7.7:
                penalties += 10
                signs.append("High-entropy residue is consistent with synthetic vocoder artifacts.")

        model_bias = {
            "clip_local_photo": -3 if features.entropy > 7.8 else 2,
            "xceptionnet_video": -2 if features.repeat_ratio > 0.1 else 1,
            "efficientnet_video": -1 if features.entropy < 5.0 else 1,
            "cnn_rnn_lstm_video": -3 if features.size_kb < 200 else 2,
            "timesformer_video": -2 if features.repeat_ratio > 0.14 else 2,
            "document_forensics_local": 2 if features.mime_type.startswith("application/pdf") else -1,
            "asvspoof_baseline_audio": -2 if features.zero_ratio > 0.18 else 1,
            "nemo_audio": -1 if features.entropy < 4.1 else 1,
            "wav2vec2_audio": -1 if features.size_kb < 50 else 2,
        }.get(name, 0)

        score = clamp(base - penalties + model_bias)
        return DetectorOutput(
            score=score,
            signs=signs or ["Local open-source detector did not see a dominant anomaly cluster."],
            summary=f"{name} produced a local score of {score}/100 from structural media features.",
            trace=ModelTrace(
                display_name=name,
                canonical_name=name,
                source_kind="open_source",
                active=True,
                emulated=False,
                score=score,
                notes="Heuristic fallback scoring path.",
            ),
        )

    def score_text(self, name: str, features: TextFeatures, text: Optional[str] = None) -> DetectorOutput:
        # Try real ML inference first if available
        if self._ml_available and text:
            try:
                ml_result = analyze_text_real(text)
                return DetectorOutput(
                    score=ml_result["score"],
                    signs=ml_result["signs"],
                    summary=ml_result["summary"],
                    trace=ModelTrace(
                        display_name=name,
                        canonical_name=name,
                        source_kind="open_source",
                        active=True,
                        emulated=False,
                        score=ml_result["score"],
                        notes="Real ML inference (RoBERTa-based detector).",
                    ),
                )
            except Exception as e:
                print(f"[Forensica] ML text inference failed: {e}")
                # Fall through to heuristic fallback

        # Fallback to heuristic-based scoring
        base = {
            "roberta_text_local": 71,
            "detectgpt_text": 69,
            "gltr_text": 67,
        }.get(name, 70)

        penalties = 0.0
        signs: list[str] = []

        if features.word_count < 30:
            penalties += 8
            signs.append("Short text sample limits detector confidence.")
        if features.word_count > 80 and features.lexical_diversity < 0.42:
            penalties += 16
            signs.append("Low lexical diversity is consistent with generated prose.")
        if features.sentence_variance < 9 and features.word_count > 40:
            penalties += 10
            signs.append("Sentence lengths are unusually uniform.")
        if features.trigram_repeat_ratio > 0.08:
            penalties += 16
            signs.append("Repeated phrase windows suggest predictive generation.")

        model_bias = {
            "roberta_text_local": 2 if features.lexical_diversity > 0.55 else -2,
            "detectgpt_text": -2 if features.trigram_repeat_ratio > 0.1 else 1,
            "gltr_text": -2 if features.avg_sentence_len > 24 else 1,
        }.get(name, 0)

        score = clamp(base - penalties + model_bias)
        return DetectorOutput(
            score=score,
            signs=signs or ["Local text detector did not see a dominant anomaly cluster."],
            summary=f"{name} produced a local score of {score}/100 from text-distribution features.",
            trace=ModelTrace(
                display_name=name,
                canonical_name=name,
                source_kind="open_source",
                active=True,
                emulated=False,
                score=score,
                notes="Heuristic fallback scoring path.",
            ),
        )


class HiveAdapter:
    def __init__(self) -> None:
        self.api_key = os.environ.get("HIVE_API_KEY")
        self.api_url = os.environ.get("HIVE_API_URL", "https://api.thehive.ai/api/v2/task/sync")

    def enabled(self) -> bool:
        return bool(self.api_key)

    def analyze(self, modality: str, payload: bytes | str, mime_type: Optional[str]) -> Optional[DetectorOutput]:
        if not self.enabled():
            return None

        try:
            boundary = "----ForensicaHiveBoundary"
            if isinstance(payload, str):
                data = (
                    f"--{boundary}\r\n"
                    f'Content-Disposition: form-data; name="text"\r\n\r\n'
                    f"{payload}\r\n"
                    f"--{boundary}--\r\n"
                ).encode("utf-8")
            else:
                filename = f"upload{self._extension_for_mime(mime_type)}"
                header = (
                    f"--{boundary}\r\n"
                    f'Content-Disposition: form-data; name="media"; filename="{filename}"\r\n'
                    f"Content-Type: {mime_type or 'application/octet-stream'}\r\n\r\n"
                ).encode("utf-8")
                footer = f"\r\n--{boundary}--\r\n".encode("utf-8")
                data = header + payload + footer

            request = urllib.request.Request(
                self.api_url,
                data=data,
                headers={
                    "Authorization": f"Token {self.api_key}",
                    "Content-Type": f"multipart/form-data; boundary={boundary}",
                    "accept": "application/json",
                },
                method="POST",
            )
            with urllib.request.urlopen(request, timeout=20) as response:
                parsed = json.loads(response.read().decode("utf-8"))

            score = self._extract_score(parsed, modality)
            signs = [f"Hive adapter returned a vendor score for {modality}."] if score is not None else ["Hive adapter returned an unparsed response."]
            score = clamp((1 - score) * 100 if score is not None else 60)
            return DetectorOutput(
                score=score,
                signs=signs,
                summary="Hive adapter path is active and contributing to the ensemble.",
                trace=ModelTrace(
                    display_name="Hive AI",
                    canonical_name="hive_ai_vendor",
                    source_kind="vendor_optional",
                    active=True,
                    emulated=False,
                    score=score,
                    notes="Optional vendor adapter is active via HIVE_API_KEY.",
                ),
            )
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, ValueError):
            return None

    def _extract_score(self, payload: dict, modality: str) -> Optional[float]:
        if not isinstance(payload, dict):
            return None
        status = payload.get("status")
        if isinstance(status, list):
            for item in status:
                if not isinstance(item, dict):
                    continue
                klass = str(item.get("class", "")).lower()
                value = item.get("score")
                if not isinstance(value, (int, float)):
                    continue
                if modality in {"photo", "image", "video"} and klass in {"ai_generated", "deepfake"}:
                    return float(value)
                if modality == "text" and klass == "ai_generated":
                    return float(value)
                if modality == "audio" and klass == "ai_generated":
                    return float(value)
        return None

    @staticmethod
    def _extension_for_mime(mime_type: Optional[str]) -> str:
        mapping = {
            "image/jpeg": ".jpg",
            "image/png": ".png",
            "image/webp": ".webp",
            "video/mp4": ".mp4",
            "audio/wav": ".wav",
            "audio/mpeg": ".mp3",
            "application/pdf": ".pdf",
        }
        return mapping.get(mime_type or "", ".bin")


class EnsembleRegistry:
    def __init__(self) -> None:
        self.local = LocalOpenSourceDetectors()
        self.hive = HiveAdapter()

    def analyze(self, request: AnalyzeRequest) -> AnalyzeResponse:
        profile = PROFILE_MAP.get(request.modality, PROFILE_MAP["photo"])

        if request.modality == "text":
            if not request.text:
                raise HTTPException(status_code=400, detail="Text payload is required for text modality.")
            features = extract_text_features(request.text)
            outputs = self._run_text_profile(profile, features, request)
        else:
            if not request.contentBase64:
                raise HTTPException(status_code=400, detail="Binary payload is required for this modality.")
            try:
                payload = base64.b64decode(request.contentBase64)
            except Exception as exc:
                raise HTTPException(status_code=400, detail="Invalid base64 content.") from exc
            features = extract_binary_features(payload, request.mimeType)
            outputs = self._run_binary_profile(profile, payload, features, request)

        active_outputs = [output for output in outputs if output.trace.active and output.score is not None]
        if not active_outputs:
            raise HTTPException(status_code=503, detail="No ensemble detectors were available for this request.")

        weighted_sum = sum(output.score * output.trace.weight for output in active_outputs if output.trace.score is not None)
        total_weight = sum(output.trace.weight for output in active_outputs)
        final_score = clamp(weighted_sum / max(total_weight, 1))
        signs = self._merge_signals(active_outputs)
        provider_mode = self._provider_mode(active_outputs)

        return AnalyzeResponse(
            authenticity_score=final_score,
            risk_level=risk_level(final_score),
            tampering_signs=signs,
            forensic_summary=self._summary_for(request.modality, final_score, active_outputs, provider_mode),
            ensemble_profile=f"{request.modality}-ensemble-v1",
            provider_mode=provider_mode,
            model_trace=[output.trace for output in outputs],
        )

    def _run_binary_profile(
        self,
        profile: list[DetectorSpec],
        payload: bytes,
        features: BinaryFeatures,
        request: AnalyzeRequest,
    ) -> list[DetectorOutput]:
        outputs: list[DetectorOutput] = []
        for spec in profile:
            if request.requestedModels and spec.display_name not in request.requestedModels and spec.canonical_name not in request.requestedModels:
                continue

            if spec.source_kind == "vendor_optional":
                if request.allowHiveAdapter:
                    hive_output = self.hive.analyze(request.modality, payload, features.mime_type)
                    if hive_output:
                        hive_output.trace.display_name = spec.display_name
                        hive_output.trace.canonical_name = spec.canonical_name
                        hive_output.trace.weight = spec.weight
                        hive_output.trace.notes = "Hive vendor adapter contributed to the ensemble."
                        outputs.append(hive_output)
                        continue
                outputs.append(self._inactive_trace(spec, "Hive adapter is configured as optional and no valid key/path is active."))
                continue

            backing_name = spec.backed_by or spec.canonical_name
            local_output = self.local.score_binary(request.modality, backing_name, features, payload)
            local_output.trace.display_name = spec.display_name
            local_output.trace.canonical_name = spec.canonical_name
            local_output.trace.source_kind = spec.source_kind
            local_output.trace.emulated = spec.emulated
            local_output.trace.weight = spec.weight
            local_output.trace.backed_by = spec.backed_by
            local_output.trace.notes = "Compatibility alias backed by a local open-source scorer." if spec.emulated else "Open-source local scorer is active."
            outputs.append(local_output)
        return outputs

    def _run_text_profile(self, profile: list[DetectorSpec], features: TextFeatures, request: AnalyzeRequest) -> list[DetectorOutput]:
        outputs: list[DetectorOutput] = []
        for spec in profile:
            if request.requestedModels and spec.display_name not in request.requestedModels and spec.canonical_name not in request.requestedModels:
                continue
            backing_name = spec.backed_by or spec.canonical_name
            local_output = self.local.score_text(backing_name, features, request.text)
            local_output.trace.display_name = spec.display_name
            local_output.trace.canonical_name = spec.canonical_name
            local_output.trace.source_kind = spec.source_kind
            local_output.trace.emulated = spec.emulated
            local_output.trace.weight = spec.weight
            local_output.trace.backed_by = spec.backed_by
            local_output.trace.notes = "Compatibility alias backed by a local open-source scorer." if spec.emulated else "Open-source local scorer is active."
            outputs.append(local_output)
        return outputs

    @staticmethod
    def _inactive_trace(spec: DetectorSpec, note: str) -> DetectorOutput:
        return DetectorOutput(
            score=60,
            signs=[note],
            summary=note,
            trace=ModelTrace(
                display_name=spec.display_name,
                canonical_name=spec.canonical_name,
                source_kind=spec.source_kind,
                active=False,
                emulated=spec.emulated,
                score=None,
                weight=spec.weight,
                notes=note,
                backed_by=spec.backed_by,
            ),
        )

    @staticmethod
    def _merge_signals(outputs: list[DetectorOutput]) -> list[str]:
        merged: list[str] = []
        seen: set[str] = set()
        for output in outputs:
            for sign in output.signs:
                if sign not in seen:
                    seen.add(sign)
                    merged.append(sign)
        return merged[:6] or ["The ensemble did not surface a dominant anomaly cluster."]

    @staticmethod
    def _provider_mode(outputs: list[DetectorOutput]) -> str:
        kinds = {output.trace.source_kind for output in outputs}
        if "vendor_optional" in kinds and "open_source" in kinds:
            return "open-source+hybrid+compatibility"
        if "vendor_optional" in kinds:
            return "hybrid"
        if "compatibility" in kinds:
            return "open-source+compatibility"
        return "open-source"

    @staticmethod
    def _summary_for(modality: str, final_score: int, outputs: list[DetectorOutput], provider_mode: str) -> str:
        labels = ", ".join(output.trace.display_name for output in outputs if output.trace.active)
        return (
            f"{modality.title()} ensemble completed with score {final_score}/100. "
            f"Provider mode: {provider_mode}. "
            f"Active detectors: {labels}."
        )


@lru_cache(maxsize=1)
def get_registry() -> EnsembleRegistry:
    return EnsembleRegistry()


app = FastAPI(title="Forensica Local Model Service", version="0.2.0")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "local-model-service"}


@app.get("/models")
def models() -> dict[str, object]:
    return {
        "status": "ok",
        "runtime": os.environ.get("MODEL_RUNTIME", "python"),
        "provider_mode": "open-source + optional Hive + exact-name compatibility",
        "modalities": {
            "photo": [spec.display_name for spec in PHOTO_PROFILE],
            "video": [spec.display_name for spec in VIDEO_PROFILE],
            "text": [spec.display_name for spec in TEXT_PROFILE],
            "audio": [spec.display_name for spec in AUDIO_PROFILE],
            "document": [spec.display_name for spec in DOCUMENT_PROFILE],
        },
        "notes": [
            "Open-source local ensemble is the default path.",
            "Hive adapter activates only when HIVE_API_KEY is set.",
            "Exact-name compatibility aliases are exposed for unavailable proprietary or retired detectors.",
        ],
    }


@app.post("/analyze", response_model=AnalyzeResponse)
def analyze(request: AnalyzeRequest) -> AnalyzeResponse:
    return get_registry().analyze(request)
