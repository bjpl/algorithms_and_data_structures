#!/usr/bin/env python3
"""ContentListCommand - Extracted from content_commands.py"""

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




class ContentListCommand(BaseCommand):
    """List content with filtering and search"""
    
    def get_metadata(self) -> CommandMetadata:
        return CommandMetadata(
            name="content-list",
            description="List all content items with filtering",
            category=CommandCategory.CONTENT,
            aliases=["content-ls", "list-content"],
            examples=[
                "content-list",
                "content-list --type lesson",
                "content-list --curriculum 123",
                "content-list --status published --format json",
                "content-list --search 'python basics'",
                "content-list --author 'Jane Smith' --tag tutorial"
            ]
        )
    
    def setup_parser(self, subparsers):
        parser = self.create_subparser(
            subparsers,
            help="List content items with filtering"
        )
        
        # Filtering options
        parser.add_argument(
            '--type',
            choices=['lesson', 'exercise', 'assessment', 'resource', 'video', 'quiz'],
            help='Filter by content type'
        )
        parser.add_argument(
            '--status',
            choices=['draft', 'review', 'published', 'archived'],
            help='Filter by content status'
        )
        parser.add_argument(
            '--curriculum',
            type=int,
            help='Filter by curriculum ID'
        )
        parser.add_argument(
            '--module',
            type=int,
            help='Filter by module ID'
        )
        parser.add_argument(
            '--author',
            help='Filter by author name'
        )
        parser.add_argument(
            '--tag',
            action='append',
            help='Filter by tags (can be used multiple times)'
        )
        parser.add_argument(
            '--difficulty',
            choices=['beginner', 'intermediate', 'advanced', 'expert'],
            help='Filter by difficulty level'
        )
        
        # Search options
        parser.add_argument(
            '--search',
            help='Search in title and content'
        )
        parser.add_argument(
            '--search-field',
            choices=['title', 'description', 'content', 'all'],
            default='all',
            help='Fields to search in'
        )
        
        # Sorting options
        parser.add_argument(
            '--sort',
            choices=['title', 'created', 'updated', 'type', 'status', 'order'],
            default='title',
            help='Sort field'
        )
        parser.add_argument(
            '--order',
            choices=['asc', 'desc'],
            default='asc',
            help='Sort order'
        )
        
        # Output options
        parser.add_argument(
            '--format',
            choices=['table', 'json', 'summary', 'tree'],
            default='table',
            help='Output format'
        )
        parser.add_argument(
            '--limit',
            type=int,
            help='Maximum number of results'
        )
        parser.add_argument(
            '--include-stats',
            action='store_true',
            help='Include content statistics'
        )
        
        return parser
    
    async def execute(self, context, args: List[str]) -> CommandResult:
        try:
            parsed_args = self.parse_args(args)
            
            # Get content items
            content_items = await self._get_content_items(context, parsed_args)
            
            if not content_items:
                return CommandResult(
                    success=True,
                    message="No content items found matching the criteria"
                )
            
            # Format output
            if parsed_args.format == 'json':
                output = json.dumps(content_items, indent=2, default=str)
                print(output)
            elif parsed_args.format == 'summary':
                self._show_summary(context.formatter, content_items)
            elif parsed_args.format == 'tree':
                self._show_tree(context.formatter, content_items)
            else:
                self._show_table(context.formatter, content_items, parsed_args.include_stats)
            
            return CommandResult(
                success=True,
                message=f"Found {len(content_items)} content item(s)",
                data={'content_items': content_items}
            )
            
        except Exception as e:
            return CommandResult(
                success=False,
                message=f"Failed to list content: {e}",
                error=e
            )
    
    async def _get_content_items(self, context, args) -> List[Dict[str, Any]]:
        """Get content items with filtering and sorting"""
        # Mock data - replace with actual database query
        mock_content = [
            {
                'id': 1,
                'title': 'Introduction to Python',
                'description': 'Learn the basics of Python programming',
                'type': 'lesson',
                'status': 'published',
                'curriculum_id': 1,
                'module_id': 1,
                'author': 'Jane Smith',
                'difficulty': 'beginner',
                'tags': ['python', 'basics', 'introduction'],
                'created': '2024-01-15T10:30:00',
                'updated': '2024-01-20T14:22:00',
                'order': 1,
                'duration': '45 minutes',
                'views': 1250,
                'completion_rate': 92.5
            },
            {
                'id': 2,
                'title': 'Python Variables Exercise',
                'description': 'Practice working with Python variables',
                'type': 'exercise',
                'status': 'published',
                'curriculum_id': 1,
                'module_id': 1,
                'author': 'Jane Smith',
                'difficulty': 'beginner',
                'tags': ['python', 'variables', 'practice'],
                'created': '2024-01-16T11:00:00',
                'updated': '2024-01-21T09:15:00',
                'order': 2,
                'duration': '30 minutes',
                'views': 980,
                'completion_rate': 87.3
            },
            {
                'id': 3,
                'title': 'Data Types Quiz',
                'description': 'Test your knowledge of Python data types',
                'type': 'quiz',
                'status': 'draft',
                'curriculum_id': 1,
                'module_id': 2,
                'author': 'John Doe',
                'difficulty': 'intermediate',
                'tags': ['python', 'data-types', 'assessment'],
                'created': '2024-01-18T15:45:00',
                'updated': '2024-01-22T10:30:00',
                'order': 1,
                'duration': '20 minutes',
                'views': 0,
                'completion_rate': 0
            }
        ]
        
        # Apply filters
        filtered_content = mock_content
        
        if args.type:
            filtered_content = [c for c in filtered_content if c['type'] == args.type]
        
        if args.status:
            filtered_content = [c for c in filtered_content if c['status'] == args.status]
        
        if args.curriculum:
            filtered_content = [c for c in filtered_content if c['curriculum_id'] == args.curriculum]
        
        if args.module:
            filtered_content = [c for c in filtered_content if c['module_id'] == args.module]
        
        if args.author:
            filtered_content = [c for c in filtered_content if args.author.lower() in c['author'].lower()]
        
        if args.difficulty:
            filtered_content = [c for c in filtered_content if c['difficulty'] == args.difficulty]
        
        if args.tag:
            for tag in args.tag:
                filtered_content = [c for c in filtered_content if tag in c['tags']]
        
        if args.search:
            search_term = args.search.lower()
            if args.search_field == 'all':
                filtered_content = [
                    c for c in filtered_content 
                    if search_term in c['title'].lower() or 
                       search_term in c['description'].lower()
                ]
            elif args.search_field == 'title':
                filtered_content = [c for c in filtered_content if search_term in c['title'].lower()]
            elif args.search_field == 'description':
                filtered_content = [c for c in filtered_content if search_term in c['description'].lower()]
        
        # Apply sorting
        reverse = args.order == 'desc'
        filtered_content.sort(key=lambda x: x.get(args.sort, ''), reverse=reverse)
        
        # Apply limit
        if args.limit:
            filtered_content = filtered_content[:args.limit]
        
        return filtered_content
    
    def _show_table(self, formatter: TerminalFormatter, content_items: List[Dict[str, Any]], include_stats: bool):
        """Show content items in table format"""
        if include_stats:
            headers = ['ID', 'Title', 'Type', 'Status', 'Views', 'Completion', 'Updated']
        else:
            headers = ['ID', 'Title', 'Type', 'Status', 'Module', 'Author']
        
        table_data = []
        for content in content_items:
            if include_stats:
                table_data.append({
                    'ID': content['id'],
                    'Title': content['title'][:25] + '...' if len(content['title']) > 25 else content['title'],
                    'Type': content['type'].upper(),
                    'Status': content['status'].upper(),
                    'Views': content.get('views', 0),
                    'Completion': f"{content.get('completion_rate', 0):.1f}%",
                    'Updated': content['updated'][:10]
                })
            else:
                table_data.append({
                    'ID': content['id'],
                    'Title': content['title'][:30] + '...' if len(content['title']) > 30 else content['title'],
                    'Type': content['type'].upper(),
                    'Status': content['status'].upper(),
                    'Module': content.get('module_id', ''),
                    'Author': content['author']
                })
        
        formatter.table(table_data, headers)
    
    def _show_summary(self, formatter: TerminalFormatter, content_items: List[Dict[str, Any]]):
        """Show content items in summary format"""
        for content in content_items:
            formatter.header(f"{content['title']} (#{content['id']})", level=3)
            
            summary = {
                'Type': content['type'].title(),
                'Status': content['status'].upper(),
                'Author': content['author'],
                'Difficulty': content['difficulty'].title(),
                'Duration': content.get('duration', 'Not specified'),
                'Tags': ', '.join(content['tags'])
            }
            
            formatter.key_value_pairs(summary, indent=1)
            formatter.info(f"  Description: {content['description']}")
            print()
    
    def _show_tree(self, formatter: TerminalFormatter, content_items: List[Dict[str, Any]]):
        """Show content items in tree format grouped by curriculum/module"""
        # Group by curriculum and module
        tree = {}
        for content in content_items:
            curr_id = content.get('curriculum_id', 'Unknown')
            mod_id = content.get('module_id', 'Unknown')
            
            if curr_id not in tree:
                tree[curr_id] = {}
            if mod_id not in tree[curr_id]:
                tree[curr_id][mod_id] = []
            
            tree[curr_id][mod_id].append(content)
        
        # Display tree
        for curr_id, modules in tree.items():
            formatter.info(f"📚 Curriculum {curr_id}")
            
            for mod_id, content_list in modules.items():
                formatter.info(f"  📖 Module {mod_id}")
                
                for content in content_list:
                    status_icon = "✅" if content['status'] == 'published' else "📝"
                    type_icon = {
                        'lesson': '📺',
                        'exercise': '💪',
                        'quiz': '❓',
                        'assessment': '📊',
                        'resource': '📄',
                        'video': '🎥'
                    }.get(content['type'], '📄')
                    
                    formatter.info(f"    {type_icon} {status_icon} {content['title']} (#{content['id']})")


