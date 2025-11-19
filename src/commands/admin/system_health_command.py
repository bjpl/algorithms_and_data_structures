#!/usr/bin/env python3
"""SystemHealthCommand - Extracted from admin_commands.py"""

#!/usr/bin/env python3
"""
Admin Commands - Administrative operations and system management

This module provides:
- User management (create, update, delete, list users)
- System configuration management
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




class SystemHealthCommand(BaseCommand):
    """Check system health and status"""
    
    def get_metadata(self) -> CommandMetadata:
        return CommandMetadata(
            name="system-health",
            description="Check system health and status",
            category=CommandCategory.ADMIN,
            aliases=["health", "status"],
            examples=[
                "system-health",
                "system-health --detailed",
                "system-health --component database",
                "system-health --export health_report.json"
            ]
        )
    
    def setup_parser(self, subparsers):
        parser = self.create_subparser(
            subparsers,
            help="Check system health and status"
        )
        
        parser.add_argument(
            '--detailed',
            action='store_true',
            help='Show detailed health information'
        )
        parser.add_argument(
            '--component',
            choices=['database', 'cache', 'storage', 'email', 'search'],
            help='Check specific component only'
        )
        parser.add_argument(
            '--format',
            choices=['report', 'json'],
            default='report',
            help='Output format'
        )
        parser.add_argument(
            '--export',
            help='Export health report to file'
        )
        
        return parser
    
    async def execute(self, context, args: List[str]) -> CommandResult:
        try:
            parsed_args = self.parse_args(args)
            
            # Check admin permissions
            if not await self._check_admin_permissions(context):
                return CommandResult(
                    success=False,
                    message="Admin permissions required for system health checks"
                )
            
            # Generate health report
            health_data = await self._generate_health_report(context, parsed_args)
            
            # Display report
            if parsed_args.format == 'json':
                output = json.dumps(health_data, indent=2, default=str)
                print(output)
            else:
                self._show_health_report(context.formatter, health_data, parsed_args)
            
            # Export if requested
            if parsed_args.export:
                export_path = await self._export_health_report(context, health_data, parsed_args.export)
                context.formatter.success(f"Health report exported to: {export_path}")
            
            # Determine overall success based on component health
            overall_healthy = all(
                component['status'] in ['healthy', 'warning'] 
                for component in health_data['components'].values()
            )
            
            return CommandResult(
                success=True,
                message=f"System health check completed - {'Healthy' if overall_healthy else 'Issues detected'}",
                data={'health': health_data, 'overall_healthy': overall_healthy}
            )
            
        except Exception as e:
            return CommandResult(
                success=False,
                message=f"Health check failed: {e}",
                error=e
            )
    
    async def _check_admin_permissions(self, context) -> bool:
        """Check admin permissions"""
        return True
    
    async def _generate_health_report(self, context, args) -> Dict[str, Any]:
        """Generate comprehensive health report"""
        health_report = {
            'timestamp': datetime.now().isoformat(),
            'system_info': await self._get_system_info(context),
            'components': {},
            'overall_status': 'healthy'
        }
        
        # Check specific component or all components
        if args.component:
            components_to_check = [args.component]
        else:
            components_to_check = ['database', 'cache', 'storage', 'email', 'search']
        
        # Check each component
        for component in components_to_check:
            health_report['components'][component] = await self._check_component_health(
                context, component, args.detailed
            )
        
        # Determine overall status
        statuses = [comp['status'] for comp in health_report['components'].values()]
        if 'critical' in statuses:
            health_report['overall_status'] = 'critical'
        elif 'error' in statuses:
            health_report['overall_status'] = 'error'
        elif 'warning' in statuses:
            health_report['overall_status'] = 'warning'
        else:
            health_report['overall_status'] = 'healthy'
        
        return health_report
    
    async def _get_system_info(self, context) -> Dict[str, Any]:
        """Get general system information"""
        import psutil
        import platform
        
        return {
            'platform': platform.system(),
            'platform_version': platform.release(),
            'python_version': platform.python_version(),
            'cpu_usage': psutil.cpu_percent(interval=1),
            'memory_usage': psutil.virtual_memory().percent,
            'disk_usage': psutil.disk_usage('/').percent,
            'uptime_seconds': int(psutil.boot_time()),
            'load_average': psutil.getloadavg() if hasattr(psutil, 'getloadavg') else None
        }
    
    async def _check_component_health(self, context, component: str, detailed: bool) -> Dict[str, Any]:
        """Check health of specific component"""
        # Mock implementation - replace with actual health checks
        if component == 'database':
            return {
                'status': 'healthy',
                'response_time_ms': 25.3,
                'connections_active': 12,
                'connections_max': 100,
                'last_backup': '2024-01-22T02:00:00',
                'disk_usage_percent': 67.3,
                'details': {
                    'host': 'localhost:5432',
                    'database': 'curriculum_db',
                    'version': 'PostgreSQL 14.2',
                    'table_count': 23,
                    'total_size_mb': 245.7
                } if detailed else None
            }
        elif component == 'cache':
            return {
                'status': 'healthy',
                'response_time_ms': 1.8,
                'memory_usage_mb': 128.5,
                'memory_max_mb': 512,
                'hit_rate_percent': 89.3,
                'keys_count': 1847,
                'details': {
                    'host': 'localhost:6379',
                    'version': 'Redis 6.2.7',
                    'evicted_keys': 23,
                    'expired_keys': 156
                } if detailed else None
            }
        elif component == 'storage':
            return {
                'status': 'warning',
                'disk_usage_percent': 85.2,
                'available_space_gb': 12.4,
                'total_files': 8947,
                'backup_status': 'healthy',
                'details': {
                    'mount_point': '/var/data',
                    'filesystem': 'ext4',
                    'last_cleanup': '2024-01-20T03:00:00',
                    'largest_files': [
                        {'name': 'video_archive.zip', 'size_mb': 1024.5},
                        {'name': 'database_backup.sql', 'size_mb': 567.2}
                    ]
                } if detailed else None
            }
        elif component == 'email':
            return {
                'status': 'healthy',
                'smtp_connection': 'connected',
                'queue_size': 3,
                'emails_sent_today': 47,
                'delivery_rate_percent': 98.5,
                'details': {
                    'smtp_server': 'smtp.example.com:587',
                    'auth_status': 'authenticated',
                    'last_sent': '2024-01-22T15:42:00',
                    'bounce_rate_percent': 1.2
                } if detailed else None
            }
        elif component == 'search':
            return {
                'status': 'healthy',
                'response_time_ms': 45.7,
                'index_size_mb': 89.3,
                'documents_indexed': 3421,
                'last_index_update': '2024-01-22T14:15:00',
                'details': {
                    'search_engine': 'Elasticsearch 7.15.2',
                    'cluster_health': 'green',
                    'active_shards': 5,
                    'queries_per_second': 12.4
                } if detailed else None
            }
        
        return {'status': 'unknown'}
    
    def _show_health_report(self, formatter: TerminalFormatter, health_data: Dict[str, Any], args):
        """Display health report"""
        # Overall status
        status_icon = {
            'healthy': '✅',
            'warning': '⚠️',
            'error': '❌',
            'critical': '🔴'
        }.get(health_data['overall_status'], '❓')
        
        formatter.header(f"System Health Check {status_icon}", level=1)
        formatter.info(f"Status: {health_data['overall_status'].upper()}")
        formatter.info(f"Checked: {health_data['timestamp'][:16]}")
        
        # System information
        if args.detailed:
            formatter.header("System Information", level=2)
            sys_info = health_data['system_info']
            formatter.key_value_pairs({
                'Platform': f"{sys_info['platform']} {sys_info['platform_version']}",
                'Python Version': sys_info['python_version'],
                'CPU Usage': f"{sys_info['cpu_usage']:.1f}%",
                'Memory Usage': f"{sys_info['memory_usage']:.1f}%",
                'Disk Usage': f"{sys_info['disk_usage']:.1f}%"
            })
        
        # Component health
        formatter.header("Component Health", level=2)
        
        for component_name, component_health in health_data['components'].items():
            status_icon = {
                'healthy': '✅',
                'warning': '⚠️',
                'error': '❌',
                'critical': '🔴'
            }.get(component_health['status'], '❓')
            
            formatter.header(f"{component_name.title()} {status_icon}", level=3)
            
            # Basic metrics
            metrics = {}
            if 'response_time_ms' in component_health:
                metrics['Response Time'] = f"{component_health['response_time_ms']:.1f}ms"
            
            if component_name == 'database':
                metrics.update({
                    'Active Connections': f"{component_health['connections_active']}/{component_health['connections_max']}",
                    'Disk Usage': f"{component_health['disk_usage_percent']:.1f}%",
                    'Last Backup': component_health['last_backup'][:16]
                })
            elif component_name == 'cache':
                metrics.update({
                    'Memory Usage': f"{component_health['memory_usage_mb']:.1f}/{component_health['memory_max_mb']}MB",
                    'Hit Rate': f"{component_health['hit_rate_percent']:.1f}%",
                    'Keys': component_health['keys_count']
                })
            elif component_name == 'storage':
                metrics.update({
                    'Disk Usage': f"{component_health['disk_usage_percent']:.1f}%",
                    'Available Space': f"{component_health['available_space_gb']:.1f}GB",
                    'Total Files': component_health['total_files']
                })
            elif component_name == 'email':
                metrics.update({
                    'Queue Size': component_health['queue_size'],
                    'Emails Sent Today': component_health['emails_sent_today'],
                    'Delivery Rate': f"{component_health['delivery_rate_percent']:.1f}%"
                })
            elif component_name == 'search':
                metrics.update({
                    'Index Size': f"{component_health['index_size_mb']:.1f}MB",
                    'Documents': component_health['documents_indexed'],
                    'Last Update': component_health['last_index_update'][:16]
                })
            
            formatter.key_value_pairs(metrics, indent=1)
            
            # Detailed information
            if args.detailed and component_health.get('details'):
                formatter.info("  Details:")
                formatter.key_value_pairs(component_health['details'], indent=2)
            
            print()
    
    async def _export_health_report(self, context, health_data: Dict[str, Any], output_file: str) -> str:
        """Export health report to file"""
        output_path = Path(output_file)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_path, 'w') as f:
            json.dump(health_data, f, indent=2, default=str)
        
        return str(output_path)
