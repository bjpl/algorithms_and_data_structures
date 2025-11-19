#!/usr/bin/env python3
"""SearchCommand - Extracted from search_commands.py"""

#!/usr/bin/env python3
"""
Search Commands - Search and discovery functionality

This module provides:
- Global search across curricula, content, and users
- Advanced search with filters and facets

# Helper functions moved to command_helpers.py
# from .command_helpers import *

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




class SearchCommand(BaseCommand):
    """Global search across all content types"""
    
    def get_metadata(self) -> CommandMetadata:
        return CommandMetadata(
            name="search",
            description="Search across curricula, content, and users",
            category=CommandCategory.SYSTEM,
            aliases=["find", "query"],
            examples=[
                "search 'python basics'",
                "search --type curriculum 'web development'",
                "search --author 'jane smith' --difficulty beginner",
                "search 'machine learning' --tag ai --format json",
                "search --content-type lesson --status published 'introduction'"
            ]
        )
    
    def setup_parser(self, subparsers):
        parser = self.create_subparser(
            subparsers,
            help="Search across all content types"
        )
        
        # Search query
        parser.add_argument(
            'query',
            nargs='?',
            help='Search query string'
        )
        
        # Search scope
        parser.add_argument(
            '--type',
            choices=['all', 'curriculum', 'content', 'user', 'progress'],
            default='all',
            help='Limit search to specific type'
        )
        parser.add_argument(
            '--content-type',
            choices=['lesson', 'exercise', 'assessment', 'resource', 'video', 'quiz'],
            help='Filter by content type (when searching content)'
        )
        
        # Search filters
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
        parser.add_argument(
            '--status',
            help='Filter by status'
        )
        parser.add_argument(
            '--created-after',
            help='Filter by creation date (YYYY-MM-DD)'
        )
        parser.add_argument(
            '--created-before',
            help='Filter by creation date (YYYY-MM-DD)'
        )
        
        # Search options
        parser.add_argument(
            '--exact',
            action='store_true',
            help='Exact phrase search'
        )
        parser.add_argument(
            '--fuzzy',
            action='store_true',
            help='Enable fuzzy matching'
        )
        parser.add_argument(
            '--case-sensitive',
            action='store_true',
            help='Case-sensitive search'
        )
        
        # Output options
        parser.add_argument(
            '--format',
            choices=['list', 'detailed', 'json', 'summary'],
            default='list',
            help='Output format'
        )
        parser.add_argument(
            '--limit',
            type=int,
            default=20,
            help='Maximum number of results'
        )
        parser.add_argument(
            '--sort',
            choices=['relevance', 'date', 'title', 'score'],
            default='relevance',
            help='Sort results by'
        )
        parser.add_argument(
            '--include-preview',
            action='store_true',
            help='Include content preview in results'
        )
        
        # Search management
        parser.add_argument(
            '--save',
            help='Save search with given name'
        )
        parser.add_argument(
            '--suggest',
            action='store_true',
            help='Show search suggestions only'
        )
        
        return parser
    
    async def execute(self, context, args: List[str]) -> CommandResult:
        try:
            parsed_args = self.parse_args(args)
            
            # Handle search suggestions
            if parsed_args.suggest:
                suggestions = await self._get_search_suggestions(context, parsed_args.query)
                self._show_suggestions(context.formatter, suggestions)
                return CommandResult(
                    success=True,
                    message=f"Found {len(suggestions)} suggestions",
                    data={'suggestions': suggestions}
                )
            
            # Require query for actual search
            if not parsed_args.query:
                return CommandResult(
                    success=False,
                    message="Search query is required (use --suggest for suggestions)"
                )
            
            # Perform search
            search_results = await self._perform_search(context, parsed_args)
            
            # Record search for analytics
            await self._record_search(context, parsed_args.query, len(search_results))
            
            # Save search if requested
            if parsed_args.save:
                await self._save_search(context, parsed_args.save, parsed_args)
                context.formatter.info(f"Search saved as '{parsed_args.save}'")
            
            # Display results
            if not search_results:
                context.formatter.warning("No results found")
                suggestions = await self._get_search_suggestions(context, parsed_args.query)
                if suggestions:
                    context.formatter.info("Did you mean:")
                    self._show_suggestions(context.formatter, suggestions[:3])
                
                return CommandResult(
                    success=True,
                    message="No results found"
                )
            
            # Format and display results
            if parsed_args.format == 'json':
                output = json.dumps(search_results, indent=2, default=str)
                print(output)
            elif parsed_args.format == 'summary':
                self._show_search_summary(context.formatter, search_results, parsed_args)
            elif parsed_args.format == 'detailed':
                self._show_detailed_results(context.formatter, search_results, parsed_args)
            else:
                self._show_list_results(context.formatter, search_results, parsed_args)
            
            return CommandResult(
                success=True,
                message=f"Found {len(search_results)} result(s)",
                data={'results': search_results, 'query': parsed_args.query}
            )
            
        except Exception as e:
            return CommandResult(
                success=False,
                message=f"Search failed: {e}",
                error=e
            )
    
    async def _perform_search(self, context, args) -> List[Dict[str, Any]]:
        """Perform the actual search operation"""
        # Mock search implementation - replace with actual search engine
        all_items = await self._get_searchable_items(context)
        
        # Apply type filter
        if args.type != 'all':
            all_items = [item for item in all_items if item['type'] == args.type]
        
        # Apply content type filter
        if args.content_type:
            all_items = [item for item in all_items if item.get('content_type') == args.content_type]
        
        # Apply other filters
        if args.author:
            all_items = [item for item in all_items if args.author.lower() in item.get('author', '').lower()]
        
        if args.difficulty:
            all_items = [item for item in all_items if item.get('difficulty') == args.difficulty]
        
        if args.status:
            all_items = [item for item in all_items if item.get('status') == args.status]
        
        if args.tag:
            for tag in args.tag:
                all_items = [item for item in all_items if tag.lower() in [t.lower() for t in item.get('tags', [])]]
        
        # Date filters
        if args.created_after or args.created_before:
            after_date = datetime.fromisoformat(args.created_after) if args.created_after else None
            before_date = datetime.fromisoformat(args.created_before) if args.created_before else None
            
            filtered_items = []
            for item in all_items:
                created_date = datetime.fromisoformat(item['created']) if item.get('created') else None
                if created_date:
                    if after_date and created_date < after_date:
                        continue
                    if before_date and created_date > before_date:
                        continue
                filtered_items.append(item)
            all_items = filtered_items
        
        # Apply text search
        query = args.query.lower()
        search_results = []
        
        for item in all_items:
            score = self._calculate_relevance_score(item, query, args)
            if score > 0:
                result_item = item.copy()
                result_item['relevance_score'] = score
                result_item['search_snippet'] = self._generate_snippet(item, query)
                search_results.append(result_item)
        
        # Sort results
        if args.sort == 'relevance':
            search_results.sort(key=lambda x: x['relevance_score'], reverse=True)
        elif args.sort == 'date':
            search_results.sort(key=lambda x: x.get('created', ''), reverse=True)
        elif args.sort == 'title':
            search_results.sort(key=lambda x: x.get('title', ''))
        elif args.sort == 'score':
            search_results.sort(key=lambda x: x.get('score', 0), reverse=True)
        
        # Apply limit
        return search_results[:args.limit]
    
    async def _get_searchable_items(self, context) -> List[Dict[str, Any]]:
        """Get all searchable items from the system"""
        # Mock data - replace with actual database queries
        return [
            {
                'id': 1,
                'type': 'curriculum',
                'title': 'Python Fundamentals',
                'description': 'Learn Python programming from basics to advanced concepts',
                'author': 'Jane Smith',
                'difficulty': 'beginner',
                'status': 'published',
                'tags': ['python', 'programming', 'fundamentals'],
                'created': '2024-01-15T10:30:00',
                'score': 4.8,
                'popularity': 245
            },
            {
                'id': 2,
                'type': 'content',
                'content_type': 'lesson',
                'title': 'Introduction to Python',
                'description': 'Learn the basics of Python programming language',
                'body': 'Python is a high-level programming language that is widely used for web development, data science, and automation.',
                'author': 'Jane Smith',
                'difficulty': 'beginner',
                'status': 'published',
                'tags': ['python', 'basics', 'introduction'],
                'created': '2024-01-15T11:00:00',
                'score': 4.7,
                'views': 1250
            },
            {
                'id': 3,
                'type': 'content',
                'content_type': 'exercise',
                'title': 'Python Variables Practice',
                'description': 'Practice working with variables in Python',
                'body': 'Complete the following exercises to practice creating and using variables in Python.',
                'author': 'John Doe',
                'difficulty': 'beginner',
                'status': 'published',
                'tags': ['python', 'variables', 'practice'],
                'created': '2024-01-16T09:30:00',
                'score': 4.5,
                'completion_rate': 87.3
            },
            {
                'id': 4,
                'type': 'curriculum',
                'title': 'Web Development with JavaScript',
                'description': 'Master modern web development using JavaScript, HTML, and CSS',
                'author': 'Alice Johnson',
                'difficulty': 'intermediate',
                'status': 'published',
                'tags': ['javascript', 'web', 'html', 'css'],
                'created': '2024-01-10T14:20:00',
                'score': 4.6,
                'popularity': 189
            },
            {
                'id': 5,
                'type': 'user',
                'title': 'Dr. Jane Smith',
                'description': 'Senior Python Developer and Educator',
                'role': 'instructor',
                'specialties': ['python', 'data science', 'machine learning'],
                'created': '2024-01-01T00:00:00',
                'courses_taught': 12,
                'rating': 4.9
            }
        ]
    
    def _calculate_relevance_score(self, item: Dict[str, Any], query: str, args) -> float:
        """Calculate relevance score for search result"""
        score = 0.0
        query_words = query.split() if not args.exact else [query]
        
        # Title matching (highest weight)
        title = item.get('title', '').lower()
        for word in query_words:
            if args.exact:
                if word in title:
                    score += 10.0
            else:
                if word in title:
                    score += 5.0
                elif args.fuzzy and self._fuzzy_match(word, title):
                    score += 3.0
        
        # Description matching (medium weight)
        description = item.get('description', '').lower()
        for word in query_words:
            if args.exact:
                if word in description:
                    score += 5.0
            else:
                if word in description:
                    score += 2.0
                elif args.fuzzy and self._fuzzy_match(word, description):
                    score += 1.0
        
        # Body content matching (lower weight)
        body = item.get('body', '').lower()
        for word in query_words:
            if word in body:
                score += 1.0
        
        # Tag matching (medium-high weight)
        tags = [tag.lower() for tag in item.get('tags', [])]
        for word in query_words:
            if word in tags:
                score += 4.0
        
        # Author matching
        author = item.get('author', '').lower()
        if query in author:
            score += 3.0
        
        # Boost popular/high-quality content
        if item.get('score'):
            score *= (1 + item['score'] / 10.0)
        
        if item.get('popularity'):
            score *= (1 + min(item['popularity'] / 1000.0, 0.5))
        
        if item.get('views'):
            score *= (1 + min(item['views'] / 5000.0, 0.3))
        
        return score
    
    def _fuzzy_match(self, word: str, text: str) -> bool:
        """Simple fuzzy matching implementation"""
        # Simple Levenshtein-like fuzzy matching
        for text_word in text.split():
            if len(word) > 3 and len(text_word) > 3:
                # Allow 1-2 character differences
                max_diff = min(2, len(word) // 3)
                diff_count = 0
                min_len = min(len(word), len(text_word))
                
                for i in range(min_len):
                    if word[i] != text_word[i]:
                        diff_count += 1
                        if diff_count > max_diff:
                            break
                
                if diff_count <= max_diff:
                    return True
        return False
    
    def _generate_snippet(self, item: Dict[str, Any], query: str) -> str:
        """Generate search result snippet"""
        text_fields = ['description', 'body']
        snippet = ""
        
        for field in text_fields:
