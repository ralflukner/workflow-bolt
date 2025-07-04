# Authentication System Diagrams

## System Architecture Overview

```mermaid
graph TB
    subgraph "User Layer"
        H[Human Users<br/>Ralf, Tanisha, Beth]
        AI[AI Service Accounts<br/>Claude, Other Agents]
    end
    
    subgraph "Authentication Methods"
        YK[YubiKey<br/>Hardware Token]
        TOTP[TOTP Generator<br/>90-day rotation]
        RC[Rescue Codes<br/>Emergency Access]
    end
    
    subgraph "Google Cloud Platform"
        SM[Secret Manager<br/>Encrypted Storage]
        CF[Cloud Functions<br/>Validation Logic]
        CS[Cloud Scheduler<br/>Rotation Triggers]
        PS[Pub/Sub<br/>Event Distribution]
    end
    
    subgraph "Access Control"
        Redis[(Redis ACL<br/>User Permissions)]
        PAM[Privileged Access<br/>Manager]
    end
    
    subgraph "Management"
        AD[Admin Dashboard<br/>Configuration UI]
        AL[Audit Logs<br/>BigQuery]
    end
    
    H --> YK
    H -.->|Emergency| RC
    AI --> TOTP
    
    YK --> SM
    TOTP --> SM
    RC --> SM
    
    SM <--> CF
    CS --> PS
    PS --> CF
    CF <--> Redis
    CF <--> PAM
    
    Redis --> AD
    PAM --> AD
    CF --> AL
    
    classDef human fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    classDef auth fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    classDef gcp fill:#e8f5e9,stroke:#388e3c,stroke-width:2px
    classDef control fill:#fce4ec,stroke:#c2185b,stroke-width:2px
    classDef mgmt fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    
    class H,AI human
    class YK,TOTP,RC auth
    class SM,CF,CS,PS gcp
    class Redis,PAM control
    class AD,AL mgmt
```

## YubiKey Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant YK as YubiKey
    participant CF as Cloud Function
    participant SM as Secret Manager
    participant Redis as Redis ACL
    
    U->>YK: Insert YubiKey + Enter PIN
    YK->>U: Generate OTP/Signature
    U->>CF: Submit Authentication Request
    CF->>SM: Retrieve User Certificate
    SM-->>CF: Encrypted Certificate
    CF->>CF: Validate YubiKey Signature
    
    alt Valid Authentication
        CF->>Redis: Create Session Token
        Redis-->>CF: Session Confirmed
        CF->>U: Authentication Success + Token
    else Invalid Authentication
        CF->>U: Authentication Failed
        CF->>BigQuery: Log Failed Attempt
    end
```

## Just-In-Time Admin Access Flow

```mermaid
flowchart LR
    A[Admin Request<br/>Elevation] --> B{Safe Context<br/>Check}
    B -->|Pass| C[YubiKey<br/>Verification]
    B -->|Fail| D[Request<br/>Denied]
    
    C --> E[PAM Approval<br/>Workflow]
    E --> F{Business Hours<br/>Check}
    
    F -->|Yes| G[Grant 4-Hour<br/>Access]
    F -->|No| H{Emergency<br/>Justification?}
    
    H -->|Valid| G
    H -->|Invalid| D
    
    G --> I[Enable Admin<br/>Permissions]
    I --> J[Start Audit<br/>Timer]
    J --> K[Auto-Revoke<br/>After 4 Hours]
    
    style A fill:#ffeb3b
    style G fill:#4caf50
    style D fill:#f44336
```

## Secret Rotation Architecture

```mermaid
graph LR
    subgraph "Trigger Layer"
        T1[90-Day Timer]
        T2[Manual Trigger]
        T3[Security Event]
    end
    
    subgraph "Rotation Process"
        R1[Generate New Secret]
        R2[Encrypt with KMS]
        R3[Store in Secret Manager]
        R4[Update Dependencies]
        R5[Verify Rotation]
    end
    
    subgraph "Notification"
        N1[Email Admins]
        N2[Update Dashboard]
        N3[Log to BigQuery]
    end
    
    T1 --> PS[Pub/Sub Topic]
    T2 --> PS
    T3 --> PS
    
    PS --> CF[Cloud Function]
    CF --> R1
    R1 --> R2
    R2 --> R3
    R3 --> R4
    R4 --> R5
    
    R5 --> N1
    R5 --> N2
    R5 --> N3
```

## Infrastructure Deployment Using Python Diagrams

```python
# Save this as generate_infrastructure_diagram.py
from diagrams import Diagram, Cluster, Edge
from diagrams.gcp.compute import Functions
from diagrams.gcp.database import Memorystore
from diagrams.gcp.security import KMS, SecurityCommandCenter
from diagrams.gcp.storage import Storage
from diagrams.gcp.analytics import BigQuery, PubSub
from diagrams.gcp.devtools 