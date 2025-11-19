#!/usr/bin/env python3
"""
Enhanced Interactive Learning System - Refactored Entry Point

This module provides the main entry point for the enhanced learning experience.
All session logic has been extracted into modular components in the session/ package.
"""

import os
import sys
import asyncio
from typing import Optional
from datetime import datetime
from pathlib import Path

from .formatter_compat import TerminalFormatter
from .unified_formatter import Theme, Color
from .navigation import NavigationController, MenuItem, QuizNavigation, ProgressVisualization, NavigationMode
from .notes import NotesManager

# Import session components
from .session import (
    BaseSession,
    SessionState,
    LearningSession,
    QuizSession,
    NotesSession
)
from .session.state import LearningMode


class EnhancedInteractiveSession:
    """Enhanced interactive learning session - Main coordinator"""

    def __init__(self, cli_engine=None):
        """Initialize enhanced interactive session"""
        # Core components
        self.formatter = TerminalFormatter()
        self.cli_engine = cli_engine

        # Session state
        self.state = SessionState()

        # Paths
        self.data_dir = Path("data")
        self.notes_dir = self.data_dir / "notes"
        self.data_dir.mkdir(exist_ok=True)
        self.notes_dir.mkdir(exist_ok=True)

        # Theme
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

        # Components
        self.navigation = NavigationController(self.formatter)
        self.notes_manager = NotesManager(self.formatter, str(self.notes_dir))
        self.quiz_nav = QuizNavigation(self.formatter)
        self.progress_viz = ProgressVisualization(self.formatter)

        # Performance settings
        self.state.performance_mode = True
        self.state.typing_speed = 0.02 if os.name == 'nt' else 0.03
        self.state.transition_speed = 0.8 if os.name == 'nt' else 1.0

        # Session modes
        self.learning_session = LearningSession(cli_engine, self.formatter, self.navigation, self.notes_manager)
        self.quiz_session = QuizSession(cli_engine, self.formatter, self.quiz_nav)
        self.notes_session = NotesSession(cli_engine, self.formatter, self.navigation, self.notes_manager)

        # Sync state references
        self.learning_session.state = self.state
        self.quiz_session.state = self.state
        self.notes_session.state = self.state

    async def run(self):
        """Main enhanced session loop"""
        await self.show_welcome()

        while True:
            try:
                choice = await self.show_main_menu()

                if choice == "1":
                    await self.learning_session.run()
                elif choice == "2":
                    await self.show_practice_mode()
                elif choice == "3":
                    await self.quiz_session.run()
                elif choice == "4":
                    await self.notes_session.run()
                elif choice == "5":
                    await self.show_progress()
                elif choice == "6":
                    await self.show_export()
                elif choice == "7":
                    await self.show_settings()
                elif choice.lower() in ["q", "quit", "exit"]:
                    await self.end_session()
                    break
                else:
                    await self.formatter.type_text("Invalid choice. Please try again.", speed=0.04)
                    await asyncio.sleep(1)

            except KeyboardInterrupt:
                await self.formatter.type_text("\n🔄 Session interrupted. Saving progress...", speed=0.04)
                break
            except EOFError:
                break
            except Exception as e:
                self.formatter.error(f"An unexpected error occurred: {e}")
                if "EOF" in str(e):
                    break
                await asyncio.sleep(1)

    async def show_welcome(self):
        """Show welcome screen"""
        self.clear_screen()

        title_lines = [
            "╔══════════════════════════════════════════════════════════════════╗",
            "║                    🎓 ALGORITHMS PROFESSOR 🎓                   ║",
            "║                Enhanced Interactive Learning Environment         ║",
            "╚══════════════════════════════════════════════════════════════════╝"
        ]

        for line in title_lines:
            await self.formatter.type_text(line, speed=0.01)
            await asyncio.sleep(0.1)

        input(self.formatter._colorize("\n⚡ Press Enter to launch...", Color.BRIGHT_CYAN, Color.BOLD))

    async def show_main_menu(self) -> str:
        """Show main menu"""
        self.formatter.transition_effect("slide") if hasattr(self.formatter, 'transition_effect') else None
        self.clear_screen()

        overall_progress = self.state.calculate_overall_progress(
            self.cli_engine,
            len(self.notes_manager.notes)
        )

        await self.progress_viz.show_live_progress(100, int(overall_progress), "🎓 Learning Progress")

        menu_items = [
            MenuItem("1", "📚", "Interactive Lessons", "Start lessons with note-taking", color=Color.BRIGHT_GREEN),
            MenuItem("2", "💪", "Practice Problems", "Solve coding challenges", color=Color.BRIGHT_YELLOW),
            MenuItem("3", "🧠", "Visual Quizzes", "Test knowledge with feedback", color=Color.BRIGHT_MAGENTA),
            MenuItem("4", "📝", "Rich Notes", "Create and organize notes", color=Color.BRIGHT_CYAN),
            MenuItem("5", "📊", "Progress Dashboard", "View statistics", color=Color.BRIGHT_BLUE),
            MenuItem("6", "💾", "Export & Backup", "Save and export data", color=Color.BRIGHT_WHITE),
            MenuItem("7", "⚙️", "Settings", "Customize experience", color=Color.BRIGHT_BLACK),
            MenuItem("Q", "🚪", "Exit", "Save and exit", color=Color.BRIGHT_RED)
        ]

        _, choice = await self.navigation.show_menu("🎓 ALGORITHMS PROFESSOR", menu_items, mode=NavigationMode.HYBRID)
        return choice

    async def show_practice_mode(self):
        """Show practice mode (placeholder)"""
        await self.formatter.type_text("💪 Practice mode coming soon!", speed=0.04)
        input("\nPress Enter to continue...")

    async def show_progress(self):
        """Show progress dashboard (placeholder)"""
        await self.formatter.type_text("📊 Progress dashboard coming soon!", speed=0.04)
        input("\nPress Enter to continue...")

    async def show_export(self):
        """Show export options (placeholder)"""
        await self.formatter.type_text("💾 Export functionality coming soon!", speed=0.04)
        input("\nPress Enter to continue...")

    async def show_settings(self):
        """Show settings (placeholder)"""
        await self.formatter.type_text("⚙️ Settings coming soon!", speed=0.04)
        input("\nPress Enter to continue...")

    async def end_session(self):
        """End session and save"""
        await self.formatter.type_text("💾 Saving your progress...", speed=0.04)
        await self.learning_session.save_state()
        await self.formatter.type_text("✅ Progress saved. Thank you for learning!", speed=0.05)

    def clear_screen(self):
        """Clear screen"""
        try:
            if os.name == 'nt':
                print('\033[2J\033[H', end='')
                sys.stdout.flush()
            else:
                print('\033[2J\033[H', end='')
                sys.stdout.flush()
        except:
            print('\n' * 3)


# Entry point
def main():
    """Main entry point"""
    session = EnhancedInteractiveSession()
    asyncio.run(session.run())


if __name__ == "__main__":
    main()
