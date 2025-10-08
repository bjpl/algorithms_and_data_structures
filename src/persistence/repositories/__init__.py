"""
Repository Layer

Provides data access objects following the Repository pattern.
"""

from .base import BaseRepository
from .curriculum_repo import CurriculumRepository
from .content_repo import ContentRepository
from .progress_repo import UserProgressRepository

# Backward compatibility alias
ProgressRepository = UserProgressRepository

__all__ = [
    'BaseRepository',
    'CurriculumRepository',
    'ContentRepository',
    'UserProgressRepository',
    'ProgressRepository'
]