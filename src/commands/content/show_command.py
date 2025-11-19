#!/usr/bin/env python3
"""ContentShowCommand - Extracted from content_commands.py"""

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




class ContentShowCommand(BaseCommand):
    """Show detailed content information"""
    
    def get_metadata(self) -> CommandMetadata:
        return CommandMetadata(
            name="content-show",
            description="Show detailed information about content",
            category=CommandCategory.CONTENT,
            aliases=["content-info", "show-content"],
            examples=[
                "content-show 123",
                "content-show 123 --format json",
                "content-show 123 --include-stats",
                "content-show 123 --include-relationships"
            ]
        )
    
    def setup_parser(self, subparsers):
        parser = self.create_subparser(
            subparsers,
            help="Show detailed content information"
        )
        
        # Identification
        parser.add_argument(
            'content_id',
            type=int,
            help='Content ID to show'
        )
        
        # Display options
        parser.add_argument(
            '--format',
            choices=['detailed', 'json', 'summary'],
            default='detailed',
            help='Output format'
        )
        parser.add_argument(
            '--include-stats',
            action='store_true',
            help='Include usage statistics'
        )
        parser.add_argument(
            '--include-relationships',
            action='store_true',
            help='Include related content'
        )
        parser.add_argument(
            '--include-content',
            action='store_true',
            help='Include actual content body'
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
            
            # Display content
            if parsed_args.format == 'json':
                output = json.dumps(content, indent=2, default=str)
                print(output)
            elif parsed_args.format == 'summary':
                self._show_summary(context.formatter, content)
            else:
                self._show_detailed(context.formatter, content, parsed_args)
            
            return CommandResult(
                success=True,
                data={'content': content}
            )
            
        except Exception as e:
            return CommandResult(
                success=False,
                message=f"Failed to show content: {e}",
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
                'curriculum_id': 1,
                'curriculum_name': 'Python Fundamentals',
                'module_id': 1,
                'module_name': 'Getting Started',
                'author': 'Jane Smith',
                'difficulty': 'beginner',
                'tags': ['python', 'basics', 'introduction'],
                'created': '2024-01-15T10:30:00',
                'updated': '2024-01-20T14:22:00',
                'order': 1,
                'duration': '45 minutes',
                'views': 1250,
                'completion_rate': 92.5,
                'average_rating': 4.7,
                'content_body': 'This lesson introduces you to Python programming...',
                'related_content': [
                    {'id': 2, 'title': 'Python Variables Exercise', 'type': 'exercise'},
                    {'id': 3, 'title': 'Python Syntax Quiz', 'type': 'quiz'}
                ]
            }
        return None
    
    def _show_detailed(self, formatter: TerminalFormatter, content: Dict[str, Any], args):
        """Show detailed content information"""
        formatter.header(content['title'], level=1)
        
        # Basic information
        formatter.header("Basic Information", level=2)
        basic_info = {
            'ID': content['id'],
            'Type': content['type'].title(),
            'Status': content['status'].upper(),
            'Difficulty': content['difficulty'].title(),
            'Author': content['author'],
            'Duration': content.get('duration', 'Not specified'),
            'Created': content['created'],
            'Updated': content['updated']
        }
        formatter.key_value_pairs(basic_info)
        
        # Organization
        if content.get('curriculum_name') or content.get('module_name'):
            formatter.header("Organization", level=2)
            org_info = {}
            if content.get('curriculum_name'):
                org_info['Curriculum'] = f"{content['curriculum_name']} (ID: {content['curriculum_id']})"
            if content.get('module_name'):
                org_info['Module'] = f"{content['module_name']} (ID: {content['module_id']})"
            if content.get('order'):
                org_info['Order'] = content['order']
            formatter.key_value_pairs(org_info)
        
        # Description
        if content.get('description'):
            formatter.header("Description", level=2)
            formatter.info(content['description'])
        
        # Tags
        if content.get('tags'):
            formatter.header("Tags", level=2)
            formatter.list_items(content['tags'])
        
        # Statistics
        if args.include_stats:
            formatter.header("Statistics", level=2)
            stats = {
                'Views': content.get('views', 0),
                'Completion Rate': f"{content.get('completion_rate', 0):.1f}%",
                'Average Rating': f"{content.get('average_rating', 0):.1f}/5.0"
            }
            formatter.key_value_pairs(stats)
        
        # Related content
        if args.include_relationships and content.get('related_content'):
            formatter.header("Related Content", level=2)
            related_data = []
            for related in content['related_content']:
                related_data.append({
                    'ID': related['id'],
                    'Title': related['title'],
                    'Type': related['type'].upper()
                })
            formatter.table(related_data)
        
        # Content body
        if args.include_content and content.get('content_body'):
            formatter.header("Content", level=2)
            formatter.box(content['content_body'][:500] + '...' if len(content['content_body']) > 500 else content['content_body'])
    
    def _show_summary(self, formatter: TerminalFormatter, content: Dict[str, Any]):
        """Show content summary"""
        formatter.info(f"ID: {content['id']} | {content['title']}")
        formatter.info(f"Type: {content['type'].upper()} | Status: {content['status'].upper()}")
        formatter.info(f"Author: {content['author']} | Duration: {content.get('duration', 'Not specified')}")
        if content.get('views'):
            formatter.info(f"Views: {content['views']} | Completion: {content.get('completion_rate', 0):.1f}%")


