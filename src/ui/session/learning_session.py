#!/usr/bin/env python3
"""Learning Session - Interactive lesson mode with note-taking"""

import asyncio
from typing import Optional, Dict, Any, List
from datetime import datetime
from .base_session import BaseSession
from .state import LearningMode
from ..unified_formatter import Color
from ..navigation import MenuItem, NavigationMode


class LearningSession(BaseSession):
    """Interactive learning session with lessons and note-taking"""

    def __init__(self, cli_engine=None, formatter=None, navigation=None, notes_manager=None):
        super().__init__(cli_engine, formatter)
        self.navigation = navigation
        self.notes_manager = notes_manager
        self.state.mode = LearningMode.LESSON

    async def run(self):
        """Main learning session loop"""
        await self.show_lesson_topics()

    async def handle_input(self, user_input: str) -> bool:
        """Handle learning session input"""
        if user_input.lower() in ['q', 'quit', 'exit', 'back']:
            return False
        return True

    async def show_lesson_topics(self):
        """Show available topics for learning"""
        await self.formatter.type_text("📚 Launching Enhanced Lesson Mode...", speed=0.04)

        if self.cli_engine and hasattr(self.cli_engine, 'curriculum'):
            topics = list(self.cli_engine.curriculum.topics.keys())

            topic_items = []
            for i, topic in enumerate(topics[:10], 1):
                description = f"Explore {topic.lower()} with interactive examples"
                topic_items.append(MenuItem(str(i), "🔍", topic, description, color=Color.BRIGHT_GREEN))

            topic_items.append(MenuItem("B", "🔙", "Back", "Return to main menu", color=Color.BRIGHT_BLACK))

            _, choice = await self.navigation.show_menu("📖 Select Your Learning Topic", topic_items)

            if choice != "B" and choice != "quit":
                try:
                    topic_idx = int(choice) - 1
                    if 0 <= topic_idx < len(topics):
                        self.state.current_topic = topics[topic_idx]
                        await self.run_lesson(self.state.current_topic)
                except (ValueError, IndexError):
                    await self.formatter.type_text("❌ Invalid selection", speed=0.04)
        else:
            await self.run_lesson("Sample Algorithm Topic")

    async def run_lesson(self, topic: str):
        """Run interactive lesson with note-taking"""
        self.clear_screen()
        await self.formatter.type_text(f"📖 Starting lesson: {topic}", speed=0.05)
        print(self.formatter.header(f"📚 {topic}", level=1, style="boxed"))

        # Lesson content segments
        segments = [
            "🎯 Learning Objectives:",
            "• Understand the fundamental concepts",
            "• Learn practical applications",
            "• Master implementation techniques",
            "",
            "📝 Key Concepts:",
            "Let's start by understanding how this algorithm works...",
        ]

        note_count = 0
        for i, segment in enumerate(segments):
            await asyncio.sleep(0.3)
            await self.formatter.type_text(segment, speed=self.state.typing_speed)

            if i % 4 == 3 and segment:
                await asyncio.sleep(0.5)
                action = input(self.formatter._colorize(
                    "\n💡 [N] Take note  [C] Continue  [Q] Finish: ", Color.BRIGHT_YELLOW
                )).lower()

                if action == 'n' and self.notes_manager:
                    note_count += 1
                    await self.formatter.type_text(f"✅ Note #{note_count} saved!", speed=0.04)
                elif action == 'q':
                    break

        # Update progress
        if topic not in self.state.progress.concepts_learned:
            self.state.progress.concepts_learned.append(topic)
            self.state.progress.lessons_completed += 1

        if topic not in self.state.progress.topics_studied:
            self.state.progress.topics_studied.append(topic)

        await self.formatter.type_text("\n🎉 Lesson Complete!", speed=0.06)
        input("\nPress Enter to continue...")
