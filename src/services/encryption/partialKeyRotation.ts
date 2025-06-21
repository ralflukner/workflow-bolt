/**
 * Partial Key Rotation Service
 * Efficiently rotate encryption keys for segments of data without re-encrypting everything
 */

import CryptoJS from 'crypto-js';
import { enhancedEncryptionService } from './enhancedPatientEncryptionService';

export interface SegmentedEncryptedData {
  segments: EncryptedSegment[];
  metadata: SegmentMetadata;
}

export interface EncryptedSegment {
  id: string;
  data: string;
  keyVersion: string;
  segmentIndex: number;
  encryptedAt: string;
  lastRotated?: string;
  dataHash: string; // Hash of original data for integrity
}

export interface SegmentMetadata {
  totalSegments: number;
  createdAt: string;
  lastPartialRotation?: string;
  rotationSchedule?: RotationSchedule;
  dataStructure: 'patient' | 'appointment' | 'session' | 'custom';
}

export interface RotationSchedule {
  segmentRotationPattern: 'sequential' | 'random' | 'priority-based';
  segmentsPerRotation: number;
  rotationIntervalHours: number;
  priorityFields?: string[]; // Fields that should be rotated more frequently
}

export interface PartialRotationResult {
  rotatedSegments: string[];
  totalSegments: number;
  rotationTime: number;
  newKeyVersion: string;
}

class PartialKeyRotationService {
  private static instance: PartialKeyRotationService;
  
  // Default rotation strategies for different data types
  private rotationStrategies: Map<string, RotationSchedule> = new Map([
    ['patient', {
      segmentRotationPattern: 'priority-based',
      segmentsPerRotation: 3,
      rotationIntervalHours: 24,
      priorityFields: ['ssn', 'medicalHistory', 'insurance']
    }],
    ['appointment', {
      segmentRotationPattern: 'sequential',
      segmentsPerRotation: 5,
      rotationIntervalHours: 48
    }],
    ['session', {
      segmentRotationPattern: 'random',
      segmentsPerRotation: 10,
      rotationIntervalHours: 72
    }]
  ]);

  private constructor() {}

  public static getInstance(): PartialKeyRotationService {
    if (!PartialKeyRotationService.instance) {
      PartialKeyRotationService.instance = new PartialKeyRotationService();
    }
    return PartialKeyRotationService.instance;
  }

  /**
   * Encrypt data with segmentation for efficient partial rotation
   */
  public async encryptWithSegmentation(
    data: any,
    dataStructure: 'patient' | 'appointment' | 'session' | 'custom' = 'custom',
    customStrategy?: RotationSchedule
  ): Promise<SegmentedEncryptedData> {
    const segments = this.segmentData(data, dataStructure);
    const encryptedSegments: EncryptedSegment[] = [];
    // const currentKey = await enhancedEncryptionService.getCurrentKey(); // Not used

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const encryptedData = await enhancedEncryptionService.encrypt(segment.data);
      
      encryptedSegments.push({
        id: segment.id,
        data: encryptedData.data,
        keyVersion: encryptedData.keyVersion,
        segmentIndex: i,
        encryptedAt: encryptedData.encryptedAt,
        dataHash: this.hashData(segment.data)
      });
    }

    const strategy = customStrategy || this.rotationStrategies.get(dataStructure);
    
    return {
      segments: encryptedSegments,
      metadata: {
        totalSegments: segments.length,
        createdAt: new Date().toISOString(),
        rotationSchedule: strategy,
        dataStructure
      }
    };
  }

  /**
   * Perform partial key rotation on segmented data
   */
  public async performPartialRotation(
    encryptedData: SegmentedEncryptedData,
    options?: {
      forceSegments?: string[]; // Specific segment IDs to rotate
      maxSegments?: number; // Override default segments per rotation
    }
  ): Promise<PartialRotationResult> {
    const startTime = Date.now();
    const currentKey = await enhancedEncryptionService.getCurrentKey();
    // const schedule = encryptedData.metadata.rotationSchedule; // Not used
    
    // Determine which segments to rotate
    const segmentsToRotate = await this.selectSegmentsForRotation(
      encryptedData,
      options?.forceSegments,
      options?.maxSegments
    );

    const rotatedSegmentIds: string[] = [];

    // Rotate selected segments
    for (const segmentId of segmentsToRotate) {
      const segment = encryptedData.segments.find(s => s.id === segmentId);
      if (!segment) continue;

      // Skip if already using current key
      if (segment.keyVersion === currentKey.version) {
        continue;
      }

      try {
        // Decrypt with old key
        const decrypted = await enhancedEncryptionService.decrypt({
          data: segment.data,
          keyVersion: segment.keyVersion,
          encryptedAt: segment.encryptedAt,
          algorithm: 'AES'
        });

        // Re-encrypt with new key
        const reencrypted = await enhancedEncryptionService.encrypt(decrypted);

        // Update segment
        segment.data = reencrypted.data;
        segment.keyVersion = reencrypted.keyVersion;
        segment.lastRotated = new Date().toISOString();

        rotatedSegmentIds.push(segmentId);
      } catch (error) {
        console.error(`Failed to rotate segment ${segmentId}:`, error);
      }
    }

    // Update metadata
    encryptedData.metadata.lastPartialRotation = new Date().toISOString();

    return {
      rotatedSegments: rotatedSegmentIds,
      totalSegments: encryptedData.segments.length,
      rotationTime: Date.now() - startTime,
      newKeyVersion: currentKey.version
    };
  }

  /**
   * Select segments for rotation based on strategy
   */
  private async selectSegmentsForRotation(
    encryptedData: SegmentedEncryptedData,
    forceSegments?: string[],
    maxSegments?: number
  ): Promise<string[]> {
    if (forceSegments && forceSegments.length > 0) {
      return forceSegments;
    }

    const schedule = encryptedData.metadata.rotationSchedule;
    if (!schedule) {
      // Default: rotate oldest segments
      return this.selectOldestSegments(encryptedData, maxSegments || 5);
    }

    const segmentsPerRotation = maxSegments || schedule.segmentsPerRotation;

    switch (schedule.segmentRotationPattern) {
      case 'sequential':
        return this.selectSequentialSegments(encryptedData, segmentsPerRotation);
      
      case 'random':
        return this.selectRandomSegments(encryptedData, segmentsPerRotation);
      
      case 'priority-based':
        return this.selectPrioritySegments(encryptedData, segmentsPerRotation, schedule.priorityFields);
      
      default:
        return this.selectOldestSegments(encryptedData, segmentsPerRotation);
    }
  }

  /**
   * Select oldest segments for rotation
   */
  private selectOldestSegments(data: SegmentedEncryptedData, count: number): string[] {
    return data.segments
      .sort((a, b) => {
        const aTime = new Date(a.lastRotated || a.encryptedAt).getTime();
        const bTime = new Date(b.lastRotated || b.encryptedAt).getTime();
        return aTime - bTime;
      })
      .slice(0, count)
      .map(s => s.id);
  }

  /**
   * Select sequential segments for rotation
   */
  private selectSequentialSegments(data: SegmentedEncryptedData, count: number): string[] {
    // Find the last rotated segment
    const lastRotatedIndex = data.segments
      .filter(s => s.lastRotated)
      .sort((a, b) => new Date(b.lastRotated!).getTime() - new Date(a.lastRotated!).getTime())
      .map(s => s.segmentIndex)[0] || -1;

    const startIndex = (lastRotatedIndex + 1) % data.segments.length;
    const selected: string[] = [];

    for (let i = 0; i < count && i < data.segments.length; i++) {
      const index = (startIndex + i) % data.segments.length;
      selected.push(data.segments[index].id);
    }

    return selected;
  }

  /**
   * Select random segments for rotation
   */
  private selectRandomSegments(data: SegmentedEncryptedData, count: number): string[] {
    const available = data.segments.filter(s => !s.lastRotated || 
      new Date().getTime() - new Date(s.lastRotated).getTime() > 3600000 // 1 hour
    );

    const selected: string[] = [];
    const indices = new Set<number>();

    while (selected.length < count && selected.length < available.length) {
      const index = Math.floor(Math.random() * available.length);
      if (!indices.has(index)) {
        indices.add(index);
        selected.push(available[index].id);
      }
    }

    return selected;
  }

  /**
   * Select priority segments for rotation
   */
  private selectPrioritySegments(
    data: SegmentedEncryptedData, 
    count: number, 
    priorityFields?: string[]
  ): string[] {
    if (!priorityFields || priorityFields.length === 0) {
      return this.selectOldestSegments(data, count);
    }

    // Prioritize segments containing priority fields
    const prioritySegments = data.segments.filter(s => 
      priorityFields.some(field => s.id.includes(field))
    );

    const regularSegments = data.segments.filter(s => 
      !priorityFields.some(field => s.id.includes(field))
    );

    // Sort by age
    const sortByAge = (a: EncryptedSegment, b: EncryptedSegment) => {
      const aTime = new Date(a.lastRotated || a.encryptedAt).getTime();
      const bTime = new Date(b.lastRotated || b.encryptedAt).getTime();
      return aTime - bTime;
    };

    prioritySegments.sort(sortByAge);
    regularSegments.sort(sortByAge);

    // Take priority segments first, then regular segments
    const selected = [
      ...prioritySegments.slice(0, Math.ceil(count * 0.7)), // 70% priority
      ...regularSegments.slice(0, Math.floor(count * 0.3))  // 30% regular
    ].slice(0, count);

    return selected.map(s => s.id);
  }

  /**
   * Segment data for encryption
   */
  private segmentData(data: any, dataStructure: string): Array<{id: string, data: any}> {
    const segments: Array<{id: string, data: any}> = [];

    if (dataStructure === 'patient' && typeof data === 'object') {
      // Segment patient data by sensitive fields
      const sensitiveFields = ['ssn', 'insurance', 'medicalHistory', 'medications'];
      const regularFields: string[] = [];
      
      for (const [key, value] of Object.entries(data)) {
        if (sensitiveFields.includes(key)) {
          segments.push({ id: `sensitive_${key}`, data: { [key]: value } });
        } else {
          regularFields.push(key);
        }
      }

      // Group regular fields
      if (regularFields.length > 0) {
        const regularData: any = {};
        regularFields.forEach(field => {
          regularData[field] = data[field];
        });
        segments.push({ id: 'regular_fields', data: regularData });
      }
    } else {
      // Default segmentation: split into chunks
      const jsonStr = JSON.stringify(data);
      const chunkSize = 1024; // 1KB chunks
      
      for (let i = 0; i < jsonStr.length; i += chunkSize) {
        segments.push({
          id: `chunk_${i / chunkSize}`,
          data: jsonStr.slice(i, i + chunkSize)
        });
      }
    }

    return segments;
  }

  /**
   * Hash data for integrity verification
   */
  private hashData(data: any): string {
    const jsonStr = JSON.stringify(data);
    return CryptoJS.SHA256(jsonStr).toString();
  }

  /**
   * Decrypt segmented data
   */
  public async decryptSegmented(encryptedData: SegmentedEncryptedData): Promise<any> {
    const decryptedSegments: any[] = [];

    // Sort segments by index
    const sortedSegments = [...encryptedData.segments].sort((a, b) => a.segmentIndex - b.segmentIndex);

    for (const segment of sortedSegments) {
      const decrypted = await enhancedEncryptionService.decrypt({
        data: segment.data,
        keyVersion: segment.keyVersion,
        encryptedAt: segment.encryptedAt,
        algorithm: 'AES'
      });

      decryptedSegments.push(decrypted);
    }

    // Reconstruct based on data structure
    if (encryptedData.metadata.dataStructure === 'patient') {
      // Merge patient data segments
      return decryptedSegments.reduce((acc, segment) => ({ ...acc, ...segment }), {});
    } else {
      // Join string chunks
      return JSON.parse(decryptedSegments.join(''));
    }
  }

  /**
   * Get rotation analytics
   */
  public getRotationAnalytics(encryptedData: SegmentedEncryptedData): {
    segmentsByKeyVersion: Map<string, number>;
    averageSegmentAge: number;
    segmentsNeedingRotation: number;
    rotationCoverage: number;
  } {
    const segmentsByKeyVersion = new Map<string, number>();
    let totalAge = 0;
    let segmentsNeedingRotation = 0;

    const now = Date.now();

    for (const segment of encryptedData.segments) {
      // Count by key version
      const count = segmentsByKeyVersion.get(segment.keyVersion) || 0;
      segmentsByKeyVersion.set(segment.keyVersion, count + 1);

      // Calculate age
      const age = now - new Date(segment.lastRotated || segment.encryptedAt).getTime();
      totalAge += age;

      // Check if needs rotation (older than 7 days)
      if (age > 7 * 24 * 60 * 60 * 1000) {
        segmentsNeedingRotation++;
      }
    }

    const averageSegmentAge = totalAge / encryptedData.segments.length;
    const rotationCoverage = (encryptedData.segments.length - segmentsNeedingRotation) / encryptedData.segments.length;

    return {
      segmentsByKeyVersion,
      averageSegmentAge,
      segmentsNeedingRotation,
      rotationCoverage
    };
  }
}

// Export singleton instance
export const partialKeyRotation = PartialKeyRotationService.getInstance();