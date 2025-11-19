#!/usr/bin/env python3
"""Notes Session - Note management and organization"""

import asyncio
from .base_session import BaseSession
from .state import LearningMode
from ..unified_formatter import Color
from ..navigation import MenuItem


class NotesSession(BaseSession):
    """Interactive notes management session"""

    def __init__(self, cli_engine=None, formatter=None, navigation=None, notes_manager=None):
        super().__init__(cli_engine, formatter)
        self.navigation = navigation
        self.notes_manager = notes_manager
        self.state.mode = LearningMode.NOTES

    async def run(self):
        """Main notes session loop"""
        while True:
            notes_menu_items = [
                MenuItem("1", "📝", "Create Rich Note", "Create note with advanced formatting",
                        color=Color.BRIGHT_GREEN),
                MenuItem("2", "📖", "Browse All Notes", "View and manage all notes",
                        color=Color.BRIGHT_CYAN),
                MenuItem("3", "🔍", "Smart Search", "Search by content, tags, or topics",
                        color=Color.BRIGHT_YELLOW),
                MenuItem("4", "🏷️", "Tag Explorer", "Browse notes by tags",
                        color=Color.BRIGHT_MAGENTA),
                MenuItem("5", "📊", "Notes Analytics", "View note statistics",
                        color=Color.BRIGHT_BLUE),
                MenuItem("B", "🔙", "Back", "Return to main menu",
                        color=Color.BRIGHT_BLACK)
            ]

            _, choice = await self.navigation.show_menu("📝 Enhanced Notes Management", notes_menu_items)

            if choice == "B" or choice == "quit":
                break
            elif choice == "1":
                await self.create_note()
            elif choice == "2":
                await self.browse_notes()
            elif choice == "3":
                await self.search_notes()
            elif choice == "4":
                await self.tag_explorer()
            elif choice == "5":
                await self.notes_analytics()

    async def handle_input(self, user_input: str) -> bool:
        """Handle notes session input"""
        return user_input.lower() not in ['quit', 'exit', 'back']

    async def create_note(self):
        """Create new note"""
        if self.notes_manager:
            note = await self.notes_manager.create_note(self.state.current_topic)
            if note:
                await self.formatter.type_text(f"✅ Created note: '{note.title}'", speed=0.04)
        input("\nPress Enter to continue...")

    async def browse_notes(self):
        """Browse all notes"""
        if not self.notes_manager or not self.notes_manager.notes:
            await self.formatter.type_text("📄 No notes yet. Create your first note!", speed=0.04)
            input("\nPress Enter to continue...")
            return

        notes_list = list(self.notes_manager.notes.values())
        await self.formatter.type_text(f"📚 Found {len(notes_list)} notes", speed=0.04)
        input("\nPress Enter to continue...")

    async def search_notes(self):
        """Search notes"""
        query = input(self.formatter._colorize("Search: ", Color.BRIGHT_YELLOW)).strip()
        if query and self.notes_manager:
            results = self.notes_manager.search_notes(query)
            await self.formatter.type_text(f"✅ Found {len(results)} notes", speed=0.04)
        input("\nPress Enter to continue...")

    async def tag_explorer(self):
        """Explore notes by tags"""
        if self.notes_manager and self.notes_manager.tags_index:
            await self.formatter.type_text("🏷️ Tag Explorer", speed=0.05)
            for tag, note_ids in list(self.notes_manager.tags_index.items())[:10]:
                await self.formatter.type_text(f"  #{tag} ({len(note_ids)})", speed=0.02)
        input("\nPress Enter to continue...")

    async def notes_analytics(self):
        """Show notes analytics"""
        if self.notes_manager:
            stats = self.notes_manager.get_statistics()
            analytics_content = f"""
Total Notes: {stats['total_notes']}
Unique Tags: {stats['total_tags']}
Topics Covered: {stats['total_topics']}
            """.strip()
            print(self.formatter.box(analytics_content, title="📊 Notes Analytics",
                                   style="double", color=Color.BRIGHT_BLUE))
        input("\nPress Enter to continue...")
