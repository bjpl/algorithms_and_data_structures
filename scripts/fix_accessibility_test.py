#!/usr/bin/env python3
"""
Fix corrupted accessibility.test.js file
Replaces literal \n with actual newlines and fixes syntax errors
"""

import sys

# Read the corrupted file
with open('tests/ui/components/accessibility.test.js', 'r', encoding='utf-8') as f:
    content = f.read()

print(f"Original file size: {len(content)} chars")
print(f"Contains literal \\n: {repr(content[:100])}")

# Replace literal \n with actual newlines
content = content.replace('\\n', '\n')

# Fix the syntax error ${= to ${
content = content.replace('${=', '${')

# Write the fixed file
with open('tests/ui/components/accessibility.test.js', 'w', encoding='utf-8') as f:
    f.write(content)

# Verify
lines = content.count('\n')
print(f"Fixed file: {lines} lines, {len(content)} chars")
print("File fixed successfully")
