# Architecture Documentation

This directory contains system architecture documentation, design patterns, and technical decisions for Workflow Bolt.

## 📁 Contents

### Core Architecture

- [System Architecture](architecture.md) - High-level system architecture and components
- [Component Design](component-design.md) - Detailed component specifications
- [Directory Structure](directory-structure.md) - Project organization and file structure

### Data & Persistence

- [Data Model](data-model.md) - Database schema and data structures
- [Firebase Persistence Plan](firebase-persistence-plan.md) - Firebase integration strategy
- [Persistence Implementation](PERSISTENCE_IMPLEMENTATION.md) - Implementation details for data persistence

### State Management

- [State Management Improvements](state-management-improvements.md) - React state management patterns
- [Wait Time Calculations](wait-time-calculations.md) - Algorithm documentation for wait time metrics

## 🏗️ Architecture Overview

### System Components

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   React App     │────▶│ Firebase Cloud   │────▶│  Tebra SOAP     │
│   (Frontend)    │     │   Functions      │     │     API         │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │                       │                         ▲
         │                       │                         │
         ▼                       ▼                         │
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│    Firestore    │     │  Cloud Run PHP   │────▶│   Secret        │
│   (Database)    │     │   API Service    │     │   Manager       │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

### Key Design Patterns

1. **Context-Based State Management**
   - TimeContext for time simulation
   - PatientContext for patient data
   - See [Component Design](component-design.md)

2. **Microservices Architecture**
   - Frontend (React/Netlify)
   - Backend Functions (Firebase)
   - PHP API Service (Cloud Run)
   - See [System Architecture](architecture.md)

3. **Event-Driven Updates**
   - Real-time Firestore listeners
   - WebSocket-like updates
   - See [Persistence Implementation](PERSISTENCE_IMPLEMENTATION.md)

## 🔑 Key Technical Decisions

### Frontend

- **React 18+** - Modern hooks and concurrent features
- **TypeScript** - Type safety and better DX
- **Tailwind CSS** - Utility-first styling
- **Vite** - Fast build tooling

### Backend

- **Firebase Functions** - Serverless compute
- **Cloud Run** - Containerized PHP service
- **Firestore** - NoSQL document database
- **Secret Manager** - Secure credential storage

### Integration

- **SOAP API** - Legacy Tebra integration
- **REST API** - Modern service communication
- **OpenTelemetry** - Distributed tracing

## 📐 Design Principles

1. **Separation of Concerns**
   - Clear boundaries between services
   - Single responsibility per component

2. **HIPAA Compliance**
   - Encryption at rest and in transit
   - Audit logging for all PHI access
   - See [Security Documentation](../security/)

3. **Scalability**
   - Stateless services
   - Horizontal scaling capability
   - Caching strategies

4. **Maintainability**
   - Clear documentation
   - Consistent coding standards
   - Comprehensive testing

## 🔗 Related Documentation

- [Deployment](../deployment/) - How to deploy the architecture
- [Security](../security/) - Security architecture and compliance
- [Debugging](../debugging/) - Troubleshooting the system
- [Tebra Integration](../tebra-integration/) - External system integration
