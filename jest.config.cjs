/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      babelConfig: true
    }],
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
  testMatch: [
    '**/__tests__/**/*.(ts|tsx|js)',
    '**/*.(test|spec).(ts|tsx|js)'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
    '/src/__tests__/real-api/',
    '/src/services/__tests__/.*\.integration\.test\.ts
  // Add globals to mock import.meta for Jest
  globals: {
    'import.meta': {
      env: {}
    }
  },
  // Separate test runners for different test types
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/*.test.(ts|tsx)',
        '<rootDir>/src/**/*.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '/integration/',
        '/e2e/',
        '.integration.test.',
        '.e2e.test.',
        'real-api',
        '/src/__tests__/real-api/',
        '/src/services/__tests__/.*\\.integration\\.test\\.ts$',
        '<rootDir>/src/services/__tests__/authBridge.integration.test.ts'
      ],
      // Add globals to mock import.meta for Jest
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'integration',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/*.integration.test.(ts|tsx)',
        '<rootDir>/src/**/__tests__/**/integration/**/*.test.(ts|tsx)',
        '<rootDir>/src/cli/__tests__/integration/**/*.integration.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '<rootDir>/src/services/__tests__/authBridge.integration.test.ts'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'cli',
      preset: 'ts-jest',
      testEnvironment: 'node',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.cli.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapping: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/cli/__tests__/setup.ts'],
      testMatch: [
        '<rootDir>/src/cli/__tests__/**/*.test.(ts|tsx)',
        '<rootDir>/src/cli/**/*.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '/node_modules/(?!chalk)/',
        '/integration/',
        '/real-api/'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'real-api',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/real-api/**/*.test.(ts|tsx)'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    }
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.test.*'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  // CLI-specific coverage paths
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'src/cli/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.test.*',
    '!src/cli/bin/**/*',
    '!src/cli/fixtures/**/*'
  ]
}; 
  ],
  // Add globals to mock import.meta for Jest
  globals: {
    'import.meta': {
      env: {}
    }
  },
  // Separate test runners for different test types
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx) 
  ],
  // Add globals to mock import.meta for Jest
  globals: {
    'import.meta': {
      env: {}
    }
  },
  // Separate test runners for different test types
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/*.test.(ts|tsx)',
        '<rootDir>/src/**/*.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '/integration/',
        '/e2e/',
        '.integration.test.',
        '.e2e.test.',
        'real-api',
        '/src/__tests__/real-api/',
        '/src/services/__tests__/.*\\.integration\\.test\\.ts$',
        '<rootDir>/src/services/__tests__/authBridge.integration.test.ts'
      ],
      // Add globals to mock import.meta for Jest
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'integration',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/*.integration.test.(ts|tsx)',
        '<rootDir>/src/**/__tests__/**/integration/**/*.test.(ts|tsx)',
        '<rootDir>/src/cli/__tests__/integration/**/*.integration.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '<rootDir>/src/services/__tests__/authBridge.integration.test.ts'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'cli',
      preset: 'ts-jest',
      testEnvironment: 'node',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.cli.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapping: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/cli/__tests__/setup.ts'],
      testMatch: [
        '<rootDir>/src/cli/__tests__/**/*.test.(ts|tsx)',
        '<rootDir>/src/cli/**/*.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '/node_modules/(?!chalk)/',
        '/integration/',
        '/real-api/'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'real-api',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/real-api/**/*.test.(ts|tsx)'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    }
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.test.*'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  // CLI-specific coverage paths
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'src/cli/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.test.*',
    '!src/cli/bin/**/*',
    '!src/cli/fixtures/**/*'
  ]
}; : ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx) 
  ],
  // Add globals to mock import.meta for Jest
  globals: {
    'import.meta': {
      env: {}
    }
  },
  // Separate test runners for different test types
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/*.test.(ts|tsx)',
        '<rootDir>/src/**/*.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '/integration/',
        '/e2e/',
        '.integration.test.',
        '.e2e.test.',
        'real-api',
        '/src/__tests__/real-api/',
        '/src/services/__tests__/.*\\.integration\\.test\\.ts$',
        '<rootDir>/src/services/__tests__/authBridge.integration.test.ts'
      ],
      // Add globals to mock import.meta for Jest
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'integration',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/*.integration.test.(ts|tsx)',
        '<rootDir>/src/**/__tests__/**/integration/**/*.test.(ts|tsx)',
        '<rootDir>/src/cli/__tests__/integration/**/*.integration.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '<rootDir>/src/services/__tests__/authBridge.integration.test.ts'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'cli',
      preset: 'ts-jest',
      testEnvironment: 'node',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.cli.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapping: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/cli/__tests__/setup.ts'],
      testMatch: [
        '<rootDir>/src/cli/__tests__/**/*.test.(ts|tsx)',
        '<rootDir>/src/cli/**/*.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '/node_modules/(?!chalk)/',
        '/integration/',
        '/real-api/'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'real-api',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/real-api/**/*.test.(ts|tsx)'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    }
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.test.*'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  // CLI-specific coverage paths
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'src/cli/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.test.*',
    '!src/cli/bin/**/*',
    '!src/cli/fixtures/**/*'
  ]
}; : 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass) 
  ],
  // Add globals to mock import.meta for Jest
  globals: {
    'import.meta': {
      env: {}
    }
  },
  // Separate test runners for different test types
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/*.test.(ts|tsx)',
        '<rootDir>/src/**/*.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '/integration/',
        '/e2e/',
        '.integration.test.',
        '.e2e.test.',
        'real-api',
        '/src/__tests__/real-api/',
        '/src/services/__tests__/.*\\.integration\\.test\\.ts$',
        '<rootDir>/src/services/__tests__/authBridge.integration.test.ts'
      ],
      // Add globals to mock import.meta for Jest
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'integration',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/*.integration.test.(ts|tsx)',
        '<rootDir>/src/**/__tests__/**/integration/**/*.test.(ts|tsx)',
        '<rootDir>/src/cli/__tests__/integration/**/*.integration.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '<rootDir>/src/services/__tests__/authBridge.integration.test.ts'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'cli',
      preset: 'ts-jest',
      testEnvironment: 'node',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.cli.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapping: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/cli/__tests__/setup.ts'],
      testMatch: [
        '<rootDir>/src/cli/__tests__/**/*.test.(ts|tsx)',
        '<rootDir>/src/cli/**/*.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '/node_modules/(?!chalk)/',
        '/integration/',
        '/real-api/'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'real-api',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/real-api/**/*.test.(ts|tsx)'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    }
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.test.*'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  // CLI-specific coverage paths
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'src/cli/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.test.*',
    '!src/cli/bin/**/*',
    '!src/cli/fixtures/**/*'
  ]
}; : 'identity-obj-proxy',
        '^@/(.*) 
  ],
  // Add globals to mock import.meta for Jest
  globals: {
    'import.meta': {
      env: {}
    }
  },
  // Separate test runners for different test types
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/*.test.(ts|tsx)',
        '<rootDir>/src/**/*.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '/integration/',
        '/e2e/',
        '.integration.test.',
        '.e2e.test.',
        'real-api',
        '/src/__tests__/real-api/',
        '/src/services/__tests__/.*\\.integration\\.test\\.ts$',
        '<rootDir>/src/services/__tests__/authBridge.integration.test.ts'
      ],
      // Add globals to mock import.meta for Jest
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'integration',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/*.integration.test.(ts|tsx)',
        '<rootDir>/src/**/__tests__/**/integration/**/*.test.(ts|tsx)',
        '<rootDir>/src/cli/__tests__/integration/**/*.integration.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '<rootDir>/src/services/__tests__/authBridge.integration.test.ts'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'cli',
      preset: 'ts-jest',
      testEnvironment: 'node',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.cli.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapping: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/cli/__tests__/setup.ts'],
      testMatch: [
        '<rootDir>/src/cli/__tests__/**/*.test.(ts|tsx)',
        '<rootDir>/src/cli/**/*.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '/node_modules/(?!chalk)/',
        '/integration/',
        '/real-api/'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'real-api',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/real-api/**/*.test.(ts|tsx)'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    }
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.test.*'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  // CLI-specific coverage paths
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'src/cli/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.test.*',
    '!src/cli/bin/**/*',
    '!src/cli/fixtures/**/*'
  ]
}; : '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/*.test.(ts|tsx)',
        '<rootDir>/src/**/*.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '/integration/',
        '/e2e/',
        '.integration.test.',
        '.e2e.test.',
        'real-api',
        '/src/__tests__/real-api/',
        '/src/services/__tests__/.*\\.integration\\.test\\.ts 
  ],
  // Add globals to mock import.meta for Jest
  globals: {
    'import.meta': {
      env: {}
    }
  },
  // Separate test runners for different test types
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/*.test.(ts|tsx)',
        '<rootDir>/src/**/*.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '/integration/',
        '/e2e/',
        '.integration.test.',
        '.e2e.test.',
        'real-api',
        '/src/__tests__/real-api/',
        '/src/services/__tests__/.*\\.integration\\.test\\.ts$',
        '<rootDir>/src/services/__tests__/authBridge.integration.test.ts'
      ],
      // Add globals to mock import.meta for Jest
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'integration',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/*.integration.test.(ts|tsx)',
        '<rootDir>/src/**/__tests__/**/integration/**/*.test.(ts|tsx)',
        '<rootDir>/src/cli/__tests__/integration/**/*.integration.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '<rootDir>/src/services/__tests__/authBridge.integration.test.ts'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'cli',
      preset: 'ts-jest',
      testEnvironment: 'node',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.cli.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapping: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/cli/__tests__/setup.ts'],
      testMatch: [
        '<rootDir>/src/cli/__tests__/**/*.test.(ts|tsx)',
        '<rootDir>/src/cli/**/*.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '/node_modules/(?!chalk)/',
        '/integration/',
        '/real-api/'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'real-api',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/real-api/**/*.test.(ts|tsx)'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    }
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.test.*'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  // CLI-specific coverage paths
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'src/cli/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.test.*',
    '!src/cli/bin/**/*',
    '!src/cli/fixtures/**/*'
  ]
}; ,
        '<rootDir>/src/services/__tests__/authBridge.integration.test.ts'
      ],
      // Add globals to mock import.meta for Jest
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'integration',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx) 
  ],
  // Add globals to mock import.meta for Jest
  globals: {
    'import.meta': {
      env: {}
    }
  },
  // Separate test runners for different test types
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/*.test.(ts|tsx)',
        '<rootDir>/src/**/*.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '/integration/',
        '/e2e/',
        '.integration.test.',
        '.e2e.test.',
        'real-api',
        '/src/__tests__/real-api/',
        '/src/services/__tests__/.*\\.integration\\.test\\.ts$',
        '<rootDir>/src/services/__tests__/authBridge.integration.test.ts'
      ],
      // Add globals to mock import.meta for Jest
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'integration',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/*.integration.test.(ts|tsx)',
        '<rootDir>/src/**/__tests__/**/integration/**/*.test.(ts|tsx)',
        '<rootDir>/src/cli/__tests__/integration/**/*.integration.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '<rootDir>/src/services/__tests__/authBridge.integration.test.ts'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'cli',
      preset: 'ts-jest',
      testEnvironment: 'node',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.cli.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapping: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/cli/__tests__/setup.ts'],
      testMatch: [
        '<rootDir>/src/cli/__tests__/**/*.test.(ts|tsx)',
        '<rootDir>/src/cli/**/*.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '/node_modules/(?!chalk)/',
        '/integration/',
        '/real-api/'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'real-api',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/real-api/**/*.test.(ts|tsx)'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    }
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.test.*'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  // CLI-specific coverage paths
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'src/cli/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.test.*',
    '!src/cli/bin/**/*',
    '!src/cli/fixtures/**/*'
  ]
}; : ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx) 
  ],
  // Add globals to mock import.meta for Jest
  globals: {
    'import.meta': {
      env: {}
    }
  },
  // Separate test runners for different test types
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/*.test.(ts|tsx)',
        '<rootDir>/src/**/*.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '/integration/',
        '/e2e/',
        '.integration.test.',
        '.e2e.test.',
        'real-api',
        '/src/__tests__/real-api/',
        '/src/services/__tests__/.*\\.integration\\.test\\.ts$',
        '<rootDir>/src/services/__tests__/authBridge.integration.test.ts'
      ],
      // Add globals to mock import.meta for Jest
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'integration',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/*.integration.test.(ts|tsx)',
        '<rootDir>/src/**/__tests__/**/integration/**/*.test.(ts|tsx)',
        '<rootDir>/src/cli/__tests__/integration/**/*.integration.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '<rootDir>/src/services/__tests__/authBridge.integration.test.ts'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'cli',
      preset: 'ts-jest',
      testEnvironment: 'node',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.cli.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapping: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/cli/__tests__/setup.ts'],
      testMatch: [
        '<rootDir>/src/cli/__tests__/**/*.test.(ts|tsx)',
        '<rootDir>/src/cli/**/*.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '/node_modules/(?!chalk)/',
        '/integration/',
        '/real-api/'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'real-api',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/real-api/**/*.test.(ts|tsx)'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    }
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.test.*'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  // CLI-specific coverage paths
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'src/cli/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.test.*',
    '!src/cli/bin/**/*',
    '!src/cli/fixtures/**/*'
  ]
}; : 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass) 
  ],
  // Add globals to mock import.meta for Jest
  globals: {
    'import.meta': {
      env: {}
    }
  },
  // Separate test runners for different test types
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/*.test.(ts|tsx)',
        '<rootDir>/src/**/*.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '/integration/',
        '/e2e/',
        '.integration.test.',
        '.e2e.test.',
        'real-api',
        '/src/__tests__/real-api/',
        '/src/services/__tests__/.*\\.integration\\.test\\.ts$',
        '<rootDir>/src/services/__tests__/authBridge.integration.test.ts'
      ],
      // Add globals to mock import.meta for Jest
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'integration',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/*.integration.test.(ts|tsx)',
        '<rootDir>/src/**/__tests__/**/integration/**/*.test.(ts|tsx)',
        '<rootDir>/src/cli/__tests__/integration/**/*.integration.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '<rootDir>/src/services/__tests__/authBridge.integration.test.ts'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'cli',
      preset: 'ts-jest',
      testEnvironment: 'node',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.cli.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapping: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/cli/__tests__/setup.ts'],
      testMatch: [
        '<rootDir>/src/cli/__tests__/**/*.test.(ts|tsx)',
        '<rootDir>/src/cli/**/*.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '/node_modules/(?!chalk)/',
        '/integration/',
        '/real-api/'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'real-api',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/real-api/**/*.test.(ts|tsx)'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    }
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.test.*'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  // CLI-specific coverage paths
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'src/cli/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.test.*',
    '!src/cli/bin/**/*',
    '!src/cli/fixtures/**/*'
  ]
}; : 'identity-obj-proxy',
        '^@/(.*) 
  ],
  // Add globals to mock import.meta for Jest
  globals: {
    'import.meta': {
      env: {}
    }
  },
  // Separate test runners for different test types
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/*.test.(ts|tsx)',
        '<rootDir>/src/**/*.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '/integration/',
        '/e2e/',
        '.integration.test.',
        '.e2e.test.',
        'real-api',
        '/src/__tests__/real-api/',
        '/src/services/__tests__/.*\\.integration\\.test\\.ts$',
        '<rootDir>/src/services/__tests__/authBridge.integration.test.ts'
      ],
      // Add globals to mock import.meta for Jest
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'integration',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/*.integration.test.(ts|tsx)',
        '<rootDir>/src/**/__tests__/**/integration/**/*.test.(ts|tsx)',
        '<rootDir>/src/cli/__tests__/integration/**/*.integration.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '<rootDir>/src/services/__tests__/authBridge.integration.test.ts'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'cli',
      preset: 'ts-jest',
      testEnvironment: 'node',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.cli.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapping: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/cli/__tests__/setup.ts'],
      testMatch: [
        '<rootDir>/src/cli/__tests__/**/*.test.(ts|tsx)',
        '<rootDir>/src/cli/**/*.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '/node_modules/(?!chalk)/',
        '/integration/',
        '/real-api/'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'real-api',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/real-api/**/*.test.(ts|tsx)'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    }
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.test.*'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  // CLI-specific coverage paths
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'src/cli/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.test.*',
    '!src/cli/bin/**/*',
    '!src/cli/fixtures/**/*'
  ]
}; : '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/*.integration.test.(ts|tsx)',
        '<rootDir>/src/**/__tests__/**/integration/**/*.test.(ts|tsx)',
        '<rootDir>/src/cli/__tests__/integration/**/*.integration.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '<rootDir>/src/services/__tests__/authBridge.integration.test.ts'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'cli',
      preset: 'ts-jest',
      testEnvironment: 'node',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx) 
  ],
  // Add globals to mock import.meta for Jest
  globals: {
    'import.meta': {
      env: {}
    }
  },
  // Separate test runners for different test types
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/*.test.(ts|tsx)',
        '<rootDir>/src/**/*.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '/integration/',
        '/e2e/',
        '.integration.test.',
        '.e2e.test.',
        'real-api',
        '/src/__tests__/real-api/',
        '/src/services/__tests__/.*\\.integration\\.test\\.ts$',
        '<rootDir>/src/services/__tests__/authBridge.integration.test.ts'
      ],
      // Add globals to mock import.meta for Jest
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'integration',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/*.integration.test.(ts|tsx)',
        '<rootDir>/src/**/__tests__/**/integration/**/*.test.(ts|tsx)',
        '<rootDir>/src/cli/__tests__/integration/**/*.integration.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '<rootDir>/src/services/__tests__/authBridge.integration.test.ts'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'cli',
      preset: 'ts-jest',
      testEnvironment: 'node',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.cli.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapping: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/cli/__tests__/setup.ts'],
      testMatch: [
        '<rootDir>/src/cli/__tests__/**/*.test.(ts|tsx)',
        '<rootDir>/src/cli/**/*.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '/node_modules/(?!chalk)/',
        '/integration/',
        '/real-api/'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'real-api',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/real-api/**/*.test.(ts|tsx)'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    }
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.test.*'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  // CLI-specific coverage paths
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'src/cli/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.test.*',
    '!src/cli/bin/**/*',
    '!src/cli/fixtures/**/*'
  ]
}; : ['ts-jest', {
          tsconfig: 'tsconfig.cli.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx) 
  ],
  // Add globals to mock import.meta for Jest
  globals: {
    'import.meta': {
      env: {}
    }
  },
  // Separate test runners for different test types
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/*.test.(ts|tsx)',
        '<rootDir>/src/**/*.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '/integration/',
        '/e2e/',
        '.integration.test.',
        '.e2e.test.',
        'real-api',
        '/src/__tests__/real-api/',
        '/src/services/__tests__/.*\\.integration\\.test\\.ts$',
        '<rootDir>/src/services/__tests__/authBridge.integration.test.ts'
      ],
      // Add globals to mock import.meta for Jest
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'integration',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/*.integration.test.(ts|tsx)',
        '<rootDir>/src/**/__tests__/**/integration/**/*.test.(ts|tsx)',
        '<rootDir>/src/cli/__tests__/integration/**/*.integration.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '<rootDir>/src/services/__tests__/authBridge.integration.test.ts'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'cli',
      preset: 'ts-jest',
      testEnvironment: 'node',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.cli.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapping: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/cli/__tests__/setup.ts'],
      testMatch: [
        '<rootDir>/src/cli/__tests__/**/*.test.(ts|tsx)',
        '<rootDir>/src/cli/**/*.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '/node_modules/(?!chalk)/',
        '/integration/',
        '/real-api/'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'real-api',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/real-api/**/*.test.(ts|tsx)'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    }
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.test.*'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  // CLI-specific coverage paths
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'src/cli/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.test.*',
    '!src/cli/bin/**/*',
    '!src/cli/fixtures/**/*'
  ]
}; : 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass) 
  ],
  // Add globals to mock import.meta for Jest
  globals: {
    'import.meta': {
      env: {}
    }
  },
  // Separate test runners for different test types
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/*.test.(ts|tsx)',
        '<rootDir>/src/**/*.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '/integration/',
        '/e2e/',
        '.integration.test.',
        '.e2e.test.',
        'real-api',
        '/src/__tests__/real-api/',
        '/src/services/__tests__/.*\\.integration\\.test\\.ts$',
        '<rootDir>/src/services/__tests__/authBridge.integration.test.ts'
      ],
      // Add globals to mock import.meta for Jest
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'integration',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/*.integration.test.(ts|tsx)',
        '<rootDir>/src/**/__tests__/**/integration/**/*.test.(ts|tsx)',
        '<rootDir>/src/cli/__tests__/integration/**/*.integration.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '<rootDir>/src/services/__tests__/authBridge.integration.test.ts'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'cli',
      preset: 'ts-jest',
      testEnvironment: 'node',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.cli.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapping: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/cli/__tests__/setup.ts'],
      testMatch: [
        '<rootDir>/src/cli/__tests__/**/*.test.(ts|tsx)',
        '<rootDir>/src/cli/**/*.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '/node_modules/(?!chalk)/',
        '/integration/',
        '/real-api/'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'real-api',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/real-api/**/*.test.(ts|tsx)'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    }
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.test.*'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  // CLI-specific coverage paths
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'src/cli/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.test.*',
    '!src/cli/bin/**/*',
    '!src/cli/fixtures/**/*'
  ]
}; : 'identity-obj-proxy',
        '^@/(.*) 
  ],
  // Add globals to mock import.meta for Jest
  globals: {
    'import.meta': {
      env: {}
    }
  },
  // Separate test runners for different test types
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/*.test.(ts|tsx)',
        '<rootDir>/src/**/*.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '/integration/',
        '/e2e/',
        '.integration.test.',
        '.e2e.test.',
        'real-api',
        '/src/__tests__/real-api/',
        '/src/services/__tests__/.*\\.integration\\.test\\.ts$',
        '<rootDir>/src/services/__tests__/authBridge.integration.test.ts'
      ],
      // Add globals to mock import.meta for Jest
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'integration',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/*.integration.test.(ts|tsx)',
        '<rootDir>/src/**/__tests__/**/integration/**/*.test.(ts|tsx)',
        '<rootDir>/src/cli/__tests__/integration/**/*.integration.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '<rootDir>/src/services/__tests__/authBridge.integration.test.ts'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'cli',
      preset: 'ts-jest',
      testEnvironment: 'node',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.cli.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapping: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/cli/__tests__/setup.ts'],
      testMatch: [
        '<rootDir>/src/cli/__tests__/**/*.test.(ts|tsx)',
        '<rootDir>/src/cli/**/*.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '/node_modules/(?!chalk)/',
        '/integration/',
        '/real-api/'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'real-api',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/real-api/**/*.test.(ts|tsx)'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    }
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.test.*'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  // CLI-specific coverage paths
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'src/cli/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.test.*',
    '!src/cli/bin/**/*',
    '!src/cli/fixtures/**/*'
  ]
}; : '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/cli/__tests__/setup.ts'],
      testMatch: [
        '<rootDir>/src/cli/__tests__/**/*.test.(ts|tsx)',
        '<rootDir>/src/cli/**/*.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '/node_modules/',
        '/integration/',
        '/real-api/'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'real-api',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx) 
  ],
  // Add globals to mock import.meta for Jest
  globals: {
    'import.meta': {
      env: {}
    }
  },
  // Separate test runners for different test types
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/*.test.(ts|tsx)',
        '<rootDir>/src/**/*.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '/integration/',
        '/e2e/',
        '.integration.test.',
        '.e2e.test.',
        'real-api',
        '/src/__tests__/real-api/',
        '/src/services/__tests__/.*\\.integration\\.test\\.ts$',
        '<rootDir>/src/services/__tests__/authBridge.integration.test.ts'
      ],
      // Add globals to mock import.meta for Jest
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'integration',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/*.integration.test.(ts|tsx)',
        '<rootDir>/src/**/__tests__/**/integration/**/*.test.(ts|tsx)',
        '<rootDir>/src/cli/__tests__/integration/**/*.integration.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '<rootDir>/src/services/__tests__/authBridge.integration.test.ts'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'cli',
      preset: 'ts-jest',
      testEnvironment: 'node',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.cli.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapping: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/cli/__tests__/setup.ts'],
      testMatch: [
        '<rootDir>/src/cli/__tests__/**/*.test.(ts|tsx)',
        '<rootDir>/src/cli/**/*.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '/node_modules/(?!chalk)/',
        '/integration/',
        '/real-api/'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'real-api',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/real-api/**/*.test.(ts|tsx)'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    }
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.test.*'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  // CLI-specific coverage paths
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'src/cli/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.test.*',
    '!src/cli/bin/**/*',
    '!src/cli/fixtures/**/*'
  ]
}; : ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx) 
  ],
  // Add globals to mock import.meta for Jest
  globals: {
    'import.meta': {
      env: {}
    }
  },
  // Separate test runners for different test types
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/*.test.(ts|tsx)',
        '<rootDir>/src/**/*.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '/integration/',
        '/e2e/',
        '.integration.test.',
        '.e2e.test.',
        'real-api',
        '/src/__tests__/real-api/',
        '/src/services/__tests__/.*\\.integration\\.test\\.ts$',
        '<rootDir>/src/services/__tests__/authBridge.integration.test.ts'
      ],
      // Add globals to mock import.meta for Jest
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'integration',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/*.integration.test.(ts|tsx)',
        '<rootDir>/src/**/__tests__/**/integration/**/*.test.(ts|tsx)',
        '<rootDir>/src/cli/__tests__/integration/**/*.integration.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '<rootDir>/src/services/__tests__/authBridge.integration.test.ts'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'cli',
      preset: 'ts-jest',
      testEnvironment: 'node',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.cli.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapping: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/cli/__tests__/setup.ts'],
      testMatch: [
        '<rootDir>/src/cli/__tests__/**/*.test.(ts|tsx)',
        '<rootDir>/src/cli/**/*.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '/node_modules/(?!chalk)/',
        '/integration/',
        '/real-api/'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'real-api',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/real-api/**/*.test.(ts|tsx)'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    }
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.test.*'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  // CLI-specific coverage paths
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'src/cli/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.test.*',
    '!src/cli/bin/**/*',
    '!src/cli/fixtures/**/*'
  ]
}; : 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass) 
  ],
  // Add globals to mock import.meta for Jest
  globals: {
    'import.meta': {
      env: {}
    }
  },
  // Separate test runners for different test types
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/*.test.(ts|tsx)',
        '<rootDir>/src/**/*.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '/integration/',
        '/e2e/',
        '.integration.test.',
        '.e2e.test.',
        'real-api',
        '/src/__tests__/real-api/',
        '/src/services/__tests__/.*\\.integration\\.test\\.ts$',
        '<rootDir>/src/services/__tests__/authBridge.integration.test.ts'
      ],
      // Add globals to mock import.meta for Jest
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'integration',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/*.integration.test.(ts|tsx)',
        '<rootDir>/src/**/__tests__/**/integration/**/*.test.(ts|tsx)',
        '<rootDir>/src/cli/__tests__/integration/**/*.integration.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '<rootDir>/src/services/__tests__/authBridge.integration.test.ts'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'cli',
      preset: 'ts-jest',
      testEnvironment: 'node',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.cli.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapping: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/cli/__tests__/setup.ts'],
      testMatch: [
        '<rootDir>/src/cli/__tests__/**/*.test.(ts|tsx)',
        '<rootDir>/src/cli/**/*.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '/node_modules/(?!chalk)/',
        '/integration/',
        '/real-api/'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'real-api',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/real-api/**/*.test.(ts|tsx)'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    }
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.test.*'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  // CLI-specific coverage paths
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'src/cli/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.test.*',
    '!src/cli/bin/**/*',
    '!src/cli/fixtures/**/*'
  ]
}; : 'identity-obj-proxy',
        '^@/(.*) 
  ],
  // Add globals to mock import.meta for Jest
  globals: {
    'import.meta': {
      env: {}
    }
  },
  // Separate test runners for different test types
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/*.test.(ts|tsx)',
        '<rootDir>/src/**/*.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '/integration/',
        '/e2e/',
        '.integration.test.',
        '.e2e.test.',
        'real-api',
        '/src/__tests__/real-api/',
        '/src/services/__tests__/.*\\.integration\\.test\\.ts$',
        '<rootDir>/src/services/__tests__/authBridge.integration.test.ts'
      ],
      // Add globals to mock import.meta for Jest
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'integration',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/*.integration.test.(ts|tsx)',
        '<rootDir>/src/**/__tests__/**/integration/**/*.test.(ts|tsx)',
        '<rootDir>/src/cli/__tests__/integration/**/*.integration.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '<rootDir>/src/services/__tests__/authBridge.integration.test.ts'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'cli',
      preset: 'ts-jest',
      testEnvironment: 'node',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.cli.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapping: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/cli/__tests__/setup.ts'],
      testMatch: [
        '<rootDir>/src/cli/__tests__/**/*.test.(ts|tsx)',
        '<rootDir>/src/cli/**/*.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '/node_modules/(?!chalk)/',
        '/integration/',
        '/real-api/'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'real-api',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/real-api/**/*.test.(ts|tsx)'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    }
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.test.*'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  // CLI-specific coverage paths
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'src/cli/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.test.*',
    '!src/cli/bin/**/*',
    '!src/cli/fixtures/**/*'
  ]
}; : '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/real-api/**/*.test.(ts|tsx)'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    }
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.test.*'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  // CLI-specific coverage paths
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'src/cli/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.test.*',
    '!src/cli/bin/**/*',
    '!src/cli/fixtures/**/*'
  ]
}; 
  ],
  // Add globals to mock import.meta for Jest
  globals: {
    'import.meta': {
      env: {}
    }
  },
  // Separate test runners for different test types
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/*.test.(ts|tsx)',
        '<rootDir>/src/**/*.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '/integration/',
        '/e2e/',
        '.integration.test.',
        '.e2e.test.',
        'real-api',
        '/src/__tests__/real-api/',
        '/src/services/__tests__/.*\\.integration\\.test\\.ts$',
        '<rootDir>/src/services/__tests__/authBridge.integration.test.ts'
      ],
      // Add globals to mock import.meta for Jest
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'integration',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/*.integration.test.(ts|tsx)',
        '<rootDir>/src/**/__tests__/**/integration/**/*.test.(ts|tsx)',
        '<rootDir>/src/cli/__tests__/integration/**/*.integration.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '<rootDir>/src/services/__tests__/authBridge.integration.test.ts'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'cli',
      preset: 'ts-jest',
      testEnvironment: 'node',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.cli.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapping: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/cli/__tests__/setup.ts'],
      testMatch: [
        '<rootDir>/src/cli/__tests__/**/*.test.(ts|tsx)',
        '<rootDir>/src/cli/**/*.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '/node_modules/(?!chalk)/',
        '/integration/',
        '/real-api/'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'real-api',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/real-api/**/*.test.(ts|tsx)'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    }
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.test.*'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  // CLI-specific coverage paths
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'src/cli/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.test.*',
    '!src/cli/bin/**/*',
    '!src/cli/fixtures/**/*'
  ]
}; ,
    '/src/cli/__tests__/' // Ignore CLI tests in the main config
  ],
  // Add globals to mock import.meta for Jest
  globals: {
    'import.meta': {
      env: {}
    }
  },
  // Separate test runners for different test types
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/*.test.(ts|tsx)',
        '<rootDir>/src/**/*.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '/integration/',
        '/e2e/',
        '.integration.test.',
        '.e2e.test.',
        'real-api',
        '/src/__tests__/real-api/',
        '/src/services/__tests__/.*\\.integration\\.test\\.ts$',
        '<rootDir>/src/services/__tests__/authBridge.integration.test.ts'
      ],
      // Add globals to mock import.meta for Jest
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'integration',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/*.integration.test.(ts|tsx)',
        '<rootDir>/src/**/__tests__/**/integration/**/*.test.(ts|tsx)',
        '<rootDir>/src/cli/__tests__/integration/**/*.integration.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '<rootDir>/src/services/__tests__/authBridge.integration.test.ts'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'cli',
      preset: 'ts-jest',
      testEnvironment: 'node',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.cli.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapping: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/cli/__tests__/setup.ts'],
      testMatch: [
        '<rootDir>/src/cli/__tests__/**/*.test.(ts|tsx)',
        '<rootDir>/src/cli/**/*.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '/node_modules/(?!chalk)/',
        '/integration/',
        '/real-api/'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'real-api',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/real-api/**/*.test.(ts|tsx)'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    }
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.test.*'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  // CLI-specific coverage paths
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'src/cli/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.test.*',
    '!src/cli/bin/**/*',
    '!src/cli/fixtures/**/*'
  ]
}; 
  ],
  // Add globals to mock import.meta for Jest
  globals: {
    'import.meta': {
      env: {}
    }
  },
  // Separate test runners for different test types
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx) 
  ],
  // Add globals to mock import.meta for Jest
  globals: {
    'import.meta': {
      env: {}
    }
  },
  // Separate test runners for different test types
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/*.test.(ts|tsx)',
        '<rootDir>/src/**/*.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '/integration/',
        '/e2e/',
        '.integration.test.',
        '.e2e.test.',
        'real-api',
        '/src/__tests__/real-api/',
        '/src/services/__tests__/.*\\.integration\\.test\\.ts$',
        '<rootDir>/src/services/__tests__/authBridge.integration.test.ts'
      ],
      // Add globals to mock import.meta for Jest
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'integration',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/*.integration.test.(ts|tsx)',
        '<rootDir>/src/**/__tests__/**/integration/**/*.test.(ts|tsx)',
        '<rootDir>/src/cli/__tests__/integration/**/*.integration.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '<rootDir>/src/services/__tests__/authBridge.integration.test.ts'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'cli',
      preset: 'ts-jest',
      testEnvironment: 'node',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.cli.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapping: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/cli/__tests__/setup.ts'],
      testMatch: [
        '<rootDir>/src/cli/__tests__/**/*.test.(ts|tsx)',
        '<rootDir>/src/cli/**/*.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '/node_modules/(?!chalk)/',
        '/integration/',
        '/real-api/'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'real-api',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/real-api/**/*.test.(ts|tsx)'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    }
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.test.*'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  // CLI-specific coverage paths
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'src/cli/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.test.*',
    '!src/cli/bin/**/*',
    '!src/cli/fixtures/**/*'
  ]
}; : ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx) 
  ],
  // Add globals to mock import.meta for Jest
  globals: {
    'import.meta': {
      env: {}
    }
  },
  // Separate test runners for different test types
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/*.test.(ts|tsx)',
        '<rootDir>/src/**/*.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '/integration/',
        '/e2e/',
        '.integration.test.',
        '.e2e.test.',
        'real-api',
        '/src/__tests__/real-api/',
        '/src/services/__tests__/.*\\.integration\\.test\\.ts$',
        '<rootDir>/src/services/__tests__/authBridge.integration.test.ts'
      ],
      // Add globals to mock import.meta for Jest
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'integration',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/*.integration.test.(ts|tsx)',
        '<rootDir>/src/**/__tests__/**/integration/**/*.test.(ts|tsx)',
        '<rootDir>/src/cli/__tests__/integration/**/*.integration.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '<rootDir>/src/services/__tests__/authBridge.integration.test.ts'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'cli',
      preset: 'ts-jest',
      testEnvironment: 'node',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.cli.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapping: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/cli/__tests__/setup.ts'],
      testMatch: [
        '<rootDir>/src/cli/__tests__/**/*.test.(ts|tsx)',
        '<rootDir>/src/cli/**/*.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '/node_modules/(?!chalk)/',
        '/integration/',
        '/real-api/'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'real-api',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/real-api/**/*.test.(ts|tsx)'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    }
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.test.*'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  // CLI-specific coverage paths
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'src/cli/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.test.*',
    '!src/cli/bin/**/*',
    '!src/cli/fixtures/**/*'
  ]
}; : 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass) 
  ],
  // Add globals to mock import.meta for Jest
  globals: {
    'import.meta': {
      env: {}
    }
  },
  // Separate test runners for different test types
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/*.test.(ts|tsx)',
        '<rootDir>/src/**/*.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '/integration/',
        '/e2e/',
        '.integration.test.',
        '.e2e.test.',
        'real-api',
        '/src/__tests__/real-api/',
        '/src/services/__tests__/.*\\.integration\\.test\\.ts$',
        '<rootDir>/src/services/__tests__/authBridge.integration.test.ts'
      ],
      // Add globals to mock import.meta for Jest
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'integration',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/*.integration.test.(ts|tsx)',
        '<rootDir>/src/**/__tests__/**/integration/**/*.test.(ts|tsx)',
        '<rootDir>/src/cli/__tests__/integration/**/*.integration.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '<rootDir>/src/services/__tests__/authBridge.integration.test.ts'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'cli',
      preset: 'ts-jest',
      testEnvironment: 'node',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.cli.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapping: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/cli/__tests__/setup.ts'],
      testMatch: [
        '<rootDir>/src/cli/__tests__/**/*.test.(ts|tsx)',
        '<rootDir>/src/cli/**/*.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '/node_modules/(?!chalk)/',
        '/integration/',
        '/real-api/'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'real-api',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/real-api/**/*.test.(ts|tsx)'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    }
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.test.*'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  // CLI-specific coverage paths
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'src/cli/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.test.*',
    '!src/cli/bin/**/*',
    '!src/cli/fixtures/**/*'
  ]
}; : 'identity-obj-proxy',
        '^@/(.*) 
  ],
  // Add globals to mock import.meta for Jest
  globals: {
    'import.meta': {
      env: {}
    }
  },
  // Separate test runners for different test types
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/*.test.(ts|tsx)',
        '<rootDir>/src/**/*.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '/integration/',
        '/e2e/',
        '.integration.test.',
        '.e2e.test.',
        'real-api',
        '/src/__tests__/real-api/',
        '/src/services/__tests__/.*\\.integration\\.test\\.ts$',
        '<rootDir>/src/services/__tests__/authBridge.integration.test.ts'
      ],
      // Add globals to mock import.meta for Jest
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'integration',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/*.integration.test.(ts|tsx)',
        '<rootDir>/src/**/__tests__/**/integration/**/*.test.(ts|tsx)',
        '<rootDir>/src/cli/__tests__/integration/**/*.integration.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '<rootDir>/src/services/__tests__/authBridge.integration.test.ts'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'cli',
      preset: 'ts-jest',
      testEnvironment: 'node',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.cli.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapping: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/cli/__tests__/setup.ts'],
      testMatch: [
        '<rootDir>/src/cli/__tests__/**/*.test.(ts|tsx)',
        '<rootDir>/src/cli/**/*.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '/node_modules/(?!chalk)/',
        '/integration/',
        '/real-api/'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'real-api',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/real-api/**/*.test.(ts|tsx)'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    }
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.test.*'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  // CLI-specific coverage paths
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'src/cli/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.test.*',
    '!src/cli/bin/**/*',
    '!src/cli/fixtures/**/*'
  ]
}; : '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/*.test.(ts|tsx)',
        '<rootDir>/src/**/*.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '/integration/',
        '/e2e/',
        '.integration.test.',
        '.e2e.test.',
        'real-api',
        '/src/__tests__/real-api/',
        '/src/services/__tests__/.*\\.integration\\.test\\.ts 
  ],
  // Add globals to mock import.meta for Jest
  globals: {
    'import.meta': {
      env: {}
    }
  },
  // Separate test runners for different test types
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/*.test.(ts|tsx)',
        '<rootDir>/src/**/*.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '/integration/',
        '/e2e/',
        '.integration.test.',
        '.e2e.test.',
        'real-api',
        '/src/__tests__/real-api/',
        '/src/services/__tests__/.*\\.integration\\.test\\.ts$',
        '<rootDir>/src/services/__tests__/authBridge.integration.test.ts'
      ],
      // Add globals to mock import.meta for Jest
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'integration',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/*.integration.test.(ts|tsx)',
        '<rootDir>/src/**/__tests__/**/integration/**/*.test.(ts|tsx)',
        '<rootDir>/src/cli/__tests__/integration/**/*.integration.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '<rootDir>/src/services/__tests__/authBridge.integration.test.ts'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'cli',
      preset: 'ts-jest',
      testEnvironment: 'node',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.cli.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapping: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/cli/__tests__/setup.ts'],
      testMatch: [
        '<rootDir>/src/cli/__tests__/**/*.test.(ts|tsx)',
        '<rootDir>/src/cli/**/*.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '/node_modules/(?!chalk)/',
        '/integration/',
        '/real-api/'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'real-api',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/real-api/**/*.test.(ts|tsx)'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    }
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.test.*'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  // CLI-specific coverage paths
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'src/cli/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.test.*',
    '!src/cli/bin/**/*',
    '!src/cli/fixtures/**/*'
  ]
}; ,
        '<rootDir>/src/services/__tests__/authBridge.integration.test.ts'
      ],
      // Add globals to mock import.meta for Jest
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'integration',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx) 
  ],
  // Add globals to mock import.meta for Jest
  globals: {
    'import.meta': {
      env: {}
    }
  },
  // Separate test runners for different test types
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/*.test.(ts|tsx)',
        '<rootDir>/src/**/*.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '/integration/',
        '/e2e/',
        '.integration.test.',
        '.e2e.test.',
        'real-api',
        '/src/__tests__/real-api/',
        '/src/services/__tests__/.*\\.integration\\.test\\.ts$',
        '<rootDir>/src/services/__tests__/authBridge.integration.test.ts'
      ],
      // Add globals to mock import.meta for Jest
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'integration',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/*.integration.test.(ts|tsx)',
        '<rootDir>/src/**/__tests__/**/integration/**/*.test.(ts|tsx)',
        '<rootDir>/src/cli/__tests__/integration/**/*.integration.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '<rootDir>/src/services/__tests__/authBridge.integration.test.ts'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'cli',
      preset: 'ts-jest',
      testEnvironment: 'node',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.cli.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapping: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/cli/__tests__/setup.ts'],
      testMatch: [
        '<rootDir>/src/cli/__tests__/**/*.test.(ts|tsx)',
        '<rootDir>/src/cli/**/*.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '/node_modules/(?!chalk)/',
        '/integration/',
        '/real-api/'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'real-api',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/real-api/**/*.test.(ts|tsx)'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    }
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.test.*'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  // CLI-specific coverage paths
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'src/cli/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.test.*',
    '!src/cli/bin/**/*',
    '!src/cli/fixtures/**/*'
  ]
}; : ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx) 
  ],
  // Add globals to mock import.meta for Jest
  globals: {
    'import.meta': {
      env: {}
    }
  },
  // Separate test runners for different test types
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/*.test.(ts|tsx)',
        '<rootDir>/src/**/*.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '/integration/',
        '/e2e/',
        '.integration.test.',
        '.e2e.test.',
        'real-api',
        '/src/__tests__/real-api/',
        '/src/services/__tests__/.*\\.integration\\.test\\.ts$',
        '<rootDir>/src/services/__tests__/authBridge.integration.test.ts'
      ],
      // Add globals to mock import.meta for Jest
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'integration',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/*.integration.test.(ts|tsx)',
        '<rootDir>/src/**/__tests__/**/integration/**/*.test.(ts|tsx)',
        '<rootDir>/src/cli/__tests__/integration/**/*.integration.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '<rootDir>/src/services/__tests__/authBridge.integration.test.ts'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'cli',
      preset: 'ts-jest',
      testEnvironment: 'node',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.cli.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapping: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/cli/__tests__/setup.ts'],
      testMatch: [
        '<rootDir>/src/cli/__tests__/**/*.test.(ts|tsx)',
        '<rootDir>/src/cli/**/*.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '/node_modules/(?!chalk)/',
        '/integration/',
        '/real-api/'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'real-api',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/real-api/**/*.test.(ts|tsx)'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    }
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.test.*'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  // CLI-specific coverage paths
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'src/cli/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.test.*',
    '!src/cli/bin/**/*',
    '!src/cli/fixtures/**/*'
  ]
}; : 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass) 
  ],
  // Add globals to mock import.meta for Jest
  globals: {
    'import.meta': {
      env: {}
    }
  },
  // Separate test runners for different test types
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/*.test.(ts|tsx)',
        '<rootDir>/src/**/*.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '/integration/',
        '/e2e/',
        '.integration.test.',
        '.e2e.test.',
        'real-api',
        '/src/__tests__/real-api/',
        '/src/services/__tests__/.*\\.integration\\.test\\.ts$',
        '<rootDir>/src/services/__tests__/authBridge.integration.test.ts'
      ],
      // Add globals to mock import.meta for Jest
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'integration',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/*.integration.test.(ts|tsx)',
        '<rootDir>/src/**/__tests__/**/integration/**/*.test.(ts|tsx)',
        '<rootDir>/src/cli/__tests__/integration/**/*.integration.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '<rootDir>/src/services/__tests__/authBridge.integration.test.ts'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'cli',
      preset: 'ts-jest',
      testEnvironment: 'node',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.cli.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapping: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/cli/__tests__/setup.ts'],
      testMatch: [
        '<rootDir>/src/cli/__tests__/**/*.test.(ts|tsx)',
        '<rootDir>/src/cli/**/*.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '/node_modules/(?!chalk)/',
        '/integration/',
        '/real-api/'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'real-api',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/real-api/**/*.test.(ts|tsx)'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    }
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.test.*'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  // CLI-specific coverage paths
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'src/cli/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.test.*',
    '!src/cli/bin/**/*',
    '!src/cli/fixtures/**/*'
  ]
}; : 'identity-obj-proxy',
        '^@/(.*) 
  ],
  // Add globals to mock import.meta for Jest
  globals: {
    'import.meta': {
      env: {}
    }
  },
  // Separate test runners for different test types
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/*.test.(ts|tsx)',
        '<rootDir>/src/**/*.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '/integration/',
        '/e2e/',
        '.integration.test.',
        '.e2e.test.',
        'real-api',
        '/src/__tests__/real-api/',
        '/src/services/__tests__/.*\\.integration\\.test\\.ts$',
        '<rootDir>/src/services/__tests__/authBridge.integration.test.ts'
      ],
      // Add globals to mock import.meta for Jest
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'integration',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/*.integration.test.(ts|tsx)',
        '<rootDir>/src/**/__tests__/**/integration/**/*.test.(ts|tsx)',
        '<rootDir>/src/cli/__tests__/integration/**/*.integration.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '<rootDir>/src/services/__tests__/authBridge.integration.test.ts'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'cli',
      preset: 'ts-jest',
      testEnvironment: 'node',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.cli.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapping: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/cli/__tests__/setup.ts'],
      testMatch: [
        '<rootDir>/src/cli/__tests__/**/*.test.(ts|tsx)',
        '<rootDir>/src/cli/**/*.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '/node_modules/(?!chalk)/',
        '/integration/',
        '/real-api/'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'real-api',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/real-api/**/*.test.(ts|tsx)'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    }
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.test.*'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  // CLI-specific coverage paths
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'src/cli/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.test.*',
    '!src/cli/bin/**/*',
    '!src/cli/fixtures/**/*'
  ]
}; : '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/*.integration.test.(ts|tsx)',
        '<rootDir>/src/**/__tests__/**/integration/**/*.test.(ts|tsx)',
        '<rootDir>/src/cli/__tests__/integration/**/*.integration.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '<rootDir>/src/services/__tests__/authBridge.integration.test.ts'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'cli',
      preset: 'ts-jest',
      testEnvironment: 'node',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx) 
  ],
  // Add globals to mock import.meta for Jest
  globals: {
    'import.meta': {
      env: {}
    }
  },
  // Separate test runners for different test types
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/*.test.(ts|tsx)',
        '<rootDir>/src/**/*.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '/integration/',
        '/e2e/',
        '.integration.test.',
        '.e2e.test.',
        'real-api',
        '/src/__tests__/real-api/',
        '/src/services/__tests__/.*\\.integration\\.test\\.ts$',
        '<rootDir>/src/services/__tests__/authBridge.integration.test.ts'
      ],
      // Add globals to mock import.meta for Jest
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'integration',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/*.integration.test.(ts|tsx)',
        '<rootDir>/src/**/__tests__/**/integration/**/*.test.(ts|tsx)',
        '<rootDir>/src/cli/__tests__/integration/**/*.integration.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '<rootDir>/src/services/__tests__/authBridge.integration.test.ts'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'cli',
      preset: 'ts-jest',
      testEnvironment: 'node',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.cli.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapping: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/cli/__tests__/setup.ts'],
      testMatch: [
        '<rootDir>/src/cli/__tests__/**/*.test.(ts|tsx)',
        '<rootDir>/src/cli/**/*.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '/node_modules/(?!chalk)/',
        '/integration/',
        '/real-api/'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'real-api',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/real-api/**/*.test.(ts|tsx)'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    }
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.test.*'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  // CLI-specific coverage paths
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'src/cli/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.test.*',
    '!src/cli/bin/**/*',
    '!src/cli/fixtures/**/*'
  ]
}; : ['ts-jest', {
          tsconfig: 'tsconfig.cli.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx) 
  ],
  // Add globals to mock import.meta for Jest
  globals: {
    'import.meta': {
      env: {}
    }
  },
  // Separate test runners for different test types
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/*.test.(ts|tsx)',
        '<rootDir>/src/**/*.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '/integration/',
        '/e2e/',
        '.integration.test.',
        '.e2e.test.',
        'real-api',
        '/src/__tests__/real-api/',
        '/src/services/__tests__/.*\\.integration\\.test\\.ts$',
        '<rootDir>/src/services/__tests__/authBridge.integration.test.ts'
      ],
      // Add globals to mock import.meta for Jest
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'integration',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/*.integration.test.(ts|tsx)',
        '<rootDir>/src/**/__tests__/**/integration/**/*.test.(ts|tsx)',
        '<rootDir>/src/cli/__tests__/integration/**/*.integration.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '<rootDir>/src/services/__tests__/authBridge.integration.test.ts'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'cli',
      preset: 'ts-jest',
      testEnvironment: 'node',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.cli.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapping: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/cli/__tests__/setup.ts'],
      testMatch: [
        '<rootDir>/src/cli/__tests__/**/*.test.(ts|tsx)',
        '<rootDir>/src/cli/**/*.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '/node_modules/(?!chalk)/',
        '/integration/',
        '/real-api/'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'real-api',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/real-api/**/*.test.(ts|tsx)'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    }
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.test.*'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  // CLI-specific coverage paths
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'src/cli/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.test.*',
    '!src/cli/bin/**/*',
    '!src/cli/fixtures/**/*'
  ]
}; : 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass) 
  ],
  // Add globals to mock import.meta for Jest
  globals: {
    'import.meta': {
      env: {}
    }
  },
  // Separate test runners for different test types
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/*.test.(ts|tsx)',
        '<rootDir>/src/**/*.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '/integration/',
        '/e2e/',
        '.integration.test.',
        '.e2e.test.',
        'real-api',
        '/src/__tests__/real-api/',
        '/src/services/__tests__/.*\\.integration\\.test\\.ts$',
        '<rootDir>/src/services/__tests__/authBridge.integration.test.ts'
      ],
      // Add globals to mock import.meta for Jest
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'integration',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/*.integration.test.(ts|tsx)',
        '<rootDir>/src/**/__tests__/**/integration/**/*.test.(ts|tsx)',
        '<rootDir>/src/cli/__tests__/integration/**/*.integration.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '<rootDir>/src/services/__tests__/authBridge.integration.test.ts'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'cli',
      preset: 'ts-jest',
      testEnvironment: 'node',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.cli.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapping: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/cli/__tests__/setup.ts'],
      testMatch: [
        '<rootDir>/src/cli/__tests__/**/*.test.(ts|tsx)',
        '<rootDir>/src/cli/**/*.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '/node_modules/(?!chalk)/',
        '/integration/',
        '/real-api/'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'real-api',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/real-api/**/*.test.(ts|tsx)'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    }
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.test.*'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  // CLI-specific coverage paths
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'src/cli/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.test.*',
    '!src/cli/bin/**/*',
    '!src/cli/fixtures/**/*'
  ]
}; : 'identity-obj-proxy',
        '^@/(.*) 
  ],
  // Add globals to mock import.meta for Jest
  globals: {
    'import.meta': {
      env: {}
    }
  },
  // Separate test runners for different test types
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/*.test.(ts|tsx)',
        '<rootDir>/src/**/*.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '/integration/',
        '/e2e/',
        '.integration.test.',
        '.e2e.test.',
        'real-api',
        '/src/__tests__/real-api/',
        '/src/services/__tests__/.*\\.integration\\.test\\.ts$',
        '<rootDir>/src/services/__tests__/authBridge.integration.test.ts'
      ],
      // Add globals to mock import.meta for Jest
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'integration',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/*.integration.test.(ts|tsx)',
        '<rootDir>/src/**/__tests__/**/integration/**/*.test.(ts|tsx)',
        '<rootDir>/src/cli/__tests__/integration/**/*.integration.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '<rootDir>/src/services/__tests__/authBridge.integration.test.ts'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'cli',
      preset: 'ts-jest',
      testEnvironment: 'node',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.cli.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapping: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/cli/__tests__/setup.ts'],
      testMatch: [
        '<rootDir>/src/cli/__tests__/**/*.test.(ts|tsx)',
        '<rootDir>/src/cli/**/*.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '/node_modules/(?!chalk)/',
        '/integration/',
        '/real-api/'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'real-api',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/real-api/**/*.test.(ts|tsx)'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    }
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.test.*'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  // CLI-specific coverage paths
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'src/cli/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.test.*',
    '!src/cli/bin/**/*',
    '!src/cli/fixtures/**/*'
  ]
}; : '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/cli/__tests__/setup.ts'],
      testMatch: [
        '<rootDir>/src/cli/__tests__/**/*.test.(ts|tsx)',
        '<rootDir>/src/cli/**/*.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '/node_modules/',
        '/integration/',
        '/real-api/'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'real-api',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx) 
  ],
  // Add globals to mock import.meta for Jest
  globals: {
    'import.meta': {
      env: {}
    }
  },
  // Separate test runners for different test types
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/*.test.(ts|tsx)',
        '<rootDir>/src/**/*.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '/integration/',
        '/e2e/',
        '.integration.test.',
        '.e2e.test.',
        'real-api',
        '/src/__tests__/real-api/',
        '/src/services/__tests__/.*\\.integration\\.test\\.ts$',
        '<rootDir>/src/services/__tests__/authBridge.integration.test.ts'
      ],
      // Add globals to mock import.meta for Jest
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'integration',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/*.integration.test.(ts|tsx)',
        '<rootDir>/src/**/__tests__/**/integration/**/*.test.(ts|tsx)',
        '<rootDir>/src/cli/__tests__/integration/**/*.integration.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '<rootDir>/src/services/__tests__/authBridge.integration.test.ts'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'cli',
      preset: 'ts-jest',
      testEnvironment: 'node',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.cli.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapping: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/cli/__tests__/setup.ts'],
      testMatch: [
        '<rootDir>/src/cli/__tests__/**/*.test.(ts|tsx)',
        '<rootDir>/src/cli/**/*.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '/node_modules/(?!chalk)/',
        '/integration/',
        '/real-api/'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'real-api',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/real-api/**/*.test.(ts|tsx)'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    }
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.test.*'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  // CLI-specific coverage paths
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'src/cli/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.test.*',
    '!src/cli/bin/**/*',
    '!src/cli/fixtures/**/*'
  ]
}; : ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx) 
  ],
  // Add globals to mock import.meta for Jest
  globals: {
    'import.meta': {
      env: {}
    }
  },
  // Separate test runners for different test types
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/*.test.(ts|tsx)',
        '<rootDir>/src/**/*.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '/integration/',
        '/e2e/',
        '.integration.test.',
        '.e2e.test.',
        'real-api',
        '/src/__tests__/real-api/',
        '/src/services/__tests__/.*\\.integration\\.test\\.ts$',
        '<rootDir>/src/services/__tests__/authBridge.integration.test.ts'
      ],
      // Add globals to mock import.meta for Jest
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'integration',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/*.integration.test.(ts|tsx)',
        '<rootDir>/src/**/__tests__/**/integration/**/*.test.(ts|tsx)',
        '<rootDir>/src/cli/__tests__/integration/**/*.integration.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '<rootDir>/src/services/__tests__/authBridge.integration.test.ts'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'cli',
      preset: 'ts-jest',
      testEnvironment: 'node',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.cli.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapping: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/cli/__tests__/setup.ts'],
      testMatch: [
        '<rootDir>/src/cli/__tests__/**/*.test.(ts|tsx)',
        '<rootDir>/src/cli/**/*.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '/node_modules/(?!chalk)/',
        '/integration/',
        '/real-api/'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'real-api',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/real-api/**/*.test.(ts|tsx)'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    }
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.test.*'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  // CLI-specific coverage paths
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'src/cli/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.test.*',
    '!src/cli/bin/**/*',
    '!src/cli/fixtures/**/*'
  ]
}; : 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass) 
  ],
  // Add globals to mock import.meta for Jest
  globals: {
    'import.meta': {
      env: {}
    }
  },
  // Separate test runners for different test types
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/*.test.(ts|tsx)',
        '<rootDir>/src/**/*.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '/integration/',
        '/e2e/',
        '.integration.test.',
        '.e2e.test.',
        'real-api',
        '/src/__tests__/real-api/',
        '/src/services/__tests__/.*\\.integration\\.test\\.ts$',
        '<rootDir>/src/services/__tests__/authBridge.integration.test.ts'
      ],
      // Add globals to mock import.meta for Jest
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'integration',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/*.integration.test.(ts|tsx)',
        '<rootDir>/src/**/__tests__/**/integration/**/*.test.(ts|tsx)',
        '<rootDir>/src/cli/__tests__/integration/**/*.integration.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '<rootDir>/src/services/__tests__/authBridge.integration.test.ts'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'cli',
      preset: 'ts-jest',
      testEnvironment: 'node',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.cli.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapping: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/cli/__tests__/setup.ts'],
      testMatch: [
        '<rootDir>/src/cli/__tests__/**/*.test.(ts|tsx)',
        '<rootDir>/src/cli/**/*.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '/node_modules/(?!chalk)/',
        '/integration/',
        '/real-api/'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'real-api',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/real-api/**/*.test.(ts|tsx)'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    }
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.test.*'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  // CLI-specific coverage paths
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'src/cli/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.test.*',
    '!src/cli/bin/**/*',
    '!src/cli/fixtures/**/*'
  ]
}; : 'identity-obj-proxy',
        '^@/(.*) 
  ],
  // Add globals to mock import.meta for Jest
  globals: {
    'import.meta': {
      env: {}
    }
  },
  // Separate test runners for different test types
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/*.test.(ts|tsx)',
        '<rootDir>/src/**/*.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '/integration/',
        '/e2e/',
        '.integration.test.',
        '.e2e.test.',
        'real-api',
        '/src/__tests__/real-api/',
        '/src/services/__tests__/.*\\.integration\\.test\\.ts$',
        '<rootDir>/src/services/__tests__/authBridge.integration.test.ts'
      ],
      // Add globals to mock import.meta for Jest
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'integration',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/*.integration.test.(ts|tsx)',
        '<rootDir>/src/**/__tests__/**/integration/**/*.test.(ts|tsx)',
        '<rootDir>/src/cli/__tests__/integration/**/*.integration.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '<rootDir>/src/services/__tests__/authBridge.integration.test.ts'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'cli',
      preset: 'ts-jest',
      testEnvironment: 'node',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.cli.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapping: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/cli/__tests__/setup.ts'],
      testMatch: [
        '<rootDir>/src/cli/__tests__/**/*.test.(ts|tsx)',
        '<rootDir>/src/cli/**/*.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '/node_modules/(?!chalk)/',
        '/integration/',
        '/real-api/'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'real-api',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/real-api/**/*.test.(ts|tsx)'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    }
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.test.*'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  // CLI-specific coverage paths
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'src/cli/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.test.*',
    '!src/cli/bin/**/*',
    '!src/cli/fixtures/**/*'
  ]
}; : '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/real-api/**/*.test.(ts|tsx)'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    }
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.test.*'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  // CLI-specific coverage paths
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'src/cli/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.test.*',
    '!src/cli/bin/**/*',
    '!src/cli/fixtures/**/*'
  ]
}; 
  ],
  // Add globals to mock import.meta for Jest
  globals: {
    'import.meta': {
      env: {}
    }
  },
  // Separate test runners for different test types
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/*.test.(ts|tsx)',
        '<rootDir>/src/**/*.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '/integration/',
        '/e2e/',
        '.integration.test.',
        '.e2e.test.',
        'real-api',
        '/src/__tests__/real-api/',
        '/src/services/__tests__/.*\\.integration\\.test\\.ts$',
        '<rootDir>/src/services/__tests__/authBridge.integration.test.ts'
      ],
      // Add globals to mock import.meta for Jest
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'integration',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/*.integration.test.(ts|tsx)',
        '<rootDir>/src/**/__tests__/**/integration/**/*.test.(ts|tsx)',
        '<rootDir>/src/cli/__tests__/integration/**/*.integration.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '<rootDir>/src/services/__tests__/authBridge.integration.test.ts'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'cli',
      preset: 'ts-jest',
      testEnvironment: 'node',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.cli.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapping: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/cli/__tests__/setup.ts'],
      testMatch: [
        '<rootDir>/src/cli/__tests__/**/*.test.(ts|tsx)',
        '<rootDir>/src/cli/**/*.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '/node_modules/(?!chalk)/',
        '/integration/',
        '/real-api/'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    },
    {
      displayName: 'real-api',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          babelConfig: true
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/real-api/**/*.test.(ts|tsx)'
      ],
      globals: {
        'import.meta': {
          env: {}
        }
      }
    }
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.test.*'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  // CLI-specific coverage paths
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'src/cli/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.test.*',
    '!src/cli/bin/**/*',
    '!src/cli/fixtures/**/*'
  ]
}; 