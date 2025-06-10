import { render, screen } from '@testing-library/react';
import MetricsPanel from '../MetricsPanel';
import { TimeContext } from '../../context/TimeContext';

// Mock TimeContext implementation
const mockGetCurrentTime = jest.fn();

const MockTimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const timeContextValue = {
    timeMode: {
      simulated: false,
      currentTime: new Date('2025-06-05T10:00:00').toISOString(),
    },
    toggleSimulation: jest.fn(),
    adjustTime: jest.fn(),
    getCurrentTime: mockGetCurrentTime,
    formatTime: jest.fn(),
    formatDateTime: jest.fn(),
  };
  
  return <TimeContext.Provider value={timeContextValue}>{children}</TimeContext.Provider>;
};

describe('MetricsPanel Wait Time Calculations', () => {
  beforeEach(() => {
    mockGetCurrentTime.mockReturnValue(new Date('2025-06-05T10:00:00').toISOString());
  });

  it('should display wait time metrics correctly', () => {
    render(
      <MockTimeProvider>
        <MetricsPanel />
      </MockTimeProvider>
    );

    expect(screen.getByText('Wait Time Metrics')).toBeInTheDocument();
  });
});
