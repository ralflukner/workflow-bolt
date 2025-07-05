/**
 * Linear API Integration for Healthcare Workflows
 * Private, secure project management
 */

interface LinearConfig {
  apiKey: string;
  teamId: string;
}

class LinearService {
  private config: LinearConfig;
  private baseUrl = 'https://api.linear.app/graphql';

  constructor() {
    this.config = {
      apiKey: import.meta.env.VITE_LINEAR_API_KEY || '',
      teamId: import.meta.env.VITE_LINEAR_TEAM_ID || ''
    };
  }

  private async graphqlRequest(query: string, variables: any = {}): Promise<any> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': this.config.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables })
    });

    const result = await response.json();
    if (result.errors) {
      throw new Error(`Linear API error: ${result.errors[0].message}`);
    }
    return result.data;
  }

  async createPatientIssue(patientName: string, appointmentTime: string): Promise<any> {
    const mutation = `
      mutation CreateIssue($teamId: String!, $title: String!, $description: String!) {
        issueCreate(input: {
          teamId: $teamId
          title: $title
          description: $description
        }) {
          success
          issue {
            id
            title
            url
          }
        }
      }
    `;

    return this.graphqlRequest(mutation, {
      teamId: this.config.teamId,
      title: `Patient: ${patientName} - ${appointmentTime}`,
      description: `Workflow tracking for patient ${patientName}`
    });
  }
}

export const linearService = new LinearService();