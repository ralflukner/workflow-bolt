// src/services/tebra/comprehensiveTebraApi.ts
import { TebraCredentials } from './tebraApiService';
import { 
  MedicalDataTypes, 
  LabResult, 
  ImagingResult, 
  ProgressNote, 
  Medication, 
  Order, 
  Allergy 
} from '../../types/medicalData';

export interface TebraLabResult {
  LabResultId: string;
  PatientId: string;
  OrderId?: string;
  TestName: string;
  TestCode: string;
  Result: string;
  Units?: string;
  ReferenceRange?: string;
  Status: string;
  CollectionDate: string;
  ResultDate: string;
  LabName: string;
  ProviderId: string;
  Notes?: string;
  CriticalFlag?: boolean;
}

export interface TebraImagingResult {
  ImagingResultId: string;
  PatientId: string;
  OrderId?: string;
  StudyType: string;
  StudyDescription: string;
  StudyDate: string;
  Radiologist: string;
  Findings: string;
  Impression: string;
  Recommendations?: string;
  Status: string;
  ProviderId: string;
}

export interface TebraProgressNote {
  NoteId: string;
  PatientId: string;
  EncounterId?: string;
  NoteType: string;
  Date: string;
  ProviderId: string;
  SubjectiveText?: string;
  ObjectiveText?: string;
  AssessmentText?: string;
  PlanText?: string;
  IsSigned: boolean;
  SignedBy?: string;
  SignedDate?: string;
}

export interface TebraMedication {
  MedicationId: string;
  PatientId: string;
  Name: string;
  GenericName?: string;
  Dosage: string;
  Frequency: string;
  Route: string;
  StartDate: string;
  EndDate?: string;
  Status: string;
  PrescriberProviderId: string;
  Instructions?: string;
  RefillsRemaining?: number;
}

export interface TebraOrder {
  OrderId: string;
  PatientId: string;
  EncounterId?: string;
  OrderType: string;
  Description: string;
  CPTCode?: string;
  ICD10Codes: string[];
  Status: string;
  OrderedBy: string;
  OrderedDate: string;
  Instructions?: string;
  Priority: string;
}

export class ComprehensiveTebraApi {
  private credentials: TebraCredentials;
  private baseUrl = 'https://webservice.kareo.com/services/soap/2.1/KareoServices.svc';

  constructor(credentials: TebraCredentials) {
    this.credentials = credentials;
  }

  /**
   * Create SOAP envelope for Tebra API requests
   */
  private createSOAPEnvelope(action: string, body: string): string {
    return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Header>
    <Action xmlns="http://schemas.microsoft.com/ws/2005/05/addressing/none">${action}</Action>
  </soap:Header>
  <soap:Body>
    ${body}
  </soap:Body>
</soap:Envelope>`;
  }

  /**
   * Create request header with authentication
   */
  private createRequestHeader(): string {
    return `
    <RequestHeader>
      <ClientVersion>v1</ClientVersion>
      <CustomerKey>${this.credentials.customerKey}</CustomerKey>
      <User>${this.credentials.username}</User>
      <Password>${this.credentials.password}</Password>
    </RequestHeader>`;
  }

  /**
   * Make SOAP request to Tebra API
   */
  private async makeSOAPRequest(action: string, soapBody: string): Promise<Document> {
    const envelope = this.createSOAPEnvelope(action, soapBody);

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': action,
        },
        body: envelope,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseText = await response.text();
      return this.parseSOAPResponse(responseText);
    } catch (error) {
      console.error('SOAP request failed:', error);
      throw new Error(`Tebra API request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse SOAP response XML
   */
  private parseSOAPResponse(xml: string): Document {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');
    
    // Check for SOAP faults
    const fault = doc.querySelector('soap\\:Fault, Fault');
    if (fault) {
      const faultString = fault.querySelector('faultstring')?.textContent || 'Unknown SOAP fault';
      throw new Error(`SOAP Fault: ${faultString}`);
    }

    return doc;
  }

  /**
   * Helper to get node value safely
   */
  private getNodeValue(parent: Element, tagName: string): string {
    return parent.querySelector(tagName)?.textContent?.trim() || '';
  }

  // ==================== LAB RESULTS ====================

  /**
   * Get lab results for a patient
   */
  async getLabResults(patientId: string, fromDate?: Date, toDate?: Date): Promise<TebraLabResult[]> {
    const fromDateStr = fromDate?.toISOString().split('T')[0] || '';
    const toDateStr = toDate?.toISOString().split('T')[0] || '';

    const soapBody = `
    <GetLabResults xmlns="http://www.kareo.com/api/schemas/">
      <request>
        ${this.createRequestHeader()}
        <Fields>
          <LabResultId>true</LabResultId>
          <PatientId>true</PatientId>
          <OrderId>true</OrderId>
          <TestName>true</TestName>
          <TestCode>true</TestCode>
          <Result>true</Result>
          <Units>true</Units>
          <ReferenceRange>true</ReferenceRange>
          <Status>true</Status>
          <CollectionDate>true</CollectionDate>
          <ResultDate>true</ResultDate>
          <LabName>true</LabName>
          <ProviderId>true</ProviderId>
          <Notes>true</Notes>
          <CriticalFlag>true</CriticalFlag>
        </Fields>
        <Filter>
          <PatientId>${patientId}</PatientId>
          ${fromDateStr ? `<FromResultDate>${fromDateStr}</FromResultDate>` : ''}
          ${toDateStr ? `<ToResultDate>${toDateStr}</ToResultDate>` : ''}
        </Filter>
      </request>
    </GetLabResults>`;

    const action = 'http://www.kareo.com/api/schemas/KareoServices/GetLabResults';
    const response = await this.makeSOAPRequest(action, soapBody);
    
    return this.parseLabResultsResponse(response);
  }

  private parseLabResultsResponse(doc: Document): TebraLabResult[] {
    const results: TebraLabResult[] = [];
    const resultNodes = doc.querySelectorAll('LabResultData');

    resultNodes.forEach(node => {
      results.push({
        LabResultId: this.getNodeValue(node, 'LabResultId'),
        PatientId: this.getNodeValue(node, 'PatientId'),
        OrderId: this.getNodeValue(node, 'OrderId'),
        TestName: this.getNodeValue(node, 'TestName'),
        TestCode: this.getNodeValue(node, 'TestCode'),
        Result: this.getNodeValue(node, 'Result'),
        Units: this.getNodeValue(node, 'Units'),
        ReferenceRange: this.getNodeValue(node, 'ReferenceRange'),
        Status: this.getNodeValue(node, 'Status'),
        CollectionDate: this.getNodeValue(node, 'CollectionDate'),
        ResultDate: this.getNodeValue(node, 'ResultDate'),
        LabName: this.getNodeValue(node, 'LabName'),
        ProviderId: this.getNodeValue(node, 'ProviderId'),
        Notes: this.getNodeValue(node, 'Notes'),
        CriticalFlag: this.getNodeValue(node, 'CriticalFlag') === 'true',
      });
    });

    return results;
  }

  // ==================== IMAGING RESULTS ====================

  /**
   * Get imaging results for a patient
   */
  async getImagingResults(patientId: string, fromDate?: Date, toDate?: Date): Promise<TebraImagingResult[]> {
    const fromDateStr = fromDate?.toISOString().split('T')[0] || '';
    const toDateStr = toDate?.toISOString().split('T')[0] || '';

    const soapBody = `
    <GetImagingResults xmlns="http://www.kareo.com/api/schemas/">
      <request>
        ${this.createRequestHeader()}
        <Fields>
          <ImagingResultId>true</ImagingResultId>
          <PatientId>true</PatientId>
          <OrderId>true</OrderId>
          <StudyType>true</StudyType>
          <StudyDescription>true</StudyDescription>
          <StudyDate>true</StudyDate>
          <Radiologist>true</Radiologist>
          <Findings>true</Findings>
          <Impression>true</Impression>
          <Recommendations>true</Recommendations>
          <Status>true</Status>
          <ProviderId>true</ProviderId>
        </Fields>
        <Filter>
          <PatientId>${patientId}</PatientId>
          ${fromDateStr ? `<FromStudyDate>${fromDateStr}</FromStudyDate>` : ''}
          ${toDateStr ? `<ToStudyDate>${toDateStr}</ToStudyDate>` : ''}
        </Filter>
      </request>
    </GetImagingResults>`;

    const action = 'http://www.kareo.com/api/schemas/KareoServices/GetImagingResults';
    const response = await this.makeSOAPRequest(action, soapBody);
    
    return this.parseImagingResultsResponse(response);
  }

  private parseImagingResultsResponse(doc: Document): TebraImagingResult[] {
    const results: TebraImagingResult[] = [];
    const resultNodes = doc.querySelectorAll('ImagingResultData');

    resultNodes.forEach(node => {
      results.push({
        ImagingResultId: this.getNodeValue(node, 'ImagingResultId'),
        PatientId: this.getNodeValue(node, 'PatientId'),
        OrderId: this.getNodeValue(node, 'OrderId'),
        StudyType: this.getNodeValue(node, 'StudyType'),
        StudyDescription: this.getNodeValue(node, 'StudyDescription'),
        StudyDate: this.getNodeValue(node, 'StudyDate'),
        Radiologist: this.getNodeValue(node, 'Radiologist'),
        Findings: this.getNodeValue(node, 'Findings'),
        Impression: this.getNodeValue(node, 'Impression'),
        Recommendations: this.getNodeValue(node, 'Recommendations'),
        Status: this.getNodeValue(node, 'Status'),
        ProviderId: this.getNodeValue(node, 'ProviderId'),
      });
    });

    return results;
  }

  // ==================== PROGRESS NOTES ====================

  /**
   * Get progress notes for a patient
   */
  async getProgressNotes(patientId: string, fromDate?: Date, toDate?: Date): Promise<TebraProgressNote[]> {
    const fromDateStr = fromDate?.toISOString().split('T')[0] || '';
    const toDateStr = toDate?.toISOString().split('T')[0] || '';

    const soapBody = `
    <GetProgressNotes xmlns="http://www.kareo.com/api/schemas/">
      <request>
        ${this.createRequestHeader()}
        <Fields>
          <NoteId>true</NoteId>
          <PatientId>true</PatientId>
          <EncounterId>true</EncounterId>
          <NoteType>true</NoteType>
          <Date>true</Date>
          <ProviderId>true</ProviderId>
          <SubjectiveText>true</SubjectiveText>
          <ObjectiveText>true</ObjectiveText>
          <AssessmentText>true</AssessmentText>
          <PlanText>true</PlanText>
          <IsSigned>true</IsSigned>
          <SignedBy>true</SignedBy>
          <SignedDate>true</SignedDate>
        </Fields>
        <Filter>
          <PatientId>${patientId}</PatientId>
          ${fromDateStr ? `<FromDate>${fromDateStr}</FromDate>` : ''}
          ${toDateStr ? `<ToDate>${toDateStr}</ToDate>` : ''}
        </Filter>
      </request>
    </GetProgressNotes>`;

    const action = 'http://www.kareo.com/api/schemas/KareoServices/GetProgressNotes';
    const response = await this.makeSOAPRequest(action, soapBody);
    
    return this.parseProgressNotesResponse(response);
  }

  private parseProgressNotesResponse(doc: Document): TebraProgressNote[] {
    const notes: TebraProgressNote[] = [];
    const noteNodes = doc.querySelectorAll('ProgressNoteData');

    noteNodes.forEach(node => {
      notes.push({
        NoteId: this.getNodeValue(node, 'NoteId'),
        PatientId: this.getNodeValue(node, 'PatientId'),
        EncounterId: this.getNodeValue(node, 'EncounterId'),
        NoteType: this.getNodeValue(node, 'NoteType'),
        Date: this.getNodeValue(node, 'Date'),
        ProviderId: this.getNodeValue(node, 'ProviderId'),
        SubjectiveText: this.getNodeValue(node, 'SubjectiveText'),
        ObjectiveText: this.getNodeValue(node, 'ObjectiveText'),
        AssessmentText: this.getNodeValue(node, 'AssessmentText'),
        PlanText: this.getNodeValue(node, 'PlanText'),
        IsSigned: this.getNodeValue(node, 'IsSigned') === 'true',
        SignedBy: this.getNodeValue(node, 'SignedBy'),
        SignedDate: this.getNodeValue(node, 'SignedDate'),
      });
    });

    return notes;
  }

  /**
   * Create/Update progress note in Tebra
   */
  async createProgressNote(note: Partial<TebraProgressNote>): Promise<string> {
    const soapBody = `
    <CreateProgressNote xmlns="http://www.kareo.com/api/schemas/">
      <request>
        ${this.createRequestHeader()}
        <ProgressNoteData>
          <PatientId>${note.PatientId}</PatientId>
          ${note.EncounterId ? `<EncounterId>${note.EncounterId}</EncounterId>` : ''}
          <NoteType>${note.NoteType}</NoteType>
          <Date>${note.Date}</Date>
          <ProviderId>${note.ProviderId}</ProviderId>
          ${note.SubjectiveText ? `<SubjectiveText><![CDATA[${note.SubjectiveText}]]></SubjectiveText>` : ''}
          ${note.ObjectiveText ? `<ObjectiveText><![CDATA[${note.ObjectiveText}]]></ObjectiveText>` : ''}
          ${note.AssessmentText ? `<AssessmentText><![CDATA[${note.AssessmentText}]]></AssessmentText>` : ''}
          ${note.PlanText ? `<PlanText><![CDATA[${note.PlanText}]]></PlanText>` : ''}
        </ProgressNoteData>
      </request>
    </CreateProgressNote>`;

    const action = 'http://www.kareo.com/api/schemas/KareoServices/CreateProgressNote';
    const response = await this.makeSOAPRequest(action, soapBody);
    
    // Extract the created note ID from response
    const noteIdNode = response.querySelector('NoteId');
    return noteIdNode?.textContent?.trim() || '';
  }

  // ==================== MEDICATIONS ====================

  /**
   * Get medications for a patient
   */
  async getMedications(patientId: string): Promise<TebraMedication[]> {
    const soapBody = `
    <GetMedications xmlns="http://www.kareo.com/api/schemas/">
      <request>
        ${this.createRequestHeader()}
        <Fields>
          <MedicationId>true</MedicationId>
          <PatientId>true</PatientId>
          <Name>true</Name>
          <GenericName>true</GenericName>
          <Dosage>true</Dosage>
          <Frequency>true</Frequency>
          <Route>true</Route>
          <StartDate>true</StartDate>
          <EndDate>true</EndDate>
          <Status>true</Status>
          <PrescriberProviderId>true</PrescriberProviderId>
          <Instructions>true</Instructions>
          <RefillsRemaining>true</RefillsRemaining>
        </Fields>
        <Filter>
          <PatientId>${patientId}</PatientId>
        </Filter>
      </request>
    </GetMedications>`;

    const action = 'http://www.kareo.com/api/schemas/KareoServices/GetMedications';
    const response = await this.makeSOAPRequest(action, soapBody);
    
    return this.parseMedicationsResponse(response);
  }

  private parseMedicationsResponse(doc: Document): TebraMedication[] {
    const medications: TebraMedication[] = [];
    const medNodes = doc.querySelectorAll('MedicationData');

    medNodes.forEach(node => {
      medications.push({
        MedicationId: this.getNodeValue(node, 'MedicationId'),
        PatientId: this.getNodeValue(node, 'PatientId'),
        Name: this.getNodeValue(node, 'Name'),
        GenericName: this.getNodeValue(node, 'GenericName'),
        Dosage: this.getNodeValue(node, 'Dosage'),
        Frequency: this.getNodeValue(node, 'Frequency'),
        Route: this.getNodeValue(node, 'Route'),
        StartDate: this.getNodeValue(node, 'StartDate'),
        EndDate: this.getNodeValue(node, 'EndDate'),
        Status: this.getNodeValue(node, 'Status'),
        PrescriberProviderId: this.getNodeValue(node, 'PrescriberProviderId'),
        Instructions: this.getNodeValue(node, 'Instructions'),
        RefillsRemaining: parseInt(this.getNodeValue(node, 'RefillsRemaining')) || 0,
      });
    });

    return medications;
  }

  /**
   * Create medication order in Tebra
   */
  async createMedicationOrder(medication: Partial<TebraMedication>): Promise<string> {
    const soapBody = `
    <CreateMedicationOrder xmlns="http://www.kareo.com/api/schemas/">
      <request>
        ${this.createRequestHeader()}
        <MedicationData>
          <PatientId>${medication.PatientId}</PatientId>
          <Name>${medication.Name}</Name>
          <Dosage>${medication.Dosage}</Dosage>
          <Frequency>${medication.Frequency}</Frequency>
          <Route>${medication.Route}</Route>
          <StartDate>${medication.StartDate}</StartDate>
          ${medication.EndDate ? `<EndDate>${medication.EndDate}</EndDate>` : ''}
          <PrescriberProviderId>${medication.PrescriberProviderId}</PrescriberProviderId>
          ${medication.Instructions ? `<Instructions><![CDATA[${medication.Instructions}]]></Instructions>` : ''}
          ${medication.RefillsRemaining ? `<RefillsRemaining>${medication.RefillsRemaining}</RefillsRemaining>` : ''}
        </MedicationData>
      </request>
    </CreateMedicationOrder>`;

    const action = 'http://www.kareo.com/api/schemas/KareoServices/CreateMedicationOrder';
    const response = await this.makeSOAPRequest(action, soapBody);
    
    const medIdNode = response.querySelector('MedicationId');
    return medIdNode?.textContent?.trim() || '';
  }

  // ==================== ORDERS ====================

  /**
   * Get orders for a patient
   */
  async getOrders(patientId: string, fromDate?: Date, toDate?: Date): Promise<TebraOrder[]> {
    const fromDateStr = fromDate?.toISOString().split('T')[0] || '';
    const toDateStr = toDate?.toISOString().split('T')[0] || '';

    const soapBody = `
    <GetOrders xmlns="http://www.kareo.com/api/schemas/">
      <request>
        ${this.createRequestHeader()}
        <Fields>
          <OrderId>true</OrderId>
          <PatientId>true</PatientId>
          <EncounterId>true</EncounterId>
          <OrderType>true</OrderType>
          <Description>true</Description>
          <CPTCode>true</CPTCode>
          <ICD10Codes>true</ICD10Codes>
          <Status>true</Status>
          <OrderedBy>true</OrderedBy>
          <OrderedDate>true</OrderedDate>
          <Instructions>true</Instructions>
          <Priority>true</Priority>
        </Fields>
        <Filter>
          <PatientId>${patientId}</PatientId>
          ${fromDateStr ? `<FromOrderedDate>${fromDateStr}</FromOrderedDate>` : ''}
          ${toDateStr ? `<ToOrderedDate>${toDateStr}</ToOrderedDate>` : ''}
        </Filter>
      </request>
    </GetOrders>`;

    const action = 'http://www.kareo.com/api/schemas/KareoServices/GetOrders';
    const response = await this.makeSOAPRequest(action, soapBody);
    
    return this.parseOrdersResponse(response);
  }

  private parseOrdersResponse(doc: Document): TebraOrder[] {
    const orders: TebraOrder[] = [];
    const orderNodes = doc.querySelectorAll('OrderData');

    orderNodes.forEach(node => {
      const icd10Codes = this.getNodeValue(node, 'ICD10Codes').split(',').filter(code => code.trim());
      
      orders.push({
        OrderId: this.getNodeValue(node, 'OrderId'),
        PatientId: this.getNodeValue(node, 'PatientId'),
        EncounterId: this.getNodeValue(node, 'EncounterId'),
        OrderType: this.getNodeValue(node, 'OrderType'),
        Description: this.getNodeValue(node, 'Description'),
        CPTCode: this.getNodeValue(node, 'CPTCode'),
        ICD10Codes: icd10Codes,
        Status: this.getNodeValue(node, 'Status'),
        OrderedBy: this.getNodeValue(node, 'OrderedBy'),
        OrderedDate: this.getNodeValue(node, 'OrderedDate'),
        Instructions: this.getNodeValue(node, 'Instructions'),
        Priority: this.getNodeValue(node, 'Priority'),
      });
    });

    return orders;
  }

  /**
   * Create order in Tebra
   */
  async createOrder(order: Partial<TebraOrder>): Promise<string> {
    const soapBody = `
    <CreateOrder xmlns="http://www.kareo.com/api/schemas/">
      <request>
        ${this.createRequestHeader()}
        <OrderData>
          <PatientId>${order.PatientId}</PatientId>
          ${order.EncounterId ? `<EncounterId>${order.EncounterId}</EncounterId>` : ''}
          <OrderType>${order.OrderType}</OrderType>
          <Description><![CDATA[${order.Description}]]></Description>
          ${order.CPTCode ? `<CPTCode>${order.CPTCode}</CPTCode>` : ''}
          ${order.ICD10Codes && order.ICD10Codes.length > 0 ? `<ICD10Codes>${order.ICD10Codes.join(',')}</ICD10Codes>` : ''}
          <OrderedBy>${order.OrderedBy}</OrderedBy>
          <OrderedDate>${order.OrderedDate}</OrderedDate>
          ${order.Instructions ? `<Instructions><![CDATA[${order.Instructions}]]></Instructions>` : ''}
          <Priority>${order.Priority || 'Routine'}</Priority>
        </OrderData>
      </request>
    </CreateOrder>`;

    const action = 'http://www.kareo.com/api/schemas/KareoServices/CreateOrder';
    const response = await this.makeSOAPRequest(action, soapBody);
    
    const orderIdNode = response.querySelector('OrderId');
    return orderIdNode?.textContent?.trim() || '';
  }

  // ==================== ENCOUNTER MANAGEMENT ====================

  /**
   * Create encounter in Tebra
   */
  async createEncounter(encounter: {
    PatientId: string;
    ProviderId: string;
    Date: string;
    Type: string;
    ChiefComplaint?: string;
  }): Promise<string> {
    const soapBody = `
    <CreateEncounter xmlns="http://www.kareo.com/api/schemas/">
      <request>
        ${this.createRequestHeader()}
        <EncounterData>
          <PatientId>${encounter.PatientId}</PatientId>
          <ProviderId>${encounter.ProviderId}</ProviderId>
          <Date>${encounter.Date}</Date>
          <Type>${encounter.Type}</Type>
          ${encounter.ChiefComplaint ? `<ChiefComplaint><![CDATA[${encounter.ChiefComplaint}]]></ChiefComplaint>` : ''}
        </EncounterData>
      </request>
    </CreateEncounter>`;

    const action = 'http://www.kareo.com/api/schemas/KareoServices/CreateEncounter';
    const response = await this.makeSOAPRequest(action, soapBody);
    
    const encounterIdNode = response.querySelector('EncounterId');
    return encounterIdNode?.textContent?.trim() || '';
  }

  /**
   * Update encounter status
   */
  async updateEncounterStatus(encounterId: string, status: string): Promise<boolean> {
    const soapBody = `
    <UpdateEncounter xmlns="http://www.kareo.com/api/schemas/">
      <request>
        ${this.createRequestHeader()}
        <EncounterData>
          <EncounterId>${encounterId}</EncounterId>
          <Status>${status}</Status>
        </EncounterData>
      </request>
    </UpdateEncounter>`;

    const action = 'http://www.kareo.com/api/schemas/KareoServices/UpdateEncounter';
    
    try {
      await this.makeSOAPRequest(action, soapBody);
      return true;
    } catch (error) {
      console.error('Failed to update encounter status:', error);
      return false;
    }
  }
}