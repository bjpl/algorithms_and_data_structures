#!/usr/bin/env python3
"""Helper functions for user_management_command.py"""

        
        return CommandResult(
            success=True,
            message=f"User {action_performed} successfully",
            data={'user_id': args.user_id, 'action': action_performed}
        )
    
    async def _show_user(self, context, args) -> CommandResult:
        """Show detailed user information"""
        # Find user
        user = await self._find_user_by_id(context, args.user_id)
        if not user:
            return CommandResult(
                success=False,
                message=f"User with ID {args.user_id} not found"
            )
        
        # Get additional data if requested
        if args.include_activity:
            user['recent_activity'] = await self._get_user_activity(context, args.user_id)
        
        if args.include_progress:
            user['progress'] = await self._get_user_progress(context, args.user_id)
        
        # Display user information
        context.formatter.header(f"User Details: {user['name']}", level=1)
        
        # Basic information
        basic_info = {
            'ID': user['id'],
            'Email': user['email'],
            'Name': user['name'],
            'Role': user['role'].title(),
            'Status': user['status'].upper(),
            'Created': user['created'][:16],
            'Last Login': user.get('last_login', 'Never')[:16] if user.get('last_login') else 'Never'
        }
        context.formatter.key_value_pairs(basic_info)
        
        # Role-specific information
        if user['role'] == 'student' and (user.get('curricula_enrolled') or user.get('completion_rate')):
            context.formatter.header("Student Information", level=2)
            student_info = {
                'Curricula Enrolled': user.get('curricula_enrolled', 0),
                'Overall Completion Rate': f"{user.get('completion_rate', 0):.1f}%"
            }
            context.formatter.key_value_pairs(student_info)
        
        elif user['role'] == 'instructor' and (user.get('courses_taught') or user.get('students_taught')):
            context.formatter.header("Instructor Information", level=2)
            instructor_info = {
                'Courses Taught': user.get('courses_taught', 0),
                'Students Taught': user.get('students_taught', 0)
            }
            context.formatter.key_value_pairs(instructor_info)
        
        # Recent activity
        if args.include_activity and user.get('recent_activity'):
            context.formatter.header("Recent Activity", level=2)
            for activity in user['recent_activity']:
                context.formatter.info(f"  {activity['timestamp'][:16]} - {activity['description']}")
        
        # Progress information
        if args.include_progress and user.get('progress'):
            context.formatter.header("Learning Progress", level=2)
            progress_data = []
            for curriculum in user['progress']:
                progress_data.append({
                    'Curriculum': curriculum['name'],
                    'Progress': f"{curriculum['completion']:.1f}%",
                    'Score': f"{curriculum['avg_score']:.1f}%" if curriculum.get('avg_score') else 'N/A'
                })
            context.formatter.table(progress_data)
        
        return CommandResult(
            success=True,
            data={'user': user}
        )
    
    async def _bulk_import_users(self, context, args) -> CommandResult:
        """Bulk import users from file"""
        file_path = Path(args.file)
        if not file_path.exists():
            return CommandResult(
                success=False,
                message=f"File not found: {args.file}"
            )
        
        # Detect format if not specified
        file_format = args.format or ('json' if file_path.suffix == '.json' else 'csv')
        
        # Load user data
        if file_format == 'json':
            with open(file_path, 'r') as f:
                users_data = json.load(f)
        else:  # CSV
            import csv
            users_data = []
            with open(file_path, 'r') as f:
                reader = csv.DictReader(f)
                users_data = list(reader)
        
        # Validate user data
        validation_errors = []
        for i, user_data in enumerate(users_data):
            errors = self._validate_user_data(user_data)
            if errors:
                validation_errors.extend([f"Row {i+1}: {error}" for error in errors])
        
        if validation_errors:
            return CommandResult(
                success=False,
                message="Validation errors:\n" + "\n".join(validation_errors[:10]) + 
                       (f"\n... and {len(validation_errors) - 10} more errors" if len(validation_errors) > 10 else "")
            )
        
        # Show preview
        context.formatter.header(f"Bulk Import Preview ({len(users_data)} users)", level=2)
        
        # Show first few users
        preview_data = []
        for user in users_data[:5]:
            preview_data.append({
                'Email': user['email'],
                'Name': user.get('name', 'N/A'),
                'Role': user.get('role', 'student')
            })
        context.formatter.table(preview_data)
        
        if len(users_data) > 5:
            context.formatter.info(f"... and {len(users_data) - 5} more users")
        
        if args.dry_run:
            return CommandResult(
                success=True,
                message=f"Dry run completed. {len(users_data)} users would be imported",
                data={'users_count': len(users_data), 'validation_passed': True}
            )
        
        # Confirm import
        if not args.force:
            if not self.confirm_action(f"Import {len(users_data)} users?", default=True):
                return CommandResult(
                    success=False,
                    message="Import cancelled"
                )
        
        # Import users
        successful_imports = 0
        failed_imports = []
        
        with context.formatter.progress_bar(len(users_data), "Importing users") as pbar:
            for i, user_data in enumerate(users_data):
                try:
                    # Check if user already exists
                    existing = await self._find_user_by_email(context, user_data['email'])
                    if existing:
                        failed_imports.append((i + 1, f"User {user_data['email']} already exists"))
                        continue
                    
                    # Create user
                    user_data.setdefault('role', 'student')
                    user_data.setdefault('status', 'active')
                    user_data['created'] = datetime.now().isoformat()
                    
                    await self._create_user_in_db(context, user_data)
                    successful_imports += 1
                    
                except Exception as e:
                    failed_imports.append((i + 1, str(e)))
                
                pbar.update()
        
        # Show results
        if failed_imports:
            context.formatter.warning(f"{len(failed_imports)} imports failed:")
            for row_num, error in failed_imports[:5]:  # Show first 5 errors
                context.formatter.error(f"Row {row_num}: {error}")
            
            if len(failed_imports) > 5:
                context.formatter.info(f"... and {len(failed_imports) - 5} more errors")
        
        context.formatter.success(
            f"Bulk import completed: {successful_imports}/{len(users_data)} successful"
        )
        
        return CommandResult(
            success=len(failed_imports) == 0,
            message=f"Imported {successful_imports} users, {len(failed_imports)} failed",
            data={
                'successful_imports': successful_imports,
                'failed_imports': len(failed_imports),
                'errors': failed_imports
            }
        )
    
    async def _bulk_export_users(self, context, args) -> CommandResult:
        """Bulk export users to file"""
        # Get users (with optional filtering)
        filter_criteria = {}
        if args.filter:
            try:
                filter_criteria = json.loads(args.filter)
            except json.JSONDecodeError:
                return CommandResult(
                    success=False,
                    message="Invalid filter JSON format"
                )
        
        # Mock data - replace with actual database query with filters
        users = await self._get_users_for_export(context, filter_criteria)
        
        if not users:
            return CommandResult(
                success=True,
                message="No users found for export"
            )
        
        # Determine output file
        if not args.output:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            args.output = f"users_export_{timestamp}.{args.format}"
        
        output_path = Path(args.output)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Export users
        if args.format == 'json':
            with open(output_path, 'w') as f:
                json.dump(users, f, indent=2, default=str)
        else:  # CSV
            import csv
            with open(output_path, 'w', newline='') as f:
                if users:
                    writer = csv.DictWriter(f, fieldnames=users[0].keys())
                    writer.writeheader()
                    writer.writerows(users)
        
        context.formatter.success(f"Exported {len(users)} users to {output_path}")
        
        return CommandResult(
            success=True,
            message=f"Exported {len(users)} users",
            data={'export_path': str(output_path), 'user_count': len(users)}
        )
    
    # Helper methods
    async def _find_user_by_email(self, context, email: str) -> Optional[Dict[str, Any]]:
        """Find user by email"""
        # Mock implementation - replace with actual database query
        return None  # User not found
    
    async def _find_user_by_id(self, context, user_id: int) -> Optional[Dict[str, Any]]:
        """Find user by ID"""
        # Mock implementation
        if user_id == 1:
            return {
                'id': 1,
                'email': 'alice.johnson@example.com',
                'name': 'Alice Johnson',
                'role': 'student',
                'status': 'active',
                'created': '2024-01-10T09:00:00',
                'last_login': '2024-01-22T14:30:00'
            }
        return None
    
    async def _create_user_in_db(self, context, user_data: Dict[str, Any]) -> int:
        """Create user in database"""
        # Mock implementation - replace with actual database creation
        user_id = hash(user_data['email'] + str(datetime.now())) % 10000
        return user_id
    
    async def _update_user_in_db(self, context, user_id: int, updates: Dict[str, Any]):
        """Update user in database"""
        # Mock implementation - replace with actual database update
        pass
    
    async def _delete_user_from_db(self, context, user_id: int):
        """Delete user from database"""
        # Mock implementation - replace with actual database deletion
        pass
    
    async def _archive_user(self, context, user_id: int):
        """Archive user instead of deleting"""
        # Mock implementation - replace with actual user archival
        pass
    
    async def _check_user_dependencies(self, context, user_id: int) -> List[str]:
        """Check for user dependencies"""
        # Mock implementation
        return [
            "3 curricula enrollments",
            "15 completed assignments",
            "2 forum posts"
        ]
    
    async def _send_welcome_email(self, context, user_id: int, email: str):
        """Send welcome email to new user"""
        # Mock implementation - replace with actual email sending
        pass
    
    async def _get_user_activity(self, context, user_id: int) -> List[Dict[str, Any]]:
        """Get recent user activity"""
        # Mock implementation
        return [
            {'timestamp': '2024-01-22T14:30:00', 'description': 'Completed Python Variables lesson'},
            {'timestamp': '2024-01-22T10:15:00', 'description': 'Started Python Fundamentals curriculum'},
            {'timestamp': '2024-01-21T16:45:00', 'description': 'Logged in'}
        ]
    
    async def _get_user_progress(self, context, user_id: int) -> List[Dict[str, Any]]:
        """Get user learning progress"""
        # Mock implementation
        return [
            {'name': 'Python Fundamentals', 'completion': 78.5, 'avg_score': 91.2},
            {'name': 'Web Development', 'completion': 34.2, 'avg_score': 87.8}
        ]
    
    async def _get_users_for_export(self, context, filter_criteria: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Get users for export with filtering"""
        # Mock implementation - would apply filters in actual database query
        return [
            {
                'id': 1,
                'email': 'alice.johnson@example.com',
                'name': 'Alice Johnson',
                'role': 'student',
                'status': 'active',
                'created': '2024-01-10T09:00:00'
            }
        ]
    
    def _validate_user_data(self, user_data: Dict[str, Any]) -> List[str]:
        """Validate user data for import"""
        errors = []
        
        if not user_data.get('email'):
            errors.append("Email is required")
        elif '@' not in user_data['email']:
            errors.append("Invalid email format")
        
        if 'role' in user_data and user_data['role'] not in ['student', 'instructor', 'admin']:
            errors.append("Invalid role")
        
        if 'status' in user_data and user_data['status'] not in ['active', 'inactive', 'suspended']:
            errors.append("Invalid status")
        
        return errors


