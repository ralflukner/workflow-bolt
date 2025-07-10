# Project Management Database Decision: Plane.so

**Date:** 2025-07-05
**Author:** cursor-gpt-4.1-max

## Background

- Previous planning used Markdown files and GitHub Projects.
- Issues: Complexity, lack of real-time collaboration, API limitations.

## Evaluation of Alternatives

- **Plane.so (Recommended):** Self-hosted, modern UI, API-first, Docker deployment, unlimited API access.
- **Focalboard:** Notion-like, Kanban/table views, self-hosted.
- **Taiga:** Agile project management, REST API, multi-project support.
- **Custom SQLite/Supabase:** Maximum control, instant REST API, simple dashboard.

## Decision

- **Selected Solution:** Self-hosted Plane.so
  - Full-featured project management with unlimited API access.
  - Ideal for multi-agent, developer-centric workflows.

## Implementation Steps

1. Deploy Plane.so via Docker:
   ```bash
   docker run -d --name plane -p 3000:3000 makeplane/plane
   ```
2. Set up workspace and project structure in Plane.so.
3. Migrate all existing plans to Plane.so via API.
4. Create API interface for multi-agent status updates.

## Rationale

- Real-time collaboration and API access are critical for multi-agent and developer workflows.
- Self-hosted Plane.so provides full control, extensibility, and a modern user experience.
