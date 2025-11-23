#!/usr/bin/env python3
"""
Session State Management

Tracks session progress, achievements, and learning metrics.
"""

from dataclasses import dataclass, field
from typing import List
from enum import Enum


class LearningMode(Enum):
    """Learning mode options"""
    LESSON = "lesson"
    PRACTICE = "practice"
    QUIZ = "quiz"
    NOTES = "notes"
    REVIEW = "review"


@dataclass
class SessionProgress:
    """Enhanced session progress tracking"""
    lessons_completed: int = 0
    concepts_learned: List[str] = field(default_factory=list)
    notes_taken: int = 0
    quiz_score: float = 0.0
    time_spent_minutes: float = 0.0
    achievements: List[str] = field(default_factory=list)
    topics_studied: List[str] = field(default_factory=list)
    practice_problems_solved: int = 0
    streak_days: int = 0


@dataclass
class SessionState:
    """Session state data"""

    def __init__(self):
        from datetime import datetime
        self.start_time = datetime.now()
        self.current_topic = ""
        self.mode = LearningMode.LESSON
        self.progress = SessionProgress()
        self.performance_mode = True
        self.typing_speed = 0.02
        self.transition_speed = 0.8

    def update_session_time(self):
        """Update total time spent"""
        from datetime import datetime
        session_time = (datetime.now() - self.start_time).seconds / 60
        self.progress.time_spent_minutes += session_time

    def calculate_overall_progress(self, cli_engine=None, total_notes=0) -> float:
        """Calculate comprehensive learning progress"""
        factors = []

        # Lesson progress (max 30%)
        if cli_engine and hasattr(cli_engine, 'curriculum'):
            total_topics = len(cli_engine.curriculum.topics)
            lesson_progress = min((self.progress.lessons_completed / total_topics) * 30, 30)
            factors.append(lesson_progress)
        else:
            factors.append(min(self.progress.lessons_completed * 5, 30))

        # Notes progress (max 25%)
        notes_progress = min((total_notes / 20) * 25, 25)
        factors.append(notes_progress)

        # Quiz performance (max 25%)
        quiz_progress = (self.progress.quiz_score / 100) * 25
        factors.append(quiz_progress)

        # Practice progress (max 20%)
        practice_progress = min((self.progress.practice_problems_solved / 10) * 20, 20)
        factors.append(practice_progress)

        return sum(factors)

    def calculate_productivity_score(self, total_notes=0) -> float:
        """Calculate productivity score based on time efficiency"""
        if self.progress.time_spent_minutes == 0:
            return 0

        # Factor in notes per minute, lessons per minute
        notes_per_min = total_notes / self.progress.time_spent_minutes
        lessons_per_min = self.progress.lessons_completed / self.progress.time_spent_minutes

        # Normalize to percentage (arbitrary scaling)
        productivity = min((notes_per_min * 100 + lessons_per_min * 50) * 10, 100)
        return productivity
