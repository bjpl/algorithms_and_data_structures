#!/usr/bin/env python3
"""CurriculumUpdateCommand - Extracted from curriculum_commands.py"""

#!/usr/bin/env python3
"""
Curriculum Commands - CRUD operations for curriculum management

This module provides:
- List all curricula with filtering and sorting
- Create new curriculum with interactive prompts
- Update existing curriculum details
- Delete curriculum with confirmation
- Show detailed curriculum information
- Export/import curriculum data
- Curriculum validation and status management
"""

import json
import asyncio
from typing import List, Optional, Dict, Any
from pathlib import Path
from datetime import datetime

from .base import BaseCommand, CommandResult, CommandMetadata, CommandCategory
from ..ui.formatter_compat import TerminalFormatter
from ..ui.interactive import InteractiveSession
from ..models.curriculum import Curriculum
from ..core.exceptions import CLIError



class CurriculumUpdateCommand(BaseCommand):
    """Update existing curriculum"""
    
    def get_metadata(self) -> CommandMetadata:
        return CommandMetadata(
            name="curriculum-update",
            description="Update an existing curriculum",
            category=CommandCategory.CURRICULUM,
            aliases=["curr-update", "update-curr"],
            examples=[
                "curriculum-update 123 --name 'New Name'",
                "curriculum-update 123 --status published",
                "curriculum-update 123 --difficulty advanced",
                "curriculum-update 123 --interactive"
            ]
        )
    
    def setup_parser(self, subparsers):
        parser = self.create_subparser(
            subparsers,
            help="Update an existing curriculum"
        )
        
        # Identification
        parser.add_argument(
            'curriculum_id',
            type=int,
            help='Curriculum ID to update'
        )
        
        # Update fields
        parser.add_argument(
            '--name',
            help='New curriculum name'
        )
        parser.add_argument(
            '--description',
            help='New description'
        )
        parser.add_argument(
            '--status',
            choices=['draft', 'active', 'archived', 'published'],
            help='New status'
        )
        parser.add_argument(
            '--difficulty',
            choices=['beginner', 'intermediate', 'advanced', 'expert'],
            help='New difficulty level'
        )
        parser.add_argument(
            '--category',
            help='New category'
        )
        parser.add_argument(
            '--author',
            help='New author'
        )
        parser.add_argument(
            '--tags',
            help='New tags (comma-separated)'
        )
        
        # Options
        parser.add_argument(
            '--interactive',
            action='store_true',
            help='Use interactive mode'
        )
        parser.add_argument(
            '--show-diff',
            action='store_true',
            help='Show changes before applying'
        )
        
        return parser
    
    async def execute(self, context, args: List[str]) -> CommandResult:
        try:
            parsed_args = self.parse_args(args)
            
            # Find curriculum
            curriculum = await self._find_curriculum(context, parsed_args.curriculum_id)
            if not curriculum:
                return CommandResult(
                    success=False,
                    message=f"Curriculum with ID {parsed_args.curriculum_id} not found"
                )
            
            original_curriculum = curriculum.copy()
            
            # Get updates
            if parsed_args.interactive:
                updates = await self._interactive_update(context.formatter, curriculum)
            else:
                updates = self._extract_updates(parsed_args)
            
            if not updates:
                return CommandResult(
                    success=False,
                    message="No updates specified"
                )
            
            # Apply updates
            updated_curriculum = curriculum.copy()
            updated_curriculum.update(updates)
            updated_curriculum['updated'] = datetime.now().isoformat()
            
            # Show diff if requested
            if parsed_args.show_diff:
                self._show_diff(context.formatter, original_curriculum, updated_curriculum)
            
            # Confirm update
            if not parsed_args.force:
                if not self.confirm_action(
                    f"Update curriculum '{curriculum['name']}'?", 
                    default=True
                ):
                    return CommandResult(
                        success=False,
                        message="Update cancelled"
                    )
            
            # Perform update
            await self._update_curriculum(context, parsed_args.curriculum_id, updated_curriculum)
            
            context.formatter.success(
                f"Curriculum '{curriculum['name']}' updated successfully"
            )
            
            return CommandResult(
                success=True,
                message="Curriculum updated successfully",
                data={'curriculum': updated_curriculum, 'updates': updates}
            )
            
        except Exception as e:
            return CommandResult(
                success=False,
                message=f"Failed to update curriculum: {e}",
                error=e
            )
    
    async def _find_curriculum(self, context, curriculum_id: int) -> Optional[Dict[str, Any]]:
        """Find curriculum by ID"""
        # Mock implementation
        if curriculum_id == 1:
            return {
                'id': 1,
                'name': 'Python Fundamentals',
                'description': 'Learn Python programming from basics to advanced',
                'status': 'active',
                'difficulty': 'beginner',
                'category': 'Programming',
                'author': 'Jane Smith',
                'tags': ['python', 'programming', 'fundamentals'],
                'created': '2024-01-15T10:30:00',
                'updated': '2024-02-01T14:22:00'
            }
        return None
    
    def _extract_updates(self, parsed_args) -> Dict[str, Any]:
        """Extract updates from command line arguments"""
        updates = {}
        
        if parsed_args.name:
            updates['name'] = parsed_args.name
        if parsed_args.description:
            updates['description'] = parsed_args.description
        if parsed_args.status:
            updates['status'] = parsed_args.status
        if parsed_args.difficulty:
            updates['difficulty'] = parsed_args.difficulty
        if parsed_args.category:
            updates['category'] = parsed_args.category
        if parsed_args.author:
            updates['author'] = parsed_args.author
        if parsed_args.tags:
            updates['tags'] = [tag.strip() for tag in parsed_args.tags.split(',')]
        
        return updates
    
    async def _interactive_update(self, formatter: TerminalFormatter, 
                                 curriculum: Dict[str, Any]) -> Dict[str, Any]:
        """Interactive curriculum update"""
        formatter.header(f"Updating Curriculum: {curriculum['name']}", level=2)
        formatter.info("Press Enter to keep current value, or enter new value:")
        
        updates = {}
        
        # Name
        current_name = curriculum.get('name', '')
        new_name = input(f"Name [{current_name}]: ").strip()
        if new_name and new_name != current_name:
            updates['name'] = new_name
        
        # Description
        current_desc = curriculum.get('description', '')
        new_desc = input(f"Description [{current_desc[:50]}{'...' if len(current_desc) > 50 else ''}]: ").strip()
        if new_desc and new_desc != current_desc:
            updates['description'] = new_desc
        
        # Status
        current_status = curriculum.get('status', '')
        statuses = ['draft', 'active', 'archived', 'published']
        formatter.info(f"Status options: {', '.join(statuses)}")
        new_status = input(f"Status [{current_status}]: ").strip()
        if new_status and new_status != current_status and new_status in statuses:
            updates['status'] = new_status
        
        # Difficulty
        current_difficulty = curriculum.get('difficulty', '')
        difficulties = ['beginner', 'intermediate', 'advanced', 'expert']
        formatter.info(f"Difficulty options: {', '.join(difficulties)}")
        new_difficulty = input(f"Difficulty [{current_difficulty}]: ").strip()
        if new_difficulty and new_difficulty != current_difficulty and new_difficulty in difficulties:
            updates['difficulty'] = new_difficulty
        
        # Category
        current_category = curriculum.get('category', '')
        new_category = input(f"Category [{current_category}]: ").strip()
        if new_category and new_category != current_category:
            updates['category'] = new_category
        
        # Tags
        current_tags = ', '.join(curriculum.get('tags', []))
        new_tags = input(f"Tags [{current_tags}]: ").strip()
        if new_tags and new_tags != current_tags:
            updates['tags'] = [tag.strip() for tag in new_tags.split(',')]
        
        return updates
    
    def _show_diff(self, formatter: TerminalFormatter, 
                   original: Dict[str, Any], 
                   updated: Dict[str, Any]):
        """Show differences between original and updated curriculum"""
        formatter.header("Changes Preview", level=2)
        
        changes = []
        for key, new_value in updated.items():
            if key in original and original[key] != new_value:
                changes.append({
                    'Field': key.title(),
                    'Before': str(original[key]),
                    'After': str(new_value)
                })
        
        if changes:
            formatter.table(changes)
        else:
            formatter.info("No changes detected")
    
    async def _update_curriculum(self, context, curriculum_id: int, 
                                updated_curriculum: Dict[str, Any]):
        """Update curriculum in database"""
        # Mock implementation - replace with actual database update
        pass


