#!/usr/bin/env python3
"""
Command Output Formatters - Format command results for different output types

This module provides formatting functions for command output in various formats
(table, JSON, CSV, list) to reduce duplication across command modules.
"""

import json
import csv
from io import StringIO
from typing import List, Dict, Any, Optional
from rich.console import Console
from rich.table import Table


def format_table_output(
    data: List[Dict[str, Any]],
    columns: Optional[List[str]] = None,
    title: Optional[str] = None,
    headers: Optional[Dict[str, str]] = None
) -> str:
    """Format data as a rich table

    Args:
        data: List of data dictionaries
        columns: List of column keys to include (all if None)
        title: Optional table title
        headers: Optional mapping of column keys to display names

    Returns:
        Formatted table string
    """
    if not data:
        return "No data to display."

    # Determine columns
    if columns is None:
        columns = list(data[0].keys()) if data else []

    # Create table
    table = Table(title=title, show_header=True, header_style="bold cyan")

    # Add columns
    for col in columns:
        header = headers.get(col, col) if headers else col
        table.add_column(header.replace('_', ' ').title())

    # Add rows
    for item in data:
        row = []
        for col in columns:
            value = item.get(col, '')
            # Convert to string and handle None
            if value is None:
                row.append('')
            elif isinstance(value, (list, dict)):
                row.append(json.dumps(value))
            else:
                row.append(str(value))
        table.add_row(*row)

    # Render to string
    console = Console(record=True)
    console.print(table)
    return console.export_text()


def format_json_output(
    data: Any,
    pretty: bool = True,
    indent: int = 2
) -> str:
    """Format data as JSON

    Args:
        data: Data to format
        pretty: Whether to pretty-print
        indent: Indentation level for pretty printing

    Returns:
        JSON string
    """
    if pretty:
        return json.dumps(data, indent=indent, default=str)
    return json.dumps(data, default=str)


def format_csv_output(
    data: List[Dict[str, Any]],
    columns: Optional[List[str]] = None,
    headers: Optional[Dict[str, str]] = None
) -> str:
    """Format data as CSV

    Args:
        data: List of data dictionaries
        columns: List of column keys to include (all if None)
        headers: Optional mapping of column keys to display names

    Returns:
        CSV string
    """
    if not data:
        return ""

    # Determine columns
    if columns is None:
        columns = list(data[0].keys()) if data else []

    # Create CSV in memory
    output = StringIO()
    writer = csv.DictWriter(output, fieldnames=columns)

    # Write header
    if headers:
        writer.writerow({col: headers.get(col, col) for col in columns})
    else:
        writer.writeheader()

    # Write rows
    for item in data:
        row = {}
        for col in columns:
            value = item.get(col, '')
            # Handle complex types
            if isinstance(value, (list, dict)):
                row[col] = json.dumps(value)
            else:
                row[col] = value
        writer.writerow(row)

    return output.getvalue()


def format_list_output(
    data: List[Dict[str, Any]],
    template: str = "{id}. {name}",
    numbered: bool = False
) -> str:
    """Format data as a simple list

    Args:
        data: List of data dictionaries
        template: Format template string using dictionary keys
        numbered: Whether to add line numbers

    Returns:
        Formatted list string
    """
    if not data:
        return "No items to display."

    lines = []
    for idx, item in enumerate(data, 1):
        try:
            line = template.format(**item)
            if numbered:
                line = f"{idx}. {line}"
            lines.append(line)
        except KeyError as e:
            lines.append(f"Error formatting item {idx}: Missing key {e}")

    return '\n'.join(lines)


def format_summary_output(
    title: str,
    metrics: Dict[str, Any],
    console_obj: Optional[Console] = None
) -> str:
    """Format summary metrics as a panel

    Args:
        title: Summary title
        metrics: Dictionary of metric name -> value
        console_obj: Optional console object

    Returns:
        Formatted summary string
    """
    from rich.panel import Panel

    # Format metrics
    lines = []
    for key, value in metrics.items():
        label = key.replace('_', ' ').title()
        lines.append(f"{label}: {value}")

    content = '\n'.join(lines)

    if console_obj is None:
        console_obj = Console(record=True)

    panel = Panel(content, title=title, border_style="blue")
    console_obj.print(panel)

    return console_obj.export_text() if hasattr(console_obj, 'export_text') else content


def format_error_output(error: Exception) -> str:
    """Format error message

    Args:
        error: Exception object

    Returns:
        Formatted error string
    """
    from rich.panel import Panel

    console = Console(record=True)
    panel = Panel(
        str(error),
        title="Error",
        border_style="red",
        title_align="left"
    )
    console.print(panel)
    return console.export_text()


def format_success_output(message: str, details: Optional[str] = None) -> str:
    """Format success message

    Args:
        message: Success message
        details: Optional details

    Returns:
        Formatted success string
    """
    from rich.panel import Panel

    console = Console(record=True)
    content = message
    if details:
        content = f"{message}\n\n{details}"

    panel = Panel(
        content,
        title="Success",
        border_style="green",
        title_align="left"
    )
    console.print(panel)
    return console.export_text()
