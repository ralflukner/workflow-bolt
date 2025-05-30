import { render, screen, fireEvent } from '@testing-library/react';
import TimeControl from '../TimeControl';
import { TestProviders } from '../../test/testHelpers';

describe('TimeControl', () => {
  const mockToggleSimulation = jest.fn();
  const mockAdjustTime = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders in real-time mode correctly', () => {
    render(
      <TestProviders
        timeContextOverrides={{
          timeMode: { simulated: false, currentTime: new Date('2023-01-01T10:00:00.000Z').toISOString() },
          toggleSimulation: mockToggleSimulation,
          adjustTime: mockAdjustTime
        }}
      >
        <TimeControl />
      </TestProviders>
    );

    expect(screen.getByText('Time Control')).toBeInTheDocument();
    expect(screen.getByText('Real-Time Mode')).toBeInTheDocument();
    // Verify time adjustment buttons are not visible in real-time mode
    expect(screen.queryByText('15m', { exact: false })).not.toBeInTheDocument();
  });

  it('renders in simulation mode correctly', () => {
    render(
      <TestProviders
        timeContextOverrides={{
          timeMode: { simulated: true, currentTime: new Date('2023-01-01T10:00:00.000Z').toISOString() },
          toggleSimulation: mockToggleSimulation,
          adjustTime: mockAdjustTime
        }}
      >
        <TimeControl />
      </TestProviders>
    );

    expect(screen.getByText('Simulation Mode')).toBeInTheDocument();
    // Check that time adjustment buttons are visible in simulation mode
    expect(screen.getAllByText('15m', { exact: false })[0]).toBeInTheDocument();
    expect(screen.getAllByText('5m', { exact: false })[0]).toBeInTheDocument();
  });

  it('calls toggleSimulation when checkbox is clicked', () => {
    render(
      <TestProviders
        timeContextOverrides={{
          timeMode: { simulated: false, currentTime: new Date('2023-01-01T10:00:00.000Z').toISOString() },
          toggleSimulation: mockToggleSimulation,
          adjustTime: mockAdjustTime
        }}
      >
        <TimeControl />
      </TestProviders>
    );

    const checkbox = screen.getByLabelText('Real-Time Mode');
    fireEvent.click(checkbox);
    expect(mockToggleSimulation).toHaveBeenCalledTimes(1);
  });

  it('calls adjustTime when time adjustment buttons are clicked', () => {
    render(
      <TestProviders
        timeContextOverrides={{
          timeMode: { simulated: true, currentTime: new Date('2023-01-01T10:00:00.000Z').toISOString() },
          toggleSimulation: mockToggleSimulation,
          adjustTime: mockAdjustTime
        }}
      >
        <TimeControl />
      </TestProviders>
    );

    const buttons = screen.getAllByRole('button');
    const backward15mButton = buttons.find(button => 
      button.textContent?.includes('15m') && button.innerHTML.includes('chevron-left')
    );
    
    if (backward15mButton) {
      fireEvent.click(backward15mButton);
      expect(mockAdjustTime).toHaveBeenCalledWith(-15, undefined);
    }

    const forward5mButton = buttons.find(button => 
      button.textContent?.includes('5m') && button.innerHTML.includes('chevron-right')
    );
    
    if (forward5mButton) {
      fireEvent.click(forward5mButton);
      expect(mockAdjustTime).toHaveBeenCalledWith(5, undefined);
    }
  });
});
