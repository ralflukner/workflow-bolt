
# Project Directory Structure

```

.
├── src/                      # Main application source code
│   ├── components/          # React components
│   ├── services/           # Service layer (API clients, etc.)
│   ├── utils/              # Utility functions
│   └── tebra-soap/         # Tebra SOAP API integration
│
├── tebra-tools/            # Tebra integration tools and scripts
│   ├── scripts/            # Shell scripts for Tebra operations
│   │   ├── security-check-gsm.sh
│   │   └── rotate-username-password.sh
│   ├── test-tebra.php      # Main Tebra test script
│   ├── test-tebra-env.php  # Environment-based test script
│   ├── check-setup.php     # Setup verification script
│   └── debug-proxy-dates.php # Debugging tool
│
├── tebra-proxy/            # Tebra SOAP API proxy service
│   ├── public/            # Public web root
│   ├── src/              # Source code
│   └── tests/            # Test files
│
├── tebra-php-api/         # Tebra PHP API service
│   ├── public/           # Public web root
│   ├── src/             # Source code
│   └── tests/           # Test files
│
├── docs/                  # Documentation
│   ├── TEBRA_DEBUGGING_RESOLUTION.md
│   └── directory-structure.md
│
├── scripts/              # Project-wide scripts
│   └── setup-tebra-test.sh
│
└── vendor/              # Composer dependencies

```

## Key Directories and Files

### Source Code

- **src/**: Main application source code
  - **components/**: React components
  - **services/**: Service layer implementations
  - **utils/**: Utility functions
  - **tebra-soap/**: Tebra SOAP API integration code

### Tebra Tools

- **tebra-tools/**: Tebra integration tools and scripts
  - **scripts/**: Shell scripts for Tebra operations
    - **security-check-gsm.sh**: Security check script
    - **rotate-username-password.sh**: Credential rotation script
  - **test-tebra.php**: Main test script using GSM
  - **test-tebra-env.php**: Environment-based test script
  - **check-setup.php**: Setup verification script
  - **debug-proxy-dates.php**: Debugging tool

### Services

- **tebra-proxy/**: Tebra SOAP API proxy service
  - **public/**: Public web root
  - **src/**: Source code
  - **tests/**: Test files

- **tebra-php-api/**: Tebra PHP API service
  - **public/**: Public web root
  - **src/**: Source code
  - **tests/**: Test files

### Documentation

- **docs/**: Project documentation
  - **TEBRA_DEBUGGING_RESOLUTION.md**: Debugging guide
  - **directory-structure.md**: This file

### Scripts

- **scripts/**: Project-wide scripts
  - **setup-tebra-test.sh**: Test environment setup script

### Dependencies

- **vendor/**: Composer dependencies
