import { render, screen } from '@testing-library/react';
import MetricsPanel from '../MetricsPanel';
import { TestProviders } from '../../test/testHelpers';
import { Metrics } from '../../types';

describe('MetricsPanel', () => {
  const mockMetrics: Metrics = {
    totalAppointments: 10,
    waitingCount: 3,
    averageWaitTime: 15,
    maxWaitTime: 30
  };

  it('renders metrics correctly', () => {
    render(
      <TestProviders
        patientContextOverrides={{
          getMetrics: jest.fn(() => mockMetrics)
        }}
      >
        <MetricsPanel />
      </TestProviders>
    );

    expect(screen.getByText('Total Appointments')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('Patients Waiting')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Avg. Wait Time')).toBeInTheDocument();
    expect(screen.getByText('15 min')).toBeInTheDocument();
    expect(screen.getByText('Max Wait Time')).toBeInTheDocument();
    expect(screen.getByText('30 min')).toBeInTheDocument();
  });

  it('handles zero values correctly', () => {
    const emptyMetrics: Metrics = {
      totalAppointments: 0,
      waitingCount: 0,
      averageWaitTime: 0,
      maxWaitTime: 0
    };

    render(
      <TestProviders
        patientContextOverrides={{
          getMetrics: jest.fn(() => emptyMetrics)
        }}
      >
        <MetricsPanel />
      </TestProviders>
    );

    expect(screen.getByText('Total Appointments')).toBeInTheDocument();
    expect(screen.getAllByText('0')[0]).toBeInTheDocument();
    expect(screen.getByText('Patients Waiting')).toBeInTheDocument();
    expect(screen.getAllByText('0')[1]).toBeInTheDocument();
    expect(screen.getByText('Avg. Wait Time')).toBeInTheDocument();
    expect(screen.getAllByText('0 min')[0]).toBeInTheDocument();
    expect(screen.getByText('Max Wait Time')).toBeInTheDocument();
    expect(screen.getAllByText('0 min')[1]).toBeInTheDocument();
  });
});
