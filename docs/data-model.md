# Data Model Documentation

This document details the data models used in the Tebra EHR Integration system, including their relationships, constraints, and usage patterns.

## Core Data Models

### 1. Patient Model

```typescript
interface Patient {
  id: string;                 // Unique identifier
  name: string;               // Full name
  dob: string;                // Date of birth (ISO format)
  appointmentTime: string;    // ISO datetime
  appointmentType: AppointmentType;
  provider: string;           // Provider name
  status: PatientStatus;
  checkInTime?: string;       // Optional ISO datetime
  room?: string;              // Optional room assignment
}
```

#### Relationships
- One-to-many with Appointments
- One-to-one with Insurance
- Many-to-one with Provider

### 2. Appointment Model

```typescript
interface Appointment {
  id: string;                 // Unique identifier
  patientId: string;          // Reference to Patient
  providerId: string;         // Reference to Provider
  startTime: string;          // ISO datetime
  endTime: string;            // ISO datetime
  type: AppointmentType;
  status: AppointmentStatus;
  notes?: string;             // Optional notes
  createdAt: string;          // ISO datetime
  updatedAt: string;          // ISO datetime
}
```

#### Relationships
- Many-to-one with Patient
- Many-to-one with Provider
- One-to-one with Session

### 3. Provider Model

```typescript
interface Provider {
  id: string;                 // Unique identifier
  firstName: string;
  lastName: string;
  title: string;              // e.g., "Dr.", "NP"
  specialties: string[];      // Array of specialties
  schedule: Schedule;         // Weekly schedule
  createdAt: string;          // ISO datetime
  updatedAt: string;          // ISO datetime
}
```

#### Relationships
- One-to-many with Appointments
- One-to-many with Patients
- One-to-one with Schedule

### 4. Session Model

```typescript
interface Session {
  id: string;                 // Unique identifier
  date: string;               // ISO date
  providerId: string;         // Reference to Provider
  appointments: Appointment[]; // Array of appointments
  status: SessionStatus;
  createdAt: string;          // ISO datetime
  updatedAt: string;          // ISO datetime
}
```

#### Relationships
- One-to-many with Appointments
- Many-to-one with Provider

## Enums and Types

### 1. Appointment Types
```typescript
enum AppointmentType {
  OFFICE_VISIT = 'Office Visit',
  LABS = 'LABS',
  FOLLOW_UP = 'Follow Up',
  CONSULTATION = 'Consultation',
  PROCEDURE = 'Procedure'
}
```

### 2. Status Types
```typescript
enum PatientStatus {
  SCHEDULED = 'scheduled',
  CHECKED_IN = 'checked_in',
  IN_ROOM = 'in_room',
  WITH_PROVIDER = 'with_provider',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show'
}

enum SessionStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}
```

## Data Relationships

### 1. Patient Flow
```mermaid
graph TD
    A[Patient] --> B[Appointment]
    B --> C[Session]
    C --> D[Provider]
    B --> E[Status]
    E --> F[Check In]
    E --> G[Room Assignment]
    E --> H[Provider Visit]
    E --> I[Completion]
```

### 2. Provider Schedule
```mermaid
graph TD
    A[Provider] --> B[Schedule]
    B --> C[Session]
    C --> D[Appointments]
    D --> E[Patients]
```

## Data Validation Rules

### 1. Patient Validation
- Name: Required, max 100 characters
- DOB: Required, valid date, not in future
- Appointment Time: Required, valid datetime
- Status: Must be valid PatientStatus enum value

### 2. Appointment Validation
- Patient ID: Required, must exist
- Provider ID: Required, must exist
- Start Time: Required, valid datetime
- End Time: Required, valid datetime, after start time
- Type: Must be valid AppointmentType enum value
- Status: Must be valid AppointmentStatus enum value

### 3. Provider Validation
- First Name: Required, max 50 characters
- Last Name: Required, max 50 characters
- Title: Required, valid title
- Specialties: Array of valid specialties
- Schedule: Valid schedule object

## Data Operations

### 1. CRUD Operations
```typescript
// Create
async function createPatient(patient: Patient): Promise<Patient>
async function createAppointment(appointment: Appointment): Promise<Appointment>
async function createProvider(provider: Provider): Promise<Provider>
async function createSession(session: Session): Promise<Session>

// Read
async function getPatient(id: string): Promise<Patient>
async function getAppointment(id: string): Promise<Appointment>
async function getProvider(id: string): Promise<Provider>
async function getSession(id: string): Promise<Session>

// Update
async function updatePatient(id: string, patient: Partial<Patient>): Promise<Patient>
async function updateAppointment(id: string, appointment: Partial<Appointment>): Promise<Appointment>
async function updateProvider(id: string, provider: Partial<Provider>): Promise<Provider>
async function updateSession(id: string, session: Partial<Session>): Promise<Session>

// Delete
async function deletePatient(id: string): Promise<void>
async function deleteAppointment(id: string): Promise<void>
async function deleteProvider(id: string): Promise<void>
async function deleteSession(id: string): Promise<void>
```

### 2. Query Operations
```typescript
// Find by criteria
async function findPatients(criteria: PatientCriteria): Promise<Patient[]>
async function findAppointments(criteria: AppointmentCriteria): Promise<Appointment[]>
async function findProviders(criteria: ProviderCriteria): Promise<Provider[]>
async function findSessions(criteria: SessionCriteria): Promise<Session[]>

// Get related data
async function getPatientAppointments(patientId: string): Promise<Appointment[]>
async function getProviderAppointments(providerId: string): Promise<Appointment[]>
async function getSessionAppointments(sessionId: string): Promise<Appointment[]>
```

## Data Migration

### 1. Version Control
- Each model version is tracked
- Migration scripts are provided
- Rollback procedures documented
- Data validation on migration

### 2. Backup Strategy
- Regular automated backups
- Point-in-time recovery
- Data integrity checks
- Backup verification

## Performance Considerations

### 1. Indexing Strategy
- Primary keys on all models
- Foreign key indexes
- Composite indexes for common queries
- Text search indexes

### 2. Caching Strategy
- In-memory caching
- Query result caching
- Cache invalidation rules
- Cache size limits

## Security Considerations

### 1. Data Access Control
- Role-based access
- Field-level security
- Audit logging
- Data encryption

### 2. Data Privacy
- PHI handling
- Data masking
- Retention policies
- Compliance requirements
