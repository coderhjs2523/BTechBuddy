import random
import os
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException, status, Form, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from jose import JWTError, jwt
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
import shutil
from pathlib import Path
from sqlalchemy import text
import threading
import time
import requests

from database import engine, SessionLocal, Base
from models import User, Subject, VideoLecture, Note, Notice, Suggestion
from auth import verify_password, hash_password, create_access_token, SECRET_KEY, ALGORITHM
from email_utils import send_otp_email

# Load environment variables strictly from .env file
load_dotenv()
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL")

# Single FastAPI app initialization
app = FastAPI(title="BTechBuddy Backend", version="1.0.0")

# 1. CORS Middleware (Frontend aur Backend ki connectivity ke liye)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Render Backend URL for Keep-Alive Task (Using threading + requests instead of async httpx to avoid Python 3.14 issues)
RENDER_URL = "https://btechbuddy-backend.onrender.com"

def keep_alive():
    """Har 10 minute mein khud ke server ko ping karega taaki Render so na jaye"""
    while True:
        time.sleep(600)  # 10 minutes wait
        try:
            response = requests.get(RENDER_URL)
            print(f"Keep-alive ping sent: {response.status_code}")
        except Exception as e:
            print(f"Keep-alive ping failed: {e}")

@app.on_event("startup")
async def startup_event():
    # Background thread for keep-alive
    threading.Thread(target=keep_alive, daemon=True).start()
    
    # Create database tables
    Base.metadata.create_all(bind=engine)
    
    # Safe Migration Fix for missing columns in older DB files
    try:
        with engine.connect() as connection:
            connection.execute(text("ALTER TABLE users ADD COLUMN reset_otp VARCHAR"))
            connection.commit()
    except Exception:
        pass

# Setup Uploads Directory
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

def get_current_active_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None: raise HTTPException(status_code=401)
    except JWTError:
        raise HTTPException(status_code=401)
    user = db.query(User).filter(User.email == email).first()
    if not user: raise HTTPException(status_code=401)
    return user

# --- HEALTH CHECK ---
@app.get("/")
def read_root():
    return {"message": "BTechBuddy Backend is awake and running smoothly!"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

# --- AUTH & PASSWORD RESET ---
@app.post("/auth/signup")
def signup(email: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    otp_code = str(random.randint(100000, 999999))
    if user:
        if user.is_verified: raise HTTPException(status_code=400, detail="Already registered")
        user.hashed_password = hash_password(password)
        user.otp = otp_code
    else:
        is_admin_user = True if (ADMIN_EMAIL and email == ADMIN_EMAIL) else False
        new_user = User(email=email, hashed_password=hash_password(password), is_verified=False, otp=otp_code, is_admin=is_admin_user)
        db.add(new_user)
    db.commit()
    send_otp_email(email, otp_code)
    return {"message": "OTP sent"}

@app.post("/auth/verify-otp")
def verify_otp(email: str = Form(...), otp: str = Form(...), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    if not user or user.otp != otp: raise HTTPException(status_code=400, detail="Invalid OTP")
    user.is_verified = True
    user.otp = None
    db.commit()
    return {"message": "Verified"}

@app.post("/auth/login")
def login(email: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.hashed_password) or not user.is_verified:
        raise HTTPException(status_code=400, detail="Invalid credentials or unverified email")
    return {"access_token": create_access_token(data={"sub": user.email, "is_admin": user.is_admin}), "token_type": "bearer", "is_admin": user.is_admin}

@app.post("/auth/forgot-password")
def forgot_password(email: str = Form(...), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    if not user: raise HTTPException(status_code=404, detail="Email not found")
    reset_code = str(random.randint(100000, 999999))
    user.reset_otp = reset_code
    db.commit()
    send_otp_email(email, reset_code)
    return {"message": "Password reset OTP sent to email"}

@app.post("/auth/reset-password")
def reset_password(email: str = Form(...), otp: str = Form(...), new_password: str = Form(...), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    if not user or user.reset_otp != otp: raise HTTPException(status_code=400, detail="Invalid OTP")
    user.hashed_password = hash_password(new_password)
    user.reset_otp = None
    db.commit()
    return {"message": "Password reset successfully!"}

# --- ADMIN USER MANAGEMENT ---
@app.get("/admin/users")
def get_all_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    if not current_user.is_admin: raise HTTPException(status_code=403)
    return db.query(User).all()

@app.delete("/admin/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    if not current_user.is_admin: raise HTTPException(status_code=403)
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        if ADMIN_EMAIL and user.email == ADMIN_EMAIL: raise HTTPException(status_code=400, detail="Cannot delete main admin")
        db.delete(user)
        db.commit()
    return {"message": "User deleted"}

# --- STATS ---
@app.get("/admin/stats")
def get_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    if not current_user.is_admin: raise HTTPException(status_code=403)
    return {"total_users": db.query(User).count(), "total_subjects": db.query(Subject).count(), "total_videos": db.query(VideoLecture).count(), "total_notes": db.query(Note).count()}

# --- SUBJECTS ---
@app.get("/subjects/")
def get_subjects(db: Session = Depends(get_db)):
    return db.query(Subject).all()

class SubjectCreate(BaseModel):
    name: str
    semester: int
    branch: str

@app.post("/subjects/")
def add_subject(sub: SubjectCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    if not current_user.is_admin: raise HTTPException(status_code=403)
    new_sub = Subject(name=sub.name, semester=sub.semester, branch=sub.branch)
    db.add(new_sub)
    db.commit()
    return {"message": "Subject added"}

@app.delete("/subjects/{id}")
def delete_subject(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    if not current_user.is_admin: raise HTTPException(status_code=403)
    sub = db.query(Subject).filter(Subject.id == id).first()
    if sub: db.delete(sub); db.commit()
    return {"message": "Deleted"}

# --- VIDEOS & NOTES ---
@app.get("/subjects/{id}/videos")
def get_videos(id: int, db: Session = Depends(get_db)):
    return db.query(VideoLecture).filter(VideoLecture.subject_id == id).all()

@app.post("/subjects/{id}/videos")
def add_video(id: int, title: str = Form(...), youtube_url: str = Form(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    if not current_user.is_admin: raise HTTPException(status_code=403)
    db.add(VideoLecture(subject_id=id, title=title, youtube_url=youtube_url))
    db.commit()
    return {"message": "Video added"}

@app.delete("/videos/{id}")
def delete_video(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    if not current_user.is_admin: raise HTTPException(status_code=403)
    vid = db.query(VideoLecture).filter(VideoLecture.id == id).first()
    if vid: db.delete(vid); db.commit()
    return {"message": "Deleted"}

@app.get("/subjects/{id}/notes")
def get_notes(id: int, db: Session = Depends(get_db)):
    return db.query(Note).filter(Note.subject_id == id).all()

@app.post("/subjects/{id}/notes")
def add_note(id: int, title: str = Form(...), file: UploadFile = File(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    if not current_user.is_admin: raise HTTPException(status_code=403)
    path = UPLOAD_DIR / file.filename
    with open(path, "wb") as buffer: shutil.copyfileobj(file.file, buffer)
    db.add(Note(subject_id=id, title=title, file_path=f"http://localhost:8000/uploads/{file.filename}"))
    db.commit()
    return {"message": "Note uploaded"}

@app.delete("/notes/{id}")
def delete_note(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    if not current_user.is_admin: raise HTTPException(status_code=403)
    note = db.query(Note).filter(Note.id == id).first()
    if note: db.delete(note); db.commit()
    return {"message": "Deleted"}

# --- NOTICES ---
@app.get("/notices/")
def get_notices(db: Session = Depends(get_db)):
    return db.query(Notice).order_by(Notice.created_at.desc()).all()

@app.post("/notices/")
def add_notice(title: str = Form(...), content: str = Form(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    if not current_user.is_admin: raise HTTPException(status_code=403)
    db.add(Notice(title=title, content=content))
    db.commit()
    return {"message": "Notice posted"}

@app.delete("/notices/{id}")
def delete_notice(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    if not current_user.is_admin: raise HTTPException(status_code=403)
    n = db.query(Notice).filter(Notice.id == id).first()
    if n: db.delete(n); db.commit()
    return {"message": "Deleted"}

# --- SUGGESTIONS / FEEDBACK ---
@app.get("/suggestions/")
def get_suggestions(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    if not current_user.is_admin: raise HTTPException(status_code=403)
    return db.query(Suggestion).order_by(Suggestion.created_at.desc()).all()

@app.post("/suggestions/")
def add_suggestion(message: str = Form(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    db.add(Suggestion(user_email=current_user.email, message=message))
    db.commit()
    return {"message": "Suggestion submitted successfully!"}

@app.delete("/suggestions/{id}")
def delete_suggestion(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    if not current_user.is_admin: raise HTTPException(status_code=403)
    suggestion = db.query(Suggestion).filter(Suggestion.id == id).first()
    if suggestion:
        db.delete(suggestion)
        db.commit()
    return {"message": "Feedback deleted successfully"}