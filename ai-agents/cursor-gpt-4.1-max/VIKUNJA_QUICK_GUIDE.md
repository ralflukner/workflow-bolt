# Vikunja Project Management - Quick Guide for AI Agents

## API Access

**Token**: `tk_556fc1cf49295b3c8637506e57877c21f863ec16`  
**Base URL**: `http://localhost:3456/api/v1`

## Quick Commands

### Get Projects

```bash
curl -H "Authorization: Bearer tk_556fc1cf49295b3c8637506e57877c21f863ec16" http://localhost:3456/api/v1/projects
```

### Create Task

```bash
curl -X PUT -H "Authorization: Bearer tk_556fc1cf49295b3c8637506e57877c21f863ec16" \
  -H "Content-Type: application/json" \
  -d '{"title":"Task Name","description":"Task details","priority":3}' \
  http://localhost:3456/api/v1/projects/3/tasks
```

### Update Task

```bash
curl -X POST -H "Authorization: Bearer tk_556fc1cf49295b3c8637506e57877c21f863ec16" \
  -H "Content-Type: application/json" \
  -d '{"done":true}' \
  http://localhost:3456/api/v1/tasks/TASK_ID
```

## Node.js Integration

```javascript
const VikunjaAPI = require('./scripts/vikunja-api.cjs');
const api = new VikunjaAPI();

// Create task
await api.createTask(3, {title: "New Task", priority: 3});

// Get projects
const projects = await api.getProjects();

// Mark task complete
await api.updateTask(taskId, {done: true});
```

## Project IDs

- **Inbox**: 1
- **workflow bolt**: 2  
- **cursor-gpt-4.1-max Tasks**: 3

## Priority Levels

1=Low, 2=Medium, 3=High, 4=Urgent, 5=Critical

Web UI: <http://localhost:3456>

## Automated Backups to Google Cloud

This project ships with `scripts/vikunja-backup.sh` which will

1. Dump the Postgres DB (`vikunja`)
2. Archive the `workflow-bolt_uploads` Docker volume
3. Upload both artefacts to `gs://vikunja-backups/<timestamp>/`

### One-time setup

```bash
# Create bucket (adjust location)
 gcloud storage buckets create gs://vikunja-backups --location=us-central1

# Create service-account & grant access
 gcloud iam service-accounts create vikunja-backup-sa \
   --display-name "Vikunja Backup SA"
 gcloud projects add-iam-policy-binding luknerlumina-firebase \
   --member="serviceAccount:vikunja-backup-sa@luknerlumina-firebase.iam.gserviceaccount.com" \
   --role="roles/storage.objectAdmin"

# (Optional for local host) create key file
 gcloud iam service-accounts keys create ~/secrets/vikunja-backup-key.json \
   --iam-account vikunja-backup-sa@luknerlumina-firebase.iam.gserviceaccount.com
```

### Manual run

```bash
./scripts/vikunja-backup.sh
```

### Cron (runs daily 02:30 UTC)

```cron
30 2 * * * /path/to/workflow-bolt/scripts/vikunja-backup.sh >> /var/log/vikunja-backup.log 2>&1
```

### Restore

```bash
# 1. fetch artefacts
gsutil cp gs://vikunja-backups/<timestamp>/db.sql.gz .
gsutil cp gs://vikunja-backups/<timestamp>/uploads.tar.gz .

# 2. restore database
gzip -dc db.sql.gz | docker exec -i workflow-bolt-vikunja-db-1 psql -U vikunja vikunja

# 3. restore uploads volume
docker run --rm -v workflow-bolt_uploads:/data -v $(pwd):/backup ubuntu \
  bash -c "rm -rf /data/* && tar -xzf /backup/uploads.tar.gz -C /data"
```
