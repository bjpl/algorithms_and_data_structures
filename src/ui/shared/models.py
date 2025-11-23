#!/usr/bin/env python3
"""
Shared UI Models - Common dataclasses and enums for UI components

This module consolidates common models used across interactive sessions,
formatters, and other UI components to eliminate duplication.
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import List
from datetime import datetime


class LearningMode(Enum):
    """Learning mode options for interactive sessions"""
    LESSON = "lesson"
    PRACTICE = "practice"
    QUIZ = "quiz"
    NOTES = "notes"
    REVIEW = "review"


class NoteImportance(Enum):
    """Note importance levels (1-5 scale)"""
    MINIMAL = 1
    LOW = 2
    MEDIUM = 3
    HIGH = 4
    CRITICAL = 5


@dataclass
class LessonNote:
    """Individual note taken during a lesson

    Attributes:
        timestamp: When the note was created (ISO format)
        topic: Topic or section the note relates to
        content: The note content
        tags: Optional tags for categorization
        importance: Importance level (1-5 scale)
    """
    timestamp: str
    topic: str
    content: str
    tags: List[str] = field(default_factory=list)
    importance: int = 1  # 1-5 scale

    def __post_init__(self):
        """Validate importance range"""
        if not 1 <= self.importance <= 5:
            raise ValueError(f"Importance must be 1-5, got {self.importance}")


@dataclass
class SessionProgress:
    """Enhanced session progress tracking

    Tracks comprehensive metrics about a learning session including:
    - Completion metrics (lessons, problems solved)
    - Learning outcomes (concepts learned, topics studied)
    - Engagement metrics (notes taken, quiz scores)
    - Time tracking (session duration)
    - Gamification (achievements, streaks)

    Attributes:
        lessons_completed: Number of lessons completed
        concepts_learned: List of concepts learned
        notes_taken: Number of notes taken
        quiz_score: Average quiz score (0.0-100.0)
        time_spent_minutes: Total time spent in minutes
        achievements: List of achievements earned
        topics_studied: List of topics studied
        practice_problems_solved: Number of practice problems solved
        streak_days: Current learning streak in days
    """
    lessons_completed: int = 0
    concepts_learned: List[str] = field(default_factory=list)
    notes_taken: int = 0
    quiz_score: float = 0.0
    time_spent_minutes: float = 0.0
    achievements: List[str] = field(default_factory=list)
    topics_studied: List[str] = field(default_factory=list)
    practice_problems_solved: int = 0
    streak_days: int = 0

    def __post_init__(self):
        """Validate progress data"""
        if self.quiz_score < 0 or self.quiz_score > 100:
            raise ValueError(f"Quiz score must be 0-100, got {self.quiz_score}")
        if self.lessons_completed < 0:
            raise ValueError("Lessons completed cannot be negative")
        if self.notes_taken < 0:
            raise ValueError("Notes taken cannot be negative")
        if self.time_spent_minutes < 0:
            raise ValueError("Time spent cannot be negative")
        if self.practice_problems_solved < 0:
            raise ValueError("Practice problems solved cannot be negative")
        if self.streak_days < 0:
            raise ValueError("Streak days cannot be negative")

    def add_concept(self, concept: str) -> None:
        """Add a learned concept (avoid duplicates)"""
        if concept and concept not in self.concepts_learned:
            self.concepts_learned.append(concept)

    def add_topic(self, topic: str) -> None:
        """Add a studied topic (avoid duplicates)"""
        if topic and topic not in self.topics_studied:
            self.topics_studied.append(topic)

    def add_achievement(self, achievement: str) -> None:
        """Add an achievement (avoid duplicates)"""
        if achievement and achievement not in self.achievements:
            self.achievements.append(achievement)

    def get_completion_rate(self) -> float:
        """Calculate overall completion rate as percentage"""
        total_items = (
            self.lessons_completed +
            len(self.concepts_learned) +
            self.practice_problems_solved
        )
        if total_items == 0:
            return 0.0
        # Simple completion metric based on activity
        return min(100.0, (total_items / 10.0) * 100)

    def get_engagement_score(self) -> float:
        """Calculate engagement score based on multiple factors"""
        # Weighted scoring: notes (30%), quiz (40%), problems (30%)
        note_score = min(30.0, (self.notes_taken / 10.0) * 30)
        quiz_contribution = (self.quiz_score / 100.0) * 40
        problem_score = min(30.0, (self.practice_problems_solved / 10.0) * 30)

        return note_score + quiz_contribution + problem_score
