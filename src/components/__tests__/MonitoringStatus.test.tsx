import '@testing-library/jest-dom';

import { describe, it, jest, beforeEach, afterEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import MonitoringStatus from '../MonitoringStatus';

// Mock tebraApi module
jest.mock('../../services/tebraApi', () => ({
  tebraTestConnection: jest.fn(),
}));

// Helper to update performance.now values deterministically
function mockPerformanceNow(sequence: number[]) {
  let call = 0;
  jest
    .spyOn(global.performance, 'now')
    .mockImplementation(() => sequence[Math.min(call++, sequence.length - 1)]);
}

describe('MonitoringStatus component', () => {
  const { tebraTestConnection } = require('../../services/tebraApi');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('displays healthy status after successful connection test', async () => {
    // Arrange mock to resolve success
    (tebraTestConnection as any).mockResolvedValue({ success: true });

    // Simulate a 1-second request duration
    mockPerformanceNow([0, 1000]);

    render(<MonitoringStatus />);

    // Trigger connection test via refresh button
    fireEvent.click(screen.getByLabelText(/Refresh status/i));

    await waitFor(() => {
      expect(screen.getByText(/Tebra Service Online/i)).toBeInTheDocument();
    });

    // Response time should be shown
    expect(screen.getByText(/1000ms/)).toBeInTheDocument();
  });

  it('displays error status when connection test fails', async () => {
    // Arrange mock to reject
    (tebraTestConnection as any).mockRejectedValue(new Error('Network error'));

    // Provide performance.now values
    mockPerformanceNow([0, 800]);

    render(<MonitoringStatus />);

    fireEvent.click(screen.getByLabelText(/Refresh status/i));

    await waitFor(() => {
      expect(screen.getByText(/Tebra Service Offline/i)).toBeInTheDocument();
    });
  });
}); 