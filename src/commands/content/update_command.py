#!/usr/bin/env python3
"""ContentUpdateCommand - Extracted from content_commands.py"""

#!/usr/bin/env python3
"""
Content Commands - Content management and organization

This module provides:
- List content with filtering and search
- Create new content items (lessons, exercises, assessments)
- Update existing content
- Delete content with safety checks
- Content validation and versioning
- Import/export content in various formats
- Content relationship management
"""

import json
import asyncio
from typing import List, Optional, Dict, Any
from pathlib import Path
from datetime import datetime

from .base import BaseCommand, CommandResult, CommandMetadata, CommandCategory
from ..ui.formatter_compat import TerminalFormatter
from ..models.content import Content
from ..core.exceptions import CLIError




class ContentUpdateCommand(BaseCommand):
    """Update existing content"""
    
    def get_metadata(self) -> CommandMetadata:
        return CommandMetadata(
            name="content-update",
            description="Update an existing content item",
            category=CommandCategory.CONTENT,
            aliases=["content-edit", "update-content"],
            examples=[
                "content-update 123 --title 'New Title'",
                "content-update 123 --status published",
                "content-update 123 --difficulty intermediate",
                "content-update 123 --interactive"
            ]
        )
    
    def setup_parser(self, subparsers):
        parser = self.create_subparser(
            subparsers,
            help="Update an existing content item"
        )
        
        # Identification
        parser.add_argument(
            'content_id',
            type=int,
            help='Content ID to update'
        )
        
        # Update fields
        parser.add_argument(
            '--title',
            help='New title'
        )
        parser.add_argument(
            '--description',
            help='New description'
        )
        parser.add_argument(
            '--status',
            choices=['draft', 'review', 'published', 'archived'],
            help='New status'
        )
        parser.add_argument(
            '--difficulty',
            choices=['beginner', 'intermediate', 'advanced', 'expert'],
            help='New difficulty level'
        )
        parser.add_argument(
            '--duration',
            help='New duration estimate'
        )
        parser.add_argument(
            '--tags',
            help='New tags (comma-separated)'
        )
        parser.add_argument(
            '--author',
            help='New author'
        )
        parser.add_argument(
            '--order',
            type=int,
            help='New order position'
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
            
            # Find content
            content = await self._find_content(context, parsed_args.content_id)
            if not content:
                return CommandResult(
                    success=False,
                    message=f"Content with ID {parsed_args.content_id} not found"
                )
            
            original_content = content.copy()
            
            # Get updates
            if parsed_args.interactive:
                updates = await self._interactive_update(context.formatter, content)
            else:
                updates = self._extract_updates(parsed_args)
            
            if not updates:
                return CommandResult(
                    success=False,
                    message="No updates specified"
                )
            
            # Apply updates
            updated_content = content.copy()
            updated_content.update(updates)
            updated_content['updated'] = datetime.now().isoformat()
            
            # Show diff if requested
            if parsed_args.show_diff:
                self._show_diff(context.formatter, original_content, updated_content)
            
            # Confirm update
            if not parsed_args.force:
                if not self.confirm_action(
                    f"Update content '{content['title']}'?", 
                    default=True
                ):
                    return CommandResult(
                        success=False,
                        message="Update cancelled"
                    )
            
            # Perform update
            await self._update_content(context, parsed_args.content_id, updated_content)
            
            context.formatter.success(
                f"Content '{content['title']}' updated successfully"
            )
            
            return CommandResult(
                success=True,
                message="Content updated successfully",
                data={'content': updated_content, 'updates': updates}
            )
            
        except Exception as e:
            return CommandResult(
                success=False,
                message=f"Failed to update content: {e}",
                error=e
            )
    
    async def _find_content(self, context, content_id: int) -> Optional[Dict[str, Any]]:
        """Find content by ID"""
        # Mock implementation
        if content_id == 1:
            return {
                'id': 1,
                'title': 'Introduction to Python',
                'description': 'Learn the basics of Python programming',
                'type': 'lesson',
                'status': 'published',
                'difficulty': 'beginner',
                'duration': '45 minutes',
                'author': 'Jane Smith',
                'tags': ['python', 'basics', 'introduction'],
                'order': 1,
                'created': '2024-01-15T10:30:00',
                'updated': '2024-01-20T14:22:00'
            }
        return None
    
    def _extract_updates(self, parsed_args) -> Dict[str, Any]:
        """Extract updates from command line arguments"""
        updates = {}
        
        if parsed_args.title:
            updates['title'] = parsed_args.title
        if parsed_args.description:
            updates['description'] = parsed_args.description
        if parsed_args.status:
            updates['status'] = parsed_args.status
        if parsed_args.difficulty:
            updates['difficulty'] = parsed_args.difficulty
        if parsed_args.duration:
            updates['duration'] = parsed_args.duration
        if parsed_args.author:
            updates['author'] = parsed_args.author
        if parsed_args.order is not None:
            updates['order'] = parsed_args.order
        if parsed_args.tags:
            updates['tags'] = [tag.strip() for tag in parsed_args.tags.split(',')]
        
        return updates
    
    async def _interactive_update(self, formatter: TerminalFormatter, 
                                 content: Dict[str, Any]) -> Dict[str, Any]:
        """Interactive content update"""
        formatter.header(f"Updating Content: {content['title']}", level=2)
        formatter.info("Press Enter to keep current value, or enter new value:")
        
        updates = {}
        
        # Title
        current_title = content.get('title', '')
        new_title = input(f"Title [{current_title}]: ").strip()
        if new_title and new_title != current_title:
            updates['title'] = new_title
        
        # Description
        current_desc = content.get('description', '')
        new_desc = input(f"Description [{current_desc[:30]}{'...' if len(current_desc) > 30 else ''}]: ").strip()
        if new_desc and new_desc != current_desc:
            updates['description'] = new_desc
        
        # Status
        current_status = content.get('status', '')
        statuses = ['draft', 'review', 'published', 'archived']
        formatter.info(f"Status options: {', '.join(statuses)}")
        new_status = input(f"Status [{current_status}]: ").strip()
        if new_status and new_status != current_status and new_status in statuses:
            updates['status'] = new_status
        
        # Difficulty
        current_difficulty = content.get('difficulty', '')
        difficulties = ['beginner', 'intermediate', 'advanced', 'expert']
        formatter.info(f"Difficulty options: {', '.join(difficulties)}")
        new_difficulty = input(f"Difficulty [{current_difficulty}]: ").strip()
        if new_difficulty and new_difficulty != current_difficulty and new_difficulty in difficulties:
            updates['difficulty'] = new_difficulty
        
        # Duration
        current_duration = content.get('duration', '')
        new_duration = input(f"Duration [{current_duration}]: ").strip()
        if new_duration and new_duration != current_duration:
            updates['duration'] = new_duration
        
        # Tags
        current_tags = ', '.join(content.get('tags', []))
        new_tags = input(f"Tags [{current_tags}]: ").strip()
        if new_tags and new_tags != current_tags:
            updates['tags'] = [tag.strip() for tag in new_tags.split(',')]
        
        return updates
    
    def _show_diff(self, formatter: TerminalFormatter, 
                   original: Dict[str, Any], 
                   updated: Dict[str, Any]):
        """Show differences between original and updated content"""
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
    
    async def _update_content(self, context, content_id: int, 
                             updated_content: Dict[str, Any]):
        """Update content in database"""
        # Mock implementation - replace with actual database update
        pass


