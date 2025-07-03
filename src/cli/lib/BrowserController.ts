/**
 * Browser Controller - Dashboard verification and automation
 * Handles browser-based testing and screenshot capture
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import {
  BrowserController as IBrowserController,
  BrowserConfig,
  ImportResult,
  DashboardState,
  ScreenshotOptions,
  ImportMode,
  PatientSummary,
  UIElementState
} from '../../types/cli.js';

export class BrowserController implements IBrowserController {
  private browser?: Browser;
  private page?: Page;
  private config?: BrowserConfig;

  /**
   * Launch browser instance
   */
  async launch(config: BrowserConfig): Promise<void> {
    this.config = config;

    console.log('Launching browser for Dashboard verification...');

    this.browser = await puppeteer.launch({
      headless: config.headless,
      devtools: config.devtools,
      slowMo: config.slowMo,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        `--window-size=${config.viewport.width},${config.viewport.height}`,
      ],
      defaultViewport: config.viewport
    });

    this.page = await this.browser.newPage();
    
    // Set timeout
    this.page.setDefaultTimeout(config.timeout);
    
    // Set viewport
    await this.page.setViewport(config.viewport);

    console.log('Browser launched successfully');
  }

  /**
   * Navigate to the application
   */
  async navigateToApp(url: string = 'http://localhost:5173'): Promise<void> {
    if (!this.page) {
      throw new Error('Browser not launched. Call launch() first.');
    }

    console.log(`Navigating to application: ${url}`);

    try {
      await this.page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: this.config?.timeout || 30000
      });

      // Wait for the app to be ready
      await this.page.waitForSelector('[data-testid="app-container"], .App, #root', {
        timeout: 10000
      });

      console.log('Successfully navigated to application');
    } catch (error) {
      throw new Error(`Failed to navigate to application: ${error}`);
    }
  }

  /**
   * Simulate schedule import in the browser
   */
  async importSchedule(file: string, mode: ImportMode): Promise<ImportResult> {
    if (!this.page) {
      throw new Error('Browser not launched. Call launch() first.');
    }

    console.log(`Importing schedule with mode: ${mode}`);

    const startTime = Date.now();
    const logs: string[] = [];
    const errors: string[] = [];

    try {
      // Look for import button or trigger
      await this.page.waitForSelector('[data-testid="import-button"], button:contains("Import")', {
        timeout: 5000
      });

      // Click import button
      await this.page.click('[data-testid="import-button"], button:contains("Import")');

      // Wait for import modal/dialog
      await this.page.waitForSelector('[data-testid="import-modal"], .import-dialog', {
        timeout: 5000
      });

      // Select import mode if available
      const modeSelector = `[data-testid="${mode}-mode"], button:contains("${mode}")`;
      try {
        await this.page.waitForSelector(modeSelector, { timeout: 2000 });
        await this.page.click(modeSelector);
        logs.push(`Selected import mode: ${mode}`);
      } catch {
        logs.push(`Import mode selector not found, using default`);
      }

      // Handle file upload or paste test data
      if (file === 'built-in-fixture') {
        // Use built-in test data
        const testData = this.getBuiltInTestData();
        
        const textareaSelector = '[data-testid="schedule-input"], textarea';
        await this.page.waitForSelector(textareaSelector, { timeout: 5000 });
        await this.page.click(textareaSelector);
        await this.page.keyboard.down('Control');
        await this.page.keyboard.press('KeyA');
        await this.page.keyboard.up('Control');
        await this.page.keyboard.type(testData);
        logs.push('Pasted built-in test data');
      }

      // Click import/submit button
      await this.page.click('[data-testid="import-submit"], button:contains("Import")');
      logs.push('Submitted import request');

      // Wait for import to complete
      await this.page.waitForFunction(
        () => {
          // Look for success message or patient data
          return document.querySelector('[data-testid="import-success"], .success-message') ||
                 document.querySelector('[data-testid="patient-list"], .patient-item');
        },
        { timeout: 15000 }
      );

      // Count imported patients
      const patientElements = await this.page.$$('[data-testid="patient-item"], .patient-item');
      const patientsImported = patientElements.length;

      logs.push(`Import completed: ${patientsImported} patients imported`);

      const importTime = Date.now() - startTime;

      return {
        success: true,
        patientsImported,
        importTime,
        errors,
        logs
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push(`Import failed: ${errorMessage}`);
      
      return {
        success: false,
        patientsImported: 0,
        importTime: Date.now() - startTime,
        errors,
        logs
      };
    }
  }

  /**
   * Get current Dashboard state
   */
  async getDashboardState(): Promise<DashboardState> {
    if (!this.page) {
      throw new Error('Browser not launched. Call launch() first.');
    }

    console.log('Getting Dashboard state...');

    try {
      // Wait for Dashboard to be loaded
      await this.page.waitForSelector('[data-testid="dashboard"], .dashboard, main', {
        timeout: 10000
      });

      // Extract Dashboard information
      const dashboardInfo = await this.page.evaluate(() => {
        // Get patient information
        const patientElements = Array.from(
          document.querySelectorAll('[data-testid="patient-item"], .patient-item, .patient-card')
        );

        const visiblePatients: PatientSummary[] = patientElements.map((element, index) => {
          const nameElement = element.querySelector('[data-testid="patient-name"], .patient-name, h3, h4');
          const statusElement = element.querySelector('[data-testid="patient-status"], .patient-status, .status');
          const timeElement = element.querySelector('[data-testid="appointment-time"], .appointment-time, .time');
          const providerElement = element.querySelector('[data-testid="provider"], .provider');

          return {
            name: nameElement?.textContent?.trim() || 'Unknown',
            status: statusElement?.textContent?.trim() || 'Unknown',
            appointmentTime: timeElement?.textContent?.trim() || 'Unknown',
            provider: providerElement?.textContent?.trim() || 'Unknown',
            visible: true,
            elementSelector: `patient-item-${index}`
          };
        });

        // Get UI elements
        const uiElements: UIElementState[] = [
          {
            selector: '[data-testid="patient-count"], .patient-count',
            visible: !!document.querySelector('[data-testid="patient-count"], .patient-count'),
            text: document.querySelector('[data-testid="patient-count"], .patient-count')?.textContent?.trim()
          },
          {
            selector: '[data-testid="provider-info"], .provider-info',
            visible: !!document.querySelector('[data-testid="provider-info"], .provider-info'),
            text: document.querySelector('[data-testid="provider-info"], .provider-info')?.textContent?.trim()
          },
          {
            selector: '[data-testid="schedule-date"], .schedule-date',
            visible: !!document.querySelector('[data-testid="schedule-date"], .schedule-date'),
            text: document.querySelector('[data-testid="schedule-date"], .schedule-date')?.textContent?.trim()
          }
        ];

        // Get basic state info
        const loadingElement = document.querySelector('[data-testid="loading"], .loading, .spinner');
        const errorElement = document.querySelector('[data-testid="error"], .error-message, .alert-error');

        return {
          patientsDisplayed: visiblePatients.length,
          visiblePatients,
          uiElements: uiElements.filter(el => el.visible),
          loadingState: !!loadingElement,
          errorState: errorElement?.textContent?.trim() || undefined,
          currentProvider: 'RALF LUKNER', // Default
          scheduleDate: new Date().toISOString().split('T')[0] // Default to today
        };
      });

      // Add metadata
      const url = this.page.url();
      const viewport = this.page.viewport();

      const dashboardState: DashboardState = {
        ...dashboardInfo,
        metadata: {
          timestamp: new Date().toISOString(),
          url,
          viewportSize: viewport || { width: 1280, height: 720 }
        }
      };

      console.log(`Dashboard state captured: ${dashboardState.patientsDisplayed} patients displayed`);
      return dashboardState;

    } catch (error) {
      throw new Error(`Failed to get Dashboard state: ${error}`);
    }
  }

  /**
   * Take screenshot of current page
   */
  async takeScreenshot(path: string, options: ScreenshotOptions = {}): Promise<string> {
    if (!this.page) {
      throw new Error('Browser not launched. Call launch() first.');
    }

    console.log(`Taking screenshot: ${path}`);

    try {
      // Ensure directory exists
      mkdirSync(dirname(path), { recursive: true });

      // Take screenshot
      await this.page.screenshot({
        path,
        fullPage: options.fullPage !== false,
        quality: options.quality || 90,
        type: options.type || 'png',
        clip: options.clip
      });

      console.log(`Screenshot saved: ${path}`);
      return path;

    } catch (error) {
      throw new Error(`Failed to take screenshot: ${error}`);
    }
  }

  /**
   * Wait for element to appear
   */
  async waitForElement(selector: string, timeout: number = 10000): Promise<void> {
    if (!this.page) {
      throw new Error('Browser not launched. Call launch() first.');
    }

    await this.page.waitForSelector(selector, { timeout });
  }

  /**
   * Click element
   */
  async clickElement(selector: string): Promise<void> {
    if (!this.page) {
      throw new Error('Browser not launched. Call launch() first.');
    }

    await this.page.click(selector);
  }

  /**
   * Type text into element
   */
  async typeText(selector: string, text: string): Promise<void> {
    if (!this.page) {
      throw new Error('Browser not launched. Call launch() first.');
    }

    await this.page.click(selector);
    await this.page.keyboard.down('Control');
    await this.page.keyboard.press('KeyA');
    await this.page.keyboard.up('Control');
    await this.page.keyboard.type(text);
  }

  /**
   * Close browser
   */
  async close(): Promise<void> {
    if (this.browser) {
      console.log('Closing browser...');
      await this.browser.close();
      this.browser = undefined;
      this.page = undefined;
      console.log('Browser closed');
    }
  }

  /**
   * Get built-in test data for imports
   */
  private getBuiltInTestData(): string {
    return `Appointments for Tuesday, July 01, 2025
Test Medical Center
1234 Test Avenue Suite 100, Test City, TX 12345-6789
Resource Time Status Patient Contact Primary Ins. Eligibility Reason Location Notes Balance
DR TEST PROVIDER 9:45 AM Cancelled JANE DOE
01/15/1980
(555) 123-4567
((M))
- - Office Visit Test
Medical
Center
Reason: Office
Visit Comment:
New patient
orientation
Member ID:
TEST-123-
ABC456
$0.00
DR TEST PROVIDER
ROOM 1
10:30
AM
Checked
Out
JOHN SMITH
03/22/1965
(555) 234-5678
((M))
TEST INSURANCE 2025 - Office Visit Test
Medical
Center
lab follow up $0.00
DR TEST PROVIDER
ROOM 2
11:00
AM
Checked
Out
ALICE JOHNSON
07/10/1990
(555) 345-6789
((M))
TEST INSURANCE 2025 - Office Visit Test
Medical
Center
- $50.00
DR TEST PROVIDER 4:30
PM
Scheduled ROBERT BROWN
11/05/1975
(555) 456-7890
((M))
TEST INSURANCE 2025 - Office Visit Test
Medical
Center
- $81.29`;
  }
}