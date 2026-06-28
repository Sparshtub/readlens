from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from datetime import date, timedelta
from typing import List, Dict
from backend.app.db import models
from backend.app.api.deps import get_current_active_user
from backend.app.db.session import get_db

router = APIRouter()

class HeartbeatRequest(BaseModel):
    seconds: int = 15  # Default increment

class DailyLogItem(BaseModel):
    date: str
    seconds: int

class AnalyticsDashboard(BaseModel):
    streak_days: int
    total_highlights: int
    total_documents: int
    total_reading_time_seconds: int
    daily_logs: List[DailyLogItem]

@router.post("/heartbeat")
def record_heartbeat(
    request: HeartbeatRequest,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    today = date.today()
    
    # Check if entry already exists for today
    analytics_entry = db.query(models.ReadingAnalytics).filter(
        models.ReadingAnalytics.user_id == current_user.id,
        models.ReadingAnalytics.date == today
    ).first()
    
    if analytics_entry:
        analytics_entry.reading_time_seconds += request.seconds
    else:
        analytics_entry = models.ReadingAnalytics(
            user_id=current_user.id,
            date=today,
            reading_time_seconds=request.seconds
        )
        db.add(analytics_entry)
        
    db.commit()
    return {"message": "Heartbeat recorded successfully", "current_seconds_today": analytics_entry.reading_time_seconds}

@router.get("/", response_model=AnalyticsDashboard)
def get_analytics(
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Total Highlights Count
    total_hl = db.query(models.Highlight).filter(models.Highlight.user_id == current_user.id).count()
    
    # Total Documents Count
    total_doc = db.query(models.Document).filter(models.Document.user_id == current_user.id).count()
    
    # Total Reading Time
    total_seconds = db.query(func.sum(models.ReadingAnalytics.reading_time_seconds)).filter(
        models.ReadingAnalytics.user_id == current_user.id
    ).scalar() or 0
    
    # Fetch all dates with reading time to calculate streak
    reading_days = db.query(models.ReadingAnalytics.date).filter(
        models.ReadingAnalytics.user_id == current_user.id,
        models.ReadingAnalytics.reading_time_seconds > 0
    ).order_by(models.ReadingAnalytics.date.desc()).all()
    
    # Convert tuples to set of dates
    reading_dates = {row[0] for row in reading_days}
    
    # Calculate streak
    streak = 0
    check_date = date.today()
    
    # If they didn't read today, check starting from yesterday
    if check_date not in reading_dates:
        check_date = check_date - timedelta(days=1)
        
    while check_date in reading_dates:
        streak += 1
        check_date = check_date - timedelta(days=1)
        
    # Compile last 7 days of logs for chart rendering
    daily_logs = []
    for i in range(6, -1, -1):
        target_date = date.today() - timedelta(days=i)
        
        # Get duration for that date
        duration = db.query(models.ReadingAnalytics.reading_time_seconds).filter(
            models.ReadingAnalytics.user_id == current_user.id,
            models.ReadingAnalytics.date == target_date
        ).scalar() or 0
        
        # Format date as Mon, Tue, etc.
        day_str = target_date.strftime("%a")
        
        daily_logs.append(DailyLogItem(
            date=day_str,
            seconds=duration
        ))
        
    return AnalyticsDashboard(
        streak_days=streak,
        total_highlights=total_hl,
        total_documents=total_doc,
        total_reading_time_seconds=total_seconds,
        daily_logs=daily_logs
    )
