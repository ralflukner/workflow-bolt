import { render, screen } from '@testing-library/react';
import MetricsPanel from '../MetricsPanel';
import { TestProviders } from '../../test/testHelpers';
import { Metrics } from '../../types';

describe('MetricsPanel', () => {
  const mockMetrics: Metrics = {
    totalPatients: 10,
    patientsByStatus: {
      scheduled: 3,
      arrived: 2,
      'appt-prep': 1,
      'ready-for-md': 1,
      'With Doctor': 1,
      'seen-by-md': 1,
      completed: 1,
      Cancelled: 0,
      'No Show': 0,
      Rescheduled: 0
    },
    averageWaitTime: 15,
    patientsSeenToday: 5
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

    expect(screen.getByText('Total Patients')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('Waiting Patients')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument(); // arrived(2) + appt-prep(1) + ready-for-md(1)
    expect(screen.getByText('Avg. Wait Time')).toBeInTheDocument();
    expect(screen.getByText('15 min')).toBeInTheDocument();
    expect(screen.getByText('Patients Seen Today')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('handles zero values correctly', () => {
    const emptyMetrics: Metrics = {
      totalPatients: 0,
      patientsByStatus: {
        scheduled: 0,
        arrived: 0,
        'appt-prep': 0,
        'ready-for-md': 0,
        'With Doctor': 0,
        'seen-by-md': 0,
        completed: 0,
        Cancelled: 0,
        'No Show': 0,
        Rescheduled: 0
      },
      averageWaitTime: 0,
      patientsSeenToday: 0
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

    expect(screen.getByText('Total Patients')).toBeInTheDocument();
    expect(screen.getAllByText('0')[0]).toBeInTheDocument();
    expect(screen.getByText('Waiting Patients')).toBeInTheDocument();
    expect(screen.getAllByText('0')[1]).toBeInTheDocument();
    expect(screen.getByText('Avg. Wait Time')).toBeInTheDocument();
    expect(screen.getAllByText('0 min')[0]).toBeInTheDocument();
    expect(screen.getByText('Patients Seen Today')).toBeInTheDocument();
    expect(screen.getAllByText('0')[2]).toBeInTheDocument();
  });
});
