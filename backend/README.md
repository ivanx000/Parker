# Parker Backend API

A production-ready FastAPI backend for the Parker mobile app.

## Features
- `POST /route` endpoint to fetch directions
- `POST /support` endpoint to send Help & Support form submissions via email
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
   Copy the example environment file and configure Google Maps + support email settings.
   ```bash
   cp .env.example .env
   ```
   Required variables:
   - `GOOGLE_MAPS_API_KEY`
   - `SUPPORT_EMAIL_TO`
   - `SUPPORT_EMAIL_FROM`
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `SMTP_USERNAME`
   - `SMTP_PASSWORD`
   - `SMTP_USE_TLS`

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

    Support endpoint example:
    ```bash
    curl -X POST "http://localhost:8000/support" \
            -H "Content-Type: application/json" \
            -d '{
                     "name": "Jane Doe",
                     "email": "jane@example.com",
                     "message": "I need help with subscription billing."
                  }'
    ```
