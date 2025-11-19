#!/usr/bin/env python3
"""CurriculumListCommand - Extracted from curriculum_commands.py"""

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



class CurriculumListCommand(BaseCommand):
    """List all curricula with filtering and sorting options"""
    
    def get_metadata(self) -> CommandMetadata:
        return CommandMetadata(
            name="curriculum-list",
            description="List all curricula with filtering and sorting",
            category=CommandCategory.CURRICULUM,
            aliases=["curr-list", "list-curr"],
            examples=[
                "curriculum-list",
                "curriculum-list --status active",
                "curriculum-list --format json",
                "curriculum-list --sort name --order desc",
                "curriculum-list --tag python --difficulty beginner"
            ]
        )
    
    def setup_parser(self, subparsers):
        parser = self.create_subparser(
            subparsers,
            help="List all curricula with optional filtering"
        )
        
        # Filtering options
        parser.add_argument(
            '--status', 
            choices=['active', 'draft', 'archived', 'published'],
            help='Filter by curriculum status'
        )
        parser.add_argument(
            '--difficulty',
            choices=['beginner', 'intermediate', 'advanced', 'expert'],
            help='Filter by difficulty level'
        )
        parser.add_argument(
            '--tag',
            action='append',
            help='Filter by tags (can be used multiple times)'
        )
        parser.add_argument(
            '--author',
            help='Filter by author name'
        )
        parser.add_argument(
            '--category',
            help='Filter by category'
        )
        
        # Sorting options
        parser.add_argument(
            '--sort',
            choices=['name', 'created', 'updated', 'difficulty', 'status'],
            default='name',
            help='Sort field (default: name)'
        )
        parser.add_argument(
            '--order',
            choices=['asc', 'desc'],
            default='asc',
            help='Sort order (default: asc)'
        )
        
        # Output options
        parser.add_argument(
            '--format',
            choices=['table', 'json', 'summary'],
            default='table',
            help='Output format (default: table)'
        )
        parser.add_argument(
            '--limit',
            type=int,
            help='Maximum number of results'
        )
        parser.add_argument(
            '--search',
            help='Search in curriculum names and descriptions'
        )
        
        return parser
    
    async def execute(self, context, args: List[str]) -> CommandResult:
        try:
            parsed_args = self.parse_args(args)
            
            # Mock data for demonstration - replace with actual database queries
            curricula = await self._get_curricula(context, parsed_args)
            
            if not curricula:
                return CommandResult(
                    success=True,
                    message="No curricula found matching the criteria"
                )
            
            # Format output
            if parsed_args.format == 'json':
                output = json.dumps(curricula, indent=2, default=str)
                print(output)
            elif parsed_args.format == 'summary':
                self._show_summary(context.formatter, curricula)
            else:
                self._show_table(context.formatter, curricula)
            
            return CommandResult(
                success=True,
                message=f"Found {len(curricula)} curriculum(s)",
                data={'curricula': curricula}
            )
            
        except Exception as e:
            return CommandResult(
                success=False,
                message=f"Failed to list curricula: {e}",
                error=e
            )
    
    async def _get_curricula(self, context, args) -> List[Dict[str, Any]]:
        """Get curricula with filtering and sorting"""
        # Mock data - replace with actual database query
        mock_curricula = [
            {
                'id': 1,
                'name': 'Python Fundamentals',
                'description': 'Learn Python programming from basics to advanced',
                'status': 'active',
                'difficulty': 'beginner',
                'category': 'Programming',
                'author': 'Jane Smith',
                'tags': ['python', 'programming', 'fundamentals'],
                'created': '2024-01-15',
                'updated': '2024-02-01',
                'modules': 12,
                'students': 245
            },
            {
                'id': 2,
                'name': 'Data Structures & Algorithms',
                'description': 'Master computer science fundamentals',
                'status': 'active',
                'difficulty': 'intermediate',
                'category': 'Computer Science',
                'author': 'John Doe',
                'tags': ['algorithms', 'data-structures', 'computer-science'],
                'created': '2024-01-10',
                'updated': '2024-01-25',
                'modules': 18,
                'students': 189
            },
            {
                'id': 3,
                'name': 'Machine Learning Basics',
                'description': 'Introduction to ML concepts and implementations',
                'status': 'draft',
                'difficulty': 'advanced',
                'category': 'AI/ML',
                'author': 'Alice Johnson',
                'tags': ['machine-learning', 'ai', 'python'],
                'created': '2024-02-01',
                'updated': '2024-02-10',
                'modules': 8,
                'students': 0
            }
        ]
        
        # Apply filters
        filtered_curricula = mock_curricula
        
        if args.status:
            filtered_curricula = [c for c in filtered_curricula if c['status'] == args.status]
        
        if args.difficulty:
            filtered_curricula = [c for c in filtered_curricula if c['difficulty'] == args.difficulty]
        
        if args.tag:
            for tag in args.tag:
                filtered_curricula = [c for c in filtered_curricula if tag in c['tags']]
        
        if args.author:
            filtered_curricula = [c for c in filtered_curricula if args.author.lower() in c['author'].lower()]
        
        if args.category:
            filtered_curricula = [c for c in filtered_curricula if args.category.lower() in c['category'].lower()]
        
        if args.search:
            search_term = args.search.lower()
            filtered_curricula = [
                c for c in filtered_curricula 
                if search_term in c['name'].lower() or search_term in c['description'].lower()
            ]
        
        # Apply sorting
        reverse = args.order == 'desc'
        filtered_curricula.sort(key=lambda x: x.get(args.sort, ''), reverse=reverse)
        
        # Apply limit
        if args.limit:
            filtered_curricula = filtered_curricula[:args.limit]
        
        return filtered_curricula
    
    def _show_table(self, formatter: TerminalFormatter, curricula: List[Dict[str, Any]]):
        """Show curricula in table format"""
        headers = ['ID', 'Name', 'Status', 'Difficulty', 'Category', 'Modules', 'Students']
        
        table_data = []
        for curriculum in curricula:
            table_data.append({
                'ID': curriculum['id'],
                'Name': curriculum['name'][:30] + '...' if len(curriculum['name']) > 30 else curriculum['name'],
                'Status': curriculum['status'].upper(),
                'Difficulty': curriculum['difficulty'].title(),
                'Category': curriculum['category'],
                'Modules': curriculum['modules'],
                'Students': curriculum['students']
            })
        
        formatter.table(table_data, headers)
    
    def _show_summary(self, formatter: TerminalFormatter, curricula: List[Dict[str, Any]]):
        """Show curricula in summary format"""
        for curriculum in curricula:
            formatter.header(curriculum['name'], level=3)
            
            details = {
                'Status': curriculum['status'].upper(),
                'Difficulty': curriculum['difficulty'].title(),
                'Category': curriculum['category'],
                'Author': curriculum['author'],
                'Modules': curriculum['modules'],
                'Students': curriculum['students'],
                'Tags': ', '.join(curriculum['tags'])
            }
            
            formatter.key_value_pairs(details, indent=1)
            formatter.info(f"  Description: {curriculum['description']}")
            print()


