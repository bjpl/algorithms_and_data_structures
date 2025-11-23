#!/usr/bin/env python
"""
Fix all corrupted test files in tests/ui directory
Replaces literal \n with actual newlines and fixes syntax errors
"""

import os
import glob

# Find all test files
test_files = glob.glob('tests/ui/**/*.test.js', recursive=True)

print(f"Found {len(test_files)} test files")

fixed_count = 0
error_count = 0

for file_path in test_files:
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        original_size = len(content)

        # Check if file needs fixing (has literal \n)
        if '\\n' in content:
            # Replace literal \n with actual newlines
            content = content.replace('\\n', '\n')

            # Fix the syntax error ${= to ${
            content = content.replace('${=', '${')

            # Write the fixed file
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)

            lines = content.count('\n')
            print(f"✓ Fixed {file_path}: {lines} lines (was {original_size} chars)")
            fixed_count += 1
        else:
            print(f"  Skipped {file_path}: already OK")

    except Exception as e:
        print(f"✗ Error fixing {file_path}: {e}")
        error_count += 1

print(f"\nSummary: Fixed {fixed_count} files, {error_count} errors")
