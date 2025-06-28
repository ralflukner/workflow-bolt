// Minimal browser stub for @google-cloud/secret-manager so Vite can bundle the frontend without pulling in Node-only dependencies.
// Any attempt to use this client in the browser will throw – we expect code paths to guard against that (`typeof window === 'undefined'`).

export class SecretManagerServiceClient {
  constructor() {
    if (typeof window !== 'undefined') {
      console.warn('SecretManagerServiceClient stub used in browser – secret retrieval disabled.');
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async accessSecretVersion(_req: unknown): Promise<never> {
    throw new Error('SecretManagerServiceClient is not available in the browser environment.');
  }
} 