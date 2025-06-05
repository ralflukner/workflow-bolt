#!/bin/bash

# This script ensures that NVM (Node Version Manager) is properly loaded
# and that node and npm are available in the PATH.

# Check if NVM is installed
if [ -d "$HOME/.nvm" ]; then
  echo "NVM is installed at $HOME/.nvm"
  
  # Load NVM
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
  [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
  
  # Check if node is now available
  if command -v node > /dev/null; then
    echo "Node.js is now available: $(node --version)"
    echo "npm is now available: $(npm --version)"
  else
    echo "Node.js is still not available after loading NVM."
    echo "You may need to install Node.js using NVM: nvm install node"
  fi
else
  echo "NVM does not appear to be installed at $HOME/.nvm"
  echo "You may need to install NVM first: https://github.com/nvm-sh/nvm#installing-and-updating"
fi

# Add the NVM bin directory to PATH if it's not already there
if [ -d "$HOME/.nvm/versions/node/v22.15.0/bin" ]; then
  if [[ ":$PATH:" != *":$HOME/.nvm/versions/node/v22.15.0/bin:"* ]]; then
    export PATH="$HOME/.nvm/versions/node/v22.15.0/bin:$PATH"
    echo "Added Node.js v22.15.0 bin directory to PATH"
  fi
fi

# Print the current PATH for debugging
echo "Current PATH: $PATH"

# Instructions for permanent setup
echo ""
echo "To make this setup permanent, add the following to your shell profile (~/.zshrc, ~/.bashrc, or ~/.bash_profile):"
echo ""
echo 'export NVM_DIR="$HOME/.nvm"'
echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm'
echo '[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion'
echo ""
echo "Then restart your terminal or run 'source ~/.zshrc' (or the appropriate profile file)."