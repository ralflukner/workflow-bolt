# Cursor GPT-4.1-Max Agent Working Directory

This directory is dedicated to the Cursor GPT-4.1-Max AI agent's work within the workflow-bolt project.

## Purpose
- Store all Cursor GPT-4.1-Max-specific scripts, logs, and collaboration artifacts
- Serve as the main workspace for Cursor GPT-4.1-Max's development, testing, and agent-to-agent communication

## Usage
- Place all Cursor GPT-4.1-Max agent scripts, notebooks, and tools here
- Store logs, intermediate results, and experiment outputs in this directory
- Use this directory for sending/receiving messages via the Redis developer communication channel (see `ai-agents/redis_event_bus.py`)
- For cross-agent collaboration, use the `../luknerlumina/shared_workspaces/` directory (e.g., `ai_collaboration_results/`)

## Example Structure
```
cursor-gpt-4.1-max/
├── README.md
├── identity.md
├── scripts/           # Custom Cursor GPT-4.1-Max scripts
├── logs/              # Agent logs and transcripts
├── results/           # Output from experiments or collaborations
```

## Best Practices
- Keep all Cursor GPT-4.1-Max-specific files in this directory for clarity
- Use clear, timestamped filenames for logs and results
- Document all major experiments and collaborations in this README or a dedicated log file
- Reference shared workspaces for any cross-agent results or artifacts
- Use the Redis developer channel for communication with other agents (see project playbook) 