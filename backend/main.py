from fastapi import FastAPI, HTTPException, Depends, Header, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import create_engine, Column, String, Integer, Boolean, DateTime, Text, Float, JSON, ForeignKey, Enum as SAEnum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from pydantic import BaseModel, EmailStr
import uvicorn
import httpx
import os
import uuid
import hashlib
import hmac
import jwt as pyjwt
import re
from datetime import datetime, timedelta
from typing import Optional
import enum

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://hbrl_admin:HardbanRecordsLab2026!@localhost:5432/hbrl_master")
ACCESS_MANAGER_URL = os.getenv("ACCESS_MANAGER_URL", "http://localhost:9107")
JWT_SECRET = os.getenv("JWT_SECRET", "course-hub-jwt-secret-2026")
JWT_ALGORITHM = "HS256"
API_PORT = int(os.getenv("API_PORT", "9104"))

engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_size=5)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class TokenStatus(str, enum.Enum):
    active = "active"
    expired = "expired"
    revoked = "revoked"
    failed = "failed"

class AccessAction(str, enum.Enum):
    granted = "access.granted"
    expired = "access.expired"
    issued = "token.issued"
    failed = "token.failed"
    completed = "course.completed"
    level_changed = "pmpro.level_changed"

class CHCourse(Base):
    __tablename__ = "ch_courses"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    slug = Column(String, unique=True, nullable=False)
    url = Column(String, nullable=False)
    status = Column(String, default="active")
    auth_method = Column(String, default="jwt")
    pmpro_levels = Column(JSON, default=list)
    active_users = Column(Integer, default=0)
    token_expiry = Column(Integer, default=86400)
    category = Column(String, default="Marketing")
    secret_key = Column(String, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class CHToken(Base):
    __tablename__ = "ch_tokens"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    jti = Column(String, unique=True, nullable=False)
    user_email = Column(String, nullable=False)
    user_name = Column(String, default="")
    course_id = Column(String, nullable=False)
    course_name = Column(String, nullable=False)
    ip_address = Column(String, default="")
    status = Column(String, default="active")
    used_count = Column(Integer, default=0)
    issued_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)
    revoked_at = Column(DateTime, nullable=True)

class CHAccessLog(Base):
    __tablename__ = "ch_access_logs"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    action = Column(String, nullable=False)
    user_email = Column(String, default="")
    user_name = Column(String, default="")
    course_name = Column(String, default="")
    course_id = Column(String, default="")
    ip_address = Column(String, default="")
    details = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="HRL Course Hub API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "http://localhost:5173",
        "https://app-course-hub.hardbanrecordslab.online",
        "https://course-hub.hardbanrecordslab.online",
    ],
    allow_origin_regex=r"^https://.*\.hardbanrecordslab\.online$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_jti() -> str:
    return "tok_" + hashlib.sha256(str(uuid.uuid4()).encode()).hexdigest()[:16]

def generate_jwt(payload: dict, secret: str) -> str:
    return pyjwt.encode(payload, secret, algorithm=JWT_ALGORITHM)

def verify_jwt(token: str, secret: str) -> Optional[dict]:
    try:
        return pyjwt.decode(token, secret, algorithms=[JWT_ALGORITHM])
    except:
        return None

async def verify_access_manager_token(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    token = authorization.replace("Bearer ", "")
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(
                f"{ACCESS_MANAGER_URL}/api/auth/verify",
                json={"token": token},
                timeout=5.0
            )
            if resp.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid token")
            return resp.json()
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="Access Manager unavailable")

@app.get("/api/health")
async def health(db: Session = Depends(get_db)):
    try:
        from sqlalchemy import text
        db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        db_status = f"disconnected: {str(e)}"
    return {
        "status": "healthy",
        "service": "course-hub",
        "arch": "Unified HRL",
        "version": "2.0.0",
        "database": db_status,
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/api/auth/verify")
async def verify_auth(authorization: Optional[str] = Header(None)):
    return await verify_access_manager_token(authorization)

@app.get("/api/auth/profile")
async def get_profile(email: str = Query(...), db: Session = Depends(get_db)):
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(f"{ACCESS_MANAGER_URL}/api/auth/profile", params={"email": email}, timeout=5.0)
            if resp.status_code == 200:
                return resp.json()
        except:
            pass
    from sqlalchemy import text
    result = db.execute(text("SELECT id, email, full_name, tier, credits, is_premium, is_superuser FROM users WHERE email = :email"), {"email": email})
    row = result.fetchone()
    if row:
        return {
            "id": str(row[0]),
            "email": row[1],
            "name": row[2] or email.split("@")[0],
            "tier": row[3] or "free",
            "credits": row[4] or 0,
            "is_premium": row[5] or False,
            "role": "admin" if row[6] else "student"
        }
    raise HTTPException(status_code=404, detail="User not found")

@app.get("/api/courses/access")
async def check_course_access(course_id: str, email: str, db: Session = Depends(get_db)):
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(f"{ACCESS_MANAGER_URL}/api/auth/profile", params={"email": email}, timeout=5.0)
            if resp.status_code == 200:
                user_data = resp.json()
                if user_data.get("is_premium") or user_data.get("credits", 0) > 0:
                    course = db.query(CHCourse).filter(CHCourse.slug == course_id).first()
                    return {"access": True, "tier": user_data.get("tier"), "course": course.title if course else None}
        except:
            pass
    return {"access": False, "message": "Premium membership or credits required"}

# --- Courses CRUD ---
@app.get("/api/courses")
async def list_courses(db: Session = Depends(get_db)):
    courses = db.query(CHCourse).order_by(CHCourse.created_at.desc()).all()
    return [
        {
            "id": c.id,
            "title": c.title,
            "slug": c.slug,
            "url": c.url,
            "status": c.status,
            "authMethod": c.auth_method,
            "pmpro_levels": c.pmpro_levels or [],
            "activeUsers": c.active_users,
            "tokenExpiry": c.token_expiry,
            "category": c.category,
            "secretKey": c.secret_key,
            "createdAt": c.created_at.isoformat() if c.created_at else None,
        }
        for c in courses
    ]

@app.post("/api/courses")
async def create_course(data: dict, db: Session = Depends(get_db)):
    course = CHCourse(
        title=data.get("title", ""),
        slug=data.get("slug", ""),
        url=data.get("url", ""),
        status=data.get("status", "draft"),
        auth_method=data.get("authMethod", "jwt"),
        pmpro_levels=data.get("pmpro_levels", []),
        token_expiry=data.get("tokenExpiry", 86400),
        category=data.get("category", "Marketing"),
        secret_key=data.get("secretKey", ""),
    )
    if not course.title or not course.url:
        raise HTTPException(status_code=400, detail="Title and URL are required")
    if not course.slug:
        course.slug = re.sub(r'[^a-z0-9-]', '', course.title.lower().replace(" ", "-"))
    db.add(course)
    db.commit()
    db.refresh(course)
    log_action(db, AccessAction.granted, "", "" , course.title, course.id, "Course created")
    return {"id": course.id, "title": course.title, "status": "created"}

@app.put("/api/courses/{course_id}")
async def update_course(course_id: str, data: dict, db: Session = Depends(get_db)):
    course = db.query(CHCourse).filter(CHCourse.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    for field in ["title", "slug", "url", "status", "auth_method", "pmpro_levels",
                   "token_expiry", "category", "secret_key", "active_users"]:
        key = field
        if field == "auth_method":
            key = "authMethod"
        elif field == "token_expiry":
            key = "tokenExpiry"
        elif field == "active_users":
            key = "activeUsers"
        if key in data:
            setattr(course, field, data[key])
    db.commit()
    return {"id": course.id, "title": course.title, "status": "updated"}

@app.delete("/api/courses/{course_id}")
async def delete_course(course_id: str, db: Session = Depends(get_db)):
    course = db.query(CHCourse).filter(CHCourse.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    db.delete(course)
    db.commit()
    return {"status": "deleted", "id": course_id}

@app.patch("/api/courses/{course_id}/status")
async def toggle_course_status(course_id: str, db: Session = Depends(get_db)):
    course = db.query(CHCourse).filter(CHCourse.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    order = {"active": "draft", "draft": "archived", "archived": "active"}
    course.status = order.get(course.status, "active")
    db.commit()
    return {"id": course.id, "status": course.status}

# --- Tokens CRUD ---
@app.get("/api/tokens")
async def list_tokens(
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(CHToken).order_by(CHToken.issued_at.desc())
    if status and status != "all":
        query = query.filter(CHToken.status == status)
    if search:
        query = query.filter(
            (CHToken.user_email.ilike(f"%{search}%")) |
            (CHToken.user_name.ilike(f"%{search}%")) |
            (CHToken.course_name.ilike(f"%{search}%"))
        )
    tokens = query.limit(200).all()
    return [
        {
            "id": t.id,
            "jti": t.jti,
            "user": t.user_name or t.user_email,
            "course": t.course_name,
            "issuedAt": t.issued_at.isoformat() if t.issued_at else None,
            "expiresAt": t.expires_at.isoformat() if t.expires_at else None,
            "usedCount": t.used_count,
            "status": t.status,
            "ip": t.ip_address,
        }
        for t in tokens
    ]

@app.post("/api/tokens")
async def create_token(data: dict, db: Session = Depends(get_db)):
    user_email = data.get("email", "")
    user_name = data.get("name", "")
    course_id = data.get("courseId", "")
    if not user_email or not course_id:
        raise HTTPException(status_code=400, detail="Email and courseId required")
    course = db.query(CHCourse).filter(CHCourse.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    jti = create_jti()
    now = datetime.utcnow()
    expires = now + timedelta(seconds=course.token_expiry)
    token = CHToken(
        jti=jti,
        user_email=user_email,
        user_name=user_name,
        course_id=course_id,
        course_name=course.title,
        status="active",
        issued_at=now,
        expires_at=expires,
    )
    db.add(token)
    log_action(db, AccessAction.issued, user_email, user_name, course.title, course_id, f"Token {jti}")
    db.commit()
    jwt_payload = {
        "jti": jti,
        "sub": user_email,
        "name": user_name,
        "course": course.slug,
        "iat": now,
        "exp": expires,
    }
    secret = course.secret_key or JWT_SECRET
    token_str = generate_jwt(jwt_payload, secret)
    return {"token": token_str, "jti": jti, "expiresAt": expires.isoformat()}

@app.post("/api/tokens/{token_id}/revoke")
async def revoke_token(token_id: str, db: Session = Depends(get_db)):
    token = db.query(CHToken).filter(CHToken.id == token_id).first()
    if not token:
        raise HTTPException(status_code=404, detail="Token not found")
    token.status = "revoked"
    token.revoked_at = datetime.utcnow()
    log_action(db, AccessAction.expired, token.user_email, token.user_name, token.course_name, token.course_id, f"Token revoked")
    db.commit()
    return {"status": "revoked", "jti": token.jti}

@app.get("/api/tokens/stats")
async def token_stats(db: Session = Depends(get_db)):
    total = db.query(CHToken).count()
    active = db.query(CHToken).filter(CHToken.status == "active").count()
    failed = db.query(CHToken).filter(CHToken.status == "failed").count()
    expired = db.query(CHToken).filter(CHToken.status == "expired").count()
    today = db.query(CHToken).filter(
        CHToken.issued_at >= datetime.utcnow().replace(hour=0, minute=0, second=0)
    ).count()
    return {"total": total, "active": active, "today": today, "failed": failed, "expired": expired}

# --- Activity / Access Logs ---
@app.get("/api/activity")
async def list_activity(
    action: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(CHAccessLog).order_by(CHAccessLog.created_at.desc())
    if action and action != "all":
        query = query.filter(CHAccessLog.action == action)
    if search:
        q = f"%{search}%"
        query = query.filter(
            (CHAccessLog.user_email.ilike(q)) |
            (CHAccessLog.user_name.ilike(q)) |
            (CHAccessLog.course_name.ilike(q))
        )
    logs = query.limit(limit).all()
    return [
        {
            "id": l.id,
            "action": l.action,
            "user": l.user_name or l.user_email,
            "email": l.user_email,
            "course": l.course_name,
            "time": l.created_at.isoformat() if l.created_at else None,
            "ip": l.ip_address,
            "details": l.details,
        }
        for l in logs
    ]

@app.get("/api/activity/stats")
async def activity_stats(db: Session = Depends(get_db)):
    total = db.query(CHAccessLog).count()
    today = db.query(CHAccessLog).filter(
        CHAccessLog.created_at >= datetime.utcnow().replace(hour=0, minute=0, second=0)
    ).count()
    return {"total": total, "today": today}

# --- Users proxy ---
@app.get("/api/users")
async def list_users(search: Optional[str] = None, db: Session = Depends(get_db)):
    from sqlalchemy import text
    query = "SELECT id, email, full_name, tier, credits, is_premium, is_superuser, is_active, created_at FROM users"
    params = {}
    if search:
        query += " WHERE email ILIKE :search OR full_name ILIKE :search"
        params["search"] = f"%{search}%"
    query += " ORDER BY created_at DESC LIMIT 100"
    result = db.execute(text(query), params)
    users = []
    for row in result:
        users.append({
            "id": str(row[0]),
            "email": row[1],
            "name": row[2] or row[1].split("@")[0],
            "level": "Pro" if row[5] else "Starter",
            "courses": 0,
            "status": "active" if row[7] else "expired",
            "lastAccess": row[8].strftime("%Y-%m-%d %H:%M") if row[8] else "-",
            "registeredAt": row[8].strftime("%Y-%m-%d") if row[8] else "-",
            "tier": row[3],
            "credits": row[4],
            "is_premium": row[5],
            "is_superuser": row[6],
        })
    return users

@app.get("/api/users/{user_id}")
async def get_user(user_id: str, db: Session = Depends(get_db)):
    from sqlalchemy import text
    result = db.execute(text("SELECT id, email, full_name, tier, credits, is_premium, is_superuser, is_active, created_at FROM users WHERE id = :id"), {"id": user_id})
    row = result.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": str(row[0]),
        "email": row[1],
        "name": row[2] or row[1].split("@")[0],
        "level": "Pro" if row[5] else "Starter",
        "tier": row[3],
        "credits": row[4],
        "is_premium": row[5],
        "is_superuser": row[6],
        "status": "active" if row[7] else "expired",
        "registeredAt": row[8].strftime("%Y-%m-%d") if row[8] else "-",
    }

# --- Subscription Plans ---
@app.get("/api/plans")
async def list_plans(db: Session = Depends(get_db)):
    from sqlalchemy import text
    result = db.execute(text("SELECT id, name, price_cents, currency, period, features FROM subscription_plans ORDER BY price_cents"))
    plans = []
    for row in result:
        plans.append({
            "id": row[0],
            "name": row[1],
            "price": row[2] / 100,
            "priceCents": row[2],
            "currency": row[3],
            "period": row[4],
            "features": row[5],
        })
    return plans

# --- Dashboard stats ---
@app.get("/api/dashboard/stats")
async def dashboard_stats(db: Session = Depends(get_db)):
    from sqlalchemy import text
    active_users = db.execute(text("SELECT COUNT(*) FROM users WHERE is_active = true")).scalar() or 0
    active_courses = db.query(CHCourse).filter(CHCourse.status == "active").count()
    total_courses = db.query(CHCourse).count()
    draft_courses = db.query(CHCourse).filter(CHCourse.status == "draft").count()
    today_tokens = db.query(CHToken).filter(
        CHToken.issued_at >= datetime.utcnow().replace(hour=0, minute=0, second=0)
    ).count()
    plans_count = db.execute(text("SELECT COUNT(*) FROM subscription_plans")).scalar() or 0
    return {
        "activeUsers": active_users,
        "activeCourses": active_courses,
        "draftCourses": draft_courses,
        "todayTokens": today_tokens,
        "plansCount": plans_count,
        "totalCourses": total_courses,
    }

def log_action(db: Session, action: AccessAction, user_email: str, user_name: str, course_name: str, course_id: str, details: str = ""):
    log = CHAccessLog(
        action=action.value,
        user_email=user_email,
        user_name=user_name,
        course_name=course_name,
        course_id=course_id,
        details=details,
    )
    db.add(log)

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(status_code=500, content={"detail": "Internal Server Error", "error": str(exc)})

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=API_PORT, reload=True)
