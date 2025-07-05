# Claude Agent Working Directory

This directory is dedicated to the Claude AI agent's work within the workflow-bolt project.

## Purpose
- Store all Claude-specific scripts, logs, and collaboration artifacts
- Serve as the main workspace for Claude's development, testing, and agent-to-agent communication

## Usage
- Place all Claude agent scripts, notebooks, and tools here
- Store logs, intermediate results, and experiment outputs in this directory
- Use this directory for sending/receiving messages via the Redis developer communication channel (see `ai-agents/redis_event_bus.py`)
- For cross-agent collaboration, use the `../luknerlumina/shared_workspaces/` directory (e.g., `ai_collaboration_results/`)

## Example Structure
```
claude/
├── README.md
├── identity.md
├── scripts/           # Custom Claude scripts
├── logs/              # Agent logs and transcripts
├── results/           # Output from experiments or collaborations
```

## Best Practices
- Keep all Claude-specific files in this directory for clarity
- Use clear, timestamped filenames for logs and results
- Document all major experiments and collaborations in this README or a dedicated log file
- Reference shared workspaces for any cross-agent results or artifacts
- Use the Redis developer channel for communication with other agents (see project playbook) 