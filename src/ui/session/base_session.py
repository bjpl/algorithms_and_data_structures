#!/usr/bin/env python3
"""
Base Session Management

Provides abstract base class for all interactive session types.
"""

import asyncio
import json
from abc import ABC, abstractmethod
from typing import Optional, Any
from datetime import datetime
from pathlib import Path
from dataclasses import asdict

from .state import SessionState, LearningMode
from ..formatter_compat import TerminalFormatter
from ..unified_formatter import Theme, Color


class BaseSession(ABC):
    """Base class for all interactive sessions"""

    def __init__(self, cli_engine=None, formatter: Optional[TerminalFormatter] = None):
        """Initialize base session"""
        self.formatter = formatter or TerminalFormatter()
        self.cli_engine = cli_engine
        self.state = SessionState()

        # Set up theme
        self.theme = Theme(
            primary=Color.BRIGHT_CYAN,
            secondary=Color.BRIGHT_MAGENTA,
            success=Color.BRIGHT_GREEN,
            warning=Color.BRIGHT_YELLOW,
            error=Color.BRIGHT_RED,
            info=Color.BRIGHT_BLUE,
            muted=Color.BRIGHT_BLACK,
            text=Color.WHITE
        )
        self.formatter.theme = self.theme

        # Data persistence paths
        self.data_dir = Path("data")
        self.data_dir.mkdir(exist_ok=True)

    @abstractmethod
    async def run(self):
        """Main session loop - must be implemented by subclasses"""
        pass

    @abstractmethod
    async def handle_input(self, user_input: str) -> bool:
        """Handle user input - returns True if should continue, False to exit"""
        pass

    def clear_screen(self):
        """Clear screen with performance optimization"""
        import sys
        import os
        try:
            if self.state.performance_mode and os.name == 'nt':
                print('\033[2J\033[H', end='')
                sys.stdout.flush()
            else:
                print('\033[2J\033[H', end='')
                sys.stdout.flush()
        except:
            print('\n' * 3)

    async def save_state(self):
        """Save session state to disk"""
        try:
            state_file = self.data_dir / "session_state.json"
            state_data = {
                'progress': asdict(self.state.progress),
                'current_topic': self.state.current_topic,
                'mode': self.state.mode.value,
                'settings': {
                    'performance_mode': self.state.performance_mode,
                    'typing_speed': self.state.typing_speed,
                    'transition_speed': self.state.transition_speed
                }
            }

            with open(state_file, 'w', encoding='utf-8') as f:
                json.dump(state_data, f, indent=2, default=str)

        except Exception as e:
            self.formatter.error(f"Error saving session state: {e}")

    async def restore_state(self):
        """Restore session state from disk"""
        try:
            state_file = self.data_dir / "session_state.json"
            if not state_file.exists():
                return

            with open(state_file, 'r', encoding='utf-8') as f:
                state_data = json.load(f)

            # Restore progress
            for key, value in state_data.get('progress', {}).items():
                if hasattr(self.state.progress, key):
                    setattr(self.state.progress, key, value)

            # Restore other state
            self.state.current_topic = state_data.get('current_topic', '')
            mode_value = state_data.get('mode', 'lesson')
            self.state.mode = LearningMode(mode_value)

            # Restore settings
            settings = state_data.get('settings', {})
            self.state.performance_mode = settings.get('performance_mode', True)
            self.state.typing_speed = settings.get('typing_speed', 0.02)
            self.state.transition_speed = settings.get('transition_speed', 0.8)

        except Exception as e:
            self.formatter.error(f"Error restoring session state: {e}")

    def get_performance_level(self, percentage: float) -> str:
        """Get performance level description with emoji"""
        if percentage >= 90:
            return "🌟 Outstanding (Master Level)"
        elif percentage >= 80:
            return "🔥 Excellent (Expert Level)"
        elif percentage >= 70:
            return "👍 Good (Proficient Level)"
        elif percentage >= 60:
            return "📚 Fair (Learning Level)"
        else:
            return "💪 Needs Practice (Beginner Level)"

    async def show_transition(self, effect="slide"):
        """Show transition effect"""
        if hasattr(self.formatter, 'transition_effect'):
            self.formatter.transition_effect(effect)
        else:
            await asyncio.sleep(0.2)
