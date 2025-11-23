#!/usr/bin/env python3
"""
Command Filters - Filtering utilities for command result sets

This module provides filter classes and utilities for filtering
database query results based on command arguments.
"""

from typing import List, Dict, Any, Callable, Optional
from datetime import datetime, timedelta


class BaseFilter:
    """Base class for filters"""

    def apply(self, item: Dict[str, Any]) -> bool:
        """Apply filter to an item

        Args:
            item: Item dictionary to filter

        Returns:
            True if item passes filter
        """
        raise NotImplementedError


class DateFilter(BaseFilter):
    """Filter items by date range"""

    def __init__(
        self,
        date_field: str,
        from_date: Optional[datetime] = None,
        to_date: Optional[datetime] = None,
        last_days: Optional[int] = None
    ):
        """Initialize date filter

        Args:
            date_field: Name of the date field to filter on
            from_date: Start date
            to_date: End date
            last_days: Filter to last N days
        """
        self.date_field = date_field
        self.from_date = from_date
        self.to_date = to_date

        if last_days:
            self.from_date = datetime.now() - timedelta(days=last_days)

    def apply(self, item: Dict[str, Any]) -> bool:
        """Apply date filter"""
        if self.date_field not in item:
            return True

        item_date = item[self.date_field]
        if isinstance(item_date, str):
            try:
                item_date = datetime.fromisoformat(item_date)
            except ValueError:
                return True

        if self.from_date and item_date < self.from_date:
            return False
        if self.to_date and item_date > self.to_date:
            return False

        return True


class ScoreFilter(BaseFilter):
    """Filter items by score range"""

    def __init__(
        self,
        score_field: str,
        min_score: Optional[float] = None,
        max_score: Optional[float] = None
    ):
        """Initialize score filter

        Args:
            score_field: Name of the score field
            min_score: Minimum score
            max_score: Maximum score
        """
        self.score_field = score_field
        self.min_score = min_score
        self.max_score = max_score

    def apply(self, item: Dict[str, Any]) -> bool:
        """Apply score filter"""
        if self.score_field not in item:
            return True

        score = item[self.score_field]
        if score is None:
            return True

        if self.min_score is not None and score < self.min_score:
            return False
        if self.max_score is not None and score > self.max_score:
            return False

        return True


class StatusFilter(BaseFilter):
    """Filter items by status"""

    def __init__(self, status_field: str, status: str):
        """Initialize status filter

        Args:
            status_field: Name of the status field
            status: Status value to filter for
        """
        self.status_field = status_field
        self.status = status

    def apply(self, item: Dict[str, Any]) -> bool:
        """Apply status filter"""
        if self.status_field not in item:
            return True
        return item[self.status_field] == self.status


class FieldFilter(BaseFilter):
    """Generic filter for any field"""

    def __init__(self, field: str, value: Any):
        """Initialize field filter

        Args:
            field: Field name
            value: Value to match
        """
        self.field = field
        self.value = value

    def apply(self, item: Dict[str, Any]) -> bool:
        """Apply field filter"""
        if self.field not in item:
            return True
        return item[self.field] == self.value


class FilterBuilder:
    """Builder for combining multiple filters"""

    def __init__(self):
        """Initialize filter builder"""
        self.filters: List[BaseFilter] = []

    def add_filter(self, filter_obj: BaseFilter) -> 'FilterBuilder':
        """Add a filter to the builder

        Args:
            filter_obj: Filter to add

        Returns:
            Self for chaining
        """
        self.filters.append(filter_obj)
        return self

    def add_date_filter(
        self,
        date_field: str,
        from_date: Optional[datetime] = None,
        to_date: Optional[datetime] = None,
        last_days: Optional[int] = None
    ) -> 'FilterBuilder':
        """Add date filter

        Args:
            date_field: Date field name
            from_date: Start date
            to_date: End date
            last_days: Last N days

        Returns:
            Self for chaining
        """
        self.filters.append(DateFilter(date_field, from_date, to_date, last_days))
        return self

    def add_score_filter(
        self,
        score_field: str,
        min_score: Optional[float] = None,
        max_score: Optional[float] = None
    ) -> 'FilterBuilder':
        """Add score filter

        Args:
            score_field: Score field name
            min_score: Minimum score
            max_score: Maximum score

        Returns:
            Self for chaining
        """
        self.filters.append(ScoreFilter(score_field, min_score, max_score))
        return self

    def add_status_filter(self, status_field: str, status: str) -> 'FilterBuilder':
        """Add status filter

        Args:
            status_field: Status field name
            status: Status value

        Returns:
            Self for chaining
        """
        self.filters.append(StatusFilter(status_field, status))
        return self

    def add_field_filter(self, field: str, value: Any) -> 'FilterBuilder':
        """Add field filter

        Args:
            field: Field name
            value: Value to match

        Returns:
            Self for chaining
        """
        self.filters.append(FieldFilter(field, value))
        return self

    def apply(self, items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Apply all filters to items list

        Args:
            items: List of items to filter

        Returns:
            Filtered list of items
        """
        if not self.filters:
            return items

        filtered = items
        for filter_obj in self.filters:
            filtered = [item for item in filtered if filter_obj.apply(item)]

        return filtered


def apply_filters(
    items: List[Dict[str, Any]],
    filters: List[BaseFilter]
) -> List[Dict[str, Any]]:
    """Apply multiple filters to a list of items

    Args:
        items: List of items to filter
        filters: List of filters to apply

    Returns:
        Filtered list of items
    """
    if not filters:
        return items

    filtered = items
    for filter_obj in filters:
        filtered = [item for item in filtered if filter_obj.apply(item)]

    return filtered
