# Data Model

This document details the data structures and state management approach used in the Patient Flow Management application.

## Core Data Types

### Patient

The `Patient` interface is the central data structure for the application:

```typescript
export interface Patient {
  id: string;
  name: string;
  dob: string;
  appointmentTime: string;
  appointmentType?: AppointmentType;
  chiefComplaint?: string;
  provider: string;
  room?: string;
  status: PatientApptStatus;
  checkInTime?: string;
  withDoctorTime?: string;
  completedTime?: string;
}
```

Key fields:
- `id`: Unique identifier for the patient
- `name`: Patient's full name
- `dob`: Date of birth in ISO format (YYYY-MM-DD)
- `appointmentTime`: Scheduled appointment time as ISO string
- `status`: Current status in the patient flow (using the combined PatientApptStatus type)
- Timestamps for different stages of the patient visit

### Combined Patient Appointment Status

The `PatientApptStatus` type combines both internal workflow statuses and external scheduling statuses:

```typescript
export type PatientApptStatus = 
  // Internal workflow statuses (lowercase kebab-case)
  | 'scheduled' | 'arrived' | 'appt-prep' | 'ready-for-md' | 'With Doctor' | 'seen-by-md' | 'completed'
  // External scheduling statuses (Title Case with spaces)
  | 'Scheduled' | 'Reminder Sent' | 'Confirmed' | 'Arrived' | 'Checked In' | 'Roomed' | 'Appt Prep Started' 
  | 'Ready for MD' | 'Seen by MD' | 'Checked Out' | 'No Show' | 'Rescheduled' | 'Cancelled';
```

This combined type allows the application to use a single status field that can represent both internal workflow states and external scheduling states.

### Patient Flow Status (Legacy)

The `PatientStatus` type defines the possible states in the patient workflow:

```typescript
export type PatientStatus = 
  | 'scheduled'     // Patient is scheduled but not arrived
  | 'arrived'       // Patient has arrived at the clinic
  | 'appt-prep'     // Patient is being prepared for appointment
  | 'ready-for-md'  // Patient is ready to see the doctor
  | 'With Doctor'   // Patient is currently with the doctor
  | 'seen-by-md'    // Patient has been seen by the doctor
  | 'completed';    // Patient has completed their visit
```

This represents the internal workflow statuses that are now included in the combined `PatientApptStatus` type. This type is maintained for backward compatibility.

### Appointment Status (Legacy)

The `AppointmentStatus` type defines the scheduling status of the appointment:

```typescript
export type AppointmentStatus = 
  | 'Scheduled'
  | 'Reminder Sent'
  | 'Confirmed'
  | 'Arrived'
  | 'Checked In'
  | 'Roomed'
  | 'Appt Prep Started'
  | 'Ready for MD'
  | 'Seen by MD'
  | 'Checked Out'
  | 'No Show'
  | 'Rescheduled'
  | 'Cancelled';
```

This represents the external scheduling statuses that are now included in the combined `PatientApptStatus` type. This type is maintained for backward compatibility.

### Appointment Type

```typescript
export type AppointmentType = 'Office Visit' | 'LABS';
```

### Time Mode

```typescript
export interface TimeMode {
  simulated: boolean;
  currentTime: string; // ISO string
}
```

### Metrics

```typescript
export interface Metrics {
  totalAppointments: number;
  waitingCount: number;
  averageWaitTime: number;
  maxWaitTime: number;
}
```

## State Management

### Context Approach

The application uses React Context API for state management:

1. **TimeContext**
   - Manages current time (real or simulated)
   - Controls time simulation features
   - Provides time formatting utilities

2. **PatientContext**
   - Stores the list of all patients
   - Provides methods to add, update, and filter patients
   - Tracks patient status transitions and timestamps
   - Calculates waiting times and other metrics

### Data Flow

![Data Flow Diagram](https://via.placeholder.com/800x400?text=Patient+Data+Flow+Diagram)

1. Patient data is loaded from mock data or imported via the ImportSchedule component
2. The PatientContext maintains the central state of all patients
3. UI components read from PatientContext and display filtered subsets based on status
4. Status changes trigger PatientContext updates, which update timestamps
5. All components re-render based on context changes

### Timestamps and Time Calculations

The application tracks several key timestamps:
- `appointmentTime`: When the patient is scheduled
- `checkInTime`: When the patient arrives/checks in
- `withDoctorTime`: When the patient goes in with the doctor
- `completedTime`: When the patient checks out

These timestamps are used to calculate waiting times and efficiency metrics. 
