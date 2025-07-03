/**
 * Import Command Unit Tests
 * Tests for schedule import functionality with various modes and options
 */

import { ImportCommand } from '../../../commands/import';
import { TestOrchestrator } from '../../../lib/TestOrchestrator';
import { ImportMode } from '../../../../types/cli';

// Mock dependencies
jest.mock('../../../lib/TestOrchestrator');
jest.mock('fs');
jest.mock('path');

const mockTestOrchestrator = TestOrchestrator as jest.MockedClass<typeof TestOrchestrator>;

describe('ImportCommand Unit Tests', () => {
  let command: ImportCommand;
  let mockOrchestrator: jest.Mocked<TestOrchestrator>;

  beforeEach(() => {
    command = new ImportCommand([], {} as any);
    mockOrchestrator = {
      runImportTest: jest.fn(),
      generateReport: jest.fn(),
      validateTestConfig: jest.fn(),
    } as any;
    mockTestOrchestrator.mockImplementation(() => mockOrchestrator);
    jest.clearAllMocks();
  });

  describe('Flag Validation', () => {
    it('should validate required file parameter', async () => {
      // Test that file parameter is required
      const flags = {};
      
      await expect(command.validateFlags(flags as any)).rejects.toThrow('File path is required');
    });

    it('should validate import mode options', async () => {
      const validModes: ImportMode[] = ['megaparse', 'secure', 'legacy'];
      
      for (const mode of validModes) {
        const flags = { file: 'test.csv', mode };
        await expect(command.validateFlags(flags as any)).resolves.not.toThrow();
      }
    });

    it('should reject invalid import modes', async () => {
      const flags = { file: 'test.csv', mode: 'invalid' as ImportMode };
      
      await expect(command.validateFlags(flags as any)).rejects.toThrow('Invalid import mode');
    });

    it('should validate expected patients parameter', async () => {
      const flags = { file: 'test.csv', expectedPatients: -1 };
      
      await expect(command.validateFlags(flags as any)).rejects.toThrow('Expected patients must be positive');
    });
  });

  describe('File Validation', () => {
    it('should check if file exists', async () => {
      const fs = require('fs');
      fs.existsSync.mockReturnValue(false);
      
      const flags = { file: 'nonexistent.csv' };
      
      await expect(command.validateFile(flags.file)).rejects.toThrow('File not found');
    });

    it('should validate file extensions', async () => {
      const fs = require('fs');
      fs.existsSync.mockReturnValue(true);
      
      const validExtensions = ['.csv', '.xlsx', '.json'];
      
      for (const ext of validExtensions) {
        await expect(command.validateFile(`test${ext}`)).resolves.not.toThrow();
      }
    });

    it('should reject invalid file extensions', async () => {
      const fs = require('fs');
      fs.existsSync.mockReturnValue(true);
      
      await expect(command.validateFile('test.txt')).rejects.toThrow('Unsupported file format');
    });
  });

  describe('Test Configuration Creation', () => {
    it('should create test config with default values', () => {
      const flags = { file: 'test.csv' };
      
      const config = command.createTestConfig(flags as any);
      
      expect(config).toMatchObject({
        mode: 'megaparse',
        format: 'auto',
        expectedPatients: 10,
        timeout: 60000,
        verifyDashboard: true,
        outputDir: expect.stringContaining('output')
      });
    });

    it('should create test config with custom values', () => {
      const flags = {
        file: 'test.csv',
        mode: 'secure' as ImportMode,
        format: 'lukner',
        expectedPatients: 25,
        timeout: 120000,
        'no-verify': true,
        outputDir: './custom-output'
      };
      
      const config = command.createTestConfig(flags as any);
      
      expect(config).toMatchObject({
        mode: 'secure',
        format: 'lukner',
        expectedPatients: 25,
        timeout: 120000,
        verifyDashboard: false,
        outputDir: './custom-output'
      });
    });

    it('should auto-detect format from filename', () => {
      const testCases = [
        { file: 'lukner_schedule.csv', expectedFormat: 'lukner' },
        { file: 'tebra_export.xlsx', expectedFormat: 'tebra' },
        { file: 'generic_file.csv', expectedFormat: 'auto' }
      ];
      
      testCases.forEach(({ file, expectedFormat }) => {
        const flags = { file };
        const config = command.createTestConfig(flags as any);
        expect(config.format).toBe(expectedFormat);
      });
    });
  });

  describe('Test Execution', () => {
    it('should execute import test successfully', async () => {
      const expectedResult = {
        success: true,
        testName: 'Import Test',
        mode: 'megaparse' as ImportMode,
        importTime: 2500,
        patientsImported: 15,
        patientsExpected: 15,
        dashboardVerified: true,
        errors: [],
        warnings: [],
        logs: ['Import completed successfully'],
        timestamp: new Date().toISOString(),
        metadata: {
          format: 'lukner',
          browserUsed: true,
          performanceMetrics: {
            importStartTime: Date.now() - 2500,
            importEndTime: Date.now(),
            importDuration: 2500
          }
        }
      };

      mockOrchestrator.runImportTest.mockResolvedValue(expectedResult);
      
      const flags = { file: 'test.csv' };
      const result = await command.executeImportTest(flags as any);
      
      expect(result).toEqual(expectedResult);
      expect(mockOrchestrator.runImportTest).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'megaparse',
          format: 'auto',
          expectedPatients: 10
        })
      );
    });

    it('should handle import test failures', async () => {
      const expectedResult = {
        success: false,
        testName: 'Import Test',
        mode: 'megaparse' as ImportMode,
        importTime: 0,
        patientsImported: 0,
        patientsExpected: 15,
        dashboardVerified: false,
        errors: ['Failed to parse CSV file'],
        warnings: ['File format may be incorrect'],
        logs: ['Import failed during parsing'],
        timestamp: new Date().toISOString(),
        metadata: {
          format: 'auto',
          browserUsed: false,
          performanceMetrics: {
            importStartTime: Date.now(),
            importEndTime: Date.now(),
            importDuration: 0
          }
        }
      };

      mockOrchestrator.runImportTest.mockResolvedValue(expectedResult);
      
      const flags = { file: 'invalid.csv' };
      const result = await command.executeImportTest(flags as any);
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Failed to parse CSV file');
    });

    it('should handle orchestrator exceptions', async () => {
      mockOrchestrator.runImportTest.mockRejectedValue(new Error('Connection timeout'));
      
      const flags = { file: 'test.csv' };
      
      await expect(command.executeImportTest(flags as any)).rejects.toThrow('Connection timeout');
    });
  });

  describe('Screenshot Functionality', () => {
    it('should handle screenshot capture when enabled', async () => {
      const flags = { file: 'test.csv', screenshot: true };
      
      const mockResult = {
        success: true,
        metadata: {
          screenshotPath: '/tmp/screenshot-123.png'
        }
      };
      
      mockOrchestrator.runImportTest.mockResolvedValue(mockResult as any);
      
      const result = await command.executeImportTest(flags as any);
      
      expect(result.metadata.screenshotPath).toBeDefined();
    });

    it('should skip screenshots when disabled', async () => {
      const flags = { file: 'test.csv', screenshot: false };
      
      const config = command.createTestConfig(flags as any);
      
      expect(config.enableScreenshot).toBe(false);
    });
  });

  describe('Performance Metrics', () => {
    it('should track import duration', async () => {
      const startTime = Date.now();
      const mockResult = {
        success: true,
        importTime: 3000,
        metadata: {
          performanceMetrics: {
            importStartTime: startTime,
            importEndTime: startTime + 3000,
            importDuration: 3000
          }
        }
      };
      
      mockOrchestrator.runImportTest.mockResolvedValue(mockResult as any);
      
      const flags = { file: 'test.csv' };
      const result = await command.executeImportTest(flags as any);
      
      expect(result.importTime).toBe(3000);
      expect(result.metadata.performanceMetrics.importDuration).toBe(3000);
    });

    it('should validate performance against thresholds', async () => {
      const slowResult = {
        success: true,
        importTime: 15000, // 15 seconds - should trigger warning
        metadata: {
          performanceMetrics: {
            importDuration: 15000
          }
        }
      };
      
      mockOrchestrator.runImportTest.mockResolvedValue(slowResult as any);
      
      const flags = { file: 'test.csv' };
      const result = await command.executeImportTest(flags as any);
      
      expect(result.importTime).toBeGreaterThan(10000);
      // Implementation should add performance warnings for slow imports
    });
  });

  describe('Format Detection', () => {
    it('should detect Lukner format from filename patterns', () => {
      const luknerFiles = [
        'lukner_schedule_2025.csv',
        'LUKNER_EXPORT.xlsx',
        'schedule_lukner.csv'
      ];
      
      luknerFiles.forEach(file => {
        const flags = { file };
        const config = command.createTestConfig(flags as any);
        expect(config.format).toBe('lukner');
      });
    });

    it('should detect Tebra format from filename patterns', () => {
      const tebraFiles = [
        'tebra_appointments.csv',
        'TEBRA_SCHEDULE.xlsx',
        'appointments_tebra.csv'
      ];
      
      tebraFiles.forEach(file => {
        const flags = { file };
        const config = command.createTestConfig(flags as any);
        expect(config.format).toBe('tebra');
      });
    });

    it('should fallback to auto-detection for unknown patterns', () => {
      const unknownFiles = [
        'schedule.csv',
        'appointments.xlsx',
        'data.csv'
      ];
      
      unknownFiles.forEach(file => {
        const flags = { file };
        const config = command.createTestConfig(flags as any);
        expect(config.format).toBe('auto');
      });
    });
  });
});

// Helper class to access private methods for testing
class TestableImportCommand extends ImportCommand {
  public validateFlags(flags: any) {
    return super.validateFlags(flags);
  }
  
  public validateFile(filePath: string) {
    return super.validateFile(filePath);
  }
  
  public createTestConfig(flags: any) {
    return super.createTestConfig(flags);
  }
  
  public executeImportTest(flags: any) {
    return super.executeImportTest(flags);
  }
}