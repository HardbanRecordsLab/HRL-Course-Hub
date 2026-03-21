from fastapi import FastAPI, HTTPException, Header, Request
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import httpx
import os

app = FastAPI(title="HRL Course Hub API", version="1.0.0")

ACCESS_MANAGER_URL = os.getenv("ACCESS_MANAGER_URL", "http://hrl-webhook-hub-backend:9107")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health():
    return {"status": "healthy", "service": "course-hub", "arch": "Unified HRL"}

@app.get("/api/courses/access")
async def check_course_access(course_id: str, email: str):
    # Verify PMP status or credits via Access Manager
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{ACCESS_MANAGER_URL}/api/auth/profile", params={"email": email})
        if resp.status_code == 200:
            user_data = resp.json()
            if user_data.get("is_premium") or user_data.get("credits") > 0:
                return {"access": True, "tier": user_data.get("tier")}
    
    return {"access": False, "message": "Premium membership or credits required for this course"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=9105, reload=True)
