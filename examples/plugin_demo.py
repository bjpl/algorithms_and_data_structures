#!/usr/bin/env python3
"""
Plugin System Demo - Demonstrates formatter plugin capabilities

This demo shows:
1. Gradient text effects
2. Animation capabilities
3. Windows optimization
4. Plugin attachment/detachment
"""

import time
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.ui.unified_formatter import UnifiedFormatter
from src.ui.formatter_factory import FormatterFactory
from src.ui.formatter_plugins.gradient_plugin import GradientPlugin, GradientType
from src.ui.formatter_plugins.animation_plugin import AnimationPlugin, SpinnerStyle
from src.ui.formatter_plugins.windows_plugin import WindowsOptimizerPlugin


def demo_gradient_plugin():
    """Demonstrate gradient plugin features"""
    print("\n" + "=" * 60)
    print("GRADIENT PLUGIN DEMONSTRATION")
    print("=" * 60 + "\n")

    formatter = UnifiedFormatter()
    gradient_plugin = GradientPlugin()
    formatter.attach_plugin(gradient_plugin)

    print("1. Linear Gradient (Cyan to Magenta):")
    text = "This text has a beautiful linear gradient!"
    gradient_text = gradient_plugin.linear_gradient(text, "cyan", "magenta")
    print(gradient_text)

    print("\n2. Rainbow Gradient:")
    text = "Rainbow colors across this entire line of text!"
    rainbow_text = gradient_plugin.rainbow_gradient(text)
    print(rainbow_text)

    print("\n3. Radial Gradient (Center to Edges):")
    text = "This gradient radiates from the center"
    radial_text = gradient_plugin.radial_gradient(text, "white", "blue")
    print(radial_text)

    print("\n4. Custom Gradient (Multiple Colors):")
    text = "Red to Yellow to Green transition"
    custom_text = gradient_plugin.custom_gradient(text, ["red", "yellow", "green"])
    print(custom_text)


def demo_animation_plugin():
    """Demonstrate animation plugin features"""
    print("\n" + "=" * 60)
    print("ANIMATION PLUGIN DEMONSTRATION")
    print("=" * 60 + "\n")

    formatter = UnifiedFormatter()
    animation_plugin = AnimationPlugin()
    formatter.attach_plugin(animation_plugin)

    print("1. Typewriter Effect:")
    animation_plugin.typewriter("This text appears one character at a time...", speed=0.03)

    print("\n2. Fade In Effect:")
    animation_plugin.fade_in("This text fades in gradually", steps=5, duration=1.0)

    print("\n3. Slide Animation:")
    animation_plugin.slide("This text slides from right to left", direction="left", duration=1.0)

    print("\n4. Spinner Animation (3 seconds):")
    with animation_plugin.spinner("Processing data...", style=SpinnerStyle.DOTS):
        time.sleep(3)
    print("✓ Processing complete!")


def demo_windows_plugin():
    """Demonstrate Windows optimizer plugin features"""
    print("\n" + "=" * 60)
    print("WINDOWS OPTIMIZER PLUGIN DEMONSTRATION")
    print("=" * 60 + "\n")

    formatter = UnifiedFormatter()
    windows_plugin = WindowsOptimizerPlugin()
    formatter.attach_plugin(windows_plugin)

    print("1. Capability Detection:")
    caps = windows_plugin.detect_capabilities()
    for key, value in caps.items():
        print(f"   {key}: {value}")

    print("\n2. Safe Box Drawing:")
    box = windows_plugin.create_safe_box(
        "This box uses Windows-safe characters\nMultiple lines are supported!",
        title="Safe Box",
        style="simple"
    )
    print(box)

    print("\n3. Progress Bar:")
    for i in range(0, 101, 10):
        bar = windows_plugin.create_progress_bar(i, 100, width=40)
        print(f"\rProgress: [{bar}] {i}%", end="")
        sys.stdout.flush()
        time.sleep(0.1)
    print()


def demo_plugin_management():
    """Demonstrate plugin attachment/detachment"""
    print("\n" + "=" * 60)
    print("PLUGIN MANAGEMENT DEMONSTRATION")
    print("=" * 60 + "\n")

    formatter = UnifiedFormatter()

    print("1. Initially no plugins attached:")
    print(f"   Plugins: {formatter.list_plugins()}")

    print("\n2. Attach gradient plugin:")
    formatter.attach_plugin(GradientPlugin())
    print(f"   Plugins: {formatter.list_plugins()}")

    print("\n3. Attach animation plugin:")
    formatter.attach_plugin(AnimationPlugin())
    print(f"   Plugins: {formatter.list_plugins()}")

    print("\n4. Get specific plugin:")
    gradient = formatter.get_plugin("gradient")
    print(f"   Retrieved: {gradient.name if gradient else 'None'}")

    print("\n5. Detach gradient plugin:")
    formatter.detach_plugin("gradient")
    print(f"   Plugins: {formatter.list_plugins()}")


def demo_factory_integration():
    """Demonstrate FormatterFactory plugin integration"""
    print("\n" + "=" * 60)
    print("FORMATTER FACTORY INTEGRATION")
    print("=" * 60 + "\n")

    print("1. Rich Formatter (with plugins):")
    rich_formatter = FormatterFactory.create_rich_formatter(
        gradient_enabled=True,
        animations_enabled=True
    )
    print(f"   Plugins attached: {rich_formatter.list_plugins()}")

    print("\n2. Windows Formatter (with optimizer):")
    windows_formatter = FormatterFactory.create_windows_formatter(safe_mode=True)
    print(f"   Plugins attached: {windows_formatter.list_plugins()}")

    print("\n3. Custom Formatter (manual plugin attachment):")
    custom_formatter = FormatterFactory.create_custom(
        plugins=[GradientPlugin(), AnimationPlugin()]
    )
    print(f"   Plugins attached: {custom_formatter.list_plugins()}")


def main():
    """Run all demos"""
    print("\n" + "=" * 60)
    print("FORMATTER PLUGIN SYSTEM DEMO")
    print("=" * 60)

    demos = [
        ("Gradient Plugin", demo_gradient_plugin),
        ("Animation Plugin", demo_animation_plugin),
        ("Windows Optimizer Plugin", demo_windows_plugin),
        ("Plugin Management", demo_plugin_management),
        ("Factory Integration", demo_factory_integration),
    ]

    print("\nAvailable demos:")
    for i, (name, _) in enumerate(demos, 1):
        print(f"  {i}. {name}")
    print(f"  0. Run all demos")

    try:
        choice = input("\nSelect demo (0-5): ").strip()

        if choice == "0":
            for name, demo_func in demos:
                try:
                    demo_func()
                except KeyboardInterrupt:
                    print("\n\nDemo interrupted by user.")
                    break
                except Exception as e:
                    print(f"\nError in {name}: {e}")
        elif choice.isdigit() and 1 <= int(choice) <= len(demos):
            name, demo_func = demos[int(choice) - 1]
            demo_func()
        else:
            print("Invalid choice. Running all demos...")
            for name, demo_func in demos:
                try:
                    demo_func()
                except KeyboardInterrupt:
                    print("\n\nDemo interrupted by user.")
                    break
                except Exception as e:
                    print(f"\nError in {name}: {e}")

    except KeyboardInterrupt:
        print("\n\nDemo interrupted by user.")

    print("\n" + "=" * 60)
    print("DEMO COMPLETE")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    main()
