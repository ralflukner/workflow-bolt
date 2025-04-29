# Setup Guide

This guide provides instructions for setting up the Patient Flow Management application for development and testing.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 18.0.0 or newer
  - Download from [nodejs.org](https://nodejs.org/)
  - Verify with `node --version`

- **npm**: Typically installed with Node.js
  - Verify with `npm --version`

- **Git**: For version control
  - Download from [git-scm.com](https://git-scm.com/)
  - Verify with `git --version`

## Getting the Code

1. Clone the repository:
   ```bash
   git clone <your-repository-url>
   cd patient-flow-management
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Development Environment

### Starting the Development Server

Run the following command to start the development server:

```bash
npm run dev
```

The application will be available at [http://localhost:5173](http://localhost:5173) (or the port indicated in your terminal).

### Code Structure

Familiarize yourself with the code structure:

```
src/
├── components/        # React components
├── context/           # Context providers
├── data/              # Mock data and data utilities
├── types/             # TypeScript type definitions
└── main.tsx           # Application entry point
```

### Recommended IDE Setup

We recommend using Visual Studio Code with the following extensions:
- ESLint
- Tailwind CSS IntelliSense
- TypeScript Vue Plugin (Volar)
- PostCSS Language Support

## TypeScript Configuration

The project uses TypeScript with the following configuration files:
- `tsconfig.json`: Base configuration
- `tsconfig.app.json`: Application-specific settings
- `tsconfig.node.json`: Node.js-specific settings

If you encounter TypeScript-related issues, ensure you have the required type definitions:

```bash
npm install @types/react @types/react-dom
```

## Linting and Code Quality

To run ESLint:

```bash
npm run lint
```

## Building for Production

To create a production build:

```bash
npm run build
```

The output will be in the `dist` directory.

To preview the production build locally:

```bash
npm run preview
```

## Testing

Currently, the application uses manual testing. Automated testing will be added in the future.

## Simulating the Application

The application includes a time simulation feature for testing:

1. Open the application in development mode
2. Use the TimeControl component to toggle simulation mode
3. Adjust the simulated time to test appointment scheduling

## Working with Mock Data

The application uses mock data located in `src/data/mockData.ts`. You can:

1. Modify this file to create different test scenarios
2. Use the ImportSchedule component to import custom schedules
3. Add patients manually using the NewPatientForm component

## Troubleshooting

### Common Issues

1. **Module not found errors**
   - Ensure all dependencies are installed with `npm install`
   - Check import paths for correct casing

2. **TypeScript errors**
   - Make sure TypeScript types are correctly defined
   - Check that `@types/react` and `@types/react-dom` are installed

3. **Tailwind CSS not working**
   - Verify that `postcss.config.js` is correctly configured
   - Check that the required Tailwind directives are in `index.css`

### Getting Help

If you encounter issues not covered in this guide, please:
1. Check the existing GitHub issues
2. Create a new issue with detailed information about the problem
3. Include environment details (OS, Node version, browser) 