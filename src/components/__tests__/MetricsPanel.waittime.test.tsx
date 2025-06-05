import React from 'react';
import { render, screen } from '@testing-library/react';
import MetricsPanel from '../MetricsPanel';
import { PatientContext } from '../../context/PatientContextDef';
import { Metrics } from '../../types';

// Mock the usePatientContext hook
jest.mock('../../hooks/usePatientContext', () => ({
  usePatientContext: () => ({
    getMetrics: jest.fn(() => mockMetrics)
  })
}));

// Default mock metrics
let mockMetrics: Metrics = {
  totalAppointments: 10,
  waitingCount: 4,
  averageWaitTime: 12,
  maxWaitTime: 20
};

describe('MetricsPanel Wait Time Display', () => {
  beforeEach(() => {
    // Reset metrics to default values before each test
    mockMetrics = {
      totalAppointments: 10,
      waitingCount: 4,
      averageWaitTime: 12,
      maxWaitTime: 20
    };
  });

  test('renders max wait time correctly', () => {
    render(<MetricsPanel />);
    
    // Check that the max wait time is displayed
    expect(screen.getByText('Max Wait Time')).toBeInTheDocument();
    expect(screen.getByText('20 min')).toBeInTheDocument();
  });

  test('applies red color styling when max wait time exceeds 15 minutes', () => {
    // With default mockMetrics where maxWaitTime = 20 (> 15)
    render(<MetricsPanel />);
    
    // Find the element containing the max wait time (should be red)
    const waitTimeElement = screen.getByText('20 min');
    expect(waitTimeElement).toHaveClass('text-red-400');
    expect(waitTimeElement).not.toHaveClass('text-white');
  });

  test('applies normal styling when max wait time is below threshold', () => {
    // Set max wait time to 10 (< 15)
    mockMetrics = {
      ...mockMetrics,
      maxWaitTime: 10
    };
    
    render(<MetricsPanel />);
    
    // Find the element containing the max wait time (should be white)
    const waitTimeElement = screen.getByText('10 min');
    expect(waitTimeElement).toHaveClass('text-white');
    expect(waitTimeElement).not.toHaveClass('text-red-400');
  });

  test('updates when max wait time changes', () => {
    const { rerender } = render(<MetricsPanel />);
    
    // Initial rendering should show max wait time of 20
    expect(screen.getByText('20 min')).toBeInTheDocument();
    
    // Update the metrics
    mockMetrics = {
      ...mockMetrics,
      maxWaitTime: 30
    };
    
    // Force rerender
    rerender(<MetricsPanel />);
    
    // Should now show updated max wait time
    expect(screen.getByText('30 min')).toBeInTheDocument();
    expect(screen.queryByText('20 min')).not.toBeInTheDocument();
  });
  
  test('handles zero wait time', () => {
    mockMetrics = {
      ...mockMetrics,
      maxWaitTime: 0
    };
    
    render(<MetricsPanel />);
    expect(screen.getByText('0 min')).toBeInTheDocument();
    
    // Should have white text because wait time is below threshold
    const waitTimeElement = screen.getByText('0 min');
    expect(waitTimeElement).toHaveClass('text-white');
  });
});
