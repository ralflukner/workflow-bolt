# Architecture Overview

## Technology Stack

The Patient Flow Management application is built with the following modern web technologies:

### Frontend
- **React 18+**: UI library for building component-based interfaces
- **TypeScript**: Type-safe JavaScript superset for better developer experience
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **Vite**: Modern build tool for fast development and optimized production builds
- **Lucide React**: Lightweight icon library

### Development Tools
- **ESLint**: Code linting with TypeScript-specific rules
- **PostCSS**: CSS processing for Tailwind integration
- **TypeScript**: Static type checking

## Application Architecture

### Component Structure
The application follows a component-based architecture with the following key sections:

```
src/
├── components/        # UI components
├── context/           # React context providers for state management
├── data/              # Mock data and data utilities
├── types/             # TypeScript type definitions
└── main.tsx           # Application entry point
```

### State Management
The application uses React Context API for state management:

- **TimeContext**: Manages real or simulated time for the application
- **PatientContext**: Handles patient data and operations

This approach provides a clean way to share state across components without prop drilling or external state libraries.

### UI Component Hierarchy

```
App
├── TimeProvider
│   └── PatientProvider
│       └── Dashboard
│           ├── MetricsPanel
│           ├── TimeControl
│           ├── PatientList (multiple instances)
│           │   └── PatientCard (multiple instances)
│           ├── NewPatientForm (modal)
│           └── ImportSchedule (modal)
```

### Data Flow
1. The TimeContext provides the current time (real or simulated)
2. The PatientContext maintains the list of patients and their status
3. UI components read from these contexts and dispatch actions to update state
4. Components re-render based on context changes

## Type System

TypeScript provides type safety throughout the application with key types including:

- **Patient**: Core data structure for patient information
- **PatientStatus**: Enumeration of possible workflow statuses
- **AppointmentStatus**: Enumeration of appointment statuses
- **TimeMode**: Configuration for time simulation

## Styling Approach

The application uses Tailwind CSS with a consistent color scheme:
- Status colors are consistently applied across components
- Responsive design works across device sizes
- Dark mode interface is used throughout

## Future Architecture Considerations

1. **API Integration**: Backend API will be added for data persistence
2. **Authentication**: User authentication will be implemented
3. **Testing**: Unit and integration tests will be added
4. **Performance Optimization**: Component memoization and lazy loading 