#!/usr/bin/env python3
"""UserManagementCommand - Extracted from admin_commands.py"""

#!/usr/bin/env python3
"""
Admin Commands - Administrative operations and system management

This module provides:
- User management (create, update, delete, list users)
- System configuration management

# Helper functions moved to user_management_command_helpers.py
# from .user_management_command_helpers import *

- Database maintenance and backups
- Log management and monitoring
- Permission and role management
- System health checks and diagnostics
- Bulk operations and data migration
"""

import json
import asyncio
from typing import List, Optional, Dict, Any
from pathlib import Path
from datetime import datetime, timedelta

from .base import BaseCommand, CommandResult, CommandMetadata, CommandCategory
from ..ui.formatter_compat import TerminalFormatter
from ..models.user import User
from ..core.exceptions import CLIError




class UserManagementCommand(BaseCommand):
    """Manage users in the system"""
    
    def get_metadata(self) -> CommandMetadata:
        return CommandMetadata(
            name="user-manage",
            description="Manage users in the system",
            category=CommandCategory.ADMIN,
            aliases=["users", "user-admin"],
            examples=[
                "user-manage list",
                "user-manage create --email user@example.com --role student",
                "user-manage update 123 --role instructor",
                "user-manage delete 123",
                "user-manage bulk-import users.json"
            ]
        )
    
    def setup_parser(self, subparsers):
        parser = self.create_subparser(
            subparsers,
            help="Manage system users"
        )
        
        # Subcommands
        subcommands = parser.add_subparsers(dest='action', help='User management actions')
        
        # List users
        list_parser = subcommands.add_parser('list', help='List users')
        list_parser.add_argument('--role', choices=['student', 'instructor', 'admin'], help='Filter by role')
        list_parser.add_argument('--status', choices=['active', 'inactive', 'suspended'], help='Filter by status')
        list_parser.add_argument('--format', choices=['table', 'json'], default='table')
        list_parser.add_argument('--limit', type=int, help='Limit number of results')
        list_parser.add_argument('--include-stats', action='store_true', help='Include user statistics')
        
        # Create user
        create_parser = subcommands.add_parser('create', help='Create new user')
        create_parser.add_argument('--email', required=True, help='User email')
        create_parser.add_argument('--name', help='Full name')
        create_parser.add_argument('--role', choices=['student', 'instructor', 'admin'], default='student')
        create_parser.add_argument('--password', help='Initial password (will be prompted if not provided)')
        create_parser.add_argument('--send-welcome', action='store_true', help='Send welcome email')
        
        # Update user
        update_parser = subcommands.add_parser('update', help='Update user')
        update_parser.add_argument('user_id', type=int, help='User ID to update')
        update_parser.add_argument('--email', help='New email')
        update_parser.add_argument('--name', help='New full name')
        update_parser.add_argument('--role', choices=['student', 'instructor', 'admin'], help='New role')
        update_parser.add_argument('--status', choices=['active', 'inactive', 'suspended'], help='New status')
        update_parser.add_argument('--reset-password', action='store_true', help='Reset password')
        
        # Delete user
        delete_parser = subcommands.add_parser('delete', help='Delete user')
        delete_parser.add_argument('user_id', type=int, help='User ID to delete')
        delete_parser.add_argument('--archive', action='store_true', help='Archive instead of delete')
        
        # Show user details
        show_parser = subcommands.add_parser('show', help='Show user details')
        show_parser.add_argument('user_id', type=int, help='User ID to show')
        show_parser.add_argument('--include-activity', action='store_true', help='Include recent activity')
        show_parser.add_argument('--include-progress', action='store_true', help='Include learning progress')
        
        # Bulk operations
        bulk_import_parser = subcommands.add_parser('bulk-import', help='Bulk import users')
        bulk_import_parser.add_argument('file', help='JSON/CSV file with user data')
        bulk_import_parser.add_argument('--format', choices=['json', 'csv'], help='File format (auto-detected if not specified)')
        bulk_import_parser.add_argument('--dry-run', action='store_true', help='Preview import without creating users')
        
        bulk_export_parser = subcommands.add_parser('bulk-export', help='Bulk export users')
        bulk_export_parser.add_argument('--format', choices=['json', 'csv'], default='json')
        bulk_export_parser.add_argument('--output', help='Output file path')
        bulk_export_parser.add_argument('--filter', help='Filter criteria (JSON)')
        
        return parser
    
    async def execute(self, context, args: List[str]) -> CommandResult:
        try:
            parsed_args = self.parse_args(args)
            
            if not parsed_args.action:
                return CommandResult(
                    success=False,
                    message="Please specify an action: list, create, update, delete, show, bulk-import, or bulk-export"
                )
            
            # Check admin permissions
            if not await self._check_admin_permissions(context):
                return CommandResult(
                    success=False,
                    message="Admin permissions required for user management"
                )
            
            if parsed_args.action == 'list':
                return await self._list_users(context, parsed_args)
            elif parsed_args.action == 'create':
                return await self._create_user(context, parsed_args)
            elif parsed_args.action == 'update':
                return await self._update_user(context, parsed_args)
            elif parsed_args.action == 'delete':
                return await self._delete_user(context, parsed_args)
            elif parsed_args.action == 'show':
                return await self._show_user(context, parsed_args)
            elif parsed_args.action == 'bulk-import':
                return await self._bulk_import_users(context, parsed_args)
            elif parsed_args.action == 'bulk-export':
                return await self._bulk_export_users(context, parsed_args)
            
        except Exception as e:
            return CommandResult(
                success=False,
                message=f"User management operation failed: {e}",
                error=e
            )
    
    async def _check_admin_permissions(self, context) -> bool:
        """Check if current user has admin permissions"""
        # Mock implementation - replace with actual permission check
        return True
    
    async def _list_users(self, context, args) -> CommandResult:
        """List users with filtering"""
        # Mock data - replace with actual database query
        users = [
            {
                'id': 1,
                'email': 'alice.johnson@example.com',
                'name': 'Alice Johnson',
                'role': 'student',
                'status': 'active',
                'created': '2024-01-10T09:00:00',
                'last_login': '2024-01-22T14:30:00',
                'curricula_enrolled': 3,
                'completion_rate': 78.5
            },
            {
                'id': 2,
                'email': 'bob.smith@example.com',
                'name': 'Bob Smith',
                'role': 'student',
                'status': 'active',
                'created': '2024-01-12T11:15:00',
                'last_login': '2024-01-21T16:45:00',
                'curricula_enrolled': 2,
                'completion_rate': 92.3
            },
            {
                'id': 3,
                'email': 'jane.doe@example.com',
                'name': 'Dr. Jane Doe',
                'role': 'instructor',
                'status': 'active',
                'created': '2024-01-05T08:30:00',
                'last_login': '2024-01-22T10:20:00',
                'courses_taught': 5,
                'students_taught': 245
            },
            {
                'id': 4,
                'email': 'admin@example.com',
                'name': 'System Admin',
                'role': 'admin',
                'status': 'active',
                'created': '2024-01-01T00:00:00',
                'last_login': '2024-01-22T09:00:00'
            }
        ]
        
        # Apply filters
        if args.role:
            users = [u for u in users if u['role'] == args.role]
        if args.status:
            users = [u for u in users if u['status'] == args.status]
        
        # Apply limit
        if args.limit:
            users = users[:args.limit]
        
        if not users:
            return CommandResult(
                success=True,
                message="No users found matching criteria"
            )
        
        # Display results
        if args.format == 'json':
            output = json.dumps(users, indent=2, default=str)
            print(output)
        else:
            context.formatter.header(f"Users ({len(users)})", level=2)
            
            if args.include_stats:
                headers = ['ID', 'Name', 'Email', 'Role', 'Status', 'Stats', 'Last Login']
            else:
                headers = ['ID', 'Name', 'Email', 'Role', 'Status', 'Last Login']
            
            table_data = []
            for user in users:
                row = {
                    'ID': user['id'],
                    'Name': user['name'],
                    'Email': user['email'],
                    'Role': user['role'].title(),
                    'Status': user['status'].upper(),
                    'Last Login': user.get('last_login', 'Never')[:10] if user.get('last_login') else 'Never'
                }
                
                if args.include_stats:
                    if user['role'] == 'student':
                        stats = f"{user.get('curricula_enrolled', 0)} enrolled, {user.get('completion_rate', 0):.0f}% complete"
                    elif user['role'] == 'instructor':
                        stats = f"{user.get('courses_taught', 0)} courses, {user.get('students_taught', 0)} students"
                    else:
                        stats = 'N/A'
                    row['Stats'] = stats
                
                table_data.append(row)
            
            context.formatter.table(table_data, headers)
        
        return CommandResult(
            success=True,
            message=f"Found {len(users)} user(s)",
            data={'users': users}
        )
    
    async def _create_user(self, context, args) -> CommandResult:
        """Create a new user"""
        # Validate email format
        if '@' not in args.email:
            return CommandResult(
                success=False,
                message="Invalid email format"
            )
        
        # Check if user already exists
        existing_user = await self._find_user_by_email(context, args.email)
        if existing_user:
            return CommandResult(
                success=False,
                message=f"User with email {args.email} already exists"
            )
        
        # Get password if not provided
        password = args.password
        if not password:
            import getpass
            password = getpass.getpass("Enter password for new user: ")
            if not password:
                return CommandResult(
                    success=False,
                    message="Password is required"
                )
        
        # Create user data
        user_data = {
            'email': args.email,
            'name': args.name or args.email.split('@')[0],
            'role': args.role,
            'password': password,  # Should be hashed in real implementation
            'status': 'active',
            'created': datetime.now().isoformat()
        }
        
        # Show preview
        if not args.force:
            context.formatter.header("User Creation Preview", level=2)
            preview_data = user_data.copy()
            preview_data['password'] = '***HIDDEN***'
            context.formatter.key_value_pairs(preview_data)
            
            if not self.confirm_action("Create this user?", default=True):
                return CommandResult(
                    success=False,
                    message="User creation cancelled"
                )
        
        # Create user
        user_id = await self._create_user_in_db(context, user_data)
        
        # Send welcome email if requested
        if args.send_welcome:
            await self._send_welcome_email(context, user_id, args.email)
            context.formatter.info("Welcome email sent")
        
        context.formatter.success(f"User created successfully (ID: {user_id})")
        
        return CommandResult(
            success=True,
            message=f"User created with ID {user_id}",
            data={'user_id': user_id, 'email': args.email}
        )
    
    async def _update_user(self, context, args) -> CommandResult:
        """Update an existing user"""
        # Find user
        user = await self._find_user_by_id(context, args.user_id)
        if not user:
            return CommandResult(
                success=False,
                message=f"User with ID {args.user_id} not found"
            )
        
        # Prepare updates
        updates = {}
        if args.email:
            # Check if new email is already taken
            existing = await self._find_user_by_email(context, args.email)
            if existing and existing['id'] != args.user_id:
                return CommandResult(
                    success=False,
                    message=f"Email {args.email} is already taken"
                )
            updates['email'] = args.email
        
        if args.name:
            updates['name'] = args.name
        if args.role:
            updates['role'] = args.role
        if args.status:
            updates['status'] = args.status
        if args.reset_password:
            import secrets
            import string
            new_password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(12))
            updates['password'] = new_password
            context.formatter.info(f"New password: {new_password}")
        
        if not updates:
            return CommandResult(
                success=False,
                message="No updates specified"
            )
        
        updates['updated'] = datetime.now().isoformat()
        
        # Show preview
        if not args.force:
            context.formatter.header(f"User Update Preview (ID: {args.user_id})", level=2)
            current_info = {
                'Current Email': user['email'],
                'Current Name': user['name'],
                'Current Role': user['role'],
                'Current Status': user['status']
            }
            context.formatter.key_value_pairs(current_info)
            
            context.formatter.header("Changes", level=3)
            preview_updates = updates.copy()
            if 'password' in preview_updates:
                preview_updates['password'] = '***RESET***'
            context.formatter.key_value_pairs(preview_updates)
            
            if not self.confirm_action("Apply these updates?", default=True):
                return CommandResult(
                    success=False,
                    message="Update cancelled"
                )
        
        # Apply updates
        await self._update_user_in_db(context, args.user_id, updates)
        
        context.formatter.success(f"User {user['name']} updated successfully")
        
        return CommandResult(
            success=True,
            message="User updated successfully",
            data={'user_id': args.user_id, 'updates': updates}
        )
    
    async def _delete_user(self, context, args) -> CommandResult:
        """Delete a user"""
        # Find user
        user = await self._find_user_by_id(context, args.user_id)
        if not user:
            return CommandResult(
                success=False,
                message=f"User with ID {args.user_id} not found"
            )
        
        # Check if user has dependencies
        dependencies = await self._check_user_dependencies(context, args.user_id)
        
        # Show user info and dependencies
        context.formatter.warning("About to delete user:")
        user_info = {
            'ID': user['id'],
            'Name': user['name'],
            'Email': user['email'],
            'Role': user['role'],
            'Status': user['status']
        }
        context.formatter.key_value_pairs(user_info)
        
        if dependencies:
            context.formatter.warning("This user has the following dependencies:")
            context.formatter.list_items(dependencies)
        
        # Confirm deletion
        if not args.force:
            action = "archive" if args.archive else "permanently delete"
            if not self.confirm_action(
                f"This will {action} user '{user['name']}'. Are you sure?", 
                default=False
            ):
                return CommandResult(
                    success=False,
                    message="Deletion cancelled"
                )
        
        # Perform deletion or archival
        if args.archive:
            await self._archive_user(context, args.user_id)
            action_performed = "archived"
        else:
            await self._delete_user_from_db(context, args.user_id)
            action_performed = "deleted"
        
        context.formatter.success(f"User '{user['name']}' {action_performed} successfully")
