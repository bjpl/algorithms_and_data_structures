#!/usr/bin/env python3
"""CurriculumShowCommand - Extracted from curriculum_commands.py"""

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



class CurriculumShowCommand(BaseCommand):
    """Show detailed curriculum information"""
    
    def get_metadata(self) -> CommandMetadata:
        return CommandMetadata(
            name="curriculum-show",
            description="Show detailed information about a curriculum",
            category=CommandCategory.CURRICULUM,
            aliases=["curr-show", "show-curr"],
            examples=[
                "curriculum-show 123",
                "curriculum-show --name 'Python Fundamentals'",
                "curriculum-show 123 --format json",
                "curriculum-show 123 --include-modules"
            ]
        )
    
    def setup_parser(self, subparsers):
        parser = self.create_subparser(
            subparsers,
            help="Show detailed curriculum information"
        )
        
        # Identification
        parser.add_argument(
            'identifier',
            nargs='?',
            help='Curriculum ID or name'
        )
        parser.add_argument(
            '--name',
            help='Find curriculum by name'
        )
        parser.add_argument(
            '--id',
            type=int,
            help='Find curriculum by ID'
        )
        
        # Display options
        parser.add_argument(
            '--format',
            choices=['detailed', 'json', 'summary'],
            default='detailed',
            help='Output format'
        )
        parser.add_argument(
            '--include-modules',
            action='store_true',
            help='Include module details'
        )
        parser.add_argument(
            '--include-stats',
            action='store_true',
            help='Include statistics'
        )
        
        return parser
    
    async def execute(self, context, args: List[str]) -> CommandResult:
        try:
            parsed_args = self.parse_args(args)
            
            # Determine curriculum identifier
            curriculum_id = None
            curriculum_name = None
            
            if parsed_args.identifier:
                if parsed_args.identifier.isdigit():
                    curriculum_id = int(parsed_args.identifier)
                else:
                    curriculum_name = parsed_args.identifier
            elif parsed_args.id:
                curriculum_id = parsed_args.id
            elif parsed_args.name:
                curriculum_name = parsed_args.name
            else:
                return CommandResult(
                    success=False,
                    message="Please specify curriculum ID or name"
                )
            
            # Find curriculum
            curriculum = await self._find_curriculum(context, curriculum_id, curriculum_name)
            
            if not curriculum:
                return CommandResult(
                    success=False,
                    message="Curriculum not found"
                )
            
            # Display curriculum
            if parsed_args.format == 'json':
                output = json.dumps(curriculum, indent=2, default=str)
                print(output)
            elif parsed_args.format == 'summary':
                self._show_summary(context.formatter, curriculum)
            else:
                self._show_detailed(context.formatter, curriculum, parsed_args)
            
            return CommandResult(
                success=True,
                data={'curriculum': curriculum}
            )
            
        except Exception as e:
            return CommandResult(
                success=False,
                message=f"Failed to show curriculum: {e}",
                error=e
            )
    
    async def _find_curriculum(self, context, curriculum_id: Optional[int], 
                              curriculum_name: Optional[str]) -> Optional[Dict[str, Any]]:
        """Find curriculum by ID or name"""
        # Mock data - replace with actual database query
        curricula = [
            {
                'id': 1,
                'name': 'Python Fundamentals',
                'description': 'Learn Python programming from basics to advanced concepts',
                'status': 'active',
                'difficulty': 'beginner',
                'category': 'Programming',
                'author': 'Jane Smith',
                'tags': ['python', 'programming', 'fundamentals'],
                'created': '2024-01-15T10:30:00',
                'updated': '2024-02-01T14:22:00',
                'modules': [
                    {'id': 1, 'name': 'Introduction to Python', 'order': 1, 'status': 'published'},
                    {'id': 2, 'name': 'Variables and Data Types', 'order': 2, 'status': 'published'},
                    {'id': 3, 'name': 'Control Structures', 'order': 3, 'status': 'draft'}
                ],
                'students': 245,
                'completion_rate': 78.5,
                'average_rating': 4.6,
                'total_duration': '120 hours'
            }
        ]
        
        for curriculum in curricula:
            if curriculum_id and curriculum['id'] == curriculum_id:
                return curriculum
            elif curriculum_name and curriculum_name.lower() in curriculum['name'].lower():
                return curriculum
        
        return None
    
    def _show_detailed(self, formatter: TerminalFormatter, curriculum: Dict[str, Any], args):
        """Show detailed curriculum information with enhanced formatting"""
        # Use banner style for main title
        formatter.header(curriculum['name'], level=1, style="banner", 
                        subtitle=f"{curriculum['category']} | {curriculum['difficulty'].title()}")
        
        # Use a decorative frame for the description
        formatter.box(
            curriculum['description'],
            title="📚 What You'll Learn",
            style="double",
            padding=2,
            color=formatter.theme.primary if hasattr(formatter, 'theme') else None
        )
        
        # Basic information in a panel
        basic_info_content = []
        basic_info_content.append(f"Status: {curriculum['status'].upper()}")
        basic_info_content.append(f"Author: {curriculum['author']}")
        basic_info_content.append(f"Created: {curriculum['created']}")
        basic_info_content.append(f"Updated: {curriculum['updated']}")
        
        sections = [("📊 Course Details", "\n".join(basic_info_content))]
        
        # Add tags if present
        if curriculum.get('tags'):
            tags_content = " • ".join([f"#{tag}" for tag in curriculum['tags']])
            sections.append(("🏷️ Topics Covered", tags_content))
        
        # Add statistics if requested
        if args.include_stats and 'students' in curriculum:
            stats_lines = []
            stats_lines.append(f"👥 Students Enrolled: {curriculum.get('students', 0)}")
            stats_lines.append(f"✅ Completion Rate: {curriculum.get('completion_rate', 0)}%")
            stats_lines.append(f"⭐ Average Rating: {curriculum.get('average_rating', 0)}/5.0")
            stats_lines.append(f"⏱️ Total Duration: {curriculum.get('total_duration', 'Not specified')}")
            sections.append(("📈 Performance Metrics", "\n".join(stats_lines)))
        
        # Display all sections in a panel
        formatter.panel(sections, title="CURRICULUM OVERVIEW")
        
        # Modules with enhanced formatting
        if args.include_modules and curriculum.get('modules'):
            formatter.header("📚 Course Modules", level=2)
            
            for i, module in enumerate(curriculum['modules'], 1):
                status_icon = "✅" if module['status'] == 'published' else "🔄" if module['status'] == 'draft' else "⏸️"
                module_line = f"  {i}. {status_icon} {module['name']}"
                
                if module['status'] == 'published':
                    formatter.success(module_line)
                elif module['status'] == 'draft':
                    formatter.warning(module_line)
                else:
                    formatter.info(module_line)
            
            # Add a progress visualization
            published_count = sum(1 for m in curriculum['modules'] if m['status'] == 'published')
            total_count = len(curriculum['modules'])
            progress_pct = (published_count / total_count * 100) if total_count > 0 else 0
            
            progress_bar = formatter.progress_with_eta(
                current=published_count,
                total=total_count,
                description="Module Completion"
            )
            print(f"\n{progress_bar}")
    
    def _show_summary(self, formatter: TerminalFormatter, curriculum: Dict[str, Any]):
        """Show curriculum summary"""
        formatter.info(f"ID: {curriculum['id']} | {curriculum['name']}")
        formatter.info(f"Status: {curriculum['status'].upper()} | Difficulty: {curriculum['difficulty'].title()}")
        formatter.info(f"Category: {curriculum['category']} | Author: {curriculum['author']}")
        if curriculum.get('students'):
            formatter.info(f"Students: {curriculum['students']} | Modules: {len(curriculum.get('modules', []))}")


