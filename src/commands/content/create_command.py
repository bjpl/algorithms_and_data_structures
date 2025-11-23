#!/usr/bin/env python3
"""ContentCreateCommand - Extracted from content_commands.py"""

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




class ContentCreateCommand(BaseCommand):
    """Create new content item with interactive prompts"""
    
    def get_metadata(self) -> CommandMetadata:
        return CommandMetadata(
            name="content-create",
            description="Create a new content item",
            category=CommandCategory.CONTENT,
            aliases=["content-new", "create-content"],
            examples=[
                "content-create",
                "content-create --type lesson --title 'Python Basics'",
                "content-create --curriculum 123 --module 45",
                "content-create --template lesson-with-exercise",
                "content-create --from-file lesson.json"
            ]
        )
    
    def setup_parser(self, subparsers):
        parser = self.create_subparser(
            subparsers,
            help="Create a new content item"
        )
        
        # Basic content information
        parser.add_argument(
            '--type',
            choices=['lesson', 'exercise', 'assessment', 'resource', 'video', 'quiz'],
            help='Content type'
        )
        parser.add_argument(
            '--title',
            help='Content title'
        )
        parser.add_argument(
            '--description',
            help='Content description'
        )
        
        # Organization
        parser.add_argument(
            '--curriculum',
            type=int,
            help='Curriculum ID'
        )
        parser.add_argument(
            '--module',
            type=int,
            help='Module ID'
        )
        parser.add_argument(
            '--order',
            type=int,
            help='Content order within module'
        )
        
        # Content properties
        parser.add_argument(
            '--difficulty',
            choices=['beginner', 'intermediate', 'advanced', 'expert'],
            help='Difficulty level'
        )
        parser.add_argument(
            '--duration',
            help='Estimated duration (e.g., "30 minutes")'
        )
        parser.add_argument(
            '--tags',
            help='Comma-separated tags'
        )
        parser.add_argument(
            '--author',
            help='Author name'
        )
        
        # Creation options
        parser.add_argument(
            '--template',
            help='Use a content template'
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
            
            # Load from file or template if specified
            if getattr(parsed_args, 'from_file', None):
                content_data = await self._load_from_file(parsed_args.from_file)
            elif parsed_args.template:
                content_data = await self._load_template(parsed_args.template)
            else:
                content_data = {}
            
            # Use interactive mode unless disabled
            if not parsed_args.no_interactive:
                content_data = await self._interactive_creation(
                    context.formatter, content_data, parsed_args
                )
            else:
                # Use command line arguments
                content_data.update(self._extract_args_data(parsed_args))
            
            # Validate required fields
            validation_errors = self._validate_content_data(content_data)
            if validation_errors:
                return CommandResult(
                    success=False,
                    message="Validation failed:\n" + "\n".join(validation_errors)
                )
            
            # Show preview and confirm
            if not parsed_args.force:
                context.formatter.header("Content Preview", level=2)
                context.formatter.key_value_pairs(content_data)
                
                if not self.confirm_action("Create this content?", default=True):
                    return CommandResult(
                        success=False,
                        message="Content creation cancelled"
                    )
            
            # Create content
            content_id = await self._create_content(context, content_data)
            
            context.formatter.success(
                f"Content '{content_data['title']}' created successfully (ID: {content_id})"
            )
            
            return CommandResult(
                success=True,
                message=f"Created content with ID {content_id}",
                data={'content_id': content_id, 'content': content_data}
            )
            
        except Exception as e:
            return CommandResult(
                success=False,
                message=f"Failed to create content: {e}",
                error=e
            )
    
    async def _load_from_file(self, file_path: str) -> Dict[str, Any]:
        """Load content data from JSON file"""
        path = Path(file_path)
        if not path.exists():
            raise CLIError(f"File not found: {file_path}")
        
        try:
            with open(path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except json.JSONDecodeError as e:
            raise CLIError(f"Invalid JSON in file {file_path}: {e}")
    
    async def _load_template(self, template_name: str) -> Dict[str, Any]:
        """Load content template"""
        templates = {
            'basic-lesson': {
                'type': 'lesson',
                'difficulty': 'beginner',
                'content_structure': {
                    'introduction': '',
                    'main_content': '',
                    'examples': [],
                    'summary': ''
                }
            },
            'interactive-exercise': {
                'type': 'exercise',
                'difficulty': 'beginner',
                'content_structure': {
                    'instructions': '',
                    'starter_code': '',
                    'solution': '',
                    'tests': []
                }
            },
            'multiple-choice-quiz': {
                'type': 'quiz',
                'difficulty': 'beginner',
                'content_structure': {
                    'questions': [],
                    'time_limit': 30,
                    'passing_score': 70
                }
            }
        }
        
        if template_name not in templates:
            raise CLIError(f"Unknown template: {template_name}. Available: {list(templates.keys())}")
        
        return templates[template_name]
    
    async def _interactive_creation(self, formatter: TerminalFormatter, 
                                   initial_data: Dict[str, Any],
                                   parsed_args) -> Dict[str, Any]:
        """Interactive content creation"""
        formatter.header("Interactive Content Creation", level=2)
        
        content_data = initial_data.copy()
        
        # Content type
        if 'type' not in content_data:
            types = ['lesson', 'exercise', 'assessment', 'resource', 'video', 'quiz']
            formatter.info("Content types:")
            for i, content_type in enumerate(types, 1):
                formatter.info(f"  {i}. {content_type.title()}")
            
            while True:
                try:
                    choice = input("Select content type (1-6): ").strip()
                    if choice.isdigit() and 1 <= int(choice) <= 6:
                        content_data['type'] = types[int(choice) - 1]
                        break
                    else:
                        formatter.warning("Please enter a number between 1 and 6")
                except ValueError:
                    formatter.warning("Please enter a valid number")
        
        # Title
        if 'title' not in content_data:
            while True:
                title = input("Content title: ").strip()
                if title:
                    content_data['title'] = title
                    break
                formatter.warning("Title is required")
        
        # Description
        if 'description' not in content_data:
            description = input("Description: ").strip()
            if description:
                content_data['description'] = description
        
        # Curriculum and module
        if 'curriculum_id' not in content_data:
            curriculum_id = input("Curriculum ID (optional): ").strip()
            if curriculum_id.isdigit():
                content_data['curriculum_id'] = int(curriculum_id)
        
        if 'module_id' not in content_data:
            module_id = input("Module ID (optional): ").strip()
            if module_id.isdigit():
                content_data['module_id'] = int(module_id)
        
        # Difficulty
        if 'difficulty' not in content_data:
            difficulties = ['beginner', 'intermediate', 'advanced', 'expert']
            formatter.info("Difficulty levels:")
            for i, diff in enumerate(difficulties, 1):
                formatter.info(f"  {i}. {diff.title()}")
            
            while True:
                try:
                    choice = input("Select difficulty (1-4): ").strip()
                    if choice.isdigit() and 1 <= int(choice) <= 4:
                        content_data['difficulty'] = difficulties[int(choice) - 1]
                        break
                    else:
                        formatter.warning("Please enter a number between 1 and 4")
                except ValueError:
                    formatter.warning("Please enter a valid number")
        
        # Duration
        if 'duration' not in content_data:
            duration = input("Estimated duration (e.g., '30 minutes'): ").strip()
            if duration:
                content_data['duration'] = duration
        
        # Author
        if 'author' not in content_data:
            author = input("Author name: ").strip()
            if author:
                content_data['author'] = author
        
        # Tags
        if 'tags' not in content_data:
            tags_input = input("Tags (comma-separated): ").strip()
            if tags_input:
                content_data['tags'] = [tag.strip() for tag in tags_input.split(',')]
        
        # Set defaults
        content_data.setdefault('status', 'draft')
        content_data.setdefault('created', datetime.now().isoformat())
        
        return content_data
    
    def _extract_args_data(self, parsed_args) -> Dict[str, Any]:
        """Extract content data from command line arguments"""
        data = {}
        
        if parsed_args.type:
            data['type'] = parsed_args.type
        if parsed_args.title:
            data['title'] = parsed_args.title
        if parsed_args.description:
            data['description'] = parsed_args.description
        if parsed_args.curriculum:
            data['curriculum_id'] = parsed_args.curriculum
        if parsed_args.module:
            data['module_id'] = parsed_args.module
        if parsed_args.order:
            data['order'] = parsed_args.order
        if parsed_args.difficulty:
            data['difficulty'] = parsed_args.difficulty
        if parsed_args.duration:
            data['duration'] = parsed_args.duration
        if parsed_args.author:
            data['author'] = parsed_args.author
        if parsed_args.tags:
            data['tags'] = [tag.strip() for tag in parsed_args.tags.split(',')]
        
        # Set defaults
        data.setdefault('status', 'draft')
        data.setdefault('created', datetime.now().isoformat())
        
        return data
    
    def _validate_content_data(self, data: Dict[str, Any]) -> List[str]:
        """Validate content data"""
        errors = []
        
        if not data.get('title'):
            errors.append("Title is required")
        
        if not data.get('type'):
            errors.append("Content type is required")
        elif data['type'] not in ['lesson', 'exercise', 'assessment', 'resource', 'video', 'quiz']:
            errors.append("Invalid content type")
        
        if 'difficulty' in data and data['difficulty'] not in ['beginner', 'intermediate', 'advanced', 'expert']:
            errors.append("Invalid difficulty level")
        
        if 'status' in data and data['status'] not in ['draft', 'review', 'published', 'archived']:
            errors.append("Invalid status")
        
        return errors
    
    async def _create_content(self, context, content_data: Dict[str, Any]) -> int:
        """Create the content in the database"""
        # Mock implementation - replace with actual database creation
        content_id = hash(content_data['title'] + str(datetime.now())) % 10000
        
        # In a real implementation, this would save to database
        # content = Content(**content_data)
        # await content.save()
        
        return content_id


