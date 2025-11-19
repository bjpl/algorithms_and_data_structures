#!/usr/bin/env python3
"""Helper functions for analytics_command.py"""

            'Avg Days to Completion': f"{retention['avg_days_to_completion']:.1f}"
        })
    
    def _show_completion_report(self, formatter: TerminalFormatter, data: Dict[str, Any]):
        """Show completion analytics report"""
        formatter.info(f"Overall Completion Rate: {data['overall_completion_rate']:.1f}%")
        
        # Completion by curriculum
        formatter.header("Completion by Curriculum", level=2)
        curriculum_data = []
        for curriculum in data['completion_by_curriculum']:
            curriculum_data.append({
                'Curriculum': curriculum['name'],
                'Rate': f"{curriculum['rate']:.1f}%",
                'Enrolled': curriculum['enrolled'],
                'Completed': curriculum['completed']
            })
        formatter.table(curriculum_data)
        
        # Time to completion
        formatter.header("Time to Completion", level=2)
        time_stats = data['time_to_completion']
        formatter.key_value_pairs({
            'Average': f"{time_stats['avg_days']:.1f} days",
            'Median': f"{time_stats['median_days']} days",
            '25th Percentile': f"{time_stats['percentiles']['25th']} days",
            '75th Percentile': f"{time_stats['percentiles']['75th']} days",
            '90th Percentile': f"{time_stats['percentiles']['90th']} days"
        })
    
    def _show_analytics_charts(self, formatter: TerminalFormatter, data: Dict[str, Any], report_type: str):
        """Show analytics as ASCII charts"""
        formatter.header(f"{report_type.replace('_', ' ').title()} Charts", level=1)
        
        # Show relevant charts based on report type
        if report_type == 'overview' and 'student_activity_trend' in data:
            trend = data['student_activity_trend']
            formatter.header("Active Students Trend", level=2)
            
            max_value = max(trend['active_students'])
            for i, (label, value) in enumerate(zip(trend['labels'], trend['active_students'])):
                bar_length = int((value / max_value) * 40)
                bar = "█" * bar_length
                formatter.info(f"{label:8} {bar} {value}")
        
        elif report_type == 'student_performance' and 'score_distribution' in data:
            formatter.header("Score Distribution", level=2)
            
            max_count = max(data['score_distribution'].values())
            for range_name, count in data['score_distribution'].items():
                bar_length = int((count / max_count) * 30)
                bar = "█" * bar_length
                percentage = (count / sum(data['score_distribution'].values())) * 100
                formatter.info(f"{range_name:8} {bar} {count} ({percentage:.1f}%)")
    
    async def _export_analytics(self, context, data: Dict[str, Any], export_format: str, 
                               output_file: Optional[str], report_type: str) -> str:
        """Export analytics to file"""
        if not output_file:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_file = f"{report_type}_analytics_{timestamp}.{export_format}"
        
        output_path = Path(output_file)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        if export_format == 'json':
            with open(output_path, 'w') as f:
                json.dump(data, f, indent=2, default=str)
        elif export_format == 'csv':
            # Convert data to CSV format (simplified)
            import csv
            with open(output_path, 'w', newline='') as f:
                writer = csv.writer(f)
                writer.writerow(['Report Type', 'Generated At'])
                writer.writerow([data['report_type'], data['generated_at']])
                # Add more specific CSV formatting based on report type
        elif export_format == 'pdf':
            # Mock PDF export - would use a PDF library in real implementation
            with open(output_path.with_suffix('.txt'), 'w') as f:
                f.write(f"Analytics Report: {report_type}\n")
                f.write(f"Generated: {data['generated_at']}\n\n")
                f.write(json.dumps(data, indent=2, default=str))
        
        return str(output_path)
