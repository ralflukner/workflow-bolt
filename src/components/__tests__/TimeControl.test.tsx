import React from 'react';
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

    expect(screen.getByText('Real Time')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Simulate Time' })).toBeInTheDocument();
    expect(screen.queryByText('Speed Up')).not.toBeInTheDocument(); // Speed controls not visible in real-time mode
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

    expect(screen.getByText('Simulated Time')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Real Time' })).toBeInTheDocument();
    expect(screen.getByText('Speed Up')).toBeInTheDocument(); // Speed controls visible in simulation mode
    expect(screen.getByText('+ 15m')).toBeInTheDocument();
    expect(screen.getByText('+ 1h')).toBeInTheDocument();
  });

  it('calls toggleSimulation when mode button is clicked', () => {
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

    fireEvent.click(screen.getByRole('button', { name: 'Simulate Time' }));
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

    fireEvent.click(screen.getByText('+ 15m'));
    expect(mockAdjustTime).toHaveBeenCalledWith(15);

    fireEvent.click(screen.getByText('+ 1h'));
    expect(mockAdjustTime).toHaveBeenCalledWith(60);
  });
});
