# Parker Backend API

A production-ready FastAPI backend for the Parker mobile app.

## Features
- `POST /route` endpoint to fetch directions
- Integrates with Google Directions API
- In-memory caching (5 minutes) for identical origin/destination pairs
- Rate limiting (5 requests/minute, 200 requests/month per `user_id`)
- Fully async and type-safe using Pydantic

## Setup Instructions

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create a virtual environment (recommended):**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure Environment Variables:**
   Copy the example environment file and add your Google Maps API key.
   ```bash
   cp .env.example .env
   ```
   Open `.env` and replace `your_google_maps_api_key_here` with your actual API key.

5. **Run the server:**
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

6. **Test the API:**
   You can view the interactive Swagger documentation at:
   `http://localhost:8000/docs`

   Or test via cURL:
   ```bash
   curl -X POST "http://localhost:8000/route" \
        -H "Content-Type: application/json" \
        -d '{
              "origin_lat": 37.7749,
              "origin_lng": -122.4194,
              "dest_lat": 37.8044,
              "dest_lng": -122.2712,
              "user_id": "user_123"
            }'
   ```
