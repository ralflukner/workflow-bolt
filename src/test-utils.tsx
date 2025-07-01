import React from 'react';
import * as rtl from '@testing-library/react';
import { TestProviders } from './test/testHelpers';

/**
 * Custom render that wraps UI in the same providers used across tests.
 * Falls back to rtl.render for everything else, but ensures
 * consistent React-Query / Patient / Time contexts.
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const render = (ui: React.ReactElement, options?: Parameters<typeof rtl.render>[1]) =>
  rtl.render(<TestProviders>{ui}</TestProviders>, options);

// Re-export everything so tests can still use RTL helpers directly.
export * from '@testing-library/react';
export { render }; 