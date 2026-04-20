# Deploying Forensica AI to Render

This guide will help you deploy your Forensica AI application to Render.com for free.

## Prerequisites

1. **GitHub Account** - You'll need to push your code to GitHub
2. **Render Account** - Sign up at [render.com](https://render.com) (free tier)
3. **Gemini API Key** - Get one from [Google AI Studio](https://makersuite.google.com/app/apikey)

## Quick Deploy (One-Click)

The easiest way to deploy is using the Render dashboard with the `render.yaml` file:

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Deploy via Render Dashboard**
   - Go to [dashboard.render.com](https://dashboard.render.com)
   - Click "New" → "Blueprint"
   - Connect your GitHub repository
   - Select the `render.yaml` file
   - Click "Apply"

3. **Configure Environment Variables**
   After deployment, go to your API service settings and add:
   - `SECRET_KEY` - A secure random string (generate at least 32 characters)
   - `GEMINI_API_KEY` - Your Google Gemini API key

## Manual Deploy (Alternative)

If you prefer deploying services individually:

### 1. Create PostgreSQL Database
- Go to Render Dashboard → "New" → "PostgreSQL"
- Name: `forensica-db`
- Plan: Free
- Region: Oregon (or closest to you)

### 2. Create Redis
- Go to Render Dashboard → "New" → "Redis"
- Name: `forensica-redis`
- Plan: Free
- Region: Oregon

### 3. Deploy Backend API
- Go to Render Dashboard → "New" → "Web Service"
- Connect your GitHub repository
- Configure:
  - Name: `forensica-api`
  - Build Command: `cd backend_fastapi && pip install -r requirements.txt`
  - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port 8000`
  - Plan: Free
- Add Environment Variables:
  - `POSTGRES_SERVER` - from your PostgreSQL service
  - `POSTGRES_PORT` - 5432
  - `POSTGRES_USER` - from your PostgreSQL service
  - `POSTGRES_PASSWORD` - from your PostgreSQL service
  - `POSTGRES_DB` - from your PostgreSQL service
  - `CELERY_BROKER_URL` - from your Redis service
  - `CELERY_RESULT_BACKEND` - from your Redis service
  - `SECRET_KEY` - Generate a secure random string
  - `GEMINI_API_KEY` - Your Gemini API key
- Add a 1GB disk at `/app/uploads`

### 4. Deploy Frontend
- Go to Render Dashboard → "New" → "Static Site"
- Connect your GitHub repository
- Configure:
  - Name: `forensica-web`
  - Build Command: `npm run build`
  - Publish Directory: `dist`
- Add Environment Variable:
  - `VITE_API_URL` - Your API service URL (e.g., `https://forensica-api.onrender.com`)

## After Deployment

1. **Update CORS** - If needed, update the CORS settings in `backend_fastapi/app/main.py` to allow your frontend URL
2. **Test the API** - Visit `https://your-api-service.onrender.com/docs` to see the API documentation
3. **Test the Frontend** - Visit your static site URL and try the detection features

## Important Notes

- **Free Tier Limits**: Render's free tier services sleep after 15 minutes of inactivity and may take ~30 seconds to wake up
- **Disk Storage**: The 1GB disk is for uploaded files - make sure to clean up old files periodically
- **API Keys**: Never commit your API keys to GitHub - use Render's environment variables

## Troubleshooting

### API returns 404
- Check that the API URL in the frontend matches your Render service URL
- Verify the backend is running on port 8000

### Upload fails
- Ensure the disk is mounted at `/app/uploads`
- Check that the upload directory exists

### CORS errors
- Update the CORS origins in `backend_fastapi/app/main.py` to include your frontend URL