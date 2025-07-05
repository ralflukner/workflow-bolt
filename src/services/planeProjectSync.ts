/**
 * Plane.so API Integration for Workflow-Bolt
 * Secure, self-hosted project management
 */

interface PlaneConfig {
  baseUrl: string;
  apiKey: string;
  workspaceSlug: string;
  projectId: string;
}

class PlaneProjectService {
  private config: PlaneConfig;

  constructor() {
    this.config = {
      baseUrl: import.meta.env.VITE_PLANE_URL || 'http://localhost:8000',
      apiKey: import.meta.env.VITE_PLANE_API_KEY || '',
      workspaceSlug: 'lukner-clinic',
      projectId: 'patient-workflows'
    };
  }

  private async apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.config.baseUrl}/api/v1${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      throw new Error(`Plane API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Create patient workflow issue
   */
  async createPatientWorkflow(
    patientName: string,
    appointmentTime: string,
    status: string,
    priority: 'urgent' | 'high' | 'medium' | 'low' = 'medium'
  ): Promise<any> {
    const issue = {
      name: `Patient: ${patientName} - ${appointmentTime}`,
      description: `
## Patient Workflow

**Patient**: ${patientName}  
**Appointment**: ${appointmentTime}  
**Current Status**: ${status}

## Workflow Steps
- [ ] Patient check-in
- [ ] Pre-appointment preparation  
- [ ] Doctor consultation
- [ ] Post-appointment tasks
- [ ] Patient check-out

*Created by Workflow-Bolt*
      `.trim(),
      project: this.config.projectId,
      priority,
      labels: [`patient-${patientName.toLowerCase().replace(' ', '-')}`, `status-${status}`]
    };

    return this.apiRequest(
      `/workspaces/${this.config.workspaceSlug}/projects/${this.config.projectId}/issues/`,
      {
        method: 'POST',
        body: JSON.stringify(issue)
      }
    );
  }

  /**
   * Update patient status
   */
  async updatePatientStatus(issueId: string, newStatus: string): Promise<any> {
    return this.apiRequest(
      `/workspaces/${this.config.workspaceSlug}/projects/${this.config.projectId}/issues/${issueId}/`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          labels: [`status-${newStatus}`]
        })
      }
    );
  }

  /**
   * Get all patient workflow issues
   */
  async getPatientWorkflows(): Promise<any[]> {
    return this.apiRequest(
      `/workspaces/${this.config.workspaceSlug}/projects/${this.config.projectId}/issues/`
    );
  }

  /**
   * Test connection to Plane.so
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      await this.apiRequest(`/workspaces/${this.config.workspaceSlug}/`);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}

export const planeProject = new PlaneProjectService();
export default planeProject;