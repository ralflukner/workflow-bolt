// src/types/medicalData.ts
export interface MedicalDataTypes {
  // Core Patient Demographics & IDs
  PatientRecord: {
    id: string; // Internal Firebase ID
    tebraPatientId: string; // Tebra EHR Patient ID
    mrn?: string; // Medical Record Number
    firstName: string;
    lastName: string;
    dob: string;
    gender: 'M' | 'F' | 'Other' | 'Unknown';
    ssn?: string; // Encrypted
    address: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      zipCode: string;
    };
    contact: {
      phone: string;
      email?: string;
      emergencyContact?: {
        name: string;
        relationship: string;
        phone: string;
      };
    };
    insurance: InsuranceInfo[];
    createdAt: Date;
    updatedAt: Date;
    lastSyncedAt: Date;
  };

  // Insurance Information
  InsuranceInfo: {
    id: string;
    tebraInsuranceId?: string;
    isPrimary: boolean;
    payerName: string;
    planName: string;
    memberId: string;
    groupNumber?: string;
    effectiveDate: string;
    terminationDate?: string;
    copay?: number;
    deductible?: number;
    status: 'Active' | 'Inactive' | 'Pending';
  };

  // Medical History & Conditions
  MedicalHistory: {
    id: string;
    patientId: string;
    tebraConditionId?: string;
    condition: string;
    icd10Code?: string;
    status: 'Active' | 'Resolved' | 'Chronic' | 'Acute';
    onsetDate?: string;
    resolvedDate?: string;
    severity: 'Mild' | 'Moderate' | 'Severe';
    notes?: string;
    providerId: string;
    createdAt: Date;
    updatedAt: Date;
  };

  // Medications
  Medication: {
    id: string;
    patientId: string;
    tebraMedicationId?: string;
    name: string;
    genericName?: string;
    dosage: string;
    frequency: string;
    route: string;
    prescribedDate: string;
    startDate: string;
    endDate?: string;
    status: 'Active' | 'Discontinued' | 'Completed' | 'On Hold';
    prescriberId: string;
    instructions?: string;
    refillsRemaining?: number;
    pharmacyInfo?: {
      name: string;
      phone: string;
      address: string;
    };
    contraindications?: string[];
    allergies?: string[];
    createdAt: Date;
    updatedAt: Date;
  };

  // Lab Results
  LabResult: {
    id: string;
    patientId: string;
    tebraLabId?: string;
    orderId?: string;
    testName: string;
    testCode: string; // CPT or LOINC code
    category: 'Chemistry' | 'Hematology' | 'Microbiology' | 'Immunology' | 'Other';
    result: {
      value: string | number;
      unit?: string;
      referenceRange?: string;
      status: 'Normal' | 'Abnormal' | 'Critical' | 'Pending';
      flags?: ('H' | 'L' | 'Critical')[];
    };
    collectionDate: string;
    resultDate: string;
    reportedDate: string;
    labName: string;
    providerId: string;
    reviewed: boolean;
    reviewedBy?: string;
    reviewedAt?: Date;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
  };

  // Imaging Results
  ImagingResult: {
    id: string;
    patientId: string;
    tebraImagingId?: string;
    orderId?: string;
    studyType: string; // 'X-Ray', 'CT', 'MRI', 'US', etc.
    studyDescription: string;
    cptCode?: string;
    bodyPart: string;
    indication: string;
    studyDate: string;
    reportDate: string;
    radiologist: string;
    findings: string;
    impression: string;
    recommendations?: string;
    images?: {
      url: string;
      description: string;
      viewType: string;
    }[];
    status: 'Pending' | 'Preliminary' | 'Final' | 'Addendum';
    providerId: string;
    reviewed: boolean;
    reviewedBy?: string;
    reviewedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
  };

  // Progress Notes & Documentation
  ProgressNote: {
    id: string;
    patientId: string;
    tebraNoteId?: string;
    encounterId?: string;
    noteType: 'Progress' | 'Consultation' | 'Discharge' | 'Procedure' | 'Telephone' | 'Other';
    date: string;
    providerId: string;
    template?: string;
    sections: {
      subjective?: string;
      objective?: string;
      assessment?: string;
      plan?: string;
      // Additional sections for your specialties
      substanceUse?: {
        currentUse: string;
        treatmentPlan: string;
        medications: string;
        counseling: string;
        followUp: string;
      };
      mentalHealth?: {
        mood: string;
        anxiety: string;
        medications: string;
        therapy: string;
        riskAssessment: string;
      };
      chronicDiseaseManagement?: {
        diabetes?: {
          a1c?: number;
          glucoseLog: string;
          medications: string;
          complications: string;
        };
        hypertension?: {
          bpReadings: string;
          medications: string;
          lifestyle: string;
        };
        kidneyDisease?: {
          creatinine?: number;
          egfr?: number;
          proteinuria: string;
          treatment: string;
        };
      };
    };
    isSigned: boolean;
    signedBy?: string;
    signedAt?: Date;
    amendedBy?: string;
    amendedAt?: Date;
    cosignRequired: boolean;
    cosignedBy?: string;
    cosignedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
  };

  // Appointments with Enhanced Clinical Context
  ClinicalAppointment: {
    id: string;
    patientId: string;
    tebraAppointmentId?: string;
    date: string;
    time: string;
    duration: number;
    type: 'Office Visit' | 'Follow-up' | 'Annual Physical' | 'Procedure' | 'Lab Review' | 'Telehealth' | 'Substance Use' | 'Mental Health';
    status: 'Scheduled' | 'Confirmed' | 'Arrived' | 'In Progress' | 'Completed' | 'No Show' | 'Cancelled';
    providerId: string;
    chiefComplaint?: string;
    reasonForVisit: string;
    // Pre-appointment preparation
    preparationNotes?: {
      reviewNeeded: string[];
      labsToOrder: string[];
      followUpItems: string[];
      medicationReview: boolean;
      specialConsiderations: string;
    };
    // Real-time appointment data
    vitalSigns?: {
      temperature?: number;
      bloodPressure?: string;
      heartRate?: number;
      respiratoryRate?: number;
      oxygenSaturation?: number;
      weight?: number;
      height?: number;
      bmi?: number;
      painScale?: number;
    };
    // Clinical decision support
    alerts?: {
      type: 'Drug Interaction' | 'Allergy' | 'Lab Critical' | 'Overdue Screening' | 'Chronic Disease';
      message: string;
      severity: 'Low' | 'Medium' | 'High' | 'Critical';
      acknowledged: boolean;
    }[];
    // Orders placed during appointment
    orders?: Order[];
    // Encounter outcome
    outcome?: {
      diagnosis: string[];
      procedures: string[];
      nextAppointment?: string;
      followUpInstructions: string;
      patientEducation: string[];
    };
    room?: string;
    checkInTime?: string;
    appointmentStartTime?: string;
    appointmentEndTime?: string;
    createdAt: Date;
    updatedAt: Date;
  };

  // Orders Management
  Order: {
    id: string;
    patientId: string;
    encounterId?: string;
    tebraOrderId?: string;
    orderType: 'Lab' | 'Imaging' | 'Medication' | 'Referral' | 'Procedure' | 'DME' | 'Home Health';
    category: string;
    description: string;
    cptCode?: string;
    icd10Codes: string[];
    priority: 'Routine' | 'ASAP' | 'STAT';
    status: 'Pending' | 'Sent' | 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
    orderedBy: string;
    orderedDate: string;
    scheduledDate?: string;
    completedDate?: string;
    // Specific order details
    labOrder?: {
      tests: string[];
      fastingRequired: boolean;
      collectionInstructions: string;
      labCompany: string;
    };
    imagingOrder?: {
      studyType: string;
      bodyPart: string;
      contrast: boolean;
      priorAuth: boolean;
      facility: string;
    };
    medicationOrder?: {
      medication: string;
      dosage: string;
      quantity: string;
      refills: number;
      pharmacy: string;
      substitutionAllowed: boolean;
    };
    referralOrder?: {
      specialty: string;
      providerName?: string;
      facility?: string;
      urgency: string;
      reason: string;
    };
    instructions?: string;
    patientInstructions?: string;
    results?: string;
    createdAt: Date;
    updatedAt: Date;
  };

  // Allergies & Adverse Reactions
  Allergy: {
    id: string;
    patientId: string;
    tebraAllergyId?: string;
    allergen: string;
    allergenType: 'Drug' | 'Food' | 'Environmental' | 'Other';
    reaction: string;
    severity: 'Mild' | 'Moderate' | 'Severe' | 'Life-threatening';
    onsetDate?: string;
    status: 'Active' | 'Inactive' | 'Resolved';
    verifiedBy?: string;
    verifiedDate?: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
  };

  // Clinical Decision Support Rules
  ClinicalRule: {
    id: string;
    name: string;
    description: string;
    category: 'Drug Interaction' | 'Screening Reminder' | 'Chronic Disease' | 'Preventive Care' | 'Lab Follow-up';
    conditions: {
      field: string;
      operator: string;
      value: any;
    }[];
    actions: {
      type: 'Alert' | 'Reminder' | 'Order Suggestion' | 'Care Plan';
      message: string;
      severity: 'Low' | 'Medium' | 'High' | 'Critical';
    }[];
    isActive: boolean;
    specialty?: string[];
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
  };

  // Care Plans for Chronic Conditions
  CarePlan: {
    id: string;
    patientId: string;
    condition: string;
    status: 'Active' | 'Completed' | 'Cancelled' | 'On Hold';
    goals: {
      id: string;
      description: string;
      targetValue?: string;
      currentValue?: string;
      targetDate?: string;
      status: 'In Progress' | 'Achieved' | 'Not Met';
    }[];
    interventions: {
      id: string;
      type: 'Medication' | 'Lifestyle' | 'Monitoring' | 'Education';
      description: string;
      frequency: string;
      instructions: string;
      compliance?: 'Good' | 'Moderate' | 'Poor';
    }[];
    monitoring: {
      parameter: string;
      frequency: string;
      lastValue?: string;
      lastDate?: string;
      nextDue?: string;
    }[];
    providerId: string;
    createdAt: Date;
    updatedAt: Date;
    nextReviewDate: string;
  };

  // Sync Tracking
  SyncLog: {
    id: string;
    dataType: 'Patient' | 'Appointment' | 'Lab' | 'Imaging' | 'Medication' | 'Note' | 'Order';
    operation: 'Read' | 'Write' | 'Update' | 'Delete';
    tebraId?: string;
    firebaseId: string;
    status: 'Success' | 'Failed' | 'Partial';
    direction: 'Firebase->Tebra' | 'Tebra->Firebase';
    errorMessage?: string;
    retryCount: number;
    lastAttempt: Date;
    nextRetry?: Date;
    createdAt: Date;
  };
}