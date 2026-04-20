# Forensica AI Detector Backend

This is the production-ready backend for Forensica AI Detector. It uses FastAPI for the REST API, PostgreSQL for the database, and Celery with Redis for background task processing of multimedia analysis.

## Requirements
- Docker
- Docker Compose

## How to Run

1. Build and start the services using Docker Compose:
   ```bash
   docker-compose up -d --build
   ```

2. The application will start the following services:
   - **web**: The FastAPI application on `http://localhost:8000`
   - **worker**: The Celery worker to process background AI analysis tasks
   - **db**: PostgreSQL database on port `5432`
   - **redis**: Redis broker on port `6379`

3. The interactive API documentation (Swagger UI) is available at:
   - `http://localhost:8000/docs`

## Initializing the Database

Before you can use the system, you need to create the database tables. You can do this by running a script inside the `web` container:

```bash
docker-compose exec web python init_db.py
```

## API Overview

### Authentication
- `POST /api/v1/auth/register`: Create a new user.
- `POST /api/v1/auth/token`: Get a JWT token by providing username (email) and password as form data.

### Analysis
- `POST /api/v1/upload/`: Upload an image, video, audio file, or provide text content. Requires JWT authentication. Returns a task `id`.
- `GET /api/v1/analysis/{id}`: Poll this endpoint to check the status of an analysis. It will transition from `pending` -> `processing` -> `completed`. Once completed, it includes the classification, confidence, and explanation.

## Structure

- `/app/api`: FastAPI routes.
- `/app/core`: Configuration, Celery, and Security setup.
- `/app/models`: SQLAlchemy ORM models.
- `/app/schemas`: Pydantic models for request/response validation.
- `/app/services`: AI logic modules (Image, Video, Audio, Text).
- `/app/workers`: Celery tasks.
