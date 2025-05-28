# Architecture Overview

## Technology Stack

The Patient Flow Management application is built with the following
modern web technologies:

### Frontend

- **React 18.3.1**: UI library for building component-based interfaces
- **TypeScript 5.5.3**: Type-safe JavaScript superset for better
  developer experience
- **Tailwind CSS 3.4.1**: Utility-first CSS framework for rapid UI
  development
- **Vite 5.0.0**: Modern build tool optimized for React plugin
  compatibility
- **Lucide React**: Lightweight icon library
- **Auth0 2.3.0**: Authentication and authorization platform

### Development Tools

- **ESLint**: Code linting with TypeScript-specific rules
- **PostCSS**: CSS processing for Tailwind integration
- **TypeScript**: Static type checking

## Application Architecture

### Component Structure

The application follows a component-based architecture with the
following key sections:

```plaintext
src/
├── components/        # UI components
├── context/           # React context providers for state management
├── data/              # Mock data and data utilities
├── types/             # TypeScript type definitions
└── main.tsx           # Application entry point
```

### State Management

The application uses React Context API for state management:

- **TimeContext**: Manages real or simulated time with split architecture
  (TimeContextDef.ts and TimeProvider.tsx)
- **PatientContext**: Handles patient data and operations with forced
  re-rendering for real-time updates

This approach provides a clean way to share state across components
without prop drilling or external state libraries. The contexts use
proper TypeScript interfaces and include comprehensive error handling.

### UI Component Hierarchy


```plaintext
App
├── AuthProvider (Auth0)
│   └── TimeProvider
│       └── PatientProvider
│           └── ProtectedRoute
│               └── Dashboard
│                   ├── AuthNav
│                   ├── MetricsPanel
│                   ├── TimeControl
│                   ├── PatientList (multiple instances)
│                   │   └── PatientCard (multiple instances)
│                   ├── NewPatientForm (modal)
│                   └── ImportSchedule (modal)
```

### Data Flow

1. Auth0Provider handles user authentication and session management
2. The TimeContext provides the current time (real or simulated) with
   proper timezone handling
3. The PatientContext maintains the list of patients and their status
   with interval-based updates
4. UI components read from these contexts and dispatch actions to
   update state
5. Context changes trigger re-renders with optimized update intervals
6. Protected routes ensure authenticated access to all patient data

## Type System

TypeScript provides type safety throughout the application with key
types including:

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
   and real-time synchronization
2. **Enhanced Authentication**: Role-based access control and user
   management features
3. **Testing Framework**: Comprehensive unit and integration testing
   with Jest and React Testing Library
4. **Performance Optimization**: Component memoization, lazy loading,
   and advanced caching strategies
5. **Scalability**: Database optimization and microservices architecture
   for larger deployments
6. **Real-time Features**: WebSocket integration for live updates across
   multiple clients
7. **Mobile Applications**: Native mobile apps using React Native or
   progressive web app features
 