# Local Model Service

This folder is the Python inference service for stronger local models.

## What it does today

- Exposes `/health`, `/models`, and `/analyze`
- Accepts `photo`, `video`, `audio`, `text`, and `document` requests
- Runs an ensemble coordinator with three layers:
- `Option 1`: open-source local ensemble
- `Option 2`: optional Hive adapter when `HIVE_API_KEY` is provided
- `Option 3`: exact-name compatibility aliases that map unavailable proprietary names onto local replacements

## Why this exists

The Node backend should not have to know how to load PyTorch, Transformers, OpenCV, audio DSP, or future model weights. This service isolates model inference so we can upgrade modality-specific detectors without rewriting the web app.

## Planned upgrades

- `photo`: replace the backstop with a real image-forensics model loader
- `video`: add a local deepfake/video detector
- `audio`: add a local spoof/deepfake audio detector
- `text`: add a local classifier for AI-vs-human or synthetic-style detection

## Run

Once Python is installed:

```bash
pip install -r ml_service/requirements.txt
uvicorn ml_service.app:app --host 127.0.0.1 --port 8001
```

Then set:

```env
MODEL_SERVICE_URL=http://127.0.0.1:8001
```

Optional hybrid adapter:

```env
HIVE_API_KEY=your_key_here
HIVE_API_URL=https://api.thehive.ai/api/v2/task/sync
```
