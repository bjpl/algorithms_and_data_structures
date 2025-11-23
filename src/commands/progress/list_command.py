#!/usr/bin/env python3
"""ProgressListCommand - Extracted from progress_commands.py"""

#!/usr/bin/env python3
"""
Progress Commands - Student progress tracking and analytics

This module provides:
- Track student progress through curricula and content
- View detailed progress reports and analytics
- Set and manage learning goals and milestones
- Generate progress visualizations and charts
- Export progress data for external analysis
- Manage progress notifications and alerts
"""

import json
import asyncio
from typing import List, Optional, Dict, Any
from pathlib import Path
from datetime import datetime, timedelta

from .base import BaseCommand, CommandResult, CommandMetadata, CommandCategory
from ..ui.formatter_compat import TerminalFormatter
from ..models.progress import Progress
from ..core.exceptions import CLIError




class ProgressListCommand(BaseCommand):
    """List student progress records with filtering"""
    
    def get_metadata(self) -> CommandMetadata:
        return CommandMetadata(
            name="progress-list",
            description="List student progress records",
            category=CommandCategory.CURRICULUM,
            aliases=["progress-ls", "list-progress"],
            examples=[
                "progress-list",
                "progress-list --student 123",
                "progress-list --curriculum 456 --status completed",
                "progress-list --date-from 2024-01-01 --format json",
                "progress-list --content-type lesson --difficulty beginner"
            ]
        )
    
    def setup_parser(self, subparsers):
        parser = self.create_subparser(
            subparsers,
            help="List student progress records"
        )
        
        # Filtering options
        parser.add_argument(
            '--student',
            type=int,
            help='Filter by student ID'
        )
        parser.add_argument(
            '--curriculum',
            type=int,
            help='Filter by curriculum ID'
        )
        parser.add_argument(
            '--content',
            type=int,
            help='Filter by content ID'
        )
        parser.add_argument(
            '--status',
            choices=['not_started', 'in_progress', 'completed', 'failed'],
            help='Filter by progress status'
        )
        parser.add_argument(
            '--content-type',
            choices=['lesson', 'exercise', 'assessment', 'quiz'],
            help='Filter by content type'
        )
        parser.add_argument(
            '--difficulty',
            choices=['beginner', 'intermediate', 'advanced', 'expert'],
            help='Filter by difficulty level'
        )
        
        # Date filtering
        parser.add_argument(
            '--date-from',
            help='Filter from date (YYYY-MM-DD)'
        )
        parser.add_argument(
            '--date-to',
            help='Filter to date (YYYY-MM-DD)'
        )
        parser.add_argument(
            '--last-days',
            type=int,
            help='Filter last N days'
        )
        
        # Score filtering
        parser.add_argument(
            '--min-score',
            type=float,
            help='Minimum completion score'
        )
        parser.add_argument(
            '--max-score',
            type=float,
            help='Maximum completion score'
        )
        
        # Sorting options
        parser.add_argument(
            '--sort',
            choices=['student', 'content', 'status', 'score', 'started', 'completed'],
            default='started',
            help='Sort field'
        )
        parser.add_argument(
            '--order',
            choices=['asc', 'desc'],
            default='desc',
            help='Sort order'
        )
        
        # Output options
        parser.add_argument(
            '--format',
            choices=['table', 'json', 'summary', 'chart'],
            default='table',
            help='Output format'
        )
        parser.add_argument(
            '--limit',
            type=int,
            help='Maximum number of results'
        )
        parser.add_argument(
            '--include-details',
            action='store_true',
            help='Include detailed progress information'
        )
        
        return parser
    
    async def execute(self, context, args: List[str]) -> CommandResult:
        try:
            parsed_args = self.parse_args(args)
            
            # Get progress records
            progress_records = await self._get_progress_records(context, parsed_args)
            
            if not progress_records:
                return CommandResult(
                    success=True,
                    message="No progress records found matching the criteria"
                )
            
            # Format output
            if parsed_args.format == 'json':
                output = json.dumps(progress_records, indent=2, default=str)
                print(output)
            elif parsed_args.format == 'summary':
                self._show_summary(context.formatter, progress_records)
            elif parsed_args.format == 'chart':
                self._show_chart(context.formatter, progress_records)
            else:
                self._show_table(context.formatter, progress_records, parsed_args.include_details)
            
            return CommandResult(
                success=True,
                message=f"Found {len(progress_records)} progress record(s)",
                data={'progress_records': progress_records}
            )
            
        except Exception as e:
            return CommandResult(
                success=False,
                message=f"Failed to list progress: {e}",
                error=e
            )
    
    async def _get_progress_records(self, context, args) -> List[Dict[str, Any]]:
        """Get progress records with filtering and sorting"""
        # Mock data - replace with actual database query
        mock_progress = [
            {
                'id': 1,
                'student_id': 101,
                'student_name': 'Alice Johnson',
                'curriculum_id': 1,
                'curriculum_name': 'Python Fundamentals',
                'content_id': 1,
                'content_title': 'Introduction to Python',
                'content_type': 'lesson',
                'difficulty': 'beginner',
                'status': 'completed',
                'score': 95.5,
                'started_at': '2024-01-15T09:30:00',
                'completed_at': '2024-01-15T10:15:00',
                'time_spent': 2700,  # seconds
                'attempts': 1,
                'progress_percentage': 100.0
            },
            {
                'id': 2,
                'student_id': 101,
                'student_name': 'Alice Johnson',
                'curriculum_id': 1,
                'curriculum_name': 'Python Fundamentals',
                'content_id': 2,
                'content_title': 'Python Variables Exercise',
                'content_type': 'exercise',
                'difficulty': 'beginner',
                'status': 'in_progress',
                'score': None,
                'started_at': '2024-01-15T10:20:00',
                'completed_at': None,
                'time_spent': 1200,
                'attempts': 0,
                'progress_percentage': 60.0
            },
            {
                'id': 3,
                'student_id': 102,
                'student_name': 'Bob Smith',
                'curriculum_id': 1,
                'curriculum_name': 'Python Fundamentals',
                'content_id': 1,
                'content_title': 'Introduction to Python',
                'content_type': 'lesson',
                'difficulty': 'beginner',
                'status': 'completed',
                'score': 87.3,
                'started_at': '2024-01-16T14:00:00',
                'completed_at': '2024-01-16T15:10:00',
                'time_spent': 4200,
                'attempts': 2,
                'progress_percentage': 100.0
            }
        ]
        
        # Apply filters
        filtered_progress = mock_progress
        
        if args.student:
            filtered_progress = [p for p in filtered_progress if p['student_id'] == args.student]
        
        if args.curriculum:
            filtered_progress = [p for p in filtered_progress if p['curriculum_id'] == args.curriculum]
        
        if args.content:
            filtered_progress = [p for p in filtered_progress if p['content_id'] == args.content]
        
        if args.status:
            filtered_progress = [p for p in filtered_progress if p['status'] == args.status]
        
        if args.content_type:
            filtered_progress = [p for p in filtered_progress if p['content_type'] == args.content_type]
        
        if args.difficulty:
            filtered_progress = [p for p in filtered_progress if p['difficulty'] == args.difficulty]
        
        if args.min_score is not None:
            filtered_progress = [p for p in filtered_progress if p.get('score') and p['score'] >= args.min_score]
        
        if args.max_score is not None:
            filtered_progress = [p for p in filtered_progress if p.get('score') and p['score'] <= args.max_score]
        
        # Date filtering
        if args.date_from or args.date_to or args.last_days:
            if args.last_days:
                date_from = datetime.now() - timedelta(days=args.last_days)
            else:
                date_from = datetime.fromisoformat(args.date_from) if args.date_from else None
            
            date_to = datetime.fromisoformat(args.date_to) if args.date_to else datetime.now()
            
            filtered_progress = [
                p for p in filtered_progress 
                if (not date_from or datetime.fromisoformat(p['started_at']) >= date_from) and
                   datetime.fromisoformat(p['started_at']) <= date_to
            ]
        
        # Apply sorting
        sort_key = {
            'student': lambda x: x['student_name'],
            'content': lambda x: x['content_title'],
            'status': lambda x: x['status'],
            'score': lambda x: x.get('score', 0),
            'started': lambda x: x['started_at'],
            'completed': lambda x: x.get('completed_at', '')
        }.get(args.sort, lambda x: x['started_at'])
        
        reverse = args.order == 'desc'
        filtered_progress.sort(key=sort_key, reverse=reverse)
        
        # Apply limit
        if args.limit:
            filtered_progress = filtered_progress[:args.limit]
        
        return filtered_progress
    
    def _show_table(self, formatter: TerminalFormatter, progress_records: List[Dict[str, Any]], include_details: bool):
        """Show progress records in table format"""
        if include_details:
            headers = ['Student', 'Content', 'Status', 'Score', 'Time', 'Progress', 'Completed']
        else:
            headers = ['Student', 'Content', 'Status', 'Score', 'Progress']
        
        table_data = []
        for record in progress_records:
            time_spent_str = f"{record['time_spent'] // 60}m" if record['time_spent'] else "-"
            
            if include_details:
                table_data.append({
                    'Student': record['student_name'],
                    'Content': record['content_title'][:25] + '...' if len(record['content_title']) > 25 else record['content_title'],
                    'Status': record['status'].upper().replace('_', ' '),
                    'Score': f"{record['score']:.1f}%" if record['score'] else "-",
                    'Time': time_spent_str,
                    'Progress': f"{record['progress_percentage']:.0f}%",
                    'Completed': record['completed_at'][:10] if record['completed_at'] else "-"
                })
            else:
                table_data.append({
                    'Student': record['student_name'],
                    'Content': record['content_title'][:30] + '...' if len(record['content_title']) > 30 else record['content_title'],
                    'Status': record['status'].upper().replace('_', ' '),
                    'Score': f"{record['score']:.1f}%" if record['score'] else "-",
                    'Progress': f"{record['progress_percentage']:.0f}%"
                })
        
        formatter.table(table_data, headers)
    
    def _show_summary(self, formatter: TerminalFormatter, progress_records: List[Dict[str, Any]]):
        """Show progress summary with statistics"""
        total_records = len(progress_records)
        completed = len([p for p in progress_records if p['status'] == 'completed'])
        in_progress = len([p for p in progress_records if p['status'] == 'in_progress'])
        not_started = len([p for p in progress_records if p['status'] == 'not_started'])
        
        # Overall statistics
        formatter.header("Progress Summary", level=2)
        stats = {
            'Total Records': total_records,
            'Completed': f"{completed} ({completed/total_records*100:.1f}%)",
            'In Progress': f"{in_progress} ({in_progress/total_records*100:.1f}%)",
            'Not Started': f"{not_started} ({not_started/total_records*100:.1f}%)"
        }
        formatter.key_value_pairs(stats)
        
        # Score statistics for completed items
        completed_records = [p for p in progress_records if p['status'] == 'completed' and p.get('score')]
        if completed_records:
            scores = [p['score'] for p in completed_records]
            avg_score = sum(scores) / len(scores)
            min_score = min(scores)
            max_score = max(scores)
            
            formatter.header("Score Statistics", level=2)
            score_stats = {
                'Average Score': f"{avg_score:.1f}%",
                'Minimum Score': f"{min_score:.1f}%",
                'Maximum Score': f"{max_score:.1f}%",
                'Records with Scores': len(completed_records)
            }
            formatter.key_value_pairs(score_stats)
    
    def _show_chart(self, formatter: TerminalFormatter, progress_records: List[Dict[str, Any]]):
        """Show progress as ASCII chart"""
        # Status distribution chart
        status_counts = {}
        for record in progress_records:
            status = record['status']
            status_counts[status] = status_counts.get(status, 0) + 1
        
        formatter.header("Progress Distribution", level=2)
        max_count = max(status_counts.values()) if status_counts else 1
        
        for status, count in status_counts.items():
            bar_length = int((count / max_count) * 30)
            bar = "█" * bar_length
            percentage = (count / len(progress_records)) * 100
            formatter.info(f"{status.upper().replace('_', ' '):12} {bar} {count} ({percentage:.1f}%)")
        
        # Score distribution for completed items
        completed_scores = [p['score'] for p in progress_records if p['status'] == 'completed' and p.get('score')]
        if completed_scores:
            formatter.header("Score Distribution (Completed)", level=2)
            
            # Create score ranges
            ranges = [(0, 60), (60, 70), (70, 80), (80, 90), (90, 100)]
            range_counts = {f"{r[0]}-{r[1]}%": 0 for r in ranges}
            
            for score in completed_scores:
                for r in ranges:
                    if r[0] <= score <= r[1]:
                        range_counts[f"{r[0]}-{r[1]}%"] += 1
                        break
            
            max_range_count = max(range_counts.values()) if range_counts else 1
            for range_name, count in range_counts.items():
                if count > 0:
                    bar_length = int((count / max_range_count) * 20)
                    bar = "█" * bar_length
                    formatter.info(f"{range_name:8} {bar} {count}")


