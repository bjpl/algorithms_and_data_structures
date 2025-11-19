#!/usr/bin/env python3
"""Helper functions for command.py"""

            text = item.get(field, '')
            if text and query.lower() in text.lower():
                # Find the query in the text and extract surrounding context
                index = text.lower().find(query.lower())
                start = max(0, index - 50)
                end = min(len(text), index + len(query) + 50)
                
                snippet = text[start:end]
                if start > 0:
                    snippet = "..." + snippet
                if end < len(text):
                    snippet = snippet + "..."
                break
        
        return snippet[:150] if snippet else (item.get('description', '') or '')[:150]
    
    async def _get_search_suggestions(self, context, query: Optional[str]) -> List[str]:
        """Get search suggestions based on query"""
        # Mock suggestions - replace with actual suggestion engine
        popular_searches = [
            'python basics',
            'web development',
            'javascript fundamentals',
            'data science',
            'machine learning',
            'html css tutorial',
            'python advanced',
            'react framework',
            'database design',
            'api development'
        ]
        
        if not query:
            return popular_searches[:5]
        
        # Filter suggestions based on query
        query = query.lower()
        suggestions = [s for s in popular_searches if query in s.lower()]
        
        # Add some dynamic suggestions
        if 'python' in query:
            suggestions.extend(['python variables', 'python functions', 'python classes'])
        elif 'web' in query:
            suggestions.extend(['web design', 'web security', 'web APIs'])
        elif 'javascript' in query or 'js' in query:
            suggestions.extend(['javascript async', 'javascript dom', 'javascript es6'])
        
        return suggestions[:8]
    
    async def _record_search(self, context, query: str, result_count: int):
        """Record search for analytics"""
        # Mock implementation - replace with actual analytics recording
        search_record = {
            'query': query,
            'result_count': result_count,
            'timestamp': datetime.now().isoformat(),
            'user_id': getattr(context, 'user_id', None)
        }
        # In real implementation: await search_analytics.record(search_record)
    
    async def _save_search(self, context, search_name: str, args):
        """Save search for later use"""
        # Mock implementation - replace with actual search saving
        saved_search = {
            'name': search_name,
            'query': args.query,
            'filters': {
                'type': args.type,
                'content_type': args.content_type,
                'author': args.author,
                'difficulty': args.difficulty,
                'status': args.status,
                'tags': args.tag,
            },
            'options': {
                'exact': args.exact,
                'fuzzy': args.fuzzy,
                'case_sensitive': args.case_sensitive
            },
            'created': datetime.now().isoformat()
        }
        # In real implementation: await saved_searches.save(saved_search)
    
    def _show_suggestions(self, formatter: TerminalFormatter, suggestions: List[str]):
        """Show search suggestions"""
        formatter.header("Search Suggestions", level=2)
        for suggestion in suggestions:
            formatter.info(f"ὐd {suggestion}")
    
    def _show_list_results(self, formatter: TerminalFormatter, results: List[Dict[str, Any]], args):
        """Show search results in list format"""
        formatter.header(f"Search Results ({len(results)} found)", level=2)
        
        for i, result in enumerate(results, 1):
            # Result type icon
            type_icons = {
                'curriculum': '📚',
                'content': '📄',
                'user': '👤',
                'progress': '📈'
            }
            icon = type_icons.get(result['type'], '📄')
            
            # Content type for content items
            content_type = ""
            if result['type'] == 'content' and result.get('content_type'):
                content_icons = {
                    'lesson': '📺',
                    'exercise': '💪',
                    'quiz': '❓',
                    'assessment': '📊',
                    'resource': '📁',
                    'video': '🎥'
                }
                content_icon = content_icons.get(result['content_type'], '📄')
                content_type = f" {content_icon}"
            
            # Result header
            score_text = f" ({result['relevance_score']:.1f})" if args.sort == 'relevance' else ""
            formatter.info(f"{i:2d}. {icon}{content_type} {result['title']}{score_text}")
            
            # Metadata
            metadata = []
            if result.get('author'):
                metadata.append(f"by {result['author']}")
            if result.get('difficulty'):
                metadata.append(result['difficulty'])
            if result.get('status'):
                metadata.append(result['status'])
            
            if metadata:
                formatter.info(f"    {' | '.join(metadata)}")
            
            # Snippet or description
            snippet = result.get('search_snippet', result.get('description', ''))
            if snippet and args.include_preview:
                formatter.info(f"    {snippet}")
            
            # Tags
            if result.get('tags') and len(result['tags']) > 0:
                tag_str = ', '.join(result['tags'][:3])
                if len(result['tags']) > 3:
                    tag_str += f" +{len(result['tags']) - 3} more"
                formatter.info(f"    🏷️ {tag_str}")
            
            print()  # Add spacing between results
    
    def _show_detailed_results(self, formatter: TerminalFormatter, results: List[Dict[str, Any]], args):
        """Show detailed search results"""
        formatter.header(f"Detailed Search Results ({len(results)} found)", level=2)
        
        for result in results:
            formatter.header(f"{result['title']} (ID: {result['id']})", level=3)
            
            # Basic info
            info = {
                'Type': result['type'].title(),
                'Score': f"{result['relevance_score']:.2f}"
            }
            
            if result.get('content_type'):
                info['Content Type'] = result['content_type'].title()
            if result.get('author'):
                info['Author'] = result['author']
            if result.get('difficulty'):
                info['Difficulty'] = result['difficulty'].title()
            if result.get('status'):
                info['Status'] = result['status'].title()
            if result.get('created'):
                info['Created'] = result['created'][:10]
            
            formatter.key_value_pairs(info, indent=1)
            
            # Description
            if result.get('description'):
                formatter.info(f"  Description: {result['description']}")
            
            # Search snippet
            if result.get('search_snippet') and result['search_snippet'] != result.get('description', ''):
                formatter.info(f"  Match: {result['search_snippet']}")
            
            # Tags
            if result.get('tags'):
                formatter.info(f"  Tags: {', '.join(result['tags'])}")
            
            # Additional metrics
            metrics = []
            if result.get('score'):
                metrics.append(f"Rating: {result['score']:.1f}")
            if result.get('views'):
                metrics.append(f"Views: {result['views']}")
            if result.get('popularity'):
                metrics.append(f"Popularity: {result['popularity']}")
            if result.get('completion_rate'):
                metrics.append(f"Completion: {result['completion_rate']}%")
            
            if metrics:
                formatter.info(f"  Metrics: {' | '.join(metrics)}")
            
            print()
    
    def _show_search_summary(self, formatter: TerminalFormatter, results: List[Dict[str, Any]], args):
        """Show search results summary"""
        formatter.header(f"Search Summary ({len(results)} results)", level=2)
        
        # Results by type
        type_counts = {}
        for result in results:
            result_type = result['type']
            type_counts[result_type] = type_counts.get(result_type, 0) + 1
        
        formatter.info("Results by type:")
        for result_type, count in type_counts.items():
            formatter.info(f"  {result_type.title()}: {count}")
        
        # Top results
        formatter.header("Top 5 Results", level=3)
        for i, result in enumerate(results[:5], 1):
            type_icon = {'curriculum': '📚', 'content': '📄', 'user': '👤'}.get(result['type'], '📄')
            score_text = f" ({result['relevance_score']:.1f})" if args.sort == 'relevance' else ""
            formatter.info(f"  {i}. {type_icon} {result['title']}{score_text}")


