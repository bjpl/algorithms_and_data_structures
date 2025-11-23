#!/usr/bin/env python3
"""
Automated Daily Development Report Generator

Generates daily development reports by analyzing git commits,
following the format established in daily_reports/.

Usage:
    python scripts/generate_daily_report.py [date]
    python scripts/generate_daily_report.py 2025-10-09
    python scripts/generate_daily_report.py  # Uses today's date
"""

import sys
import subprocess
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Dict, Any
import re


class DailyReportGenerator:
    """Generate daily development reports from git history"""

    def __init__(self, repo_path: Path = Path(".")):
        self.repo_path = repo_path
        self.daily_reports_dir = repo_path / "daily_reports"
        self.daily_reports_dir.mkdir(exist_ok=True)

    def get_commits_for_date(self, target_date: str) -> List[Dict[str, Any]]:
        """
        Get all commits for a specific date.

        Args:
            target_date: Date in YYYY-MM-DD format

        Returns:
            List of commit dictionaries
        """
        # Get commits for the specific date
        cmd = [
            "git", "log",
            f"--since={target_date} 00:00:00",
            f"--until={target_date} 23:59:59",
            "--pretty=format:%H|%h|%an|%ae|%ad|%s",
            "--date=short"
        ]

        try:
            result = subprocess.run(
                cmd,
                cwd=self.repo_path,
                capture_output=True,
                text=True,
                check=True
            )

            commits = []
            for line in result.stdout.strip().split('\n'):
                if not line:
                    continue

                parts = line.split('|')
                if len(parts) >= 6:
                    commits.append({
                        'hash': parts[0],
                        'short_hash': parts[1],
                        'author_name': parts[2],
                        'author_email': parts[3],
                        'date': parts[4],
                        'message': '|'.join(parts[5:])  # Rejoin in case message had |
                    })

            return commits

        except subprocess.CalledProcessError as e:
            print(f"Error getting commits: {e}")
            return []

    def get_commit_stats(self, commit_hash: str) -> Dict[str, Any]:
        """Get detailed statistics for a commit"""
        cmd = ["git", "show", "--stat", "--format=%H", commit_hash]

        try:
            result = subprocess.run(
                cmd,
                cwd=self.repo_path,
                capture_output=True,
                text=True,
                check=True
            )

            stats_text = result.stdout

            # Parse stats
            files_changed = 0
            insertions = 0
            deletions = 0

            # Look for summary line like "3 files changed, 150 insertions(+), 20 deletions(-)"
            summary_match = re.search(
                r'(\d+) files? changed(?:, (\d+) insertions?\(\+\))?(?:, (\d+) deletions?\(-\))?',
                stats_text
            )

            if summary_match:
                files_changed = int(summary_match.group(1))
                insertions = int(summary_match.group(2) or 0)
                deletions = int(summary_match.group(3) or 0)

            return {
                'files_changed': files_changed,
                'insertions': insertions,
                'deletions': deletions
            }

        except subprocess.CalledProcessError:
            return {'files_changed': 0, 'insertions': 0, 'deletions': 0}

    def categorize_commit(self, message: str) -> str:
        """Categorize commit by type from conventional commit message"""
        message_lower = message.lower()

        if message.startswith('feat'):
            return 'Feature'
        elif message.startswith('fix'):
            return 'Bug Fix'
        elif message.startswith('docs'):
            return 'Documentation'
        elif message.startswith('test'):
            return 'Testing'
        elif message.startswith('refactor'):
            return 'Refactoring'
        elif message.startswith('perf'):
            return 'Performance'
        elif message.startswith('chore'):
            return 'Maintenance'
        elif message.startswith('style'):
            return 'Code Style'
        elif message.startswith('ci'):
            return 'CI/CD'
        else:
            return 'Other'

    def generate_report(self, target_date: str) -> str:
        """
        Generate daily development report.

        Args:
            target_date: Date in YYYY-MM-DD format

        Returns:
            Report content as markdown string
        """
        commits = self.get_commits_for_date(target_date)

        if not commits:
            return None

        # Get commit statistics
        total_files = 0
        total_insertions = 0
        total_deletions = 0

        for commit in commits:
            stats = self.get_commit_stats(commit['hash'])
            commit['stats'] = stats
            total_files += stats['files_changed']
            total_insertions += stats['insertions']
            total_deletions += stats['deletions']

        # Categorize commits
        categories = {}
        for commit in commits:
            category = self.categorize_commit(commit['message'])
            if category not in categories:
                categories[category] = []
            categories[category].append(commit)

        # Build report
        report = self._build_report_markdown(
            target_date,
            commits,
            categories,
            total_files,
            total_insertions,
            total_deletions
        )

        return report

    def _build_report_markdown(
        self,
        date: str,
        commits: List[Dict],
        categories: Dict[str, List],
        total_files: int,
        total_insertions: int,
        total_deletions: int
    ) -> str:
        """Build markdown report content"""

        # Extract unique contributors
        contributors = list(set(f"{c['author_name']}" for c in commits))

        report = f"""# Daily Development Report - {date}

## 📊 Summary
**Total Commits:** {len(commits)}
**Contributors:** {', '.join(contributors)}
**Files Changed:** {total_files}
**Lines Added:** {total_insertions}
**Lines Removed:** {total_deletions}
**Net Change:** {total_insertions - total_deletions:+d} lines

---

## 🎯 Commits by Category

"""

        # Add commits by category
        for category, category_commits in sorted(categories.items()):
            report += f"### {category} ({len(category_commits)} commits)\n\n"

            for commit in category_commits:
                report += f"**{commit['short_hash']}**: {commit['message']}\n"
                stats = commit['stats']
                report += f"- Files: {stats['files_changed']}, +{stats['insertions']}/-{stats['deletions']} lines\n\n"

        report += "---\n\n"

        # Add commit details
        report += "## 📝 Detailed Commit Analysis\n\n"

        for i, commit in enumerate(commits, 1):
            report += f"### {i}. {commit['message']}\n"
            report += f"**Commit:** `{commit['short_hash']}`\n"
            report += f"**Author:** {commit['author_name']} <{commit['author_email']}>\n"
            report += f"**Date:** {commit['date']}\n\n"

            stats = commit['stats']
            report += f"#### Changes\n"
            report += f"- **Files Changed:** {stats['files_changed']}\n"
            report += f"- **Insertions:** {stats['insertions']}\n"
            report += f"- **Deletions:** {stats['deletions']}\n\n"

            report += "---\n\n"

        # Add reflection section template
        report += """## 🎓 Learning Outcomes

### Key Insights
(To be filled in manually with insights from the day's work)

### Technical Learnings
(What technical concepts or patterns were learned)

### Process Improvements
(What process or workflow improvements were identified)

---

## 📈 Project Metrics

### Code Quality
- Test Pass Rate: [Update if tests were run]
- Coverage: [Update if coverage measured]
- Linting Issues: [Update if linting run]

### Velocity
- Story Points: [If using story points]
- Features Completed: [Count of features]
- Bugs Fixed: [Count of bugs]

---

## 🚀 Next Steps

### Immediate (Tomorrow)
- [ ] [Task 1]
- [ ] [Task 2]
- [ ] [Task 3]

### This Week
- [ ] [Goal 1]
- [ ] [Goal 2]

### Blockers
- [ ] [Any blockers identified]

---

## 💡 Reflections

### What Went Well
-

### What Could Be Improved
-

### Questions/Concerns
-

---

**Report Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
**Project:** Algorithms and Data Structures Learning Environment
**Status:** [Update with current project status]
"""

        return report

    def save_report(self, date: str, content: str) -> Path:
        """
        Save report to file.

        Args:
            date: Date in YYYY-MM-DD format
            content: Report markdown content

        Returns:
            Path to saved report file
        """
        report_file = self.daily_reports_dir / f"{date}.md"

        with open(report_file, 'w', encoding='utf-8') as f:
            f.write(content)

        return report_file

    def generate_and_save(self, date: str = None) -> Path:
        """
        Generate and save daily report for a specific date.

        Args:
            date: Date in YYYY-MM-DD format (defaults to today)

        Returns:
            Path to saved report or None if no commits
        """
        if date is None:
            date = datetime.now().strftime('%Y-%m-%d')

        report_content = self.generate_report(date)

        if not report_content:
            print(f"No commits found for {date}")
            return None

        report_file = self.save_report(date, report_content)
        print(f"✅ Daily report generated: {report_file}")
        print(f"   Commits analyzed: {len(self.get_commits_for_date(date))}")

        return report_file


def main():
    """Main entry point"""
    import argparse

    parser = argparse.ArgumentParser(
        description='Generate daily development report from git commits'
    )
    parser.add_argument(
        'date',
        nargs='?',
        help='Date in YYYY-MM-DD format (defaults to today)'
    )
    parser.add_argument(
        '--output-dir',
        default='daily_reports',
        help='Output directory for reports (default: daily_reports)'
    )

    args = parser.parse_args()

    # Validate date format if provided
    if args.date:
        try:
            datetime.strptime(args.date, '%Y-%m-%d')
            target_date = args.date
        except ValueError:
            print(f"Error: Invalid date format '{args.date}'. Use YYYY-MM-DD")
            sys.exit(1)
    else:
        target_date = datetime.now().strftime('%Y-%m-%d')

    # Generate report
    generator = DailyReportGenerator()
    report_file = generator.generate_and_save(target_date)

    if report_file:
        print(f"\n✅ Report saved to: {report_file}")
        print(f"\n💡 Next steps:")
        print(f"   1. Review the generated report")
        print(f"   2. Fill in the Learning Outcomes, Reflections, and Next Steps sections")
        print(f"   3. Commit the report: git add {report_file} && git commit -m 'docs: Daily report for {target_date}'")
    else:
        print(f"\n ℹ️ No commits found for {target_date}")


if __name__ == '__main__':
    main()
