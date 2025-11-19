#!/usr/bin/env python3
"""SavedSearchCommand - Extracted from search_commands.py"""

#!/usr/bin/env python3
"""
Search Commands - Search and discovery functionality

This module provides:
- Global search across curricula, content, and users
- Advanced search with filters and facets
- Search suggestions and autocomplete
- Search analytics and popular searches
- Saved searches and search history
- Full-text search with ranking
"""

import json
import asyncio
from typing import List, Optional, Dict, Any, Tuple
from pathlib import Path
from datetime import datetime, timedelta

from .base import BaseCommand, CommandResult, CommandMetadata, CommandCategory
from ..ui.formatter_compat import TerminalFormatter
from ..core.exceptions import CLIError




class SavedSearchCommand(BaseCommand):
    """Manage saved searches"""
    
    def get_metadata(self) -> CommandMetadata:
        return CommandMetadata(
            name="saved-search",
            description="Manage saved searches",
            category=CommandCategory.SYSTEM,
            aliases=["saved-searches", "search-saved"],
            examples=[
                "saved-search list",
                "saved-search run my-search",
                "saved-search delete old-search",
                "saved-search show my-search --details"
            ]
        )
    
    def setup_parser(self, subparsers):
        parser = self.create_subparser(
            subparsers,
            help="Manage saved searches"
        )
        
        # Subcommands
        subcommands = parser.add_subparsers(dest='action', help='Saved search actions')
        
        # List saved searches
        list_parser = subcommands.add_parser('list', help='List saved searches')
        list_parser.add_argument('--format', choices=['table', 'json'], default='table')
        
        # Run saved search
        run_parser = subcommands.add_parser('run', help='Run a saved search')
        run_parser.add_argument('name', help='Saved search name')
        run_parser.add_argument('--format', choices=['list', 'detailed', 'json'], default='list')
        run_parser.add_argument('--limit', type=int, help='Override result limit')
        
        # Show saved search details
        show_parser = subcommands.add_parser('show', help='Show saved search details')
        show_parser.add_argument('name', help='Saved search name')
        show_parser.add_argument('--details', action='store_true', help='Show full details')
        
        # Delete saved search
        delete_parser = subcommands.add_parser('delete', help='Delete a saved search')
        delete_parser.add_argument('name', help='Saved search name')
        
        return parser
    
    async def execute(self, context, args: List[str]) -> CommandResult:
        try:
            parsed_args = self.parse_args(args)
            
            if not parsed_args.action:
                return CommandResult(
                    success=False,
                    message="Please specify an action: list, run, show, or delete"
                )
            
            if parsed_args.action == 'list':
                return await self._list_saved_searches(context, parsed_args)
            elif parsed_args.action == 'run':
                return await self._run_saved_search(context, parsed_args)
            elif parsed_args.action == 'show':
                return await self._show_saved_search(context, parsed_args)
            elif parsed_args.action == 'delete':
                return await self._delete_saved_search(context, parsed_args)
            
        except Exception as e:
            return CommandResult(
                success=False,
                message=f"Saved search operation failed: {e}",
                error=e
            )
    
    async def _list_saved_searches(self, context, args) -> CommandResult:
        """List all saved searches"""
        # Mock data - replace with actual database query
        saved_searches = [
            {
                'name': 'python-basics',
                'query': 'python basics',
                'type': 'content',
                'created': '2024-01-15T10:30:00',
                'last_used': '2024-01-20T14:22:00',
                'use_count': 12
            },
            {
                'name': 'web-development',
                'query': 'web development',
                'type': 'all',
                'created': '2024-01-18T09:15:00',
                'last_used': '2024-01-22T11:45:00',
                'use_count': 8
            },
            {
                'name': 'advanced-topics',
                'query': 'advanced',
                'type': 'curriculum',
                'difficulty': 'advanced',
                'created': '2024-01-20T16:20:00',
                'last_used': '2024-01-21T10:30:00',
                'use_count': 3
            }
        ]
        
        if not saved_searches:
            return CommandResult(
                success=True,
                message="No saved searches found"
            )
        
        if args.format == 'json':
            output = json.dumps(saved_searches, indent=2, default=str)
            print(output)
        else:
            context.formatter.header(f"Saved Searches ({len(saved_searches)})", level=2)
            
            table_data = []
            for search in saved_searches:
                table_data.append({
                    'Name': search['name'],
                    'Query': search['query'][:30] + '...' if len(search['query']) > 30 else search['query'],
                    'Type': search.get('type', 'all').title(),
                    'Used': search['use_count'],
                    'Last Used': search['last_used'][:10]
                })
            
            context.formatter.table(table_data)
        
        return CommandResult(
            success=True,
            message=f"Found {len(saved_searches)} saved search(es)",
            data={'saved_searches': saved_searches}
        )
    
    async def _run_saved_search(self, context, args) -> CommandResult:
        """Run a saved search"""
        # Mock implementation - find saved search and execute it
        saved_search = await self._find_saved_search(context, args.name)
        
        if not saved_search:
            return CommandResult(
                success=False,
                message=f"Saved search '{args.name}' not found"
            )
        
        context.formatter.info(f"Running saved search: {saved_search['name']}")
        context.formatter.info(f"Query: {saved_search['query']}")
        
        # Execute the search using the SearchCommand
        search_command = SearchCommand()
        
        # Build arguments from saved search
        search_args = [saved_search['query']]
        
        if saved_search.get('type') != 'all':
            search_args.extend(['--type', saved_search['type']])
        
        for key, value in saved_search.get('filters', {}).items():
            if value:
                if key == 'tags' and isinstance(value, list):
                    for tag in value:
                        search_args.extend(['--tag', tag])
                else:
                    search_args.extend([f'--{key.replace("_", "-")}', str(value)])
        
        for key, value in saved_search.get('options', {}).items():
            if value:
                search_args.append(f'--{key.replace("_", "-")}')
        
        # Add format and limit
        search_args.extend(['--format', args.format])
        if args.limit:
            search_args.extend(['--limit', str(args.limit)])
        
        # Execute search
        result = await search_command.execute(context, search_args)
        
        # Update usage statistics
        await self._update_search_usage(context, args.name)
        
        return result
    
    async def _show_saved_search(self, context, args) -> CommandResult:
        """Show details of a saved search"""
        saved_search = await self._find_saved_search(context, args.name)
        
        if not saved_search:
            return CommandResult(
                success=False,
                message=f"Saved search '{args.name}' not found"
            )
        
        context.formatter.header(f"Saved Search: {saved_search['name']}", level=2)
        
        # Basic information
        basic_info = {
            'Name': saved_search['name'],
            'Query': saved_search['query'],
            'Type': saved_search.get('type', 'all').title(),
            'Created': saved_search['created'][:16],
            'Last Used': saved_search.get('last_used', 'Never')[:16],
            'Use Count': saved_search.get('use_count', 0)
        }
        context.formatter.key_value_pairs(basic_info)
        
        # Filters
        if args.details and saved_search.get('filters'):
            context.formatter.header("Filters", level=3)
            filters = {k: v for k, v in saved_search['filters'].items() if v}
            if filters:
                context.formatter.key_value_pairs(filters, indent=1)
            else:
                context.formatter.info("  No filters applied")
        
        # Options
        if args.details and saved_search.get('options'):
            context.formatter.header("Options", level=3)
            options = {k.replace('_', ' ').title(): v for k, v in saved_search['options'].items() if v}
            if options:
                context.formatter.key_value_pairs(options, indent=1)
            else:
                context.formatter.info("  No special options")
        
        return CommandResult(
            success=True,
            data={'saved_search': saved_search}
        )
    
    async def _delete_saved_search(self, context, args) -> CommandResult:
        """Delete a saved search"""
        saved_search = await self._find_saved_search(context, args.name)
        
        if not saved_search:
            return CommandResult(
                success=False,
                message=f"Saved search '{args.name}' not found"
            )
        
        # Confirm deletion
        if not args.force:
            if not self.confirm_action(
                f"Delete saved search '{args.name}'?", 
                default=False
            ):
                return CommandResult(
                    success=False,
                    message="Deletion cancelled"
                )
        
        # Delete the search
        await self._remove_saved_search(context, args.name)
        
        context.formatter.success(f"Saved search '{args.name}' deleted successfully")
        
        return CommandResult(
            success=True,
            message=f"Saved search '{args.name}' deleted"
        )
    
    async def _find_saved_search(self, context, name: str) -> Optional[Dict[str, Any]]:
        """Find a saved search by name"""
        # Mock implementation - replace with actual database query
        saved_searches = {
            'python-basics': {
                'name': 'python-basics',
                'query': 'python basics',
                'type': 'content',
                'created': '2024-01-15T10:30:00',
                'last_used': '2024-01-20T14:22:00',
                'use_count': 12,
                'filters': {
                    'difficulty': 'beginner',
                    'tags': ['python']
                },
                'options': {
                    'fuzzy': True
                }
            }
        }
        
        return saved_searches.get(name)
    
    async def _update_search_usage(self, context, name: str):
        """Update usage statistics for saved search"""
        # Mock implementation - replace with actual database update
        pass
    
    async def _remove_saved_search(self, context, name: str):
        """Remove saved search from storage"""
        # Mock implementation - replace with actual database deletion
        pass


