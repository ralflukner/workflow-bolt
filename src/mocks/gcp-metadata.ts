export const gcpMetadata = {
  isAvailable: async () => false,
  project: async (id?: string) => {
    throw new Error('GCP metadata is not available in browser environment');
  },
  instance: async (property?: string) => {
    throw new Error('GCP metadata is not available in browser environment');
  }
};

export default gcpMetadata;