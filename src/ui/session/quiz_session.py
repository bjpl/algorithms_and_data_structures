#!/usr/bin/env python3
"""Quiz Session - Interactive quiz mode with visual feedback"""

import asyncio
from typing import List, Dict, Any
from .base_session import BaseSession
from .state import LearningMode
from ..unified_formatter import Color


class QuizSession(BaseSession):
    """Interactive quiz session with visual feedback"""

    def __init__(self, cli_engine=None, formatter=None, quiz_nav=None):
        super().__init__(cli_engine, formatter)
        self.quiz_nav = quiz_nav
        self.state.mode = LearningMode.QUIZ
        self.score = 0
        self.total_questions = 0

    async def run(self):
        """Main quiz session loop"""
        await self.show_quiz()

    async def handle_input(self, user_input: str) -> bool:
        """Handle quiz session input"""
        return user_input.lower() not in ['quit', 'exit']

    async def show_quiz(self):
        """Show and run quiz"""
        await self.formatter.type_text("🧠 Initializing Enhanced Quiz System...", speed=0.05)

        quiz_questions = self.get_quiz_questions()

        await self.formatter.type_text("🎯 Enhanced Visual Quiz Experience", speed=0.05)

        score = 0
        total_questions = len(quiz_questions)
        detailed_results = []

        for i, question in enumerate(quiz_questions, 1):
            if self.quiz_nav:
                result, is_correct = await self.quiz_nav.show_question(question, i, total_questions)
                if result == "quit":
                    break
                elif result != "skip" and is_correct:
                    score += 1

                detailed_results.append({
                    'question': i,
                    'correct': is_correct,
                    'difficulty': question.get('difficulty', 'Medium'),
                    'explanation': question.get('explanation', '')
                })

        # Update progress
        percentage = (score / total_questions) * 100 if total_questions > 0 else 0
        self.state.progress.quiz_score = max(self.state.progress.quiz_score, percentage)

        await self.show_results(score, total_questions, detailed_results)

    async def show_results(self, score: int, total: int, results: List[Dict]):
        """Show quiz results"""
        percentage = (score / total) * 100 if total > 0 else 0

        self.clear_screen()
        await self.formatter.type_text("📊 Quiz Results Analysis", speed=0.06)

        performance_level = self.get_performance_level(percentage)

        results_content = f"""
Final Score: {score}/{total} ({percentage:.1f}%)
Performance Level: {performance_level}
Time Taken: ~{total * 45} seconds
        """.strip()

        print(self.formatter.box(results_content, title="🎯 Quiz Results",
                               style="double", color=Color.BRIGHT_CYAN))

        input("\nPress Enter to continue...")

    def get_quiz_questions(self) -> List[Dict[str, Any]]:
        """Get quiz questions"""
        return [
            {
                "question": "What is the time complexity of binary search?",
                "options": ["O(n)", "O(log n)", "O(n²)", "O(1)"],
                "correct": 1,
                "explanation": "Binary search divides the search space in half with each step.",
                "difficulty": "Medium"
            },
            {
                "question": "Which data structure follows LIFO?",
                "options": ["Queue", "Stack", "Array", "Linked List"],
                "correct": 1,
                "explanation": "A stack follows Last In, First Out principle.",
                "difficulty": "Easy"
            },
        ]
