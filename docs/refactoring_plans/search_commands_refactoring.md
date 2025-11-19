# Refactoring Plan: search_commands.py

## Current State Analysis

**File:** `/home/user/algorithms_and_data_structures/src/commands/search_commands.py`
**Current Lines:** 1397 lines (2.8x limit)
**Target:** 500 lines (279% reduction required)
**Severity:** High

### Identified Responsibilities

The file contains **3 command classes** with **18 distinct responsibilities**:

#### 1. SearchCommand (lines 25-667, 642 lines)
- Argument parsing with 17+ options
- Query execution with complex filtering
- Relevance score calculation
- Fuzzy matching algorithm
- Snippet generation
- Search suggestions
- Three display formats (list, detailed, summary)
- Save search functionality
- Search analytics recording

#### 2. SavedSearchCommand (lines 669-960, 291 lines)
- Manage saved searches (list, run, show, delete)
- Execute saved searches by delegating to SearchCommand
- Usage tracking

#### 3. SearchAnalyticsCommand (lines 962-1397, 435 lines)
- Five analytics types: overview, popular-queries, no-results, user-behavior, performance
- Five report generators
- Chart visualization
- Export to CSV/JSON

### Code Smells Detected

1. **Business Logic in Command** - Search algorithm embedded in command (lines 221-287)
2. **Complex Algorithms Inline** - Relevance scoring, fuzzy matching not abstracted
3. **Duplicate Analytics Pattern** - Same analytics structure as progress_commands
4. **God Object** - SearchCommand handles too much (search + suggestions + saving + display)
5. **Tight Coupling** - SavedSearchCommand directly instantiates SearchCommand
6. **Mock Data Embedded** - Mock search data inline (lines 289-360)

---

## Refactoring Strategy

### Phase 1: Extract Search Engine (Priority: CRITICAL)

**New File:** `src/services/search/search_engine.py` (~200 lines)

```python
class SearchEngine:
    """Core search functionality"""

    def __init__(self, repository: SearchableRepository):
        self.repository = repository
        self.scorer = RelevanceScorer()
        self.snippet_generator = SnippetGenerator()

    async def search(self, query: str, filters: SearchFilters, options: SearchOptions) -> List[SearchResult]: ...
    async def suggest(self, query: Optional[str] = None) -> List[str]: ...
```

**New File:** `src/services/search/relevance_scorer.py` (~150 lines)

```python
class RelevanceScorer:
    """Calculate relevance scores for search results"""

    def calculate_score(self, item: Dict, query: str, options: SearchOptions) -> float: ...
    def score_title_match(self, title: str, query_words: List[str]) -> float: ...
    def score_description_match(self, description: str, query_words: List[str]) -> float: ...
    def score_tag_match(self, tags: List[str], query_words: List[str]) -> float: ...
    def apply_quality_boost(self, base_score: float, item: Dict) -> float: ...
```

**New File:** `src/services/search/fuzzy_matcher.py` (~80 lines)

```python
class FuzzyMatcher:
    """Fuzzy string matching for search"""

    def fuzzy_match(self, word: str, text: str, max_distance: int = 2) -> bool: ...
    def levenshtein_distance(self, s1: str, s2: str) -> int: ...
```

**New File:** `src/services/search/snippet_generator.py` (~60 lines)

```python
class SnippetGenerator:
    """Generate search result snippets"""

    def generate(self, item: Dict, query: str, max_length: int = 150) -> str: ...
    def find_query_context(self, text: str, query: str, context_size: int = 50) -> str: ...
```

**Extracted Code:**
- Lines 221-287 → SearchEngine.search
- Lines 362-418 → RelevanceScorer methods
- Lines 420-438 → FuzzyMatcher.fuzzy_match
- Lines 440-460 → SnippetGenerator.generate

**Benefits:**
- Separates search algorithm from command
- Enables testing search logic independently
- Removes ~400 lines from SearchCommand
- Reusable search engine across application

---

### Phase 2: Extract Search Filters & Models (Priority: HIGH)

**New File:** `src/models/search_filters.py` (~120 lines)

```python
@dataclass
class SearchFilters:
    """Search filter criteria"""
    type: str = 'all'
    content_type: Optional[str] = None
    author: Optional[str] = None
    tags: List[str] = field(default_factory=list)
    difficulty: Optional[str] = None
    status: Optional[str] = None
    created_after: Optional[datetime] = None
    created_before: Optional[datetime] = None

@dataclass
class SearchOptions:
    """Search behavior options"""
    exact: bool = False
    fuzzy: bool = False
    case_sensitive: bool = False
    limit: int = 20
    sort: str = 'relevance'
    include_preview: bool = False

@dataclass
class SearchResult:
    """Search result item"""
    id: int
    type: str
    title: str
    description: str
    relevance_score: float
    search_snippet: str
    metadata: Dict[str, Any]
```

**Benefits:**
- Type-safe search parameters
- Clear contract for search engine
- Removes ~80 lines of arg parsing complexity

---

### Phase 3: Extract Suggestion Service (Priority: HIGH)

**New File:** `src/services/search/suggestion_service.py` (~100 lines)

```python
class SuggestionService:
    """Search suggestion and autocomplete"""

    def __init__(self, repository: SearchAnalyticsRepository):
        self.analytics_repository = repository

    async def get_suggestions(self, query: Optional[str] = None, limit: int = 8) -> List[str]: ...
    async def get_popular_searches(self, limit: int = 10) -> List[str]: ...
    async def get_trending_searches(self, period_days: int = 7) -> List[str]: ...
    def generate_dynamic_suggestions(self, query: str) -> List[str]: ...
```

**Extracted Code:**
- Lines 462-493 → SuggestionService

**Benefits:**
- Separates suggestion logic
- Enables ML-based suggestions in future
- Removes ~50 lines from SearchCommand

---

### Phase 4: Extract Saved Search Management (Priority: MEDIUM)

**New File:** `src/repositories/saved_search_repository.py` (~100 lines)

```python
class SavedSearchRepository(BaseRepository):
    """Data access for saved searches"""

    async def save(self, name: str, search_data: SavedSearchData) -> int: ...
    async def find_by_name(self, name: str) -> Optional[SavedSearch]: ...
    async def list_all(self, user_id: Optional[int] = None) -> List[SavedSearch]: ...
    async def delete(self, name: str) -> None: ...
    async def update_usage(self, name: str) -> None: ...
```

**New File:** `src/services/search/saved_search_service.py` (~80 lines)

```python
class SavedSearchService:
    """Execute and manage saved searches"""

    def __init__(self, repository: SavedSearchRepository, search_engine: SearchEngine):
        self.repository = repository
        self.search_engine = search_engine

    async def execute_saved_search(self, name: str, overrides: Dict = None) -> List[SearchResult]: ...
    def build_filters_from_saved_search(self, saved_search: SavedSearch) -> SearchFilters: ...
```

**Extracted Code:**
- Lines 928-959 (repository helpers) → SavedSearchRepository
- Lines 803-849 (execute logic) → SavedSearchService

**Benefits:**
- Removes repository logic from command
- Enables saved search reuse
- Removes ~120 lines from SavedSearchCommand

---

### Phase 5: Extract Search Analytics (Priority: MEDIUM)

**New File:** `src/services/analytics/search_analytics_service.py` (~80 lines)

```python
class SearchAnalyticsService:
    """Factory for search analytics generators"""

    def __init__(self, repository: SearchAnalyticsRepository):
        self.generators = {
            'overview': OverviewAnalyticsGenerator(repository),
            'popular-queries': PopularQueriesGenerator(repository),
            'no-results': NoResultsGenerator(repository),
            'user-behavior': UserBehaviorGenerator(repository),
            'performance': PerformanceGenerator(repository)
        }

    async def generate(self, analytics_type: str, period: str) -> AnalyticsData: ...
```

**New Files for Generators:**
- `src/services/analytics/overview_analytics_generator.py` (70 lines)
- `src/services/analytics/popular_queries_generator.py` (60 lines)
- `src/services/analytics/no_results_generator.py` (60 lines)
- `src/services/analytics/user_behavior_generator.py` (70 lines)
- `src/services/analytics/performance_generator.py` (60 lines)

**Extracted Code:**
- Lines 1066-1096 → OverviewAnalyticsGenerator
- Lines 1098-1123 → PopularQueriesGenerator
- Lines 1125-1153 → NoResultsGenerator
- Lines 1155-1183 → UserBehaviorGenerator
- Lines 1185-1212 → PerformanceGenerator

**Benefits:**
- Single Responsibility per analytics type
- Removes ~300 lines from SearchAnalyticsCommand
- Reusable analytics generators

---

### Phase 6: Extract Renderers (Priority: MEDIUM)

**New File:** `src/ui/renderers/search_renderer.py` (~200 lines)

```python
class SearchRenderer:
    """Renders search results"""

    def render_list(self, results: List[SearchResult], options: RenderOptions) -> None: ...
    def render_detailed(self, results: List[SearchResult], options: RenderOptions) -> None: ...
    def render_summary(self, results: List[SearchResult], options: RenderOptions) -> None: ...
    def render_suggestions(self, suggestions: List[str]) -> None: ...
```

**New File:** `src/ui/renderers/search_analytics_renderer.py` (~150 lines)

```python
class SearchAnalyticsRenderer:
    """Renders search analytics reports"""

    def render_overview(self, data: OverviewAnalytics) -> None: ...
    def render_popular_queries(self, data: PopularQueriesAnalytics) -> None: ...
    def render_no_results(self, data: NoResultsAnalytics) -> None: ...
    def render_user_behavior(self, data: UserBehaviorAnalytics) -> None: ...
    def render_performance(self, data: PerformanceAnalytics) -> None: ...
    def render_charts(self, data: AnalyticsData, chart_type: str) -> None: ...
```

**Extracted Code:**
- Lines 529-533 → SearchRenderer.render_suggestions
- Lines 535-591 → SearchRenderer.render_list
- Lines 593-645 → SearchRenderer.render_detailed
- Lines 647-666 → SearchRenderer.render_summary
- Lines 1230-1356 → SearchAnalyticsRenderer methods

**Benefits:**
- Separates presentation layer
- Removes ~300 lines from commands
- Enables alternative output formats

---

### Phase 7: Extract Analytics Recording (Priority: LOW)

**New File:** `src/services/search/search_tracker.py` (~80 lines)

```python
class SearchTracker:
    """Track search queries for analytics"""

    def __init__(self, repository: SearchAnalyticsRepository):
        self.repository = repository

    async def record_search(self, query: str, result_count: int, user_id: Optional[int] = None) -> None: ...
    async def record_click(self, search_id: int, result_id: int) -> None: ...
    async def record_no_result(self, query: str) -> None: ...
```

**Extracted Code:**
- Lines 495-504 → SearchTracker.record_search

**Benefits:**
- Centralizes analytics tracking
- Enables future ML features (click-through prediction)

---

## Final File Structure

After refactoring:

```
src/
├── commands/
│   ├── search/
│   │   ├── __init__.py
│   │   ├── search_command.py              (100 lines) - Main search
│   │   ├── saved_search_command.py        (120 lines) - Saved search ops
│   │   └── search_analytics_command.py    (100 lines) - Analytics
├── models/
│   ├── search_filters.py                  (120 lines) - Filter/option models
│   └── search_result.py                   (60 lines) - Result models
├── repositories/
│   ├── searchable_repository.py           (100 lines) - Searchable items
│   ├── saved_search_repository.py         (100 lines) - Saved searches
│   └── search_analytics_repository.py     (120 lines) - Analytics data
├── services/
│   ├── search/
│   │   ├── __init__.py
│   │   ├── search_engine.py               (200 lines) - Core search
│   │   ├── relevance_scorer.py            (150 lines) - Scoring algorithm
│   │   ├── fuzzy_matcher.py               (80 lines) - Fuzzy matching
│   │   ├── snippet_generator.py           (60 lines) - Snippet generation
│   │   ├── suggestion_service.py          (100 lines) - Suggestions
│   │   ├── saved_search_service.py        (80 lines) - Saved search execution
│   │   └── search_tracker.py              (80 lines) - Analytics tracking
│   └── analytics/
│       ├── search_analytics_service.py    (80 lines) - Analytics factory
│       ├── overview_analytics_generator.py (70 lines)
│       ├── popular_queries_generator.py   (60 lines)
│       ├── no_results_generator.py        (60 lines)
│       ├── user_behavior_generator.py     (70 lines)
│       └── performance_generator.py       (60 lines)
└── ui/
    └── renderers/
        ├── search_renderer.py             (200 lines) - Search results
        └── search_analytics_renderer.py   (150 lines) - Analytics reports
```

**Total:** 2,120 lines across 23 files (~92 lines per file avg)

---

## Migration Strategy

1. **Day 1:** Extract SearchEngine + scoring components
2. **Day 2:** Extract repositories and models
3. **Day 3:** Extract analytics generators
4. **Day 4:** Extract renderers
5. **Day 5:** Refactor commands to use extracted components
6. **Day 6:** Integration testing and optimization

---

## Test Impact

### New Test Files
- Repository tests (3 files): 6 hours
- Search engine tests: 5 hours
- Analytics generator tests (5 files): 8 hours
- Renderer tests (2 files): 4 hours
- Command tests (3 files): 6 hours
- Integration tests: 5 hours
**Total: 34 hours**

---

## Effort Estimate

| Phase | Hours | Priority |
|-------|-------|----------|
| Phase 1: Search Engine | 8-10 | CRITICAL |
| Phase 2: Models/Filters | 3-4 | HIGH |
| Phase 3: Suggestions | 3-4 | HIGH |
| Phase 4: Saved Searches | 4-5 | MEDIUM |
| Phase 5: Analytics | 6-8 | MEDIUM |
| Phase 6: Renderers | 5-6 | MEDIUM |
| Phase 7: Tracking | 2-3 | LOW |
| Testing | 34 | CRITICAL |

**Total: 65-74 hours (8-9 days)**

---

## Success Criteria

✅ Search algorithm separated from command
✅ Relevance scoring independently testable
✅ All files under 500 lines
✅ Analytics generators follow same pattern as progress_commands
✅ Renderers reusable across commands
✅ Search engine extensible for ML features
✅ Test coverage ≥85%

---

## Recommended Next Steps

1. **Immediate:** Extract SearchEngine (enables independent testing of search logic)
2. **High Priority:** Extract analytics generators (follows established pattern)
3. **Medium Priority:** Extract saved search management (reduces coupling)
4. **Future:** Add ML-based suggestions using SearchTracker data
