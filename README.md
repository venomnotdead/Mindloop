# Mindloop

A local-first AI learning operating system powered by Ollama.

Mindloop helps you learn subjects deeply through:
- adaptive tutoring
- persistent learning sessions
- progress tracking
- active recall
- quizzes
- spaced repetition

Instead of being another AI chatbot, Mindloop is designed to function like a personal learning system that remembers what you study and helps you retain knowledge over time.

---

# Vision

Most AI tools answer questions.

Mindloop is built to help users:
- master subjects
- retain information
- build long-term understanding
- learn interactively

The system focuses on continuity and memory instead of isolated conversations.

---

# Features

## Current
- Local AI tutoring using Ollama
- Streaming terminal chat
- Persistent learning sessions
- Topic-based learning
- SQLite session storage

## Planned
- Adaptive quizzes
- Flashcards
- Spaced repetition
- Weakness tracking
- PDF ingestion
- Retrieval-augmented learning
- Voice learning mode
- Desktop application (Tauri)

---

# Stack

- TypeScript
- Node.js
- Ollama
- SQLite
- Ink (planned)
- Tauri (planned)

---

# Architecture

User
→ Session Engine
→ Prompt System
→ Ollama
→ Learning Memory
→ Progress Tracking

Mindloop separates:
- AI generation
from
- learning logic

The LLM generates explanations, while the application controls memory, progress, and learning flow.

---

# Why Local-First?

Mindloop runs locally using Ollama.

Benefits:
- private learning
- offline capability
- no API costs
- low latency
- full control over models

---

# Example

```bash
> learn finance

Welcome back.

Last session:
- Inflation
- CPI
- Monetary policy

Ready for a quick revision?
```

---

# Philosophy

Mindloop is designed around learning psychology, not chatbot interaction.

The focus is on:
- active recall
- spaced repetition
- adaptive difficulty
- continuity
- mastery

---

# Development Status

Early-stage experimental project.

Currently focused on:
- architecture
- session management
- prompt systems
- learning workflows

---

# License

MIT