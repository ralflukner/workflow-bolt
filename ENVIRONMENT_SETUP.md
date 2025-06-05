# Environment Variables Setup

This project uses multiple environment files to manage configuration and
sensitive credentials.

## File Structure

- **`.envrc`** - Public configuration variables loaded by direnv (safe to commit)
- **`.env.local`** - Sensitive credentials (gitignored, never commit)
- **`env-local-template.txt`** - Template for setting up `.env.local`
- **`.env-example`** - Example of basic environment variables
- **`scripts/setup-nvm.sh`** - Script to ensure NVM is loaded and node/npm are in PATH

## Setup Instructions

### 1. Install direnv (optional but recommended)

```bash
# macOS
brew install direnv

# Add to your shell config (~/.zshrc or ~/.bashrc)
eval "$(direnv hook zsh)"  # for zsh
eval "$(direnv hook bash)" # for bash
```

### 2. Set up local environment variables

```bash
# Copy the template to create your local environment file
cp env-local-template.txt .env.local

# Edit .env.local with your actual credentials
# Update the Tebra username and password with real values
```

### 3. Load environment variables

**With direnv:**

```bash
direnv allow  # This will load .envrc automatically
```

**Without direnv:**

```bash
source .envrc  # Manually load variables
```

## Environment Variables

### Public Configuration (in .envrc)

- `VITE_AUTH0_DOMAIN` - Auth0 domain
- `VITE_AUTH0_CLIENT_ID` - Auth0 client ID
- `VITE_AUTH0_REDIRECT_URI` - Auth0 redirect URI
- `VITE_AUTH0_AUDIENCE` - Auth0 API audience
- `VITE_APP_NAME` - Application name
- `REACT_APP_TEBRA_CUSTKEY` - Tebra customer key (public)
- `REACT_APP_TEBRA_WSDL_URL` - Tebra WSDL endpoint URL

### Sensitive Credentials (in .env.local)

- `REACT_APP_TEBRA_USERNAME` - Tebra EHR username
- `REACT_APP_TEBRA_PASSWORD` - Tebra EHR password

## Node.js and NVM Setup

This project uses Node.js (v18 or newer recommended) and npm. If you're using NVM (Node Version Manager) to manage Node.js versions, follow these steps to ensure node and npm are available in your terminal:

### 1. Source the setup-nvm.sh script

```bash
source scripts/setup-nvm.sh
```

This script will:
- Check if NVM is installed
- Load NVM if it's installed
- Verify if node and npm are available
- Add the Node.js bin directory to PATH if needed

### 2. Make the setup permanent

To ensure NVM is always loaded in your terminal, add the following to your shell profile (~/.zshrc, ~/.bashrc, or ~/.bash_profile):

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
```

Then restart your terminal or run `source ~/.zshrc` (or the appropriate profile file).

### 3. Using direnv (recommended)

If you're using direnv, the `.envrc` file will automatically source the `scripts/setup-nvm.sh` script, ensuring that NVM is loaded and node/npm are in the PATH whenever you enter the project directory.

## Security Notes

- Never commit `.env.local` to version control
- The `.envrc` file automatically loads `.env.local` if it exists
- All sensitive credentials should be in `.env.local` only
- The `env-local-template.txt` shows the required format but contains
  placeholder/example values
