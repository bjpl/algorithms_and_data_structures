#!/usr/bin/env python3
"""CurriculumDeleteCommand - Extracted from curriculum_commands.py"""

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



class CurriculumDeleteCommand(BaseCommand):
    """Delete curriculum with confirmation"""
    
    def get_metadata(self) -> CommandMetadata:
        return CommandMetadata(
            name="curriculum-delete",
            description="Delete a curriculum with confirmation",
            category=CommandCategory.CURRICULUM,
            aliases=["curr-delete", "delete-curr"],
            examples=[
                "curriculum-delete 123",
                "curriculum-delete 123 --force",
                "curriculum-delete --name 'Old Curriculum'"
            ]
        )
    
    def setup_parser(self, subparsers):
        parser = self.create_subparser(
            subparsers,
            help="Delete a curriculum"
        )
        
        # Identification
        parser.add_argument(
            'curriculum_id',
            nargs='?',
            type=int,
            help='Curriculum ID to delete'
        )
        parser.add_argument(
            '--name',
            help='Find curriculum by name to delete'
        )
        
        # Safety options
        parser.add_argument(
            '--cascade',
            action='store_true',
            help='Also delete associated modules and content'
        )
        parser.add_argument(
            '--backup',
            action='store_true',
            default=True,
            help='Create backup before deletion (default)'
        )
        parser.add_argument(
            '--no-backup',
            action='store_true',
            help='Skip backup creation'
        )
        
        return parser
    
    async def execute(self, context, args: List[str]) -> CommandResult:
        try:
            parsed_args = self.parse_args(args)
            
            # Find curriculum
            curriculum_id = parsed_args.curriculum_id
            curriculum_name = parsed_args.name
            
            if not curriculum_id and not curriculum_name:
                return CommandResult(
                    success=False,
                    message="Please specify curriculum ID or name to delete"
                )
            
            curriculum = await self._find_curriculum(context, curriculum_id, curriculum_name)
            if not curriculum:
                return CommandResult(
                    success=False,
                    message="Curriculum not found"
                )
            
            # Show curriculum info
            context.formatter.warning("About to delete curriculum:")
            summary = {
                'ID': curriculum['id'],
                'Name': curriculum['name'],
                'Status': curriculum['status'],
                'Students': curriculum.get('students', 0),
                'Modules': len(curriculum.get('modules', []))
            }
            context.formatter.key_value_pairs(summary)
            
            # Check dependencies
            dependencies = await self._check_dependencies(context, curriculum['id'])
            if dependencies:
                context.formatter.warning("This curriculum has dependencies:")
                context.formatter.list_items(dependencies)
                
                if not parsed_args.cascade:
                    return CommandResult(
                        success=False,
                        message="Cannot delete curriculum with dependencies. Use --cascade to delete all related data."
                    )
            
            # Confirm deletion
            if not parsed_args.force:
                danger_message = f"This will permanently delete curriculum '{curriculum['name']}'"
                if dependencies:
                    danger_message += " and all its dependencies"
                
                if not self.confirm_action(danger_message + ". Are you sure?", default=False):
                    return CommandResult(
                        success=False,
                        message="Deletion cancelled"
                    )
            
            # Create backup if requested
            backup_path = None
            if not parsed_args.no_backup:
                backup_path = await self._create_backup(context, curriculum)
                context.formatter.info(f"Backup created: {backup_path}")
            
            # Perform deletion
            await self._delete_curriculum(context, curriculum['id'], parsed_args.cascade)
            
            context.formatter.success(
                f"Curriculum '{curriculum['name']}' deleted successfully"
            )
            
            return CommandResult(
                success=True,
                message="Curriculum deleted successfully",
                data={'deleted_curriculum_id': curriculum['id'], 'backup_path': backup_path}
            )
            
        except Exception as e:
            return CommandResult(
                success=False,
                message=f"Failed to delete curriculum: {e}",
                error=e
            )
    
    async def _find_curriculum(self, context, curriculum_id: Optional[int], 
                              curriculum_name: Optional[str]) -> Optional[Dict[str, Any]]:
        """Find curriculum by ID or name"""
        # Mock implementation
        curricula = [
            {
                'id': 1,
                'name': 'Python Fundamentals',
                'status': 'active',
                'students': 245,
                'modules': [{'id': 1}, {'id': 2}, {'id': 3}]
            }
        ]
        
        for curriculum in curricula:
            if curriculum_id and curriculum['id'] == curriculum_id:
                return curriculum
            elif curriculum_name and curriculum_name.lower() in curriculum['name'].lower():
                return curriculum
        
        return None
    
    async def _check_dependencies(self, context, curriculum_id: int) -> List[str]:
        """Check for curriculum dependencies"""
        # Mock implementation
        return [
            "245 enrolled students",
            "3 published modules",
            "18 completed assignments"
        ]
    
    async def _create_backup(self, context, curriculum: Dict[str, Any]) -> str:
        """Create backup of curriculum data"""
        # Mock implementation
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_filename = f"curriculum_{curriculum['id']}_{timestamp}.json"
        backup_path = Path("backups") / backup_filename
        
        # In real implementation, save curriculum data to backup file
        backup_path.parent.mkdir(exist_ok=True)
        with open(backup_path, 'w') as f:
            json.dump(curriculum, f, indent=2, default=str)
        
        return str(backup_path)
    
    async def _delete_curriculum(self, context, curriculum_id: int, cascade: bool):
        """Delete curriculum and optionally its dependencies"""
        # Mock implementation - replace with actual database deletion
