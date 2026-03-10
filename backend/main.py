import os
import logging
from datetime import datetime
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
from dotenv import load_dotenv
from cachetools import TTLCache

# --- Configuration & Logging ---
load_dotenv()
GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("parker_backend")

app = FastAPI(title="Parker Backend API")

# --- CORS Configuration ---
# Expo apps often need broad CORS during development. 
# In strict production, restrict allow_origins to your specific domains.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- In-Memory Stores & Rate Limiting ---
# Note: For multi-worker production deployments (e.g., multiple gunicorn workers), 
# consider replacing these in-memory stores with Redis.

minute_limits = TTLCache(maxsize=100000, ttl=60)
route_cache = TTLCache(maxsize=10000, ttl=300)

class MonthlyRateLimiter:
    def __init__(self):
        self.current_month = datetime.utcnow().strftime('%Y-%m')
        self.global_count = 0
        self.user_counts = {}

    def _check_reset(self):
        now_month = datetime.utcnow().strftime('%Y-%m')
        if now_month != self.current_month:
            self.current_month = now_month
            self.global_count = 0
            self.user_counts.clear()
            logger.info(f"Monthly counters automatically reset for new month: {now_month}")

    def check_and_increment(self, user_id: str):
        self._check_reset()

        # 1. Global limit check (30,000 / month)
        if self.global_count >= 30000:
            logger.warning("Global monthly routing limit (30,000) exceeded.")
            raise HTTPException(status_code=503, detail="Routing temporarily unavailable.")

        # 2. Per-user monthly limit check (200 / month)
        user_count = self.user_counts.get(user_id, 0)
        if user_count >= 200:
            logger.warning(f"User {user_id} exceeded monthly limit (200).")
            raise HTTPException(status_code=429, detail="Rate limit exceeded")

        # Increment counters
        self.global_count += 1
        self.user_counts[user_id] = user_count + 1

monthly_limiter = MonthlyRateLimiter()

# --- Models ---
class RouteRequest(BaseModel):
    origin_lat: float
    origin_lng: float
    dest_lat: float
    dest_lng: float
    user_id: str

class RouteResponse(BaseModel):
    polyline: str
    distance_meters: int
    duration_seconds: int

def check_rate_limit(user_id: str):
    # Check minute limit (5 / minute)
    min_count = minute_limits.get(user_id, 0)
    if min_count >= 5:
        logger.warning(f"User {user_id} exceeded minute limit (5).")
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    minute_limits[user_id] = min_count + 1

    # Check monthly limits (global and per-user)
    monthly_limiter.check_and_increment(user_id)

# --- Endpoints ---
@app.post("/route", response_model=RouteResponse)
async def get_route(payload: RouteRequest):
    # 1. Log the incoming request
    logger.info(
        f"Route request: timestamp={datetime.utcnow().isoformat()}Z "
        f"user_id={payload.user_id} "
        f"origin={payload.origin_lat},{payload.origin_lng} "
        f"destination={payload.dest_lat},{payload.dest_lng}"
    )

    # 2. Check Rate Limits
    check_rate_limit(payload.user_id)

    # 3. Check Route Cache
    cache_key = f"{payload.origin_lat},{payload.origin_lng}|{payload.dest_lat},{payload.dest_lng}"
    if cache_key in route_cache:
        logger.info(f"Cache hit for route: {cache_key}")
        return route_cache[cache_key]

    # 4. Validate API Key
    if not GOOGLE_MAPS_API_KEY:
        logger.error("Google Maps API key not configured.")
        raise HTTPException(status_code=500, detail="Google Maps API key not configured on server.")

    # 5. Call Google Directions API
    url = "https://maps.googleapis.com/maps/api/directions/json"
    params = {
        "origin": f"{payload.origin_lat},{payload.origin_lng}",
        "destination": f"{payload.dest_lat},{payload.dest_lng}",
        "key": GOOGLE_MAPS_API_KEY
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, params=params, timeout=10.0)
            response.raise_for_status()
        except httpx.RequestError as e:
            logger.error(f"Google API Request Error: {e}")
            raise HTTPException(status_code=502, detail="Error communicating with Google Maps API")
        except httpx.HTTPStatusError as e:
            logger.error(f"Google API HTTP Status Error: {e}")
            raise HTTPException(status_code=502, detail="Received error response from Google Maps API")

    data = response.json()
    status = data.get("status")
    
    # 6. Google Quota Monitoring
    if status in ["OVER_DAILY_LIMIT", "OVER_QUERY_LIMIT"]:
        logger.error(f"Google Maps API Quota Exceeded: {status}")
        raise HTTPException(status_code=503, detail="Navigation temporarily unavailable.")
        
    if status != "OK":
        logger.error(f"Google Maps API returned error status: {status}")
        raise HTTPException(status_code=400, detail=f"Google Maps API returned status: {status}")

    # 7. Parse and Cache Response
    try:
        route = data["routes"][0]
        leg = route["legs"][0]
        
        result = RouteResponse(
            polyline=route["overview_polyline"]["points"],
            distance_meters=leg["distance"]["value"],
            duration_seconds=leg["duration"]["value"]
        )
        
        # Store in cache
        route_cache[cache_key] = result
        logger.info(f"Successfully fetched and cached route: {cache_key}")
        return result
        
    except (KeyError, IndexError) as e:
        logger.error(f"Unexpected Google API response format: {e}")
        raise HTTPException(status_code=500, detail="Unexpected response format from Google Maps API")
