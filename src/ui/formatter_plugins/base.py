"""
Base Plugin System for UnifiedFormatter

Provides abstract base classes and management infrastructure for the plugin system.
Plugins extend formatter functionality without modifying core code.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Set, Callable
from enum import Enum
import logging
from pathlib import Path


# Configure logging
logger = logging.getLogger(__name__)


# ============================================================================
# Exceptions
# ============================================================================


class PluginError(Exception):
    """Base exception for plugin-related errors"""
    pass


class PluginNotFoundError(PluginError):
    """Raised when a plugin is not found"""
    pass


class PluginDependencyError(PluginError):
    """Raised when plugin dependencies cannot be resolved"""
    pass


class PluginInitializationError(PluginError):
    """Raised when plugin initialization fails"""
    pass


# ============================================================================
# Plugin Priority and Status
# ============================================================================


class PluginPriority(Enum):
    """Plugin priority for conflict resolution"""
    LOWEST = 0
    LOW = 25
    NORMAL = 50
    HIGH = 75
    HIGHEST = 100


class PluginStatus(Enum):
    """Plugin lifecycle status"""
    UNINITIALIZED = "uninitialized"
    INITIALIZING = "initializing"
    INITIALIZED = "initialized"
    ACTIVE = "active"
    DISABLED = "disabled"
    ERROR = "error"


# ============================================================================
# Data Classes
# ============================================================================


@dataclass
class PluginMetadata:
    """Plugin metadata information"""
    name: str
    version: str
    author: str = "Unknown"
    description: str = ""
    url: str = ""
    license: str = ""
    tags: List[str] = field(default_factory=list)


@dataclass
class PluginCapabilities:
    """Describes plugin capabilities"""
    content_types: Set[str] = field(default_factory=set)
    features: Set[str] = field(default_factory=set)
    dependencies: Set[str] = field(default_factory=set)
    conflicts_with: Set[str] = field(default_factory=set)
    provides: Set[str] = field(default_factory=set)


@dataclass
class PluginConfig:
    """Plugin configuration"""
    enabled: bool = True
    priority: PluginPriority = PluginPriority.NORMAL
    options: Dict[str, Any] = field(default_factory=dict)
    lazy_load: bool = True
    auto_enable: bool = True


# ============================================================================
# Base Plugin Class
# ============================================================================


class BasePlugin(ABC):
    """
    Abstract base class for all formatter plugins.

    Plugins extend formatter functionality by:
    - Handling specific content types
    - Providing rendering strategies
    - Adding pre/post processing hooks
    - Implementing custom formatting logic

    Example:
        >>> class LessonFormatterPlugin(BasePlugin):
        ...     @property
        ...     def name(self):
        ...         return "lesson_formatter"
        ...
        ...     @property
        ...     def version(self):
        ...         return "1.0.0"
        ...
        ...     def initialize(self, formatter=None):
        ...         self.formatter = formatter
        ...         logger.info(f"Initialized {self.name}")
        ...
        ...     def shutdown(self):
        ...         logger.info(f"Shutdown {self.name}")
        ...
        ...     def can_handle(self, content_type):
        ...         return content_type in ["lesson", "lesson_header"]
        ...
        ...     def format(self, content, **options):
        ...         if isinstance(content, dict) and 'title' in content:
        ...             return f"Lesson: {content['title']}"
        ...         return str(content)
        ...
        ...     def get_capabilities(self):
        ...         return PluginCapabilities(
        ...             content_types={"lesson", "lesson_header"},
        ...             features={"complexity_badges", "practice_problems"}
        ...         )
    """

    def __init__(self):
        """Initialize plugin base"""
        self._status = PluginStatus.UNINITIALIZED
        self._config = PluginConfig()
        self._pre_hooks: List[Callable] = []
        self._post_hooks: List[Callable] = []

    # ========================================================================
    # Abstract Properties (Must Implement)
    # ========================================================================

    @property
    @abstractmethod
    def name(self) -> str:
        """
        Unique plugin name (identifier).

        Returns:
            Plugin name (lowercase, no spaces)
        """
        pass

    @property
    @abstractmethod
    def version(self) -> str:
        """
        Plugin version (semantic versioning recommended).

        Returns:
            Version string (e.g., "1.0.0")
        """
        pass

    # ========================================================================
    # Abstract Lifecycle Methods (Must Implement)
    # ========================================================================

    @abstractmethod
    def initialize(self, formatter: Any = None) -> None:
        """
        Initialize plugin with formatter instance.

        Called when plugin is registered with formatter.
        Use this to set up resources, register strategies, etc.

        Args:
            formatter: UnifiedFormatter instance (may be None for standalone)

        Raises:
            PluginInitializationError: If initialization fails
        """
        pass

    @abstractmethod
    def shutdown(self) -> None:
        """
        Cleanup plugin resources.

        Called when plugin is unregistered or formatter is destroyed.
        Use this to close files, release resources, etc.
        """
        pass

    # ========================================================================
    # Abstract Handler Methods (Must Implement)
    # ========================================================================

    @abstractmethod
    def can_handle(self, content_type: str) -> bool:
        """
        Check if plugin can handle given content type.

        Args:
            content_type: Content type identifier (e.g., "lesson", "markdown")

        Returns:
            True if plugin can handle this content type
        """
        pass

    @abstractmethod
    def format(self, content: Any, **options) -> str:
        """
        Format content using this plugin.

        Args:
            content: Content to format (type depends on content_type)
            **options: Additional formatting options

        Returns:
            Formatted string

        Raises:
            ValueError: If content cannot be formatted
        """
        pass

    @abstractmethod
    def get_capabilities(self) -> PluginCapabilities:
        """
        Get plugin capabilities.

        Returns:
            PluginCapabilities instance describing what plugin provides
        """
        pass

    # ========================================================================
    # Optional Hook Methods (Override if needed)
    # ========================================================================

    def get_metadata(self) -> PluginMetadata:
        """
        Get plugin metadata.

        Override to provide detailed plugin information.

        Returns:
            PluginMetadata instance
        """
        return PluginMetadata(
            name=self.name,
            version=self.version
        )

    def pre_process(self, content: Any, **options) -> Any:
        """
        Pre-process content before formatting.

        Override to add pre-processing logic.

        Args:
            content: Raw content
            **options: Processing options

        Returns:
            Processed content
        """
        return content

    def post_process(self, formatted: str, **options) -> str:
        """
        Post-process formatted content.

        Override to add post-processing logic.

        Args:
            formatted: Formatted string
            **options: Processing options

        Returns:
            Post-processed string
        """
        return formatted

    def validate_content(self, content: Any) -> bool:
        """
        Validate content before formatting.

        Override to add validation logic.

        Args:
            content: Content to validate

        Returns:
            True if content is valid
        """
        return True

    # ========================================================================
    # Hook Management
    # ========================================================================

    def add_pre_hook(self, hook: Callable) -> None:
        """
        Add pre-processing hook.

        Args:
            hook: Callable(content, **options) -> content
        """
        self._pre_hooks.append(hook)

    def add_post_hook(self, hook: Callable) -> None:
        """
        Add post-processing hook.

        Args:
            hook: Callable(formatted, **options) -> formatted
        """
        self._post_hooks.append(hook)

    def _execute_pre_hooks(self, content: Any, **options) -> Any:
        """Execute all pre-processing hooks"""
        for hook in self._pre_hooks:
            content = hook(content, **options)
        return content

    def _execute_post_hooks(self, formatted: str, **options) -> str:
        """Execute all post-processing hooks"""
        for hook in self._post_hooks:
            formatted = hook(formatted, **options)
        return formatted

    # ========================================================================
    # Configuration
    # ========================================================================

    def configure(self, config: PluginConfig) -> None:
        """
        Configure plugin.

        Args:
            config: PluginConfig instance
        """
        self._config = config

    def get_config(self) -> PluginConfig:
        """Get plugin configuration"""
        return self._config

    def set_option(self, key: str, value: Any) -> None:
        """Set configuration option"""
        self._config.options[key] = value

    def get_option(self, key: str, default: Any = None) -> Any:
        """Get configuration option"""
        return self._config.options.get(key, default)

    # ========================================================================
    # Status Management
    # ========================================================================

    @property
    def status(self) -> PluginStatus:
        """Get plugin status"""
        return self._status

    @property
    def is_active(self) -> bool:
        """Check if plugin is active"""
        return self._status == PluginStatus.ACTIVE

    @property
    def is_enabled(self) -> bool:
        """Check if plugin is enabled"""
        return self._config.enabled

    def enable(self) -> None:
        """Enable plugin"""
        self._config.enabled = True
        if self._status == PluginStatus.INITIALIZED:
            self._status = PluginStatus.ACTIVE

    def disable(self) -> None:
        """Disable plugin"""
        self._config.enabled = False
        self._status = PluginStatus.DISABLED

    # ========================================================================
    # Priority Management
    # ========================================================================

    @property
    def priority(self) -> PluginPriority:
        """Get plugin priority"""
        return self._config.priority

    def set_priority(self, priority: PluginPriority) -> None:
        """Set plugin priority"""
        self._config.priority = priority


# ============================================================================
# Plugin Registry
# ============================================================================


class PluginRegistry:
    """
    Registry for plugin management and discovery.

    Handles plugin registration, lookup, and conflict resolution.

    Example:
        >>> registry = PluginRegistry()
        >>> registry.register(my_plugin)
        >>> plugin = registry.get_plugin("my_plugin")
        >>> handlers = registry.find_handlers("markdown")
    """

    def __init__(self):
        """Initialize registry"""
        self._plugins: Dict[str, BasePlugin] = {}
        self._content_type_map: Dict[str, List[BasePlugin]] = {}
        self._feature_map: Dict[str, List[BasePlugin]] = {}

    def register(self, plugin: BasePlugin) -> None:
        """
        Register plugin.

        Args:
            plugin: Plugin instance

        Raises:
            PluginError: If plugin with same name exists
        """
        if plugin.name in self._plugins:
            raise PluginError(f"Plugin '{plugin.name}' already registered")

        self._plugins[plugin.name] = plugin

        # Update content type mapping
        capabilities = plugin.get_capabilities()
        for content_type in capabilities.content_types:
            if content_type not in self._content_type_map:
                self._content_type_map[content_type] = []
            self._content_type_map[content_type].append(plugin)

        # Update feature mapping
        for feature in capabilities.features:
            if feature not in self._feature_map:
                self._feature_map[feature] = []
            self._feature_map[feature].append(plugin)

        logger.info(f"Registered plugin: {plugin.name} v{plugin.version}")

    def unregister(self, name: str) -> None:
        """
        Unregister plugin.

        Args:
            name: Plugin name

        Raises:
            PluginNotFoundError: If plugin not found
        """
        if name not in self._plugins:
            raise PluginNotFoundError(f"Plugin '{name}' not found")

        plugin = self._plugins[name]

        # Remove from content type mapping
        capabilities = plugin.get_capabilities()
        for content_type in capabilities.content_types:
            if content_type in self._content_type_map:
                self._content_type_map[content_type].remove(plugin)

        # Remove from feature mapping
        for feature in capabilities.features:
            if feature in self._feature_map:
                self._feature_map[feature].remove(plugin)

        del self._plugins[name]
        logger.info(f"Unregistered plugin: {name}")

    def get_plugin(self, name: str) -> Optional[BasePlugin]:
        """
        Get plugin by name.

        Args:
            name: Plugin name

        Returns:
            Plugin instance or None
        """
        return self._plugins.get(name)

    def list_plugins(self) -> List[str]:
        """
        List all registered plugin names.

        Returns:
            List of plugin names
        """
        return list(self._plugins.keys())

    def find_handlers(self, content_type: str) -> List[BasePlugin]:
        """
        Find all plugins that can handle content type.

        Args:
            content_type: Content type identifier

        Returns:
            List of plugins, sorted by priority (highest first)
        """
        handlers = []
        for plugin in self._plugins.values():
            if plugin.can_handle(content_type) and plugin.is_enabled:
                handlers.append(plugin)

        # Sort by priority (highest first)
        handlers.sort(key=lambda p: p.priority.value, reverse=True)
        return handlers

    def find_handler(self, content_type: str) -> Optional[BasePlugin]:
        """
        Find single best handler for content type.

        Args:
            content_type: Content type identifier

        Returns:
            Best plugin handler or None
        """
        handlers = self.find_handlers(content_type)
        return handlers[0] if handlers else None

    def get_plugins_by_feature(self, feature: str) -> List[BasePlugin]:
        """
        Get plugins providing a feature.

        Args:
            feature: Feature name

        Returns:
            List of plugins
        """
        return self._feature_map.get(feature, [])

    def has_plugin(self, name: str) -> bool:
        """Check if plugin is registered"""
        return name in self._plugins


# ============================================================================
# Plugin Manager
# ============================================================================


class PluginManager:
    """
    Manages plugin lifecycle, loading, and dependencies.

    Provides:
    - Lazy loading of plugins
    - Dependency resolution
    - Error handling and fallbacks
    - Plugin discovery from directories

    Example:
        >>> manager = PluginManager()
        >>> manager.register(my_plugin)
        >>> manager.initialize_all()
        >>>
        >>> # Auto-select handler
        >>> result = manager.format_with_plugin("markdown", "# Title")
        >>>
        >>> # Shutdown
        >>> manager.shutdown_all()
    """

    def __init__(self, formatter: Any = None):
        """
        Initialize plugin manager.

        Args:
            formatter: UnifiedFormatter instance (optional)
        """
        self._registry = PluginRegistry()
        self._formatter = formatter
        self._lazy_loaders: Dict[str, Callable] = {}
        self._initialized: Set[str] = set()

    # ========================================================================
    # Plugin Registration
    # ========================================================================

    def register(self, plugin: BasePlugin) -> None:
        """
        Register plugin (immediate loading).

        Args:
            plugin: Plugin instance
        """
        self._registry.register(plugin)

    def register_lazy(self, name: str, loader: Callable[[], BasePlugin]) -> None:
        """
        Register plugin with lazy loading.

        Args:
            name: Plugin name
            loader: Callable that returns plugin instance
        """
        self._lazy_loaders[name] = loader
        logger.debug(f"Registered lazy loader for plugin: {name}")

    def unregister(self, name: str) -> None:
        """
        Unregister plugin.

        Args:
            name: Plugin name
        """
        if name in self._initialized:
            plugin = self._registry.get_plugin(name)
            if plugin:
                try:
                    plugin.shutdown()
                except Exception as e:
                    logger.error(f"Error shutting down plugin '{name}': {e}")
            self._initialized.discard(name)

        self._registry.unregister(name)
        if name in self._lazy_loaders:
            del self._lazy_loaders[name]

    # ========================================================================
    # Lifecycle Management
    # ========================================================================

    def initialize(self, name: str) -> None:
        """
        Initialize specific plugin.

        Args:
            name: Plugin name

        Raises:
            PluginNotFoundError: If plugin not found
            PluginInitializationError: If initialization fails
        """
        # Check if lazy loader exists
        if name in self._lazy_loaders and name not in self._registry.list_plugins():
            loader = self._lazy_loaders[name]
            try:
                plugin = loader()
                self._registry.register(plugin)
            except Exception as e:
                raise PluginInitializationError(
                    f"Failed to load plugin '{name}': {e}"
                )

        plugin = self._registry.get_plugin(name)
        if not plugin:
            raise PluginNotFoundError(f"Plugin '{name}' not found")

        if name in self._initialized:
            logger.debug(f"Plugin '{name}' already initialized")
            return

        # Resolve dependencies
        self._resolve_dependencies(plugin)

        # Initialize plugin
        try:
            plugin._status = PluginStatus.INITIALIZING
            plugin.initialize(self._formatter)
            plugin._status = PluginStatus.ACTIVE if plugin.is_enabled else PluginStatus.INITIALIZED
            self._initialized.add(name)
            logger.info(f"Initialized plugin: {name}")
        except Exception as e:
            plugin._status = PluginStatus.ERROR
            raise PluginInitializationError(
                f"Failed to initialize plugin '{name}': {e}"
            )

    def initialize_all(self) -> None:
        """Initialize all registered plugins"""
        for name in self._registry.list_plugins():
            try:
                self.initialize(name)
            except PluginError as e:
                logger.error(f"Failed to initialize plugin '{name}': {e}")

    def shutdown(self, name: str) -> None:
        """
        Shutdown specific plugin.

        Args:
            name: Plugin name
        """
        plugin = self._registry.get_plugin(name)
        if plugin and name in self._initialized:
            try:
                plugin.shutdown()
                plugin._status = PluginStatus.UNINITIALIZED
                self._initialized.discard(name)
                logger.info(f"Shutdown plugin: {name}")
            except Exception as e:
                logger.error(f"Error shutting down plugin '{name}': {e}")

    def shutdown_all(self) -> None:
        """Shutdown all plugins"""
        for name in list(self._initialized):
            self.shutdown(name)

    # ========================================================================
    # Dependency Resolution
    # ========================================================================

    def _resolve_dependencies(self, plugin: BasePlugin) -> None:
        """
        Resolve plugin dependencies.

        Args:
            plugin: Plugin instance

        Raises:
            PluginDependencyError: If dependencies cannot be resolved
        """
        capabilities = plugin.get_capabilities()

        # Check dependencies
        for dep in capabilities.dependencies:
            if not self._registry.has_plugin(dep):
                raise PluginDependencyError(
                    f"Plugin '{plugin.name}' requires '{dep}' which is not registered"
                )

            # Initialize dependency if needed
            if dep not in self._initialized:
                try:
                    self.initialize(dep)
                except PluginError as e:
                    raise PluginDependencyError(
                        f"Failed to initialize dependency '{dep}' for '{plugin.name}': {e}"
                    )

        # Check conflicts
        for conflict in capabilities.conflicts_with:
            if conflict in self._initialized:
                raise PluginDependencyError(
                    f"Plugin '{plugin.name}' conflicts with '{conflict}' which is active"
                )

    # ========================================================================
    # Plugin Discovery
    # ========================================================================

    def get_plugin(self, name: str) -> Optional[BasePlugin]:
        """Get plugin by name"""
        return self._registry.get_plugin(name)

    def list_plugins(self) -> List[str]:
        """List all plugin names"""
        return self._registry.list_plugins()

    def find_handler(self, content_type: str) -> Optional[BasePlugin]:
        """Find best handler for content type"""
        return self._registry.find_handler(content_type)

    # ========================================================================
    # Formatting with Plugins
    # ========================================================================

    def format_with_plugin(
        self,
        content_type: str,
        content: Any,
        plugin_name: Optional[str] = None,
        **options
    ) -> str:
        """
        Format content using plugin.

        Args:
            content_type: Content type identifier
            content: Content to format
            plugin_name: Specific plugin to use (auto-select if None)
            **options: Formatting options

        Returns:
            Formatted string

        Raises:
            PluginNotFoundError: If no handler found
        """
        # Get plugin
        if plugin_name:
            plugin = self._registry.get_plugin(plugin_name)
            if not plugin:
                raise PluginNotFoundError(f"Plugin '{plugin_name}' not found")
        else:
            plugin = self._registry.find_handler(content_type)
            if not plugin:
                raise PluginNotFoundError(
                    f"No plugin found for content type '{content_type}'"
                )

        # Initialize if needed
        if plugin.name not in self._initialized:
            self.initialize(plugin.name)

        # Format with error handling
        try:
            # Pre-process
            content = plugin.pre_process(content, **options)
            content = plugin._execute_pre_hooks(content, **options)

            # Format
            formatted = plugin.format(content, **options)

            # Post-process
            formatted = plugin.post_process(formatted, **options)
            formatted = plugin._execute_post_hooks(formatted, **options)

            return formatted
        except Exception as e:
            logger.error(f"Error formatting with plugin '{plugin.name}': {e}")
            raise

    # ========================================================================
    # Configuration
    # ========================================================================

    def set_formatter(self, formatter: Any) -> None:
        """Set formatter instance for plugins"""
        self._formatter = formatter

    def enable_plugin(self, name: str) -> None:
        """Enable plugin"""
        plugin = self._registry.get_plugin(name)
        if plugin:
            plugin.enable()

    def disable_plugin(self, name: str) -> None:
        """Disable plugin"""
        plugin = self._registry.get_plugin(name)
        if plugin:
            plugin.disable()
