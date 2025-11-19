#!/usr/bin/env python3
"""
Interactive Learning Session - Refactored to use session components

This module now uses the modular session components from ui/session/ package.
"""

import asyncio
from .session import LearningSession, QuizSession, NotesSession
from .formatter_compat import TerminalFormatter
from .navigation import NavigationController, QuizNavigation, ProgressVisualization
from .notes import NotesManager
from pathlib import Path


class InteractiveSession:
    """Interactive learning session - refactored to use modular components"""

    def __init__(self, cli_engine=None):
        """Initialize with modular session components"""
        self.formatter = TerminalFormatter()
        self.cli_engine = cli_engine

        # Setup components
        self.navigation = NavigationController(self.formatter)
        self.notes_manager = NotesManager(self.formatter, str(Path("data/notes")))
        self.quiz_nav = QuizNavigation(self.formatter)
        self.progress_viz = ProgressVisualization(self.formatter)

        # Create session instances
        self.learning_session = LearningSession(cli_engine, self.formatter, self.navigation, self.notes_manager)
        self.quiz_session = QuizSession(cli_engine, self.formatter, self.quiz_nav)
        self.notes_session = NotesSession(cli_engine, self.formatter, self.navigation, self.notes_manager)

    async def run(self):
        """Main session loop"""
        print("🎓 Welcome to Interactive Learning!")
        print("This session uses modular components from ui/session/ package")

        while True:
            print("\n" + "=" * 60)
            print("1. Start Learning Session")
            print("2. Take Quiz")
            print("3. Manage Notes")
            print("Q. Quit")
            print("=" * 60)

            choice = input("\nSelect option: ").strip().lower()

            if choice == "1":
                await self.learning_session.run()
            elif choice == "2":
                await self.quiz_session.run()
            elif choice == "3":
                await self.notes_session.run()
            elif choice in ["q", "quit", "exit"]:
                print("\n👋 Thank you for learning!")
                break
            else:
                print("❌ Invalid choice. Please try again.")


async def main():
    """Entry point for interactive session"""
    session = InteractiveSession()
    await session.run()


if __name__ == "__main__":
    asyncio.run(main())
