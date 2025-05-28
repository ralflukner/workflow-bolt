# Component Design

This document provides an overview of the UI components and their
interactions within the Patient Flow Management application.

## Component Hierarchy

```text
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

## Key Components

### Dashboard

The Dashboard is the main container component that orchestrates the entire user interface.

```typescript
// Dashboard.tsx
const Dashboard: React.FC = () => {
  const [showNewPatientForm, setShowNewPatientForm] = useState(false);
  const [showImportSchedule, setShowImportSchedule] = useState(false);

  // Component rendering logic
}
```

**Responsibilities:**

- Layout management for the entire application
- Triggering modal forms (NewPatientForm, ImportSchedule)
- Organizing PatientList components by status

### PatientList

The PatientList component displays a filtered list of patients based on their status.

```typescript
// PatientList.tsx
interface PatientListProps {
  status: PatientStatus;
  title: string;
}

const PatientList: React.FC<PatientListProps> = ({ status, title }) => {
  const { getPatientsByStatus } = usePatientContext();
  const patients = getPatientsByStatus(status);

  // Rendering logic for the list of patients
}
```

**Responsibilities:**

- Filtering patients by status
- Rendering the appropriate list title
- Containing PatientCard components

### PatientCard

The PatientCard component represents a single patient and their information.

```typescript
// PatientCard.tsx
interface PatientCardProps {
  patient: Patient;
}

const PatientCard: React.FC<PatientCardProps> = ({ patient }) => {
  const { updatePatientStatus, assignRoom, getWaitTime } = usePatientContext();

  // Functions for status colors, actions, etc.

  // Rendering logic for patient information and actions
}
```

**Responsibilities:**

- Displaying patient information
- Managing room assignments
- Providing status transitions (action buttons)
- Visual indicators for status and wait times

### TimeControl

The TimeControl component allows users to manipulate time for testing.

```typescript
// TimeControl.tsx
const TimeControl: React.FC = () => {
  const {
    timeMode,
    toggleSimulation,
    adjustTime,
    getCurrentTime,
    formatTime
  } = useTimeContext();

  // Time management logic and UI
}
```

**Responsibilities:**

- Toggling between real and simulated time
- Adjusting the simulated time
- Displaying current time

### MetricsPanel

The MetricsPanel component displays key performance metrics.

```typescript
// MetricsPanel.tsx
const MetricsPanel: React.FC = () => {
  const { getMetrics } = usePatientContext();
  const metrics = getMetrics();

  // Rendering logic for metrics
}
```

**Responsibilities:**

- Calculating and displaying clinic metrics
- Visualizing patient flow efficiency

### Modal Components

#### NewPatientForm

```typescript
// NewPatientForm.tsx
interface NewPatientFormProps {
  onClose: () => void;
}

const NewPatientForm: React.FC<NewPatientFormProps> = ({ onClose }) => {
  // Form state and submission logic
}
```

#### ImportSchedule

```typescript
// ImportSchedule.tsx
interface ImportScheduleProps {
  onClose: () => void;
}

const ImportSchedule: React.FC<ImportScheduleProps> = ({ onClose }) => {
  // Import logic and UI
}
```

## UI Design Patterns

### Status Color Coding

Each patient status has a consistent color code applied across components:

```typescript
// Example from PatientCard.tsx
const getStatusColor = (status: string): string => {
  switch (status) {
    case 'scheduled': return 'bg-gray-500';
    case 'arrived': return 'bg-amber-500';
    case 'appt-prep': return 'bg-purple-500';
    case 'ready-for-md': return 'bg-cyan-500';
    case 'With Doctor': return 'bg-blue-500';
    case 'seen-by-md': return 'bg-teal-500';
    case 'completed': return 'bg-green-500';
    default: return 'bg-gray-500';
  }
};
```

### Appointment Status Styling

Appointment statuses use a different color scheme:

```typescript
// Example from PatientCard.tsx
patient.appointmentStatus === 'Confirmed' ? 'bg-blue-600 text-white' : 
patient.appointmentStatus === 'Reminder Sent' ?
  'bg-indigo-600 text-white' : 
patient.appointmentStatus === 'Arrived' || patient.appointmentStatus === 'Checked In' ? 'bg-green-600 text-white' : 
'bg-red-600 text-white'
```

### Responsive Design

The application is fully responsive with:

- Column layout on desktop
- Single column layout on mobile
- Expandable sections on mobile
- Tailwind's responsive utility classes

### Action Flow

User actions follow a consistent pattern:

1. User triggers action (button click)
2. React handler executes
3. Context method is called to update state
4. Context updates patient data
5. UI re-renders to reflect changes

## Component Interactions

Example: Patient Status Update Flow:

1. User clicks "Check In" on a PatientCard
2. handleStatusChange() is called in PatientCard
3. updatePatientStatus() from PatientContext is called
4. PatientContext updates the patient's status and adds a timestamp
5. State changes propagate to all components using the context
6. PatientCard moves to a different PatientList based on the new status
