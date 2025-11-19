#!/usr/bin/env python3
"""
Command Input Validators - Validation functions for command arguments

This module provides validation functions used across multiple command modules
to ensure input data meets requirements before processing.
"""

from datetime import datetime
from typing import Optional, Any
from ...core.exceptions import CLIError


def validate_id(value: Any, field_name: str = "ID") -> int:
    """Validate and convert ID value

    Args:
        value: Value to validate
        field_name: Name of the field for error messages

    Returns:
        Validated integer ID

    Raises:
        CLIError: If validation fails
    """
    try:
        id_val = int(value)
        if id_val <= 0:
            raise CLIError(f"{field_name} must be positive, got {id_val}")
        return id_val
    except (ValueError, TypeError):
        raise CLIError(f"Invalid {field_name}: {value}. Must be a positive integer.")


def validate_date(date_str: str, field_name: str = "date") -> datetime:
    """Validate and parse date string

    Args:
        date_str: Date string in YYYY-MM-DD format
        field_name: Name of the field for error messages

    Returns:
        Parsed datetime object

    Raises:
        CLIError: If validation fails
    """
    try:
        return datetime.strptime(date_str, "%Y-%m-%d")
    except ValueError:
        raise CLIError(
            f"Invalid {field_name}: {date_str}. "
            "Expected format: YYYY-MM-DD (e.g., 2024-01-31)"
        )


def validate_score(score: float, min_val: float = 0.0, max_val: float = 100.0) -> float:
    """Validate score is within valid range

    Args:
        score: Score value to validate
        min_val: Minimum valid score
        max_val: Maximum valid score

    Returns:
        Validated score

    Raises:
        CLIError: If validation fails
    """
    try:
        score_val = float(score)
        if not min_val <= score_val <= max_val:
            raise CLIError(
                f"Score must be between {min_val} and {max_val}, got {score_val}"
            )
        return score_val
    except (ValueError, TypeError):
        raise CLIError(f"Invalid score: {score}. Must be a number.")


def validate_difficulty(difficulty: str) -> str:
    """Validate difficulty level

    Args:
        difficulty: Difficulty string to validate

    Returns:
        Validated difficulty

    Raises:
        CLIError: If validation fails
    """
    valid_difficulties = ['beginner', 'intermediate', 'advanced', 'expert']
    if difficulty.lower() not in valid_difficulties:
        raise CLIError(
            f"Invalid difficulty: {difficulty}. "
            f"Valid options: {', '.join(valid_difficulties)}"
        )
    return difficulty.lower()


def validate_content_type(content_type: str) -> str:
    """Validate content type

    Args:
        content_type: Content type string to validate

    Returns:
        Validated content type

    Raises:
        CLIError: If validation fails
    """
    valid_types = ['lesson', 'exercise', 'assessment', 'quiz', 'tutorial', 'reference']
    if content_type.lower() not in valid_types:
        raise CLIError(
            f"Invalid content type: {content_type}. "
            f"Valid options: {', '.join(valid_types)}"
        )
    return content_type.lower()


def validate_status(status: str) -> str:
    """Validate status value

    Args:
        status: Status string to validate

    Returns:
        Validated status

    Raises:
        CLIError: If validation fails
    """
    valid_statuses = ['not_started', 'in_progress', 'completed', 'failed', 'archived']
    if status.lower() not in valid_statuses:
        raise CLIError(
            f"Invalid status: {status}. "
            f"Valid options: {', '.join(valid_statuses)}"
        )
    return status.lower()


class DateRangeValidator:
    """Validator for date ranges"""

    def __init__(self, from_date: Optional[str] = None, to_date: Optional[str] = None):
        """Initialize date range validator

        Args:
            from_date: Start date string (YYYY-MM-DD)
            to_date: End date string (YYYY-MM-DD)
        """
        self.from_date = validate_date(from_date, "from_date") if from_date else None
        self.to_date = validate_date(to_date, "to_date") if to_date else None

        if self.from_date and self.to_date and self.from_date > self.to_date:
            raise CLIError("from_date must be before to_date")

    def is_in_range(self, date: datetime) -> bool:
        """Check if date is within range

        Args:
            date: Date to check

        Returns:
            True if date is within range
        """
        if self.from_date and date < self.from_date:
            return False
        if self.to_date and date > self.to_date:
            return False
        return True


class ScoreRangeValidator:
    """Validator for score ranges"""

    def __init__(
        self,
        min_score: Optional[float] = None,
        max_score: Optional[float] = None
    ):
        """Initialize score range validator

        Args:
            min_score: Minimum score
            max_score: Maximum score
        """
        self.min_score = validate_score(min_score) if min_score is not None else None
        self.max_score = validate_score(max_score) if max_score is not None else None

        if (
            self.min_score is not None and
            self.max_score is not None and
            self.min_score > self.max_score
        ):
            raise CLIError("min_score must be less than or equal to max_score")

    def is_in_range(self, score: float) -> bool:
        """Check if score is within range

        Args:
            score: Score to check

        Returns:
            True if score is within range
        """
        if self.min_score is not None and score < self.min_score:
            return False
        if self.max_score is not None and score > self.max_score:
            return False
        return True
