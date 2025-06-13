  #!/bin/bash

# This script ensures that NVM (Node Version Manager) is properly loaded
# and that node and npm are available in the PATH.

# Check if NVM is installed
if [ -d "$HOME/.nvm" ]; then
  # Load NVM (silently)
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
  [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
  
  # Check if node is available (silently)
  if ! command -v node > /dev/null; then
    echo "Warning: Node.js is not available after loading NVM."
    echo "You may need to install Node.js using NVM: nvm install node"
  fi
else
  echo "Warning: NVM does not appear to be installed at $HOME/.nvm"
  echo "You may need to install NVM first: https://github.com/nvm-sh/nvm#installing-and-updating"
fi

# Add the current/latest NVM Node.js bin directory to PATH if available
if [ -n "$NVM_DIR" ] && command -v nvm > /dev/null; then
  NODE_VERSION=$(nvm current 2>/dev/null || nvm ls --no-colors | grep -E "v[0-9]+" | tail -1 | sed 's/[^v0-9.]//g')
  if [ -n "$NODE_VERSION" ] && [ -d "$NVM_DIR/versions/node/$NODE_VERSION/bin" ]; then
    if [[ ":$PATH:" != *":$NVM_DIR/versions/node/$NODE_VERSION/bin:"* ]]; then
      export PATH="$NVM_DIR/versions/node/$NODE_VERSION/bin:$PATH"
    fi
  fi
fi

# Script completed silently - NVM should now be available