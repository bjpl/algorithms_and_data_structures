#!/usr/bin/env python
"""Fix jest.config.cjs file - replace literal \n with actual newlines"""

with open('jest.config.cjs', 'r', encoding='utf-8') as f:
    content = f.read()

print(f"Original file size: {len(content)} chars")

# Replace literal \n with actual newlines
content = content.replace('\\n', '\n')

with open('jest.config.cjs', 'w', encoding='utf-8') as f:
    f.write(content)

lines = content.count('\n')
print(f"Fixed file: {lines} lines, {len(content)} chars")
print("jest.config.cjs fixed successfully")
