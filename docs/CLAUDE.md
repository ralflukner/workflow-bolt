
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working
with code in this repository.

## Commands

### Developmen

```bash

# Start the development server

npm run dev

# Build for production

npm run build

# Preview production build

npm run preview

# Run ESLin

npm run lin

```

## Code Architecture

### Project Overview

This is a Patient Flow Management dashboard built with Vite, React,
TypeScript, and Tailwind CSS. It provides an interface for managing patien
appointments and workflow in a clinical setting.

### Core Technologies

- Vite for build tooling

- React 18+ for UI components

- TypeScript for type safety

- Tailwind CSS for styling

- Auth0 for authentication

### State Managemen

The application uses React Context API for state management:

1. **TimeContext** (`src/context/TimeContext.tsx`):

   - Manages real or simulated time
   - Provides time simulation capabilities
   - Offers time formatting utilities

2. **PatientContext** (`src/context/PatientContext.tsx`):
   - Stores and manages patient data
   - Handles patient status transitions
   - Calculates metrics like wait times
   - Provides methods to add/update patients

### Key Data Types

1. **Patient** (`src/types/index.ts`):

   - Central data structure for patient information
   - Contains appointment details, status, and timestamps

2. **PatientApptStatus** (`src/types/index.ts`):
   - Combined type for internal workflow and external scheduling statuses
   - Statuses include: scheduled, arrived, appt-prep, ready-for-md,
     With Doctor, seen-by-md, completed

### Component Hierarchy

```tex
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

1. The TimeContext provides current time (real or simulated)
2. The PatientContext maintains patient data and status
3. Components read from these contexts and dispatch actions
4. Patient status changes trigger timestamp updates
5. Components re-render based on context changes

## Authentication

The application uses Auth0 for authentication:

- Auth0Provider wraps the application in `src/auth/AuthProvider.tsx`

- Environmental variables configure the Auth0 connection

- LoginButton and LogoutButton components handle authentication actions

- ProtectedRoute component ensures content is only accessible to
  authenticated users

## Key Features

1. **Dashboard View**: Visualizes patients by status
2. **Time Simulation**: Allows for testing workflows by advancing time
3. **Metrics Panel**: Shows key performance indicators
4. **Patient Management**: Add, update, and track patients through various stages
