#!/usr/bin/env python3
"""CurriculumCreateCommand - Extracted from curriculum_commands.py"""

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



class CurriculumCreateCommand(BaseCommand):
    """Create new curriculum with interactive prompts"""
    
    def get_metadata(self) -> CommandMetadata:
        return CommandMetadata(
            name="curriculum-create",
            description="Create a new curriculum interactively",
            category=CommandCategory.CURRICULUM,
            aliases=["curr-create", "create-curr"],
            examples=[
                "curriculum-create",
                "curriculum-create --name 'Advanced Python' --difficulty advanced",
                "curriculum-create --template basic-programming",
                "curriculum-create --from-file curriculum.json"
            ]
        )
    
    def setup_parser(self, subparsers):
        parser = self.create_subparser(
            subparsers,
            help="Create a new curriculum"
        )
        
        # Direct creation options
        parser.add_argument(
            '--name',
            help='Curriculum name'
        )
        parser.add_argument(
            '--description',
            help='Curriculum description'
        )
        parser.add_argument(
            '--difficulty',
            choices=['beginner', 'intermediate', 'advanced', 'expert'],
            help='Difficulty level'
        )
        parser.add_argument(
            '--category',
            help='Curriculum category'
        )
        parser.add_argument(
            '--tags',
            help='Comma-separated tags'
        )
        parser.add_argument(
            '--author',
            help='Author name'
        )
        
        # Template and import options
        parser.add_argument(
            '--template',
            help='Use a template for creation'
        )
        parser.add_argument(
            '--from-file',
            help='Create from JSON file'
        )
        parser.add_argument(
            '--interactive',
            action='store_true',
            default=True,
            help='Use interactive mode (default)'
        )
        parser.add_argument(
            '--no-interactive',
            action='store_true',
            help='Skip interactive prompts'
        )
        
        return parser
    
    async def execute(self, context, args: List[str]) -> CommandResult:
        try:
            parsed_args = self.parse_args(args)
            
            # Load from file if specified
            if getattr(parsed_args, 'from_file', None):
                curriculum_data = await self._load_from_file(parsed_args.from_file)
            elif parsed_args.template:
                curriculum_data = await self._load_template(parsed_args.template)
            else:
                curriculum_data = {}
            
            # Use interactive mode unless disabled
            if not parsed_args.no_interactive:
                curriculum_data = await self._interactive_creation(
                    context.formatter, curriculum_data, parsed_args
                )
            else:
                # Use command line arguments
                curriculum_data.update(self._extract_args_data(parsed_args))
            
            # Validate required fields
            validation_errors = self._validate_curriculum_data(curriculum_data)
            if validation_errors:
                return CommandResult(
                    success=False,
                    message="Validation failed:\n" + "\n".join(validation_errors)
                )
            
            # Show preview and confirm
            if not parsed_args.force:
                context.formatter.header("Curriculum Preview", level=2)
                context.formatter.key_value_pairs(curriculum_data)
                
                if not self.confirm_action("Create this curriculum?", default=True):
                    return CommandResult(
                        success=False,
                        message="Curriculum creation cancelled"
                    )
            
            # Create curriculum
            curriculum_id = await self._create_curriculum(context, curriculum_data)
            
            context.formatter.success(
                f"Curriculum '{curriculum_data['name']}' created successfully (ID: {curriculum_id})"
            )
            
            return CommandResult(
                success=True,
                message=f"Created curriculum with ID {curriculum_id}",
                data={'curriculum_id': curriculum_id, 'curriculum': curriculum_data}
            )
            
        except Exception as e:
            return CommandResult(
                success=False,
                message=f"Failed to create curriculum: {e}",
                error=e
            )
    
    async def _load_from_file(self, file_path: str) -> Dict[str, Any]:
        """Load curriculum data from JSON file"""
        path = Path(file_path)
        if not path.exists():
            raise CLIError(f"File not found: {file_path}")
        
        try:
            with open(path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except json.JSONDecodeError as e:
            raise CLIError(f"Invalid JSON in file {file_path}: {e}")
    
    async def _load_template(self, template_name: str) -> Dict[str, Any]:
        """Load curriculum template"""
        templates = {
            'basic-programming': {
                'category': 'Programming',
                'difficulty': 'beginner',
                'tags': ['programming', 'fundamentals'],
                'modules': []
            },
            'data-science': {
                'category': 'Data Science',
                'difficulty': 'intermediate',
                'tags': ['data-science', 'python', 'statistics'],
                'modules': []
            },
            'web-development': {
                'category': 'Web Development',
                'difficulty': 'beginner',
                'tags': ['web', 'html', 'css', 'javascript'],
                'modules': []
            }
        }
        
        if template_name not in templates:
            raise CLIError(f"Unknown template: {template_name}. Available: {list(templates.keys())}")
        
        return templates[template_name]
    
    async def _interactive_creation(self, formatter: TerminalFormatter, 
                                   initial_data: Dict[str, Any],
                                   parsed_args) -> Dict[str, Any]:
        """Interactive curriculum creation"""
        formatter.header("Interactive Curriculum Creation", level=2)
        
        curriculum_data = initial_data.copy()
        
        # Get basic information
        if 'name' not in curriculum_data:
            while True:
                name = input("Curriculum name: ").strip()
                if name:
                    curriculum_data['name'] = name
                    break
                formatter.warning("Name is required")
        
        if 'description' not in curriculum_data:
            description = input(f"Description (optional): ").strip()
            if description:
                curriculum_data['description'] = description
        
        # Get difficulty level
        if 'difficulty' not in curriculum_data:
            difficulties = ['beginner', 'intermediate', 'advanced', 'expert']
            formatter.info("Available difficulty levels:")
            for i, diff in enumerate(difficulties, 1):
                formatter.info(f"  {i}. {diff.title()}")
            
            while True:
                try:
                    choice = input("Select difficulty (1-4): ").strip()
                    if choice.isdigit() and 1 <= int(choice) <= 4:
                        curriculum_data['difficulty'] = difficulties[int(choice) - 1]
                        break
                    else:
                        formatter.warning("Please enter a number between 1 and 4")
                except ValueError:
                    formatter.warning("Please enter a valid number")
        
        # Get category
        if 'category' not in curriculum_data:
            category = input("Category (e.g., Programming, Data Science): ").strip()
            if category:
                curriculum_data['category'] = category
        
        # Get author
        if 'author' not in curriculum_data:
            author = input("Author name: ").strip()
            if author:
                curriculum_data['author'] = author
        
        # Get tags
        if 'tags' not in curriculum_data:
            tags_input = input("Tags (comma-separated): ").strip()
            if tags_input:
                curriculum_data['tags'] = [tag.strip() for tag in tags_input.split(',')]
        
        # Set defaults
        curriculum_data.setdefault('status', 'draft')
        curriculum_data.setdefault('created', datetime.now().isoformat())
        curriculum_data.setdefault('modules', [])
        
        return curriculum_data
    
    def _extract_args_data(self, parsed_args) -> Dict[str, Any]:
        """Extract curriculum data from command line arguments"""
        data = {}
        
        if parsed_args.name:
            data['name'] = parsed_args.name
        if parsed_args.description:
            data['description'] = parsed_args.description
        if parsed_args.difficulty:
            data['difficulty'] = parsed_args.difficulty
        if parsed_args.category:
            data['category'] = parsed_args.category
        if parsed_args.author:
            data['author'] = parsed_args.author
        if parsed_args.tags:
            data['tags'] = [tag.strip() for tag in parsed_args.tags.split(',')]
        
        # Set defaults
        data.setdefault('status', 'draft')
        data.setdefault('created', datetime.now().isoformat())
        data.setdefault('modules', [])
        
        return data
    
    def _validate_curriculum_data(self, data: Dict[str, Any]) -> List[str]:
        """Validate curriculum data"""
        errors = []
        
        if not data.get('name'):
            errors.append("Name is required")
        
        if 'difficulty' in data and data['difficulty'] not in ['beginner', 'intermediate', 'advanced', 'expert']:
            errors.append("Invalid difficulty level")
        
        if 'status' in data and data['status'] not in ['draft', 'active', 'archived', 'published']:
            errors.append("Invalid status")
        
        return errors
    
    async def _create_curriculum(self, context, curriculum_data: Dict[str, Any]) -> int:
        """Create the curriculum in the database"""
        # Mock implementation - replace with actual database creation
        curriculum_id = hash(curriculum_data['name'] + str(datetime.now())) % 10000
        
        # In a real implementation, this would save to database
        # curriculum = Curriculum(**curriculum_data)
        # await curriculum.save()
        
        return curriculum_id


