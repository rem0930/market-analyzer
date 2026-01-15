"""Tests for main module."""

from app.main import greet


def test_greet():
    """Test greet function returns expected greeting."""
    assert greet("World") == "Hello, World!"


def test_greet_empty():
    """Test greet function handles empty name."""
    assert greet("") == "Hello, !"
