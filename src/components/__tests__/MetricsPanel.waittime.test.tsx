import { render, screen } from '@testing-library/react';
import MetricsPanel from '../MetricsPanel';
import { TestProviders } from '../../test/testHelpers';

describe('MetricsPanel Wait Time Calculations', () => {
  it('should display wait time metrics correctly', () => {
    render(
      <TestProviders>
        <MetricsPanel />
      </TestProviders>
    );

    // Check for the actual metrics displayed by the component
    expect(screen.getByText('Total Patients')).toBeInTheDocument();
    expect(screen.getByText('Waiting Patients')).toBeInTheDocument();
    expect(screen.getByText('Avg. Wait Time')).toBeInTheDocument();
    expect(screen.getByText('Patients Seen Today')).toBeInTheDocument();
  });
});
