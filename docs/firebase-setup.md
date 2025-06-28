# Firebase Configuration Setup

This project uses a template-based approach for Firebase configuration to avoid committing project IDs to the repository.

## Quick Setup

### Option 1: Using Environment Variable
```bash
export PROJECT_ID=your-firebase-project-id
./scripts/setup-firebaserc.sh
```

### Option 2: Using gcloud CLI
```bash
gcloud config set project your-firebase-project-id
./scripts/setup-firebaserc.sh
```

### Option 3: One-liner
```bash
PROJECT_ID=your-firebase-project-id ./scripts/setup-firebaserc.sh
```

## How It Works

1. **Template File**: `.firebaserc.template` contains the configuration structure with placeholders
2. **Generated File**: `.firebaserc` is generated locally and ignored by git
3. **Setup Script**: `scripts/setup-firebaserc.sh` creates the real config from environment variables

## Files

- `.firebaserc.template` - Template with placeholders (tracked in git)
- `.firebaserc` - Generated config file (ignored by git)
- `scripts/setup-firebaserc.sh` - Setup script

## Environment Variables

The setup script accepts project IDs from these sources (in order of priority):

1. `PROJECT_ID` environment variable
2. `FIREBASE_PROJECT_ID` environment variable  
3. `gcloud config get-value project` (current gcloud project)

## For New Contributors

After cloning the repository:

1. Set your Firebase project ID:
   ```bash
   export PROJECT_ID=your-firebase-project-id
   ```

2. Run the setup script:
   ```bash
   ./scripts/setup-firebaserc.sh
   ```

3. Verify the configuration:
   ```bash
   cat .firebaserc
   ```

## For CI/CD

Set the `PROJECT_ID` environment variable in your CI system, then run:
```bash
./scripts/setup-firebaserc.sh
```

The script will create the `.firebaserc` file automatically with the correct project ID.

## Benefits

- ✅ No sensitive project IDs in git history
- ✅ Clear template shows expected structure
- ✅ Deterministic CI builds
- ✅ Easy for new team members
- ✅ Firebase CLI works with standard `.firebaserc` files
- ✅ No runtime indirection needed

## Troubleshooting

### "No Firebase project ID found" Error

Make sure you have one of:
- `PROJECT_ID` environment variable set
- `FIREBASE_PROJECT_ID` environment variable set
- gcloud CLI configured with a default project

### Invalid Project ID Format

Firebase project IDs must contain only lowercase letters, numbers, and hyphens.

### Permission Issues

Make sure the setup script is executable:
```bash
chmod +x scripts/setup-firebaserc.sh
```