import React, { Component } from 'react';
import { withContexts, WithContextsProps } from './withContexts';
import { Patient } from '../types';

interface State {
  currentTime: Date;
  timeCallCount: number;
  lastTickCounter: number;
  tickChangeCount: number;
}

class WaitTimeDiagnosticClass extends Component<WithContextsProps, State> {
  private timeInterval: NodeJS.Timeout | null = null;

  constructor(props: WithContextsProps) {
    super(props);

    this.state = {
      currentTime: new Date(),
      timeCallCount: 0,
      lastTickCounter: 0,
      tickChangeCount: 0,
    };
  }

  componentDidMount() {
    // Start time tracking interval - proper lifecycle management
    this.timeInterval = setInterval(() => {
      try {
        const newTime = this.props.timeContext.getCurrentTime();
        this.setState(prevState => ({
          currentTime: newTime,
          timeCallCount: prevState.timeCallCount + 1
        }));
      } catch (error) {
        console.error('Error calling getCurrentTime:', error);
      }
    }, 1000);

    // Initialize tick counter tracking
    const { tickCounter } = this.props.patientContext;
    this.setState({ lastTickCounter: tickCounter });
  }

  componentDidUpdate() {
    // Track tick counter changes
    const { tickCounter } = this.props.patientContext;
    if (tickCounter !== this.state.lastTickCounter) {
      this.setState(prevState => ({
        lastTickCounter: tickCounter,
        tickChangeCount: prevState.tickChangeCount + 1
      }));
    }
  }

  componentWillUnmount() {
    // Clean up interval to prevent memory leaks
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
  }

  getWaitTimeColor = (waitTime: number) => {
    if (waitTime === 0) return 'text-gray-400';
    if (waitTime < 15) return 'text-green-400';
    if (waitTime < 30) return 'text-yellow-400';
    return 'text-red-400';
  };

  getValidationColor = (isValid: boolean | null) => {
    if (isValid === null) return 'text-gray-400';
    return isValid ? 'text-green-400' : 'text-red-400';
  };

  // Test wait time calculation manually
  testWaitTimeCalculation = (patient: Patient) => {
    if (!patient.checkInTime) return 'No check-in time';

    try {
      const checkInTime = new Date(patient.checkInTime);
      const endTime = patient.withDoctorTime 
        ? new Date(patient.withDoctorTime)
        : this.props.timeContext.getCurrentTime();

      const waitTimeMs = endTime.valueOf() - checkInTime.valueOf();
      const waitTimeMinutes = Math.max(0, Math.floor(waitTimeMs / 60000));

      return `${waitTimeMinutes} min (${checkInTime.toLocaleTimeString()} → ${endTime.toLocaleTimeString()})`;
    } catch (error) {
      return `Error: ${error}`;
    }
  };

  handleLogTimeInfo = () => {
    console.log('getCurrentTime test:', this.props.timeContext.getCurrentTime());
    console.log('Direct new Date():', new Date());
    console.log('timeMode:', this.props.timeContext.timeMode);
  };

  handleLogWaitTimes = (patientsWithWaitTimes: any[]) => {
    patientsWithWaitTimes.forEach(patient => {
      console.log(`${patient.name}:`, {
        checkInTime: patient.checkInTime,
        waitTime: patient.waitTime,
        calculation: this.testWaitTimeCalculation(patient)
      });
    });
  };

  handleResetCounters = () => {
    this.setState({ timeCallCount: 0, tickChangeCount: 0 });
  };

  render() {
    const { patientContext, timeContext } = this.props;
    const { currentTime, timeCallCount, tickChangeCount } = this.state;
    
    const {
      patients,
      getWaitTime,
      tickCounter
    } = patientContext;

    const { timeMode, formatDateTime } = timeContext;

    // Get patients with wait times for analysis
    const patientsWithWaitTimes = patients
      .filter(p => p.checkInTime)
      .map(patient => ({
        ...patient,
        waitTime: getWaitTime(patient),
        checkInTimeValid: !isNaN(new Date(patient.checkInTime!).getTime()),
        withDoctorTimeValid: patient.withDoctorTime ? !isNaN(new Date(patient.withDoctorTime).getTime()) : null,
      }));

    return (
      <div className="bg-gray-800 rounded-lg p-4 shadow-lg mb-4">
        <h3 className="text-lg font-semibold text-white mb-4">⏱️ Wait Time Diagnostics</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Time System Status */}
          <div className="bg-gray-700 p-3 rounded">
            <h4 className="font-medium text-white mb-2">Time System</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-300">Current Time:</span>
                <span className="text-blue-400 text-xs">
                  {formatDateTime(currentTime)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Time Mode:</span>
                <span className={timeMode.simulated ? 'text-yellow-400' : 'text-green-400'}>
                  {timeMode.simulated ? 'Simulated' : 'Real-time'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Tick Counter:</span>
                <span className="text-blue-400">{tickCounter}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Time Calls:</span>
                <span className="text-blue-400">{timeCallCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Tick Changes:</span>
                <span className="text-blue-400">{tickChangeCount}</span>
              </div>
            </div>
          </div>

          {/* Wait Time Summary */}
          <div className="bg-gray-700 p-3 rounded">
            <h4 className="font-medium text-white mb-2">Wait Time Summary</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-300">Total Patients:</span>
                <span className="text-blue-400">{patients.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">With Check-in:</span>
                <span className="text-blue-400">{patientsWithWaitTimes.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Waiting (&gt;0 min):</span>
                <span className="text-yellow-400">
                  {patientsWithWaitTimes.filter(p => p.waitTime > 0).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Long Wait (&gt;30 min):</span>
                <span className="text-red-400">
                  {patientsWithWaitTimes.filter(p => p.waitTime > 30).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Max Wait Time:</span>
                <span className="text-red-400">
                  {patientsWithWaitTimes.length > 0 
                    ? Math.max(...patientsWithWaitTimes.map(p => p.waitTime)) + ' min'
                    : '0 min'
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Average Wait:</span>
                <span className="text-blue-400">
                  {patientsWithWaitTimes.length > 0 
                    ? Math.round(patientsWithWaitTimes.reduce((sum, p) => sum + p.waitTime, 0) / patientsWithWaitTimes.length) + ' min'
                    : '0 min'
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Patient Wait Time Details */}
          <div className="bg-gray-700 p-3 rounded lg:col-span-2">
            <h4 className="font-medium text-white mb-2">Patient Wait Time Details</h4>
            
            {patients.length === 0 ? (
              <div className="text-gray-400 text-sm">No patients loaded</div>
            ) : patientsWithWaitTimes.length === 0 ? (
              <div className="space-y-2">
                <div className="text-yellow-400 text-sm">No patients with check-in times</div>
                <div className="text-xs text-gray-400">
                  <div>All patients ({patients.length}):</div>
                  {patients.slice(0, 3).map(p => (
                    <div key={p.id} className="ml-2">
                      • {p.name}: status={p.status}, checkInTime={p.checkInTime ? 'SET' : 'MISSING'}
                    </div>
                  ))}
                  {patients.length > 3 && <div className="ml-2">... and {patients.length - 3} more</div>}
                </div>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {patientsWithWaitTimes.map((patient) => (
                  <div key={patient.id} className="bg-gray-600 p-2 rounded text-xs">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-white font-medium">{patient.name}</span>
                      <span className={`font-bold ${this.getWaitTimeColor(patient.waitTime)}`}>
                        {patient.waitTime} min
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-300">Status: </span>
                        <span className="text-blue-400">{patient.status}</span>
                      </div>
                      <div>
                        <span className="text-gray-300">Check-in Valid: </span>
                        <span className={this.getValidationColor(patient.checkInTimeValid)}>
                          {patient.checkInTimeValid ? '✓' : '✗'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-1">
                      <span className="text-gray-300">Calculation: </span>
                      <span className="text-blue-300">
                        {this.testWaitTimeCalculation(patient)}
                      </span>
                    </div>

                    {patient.withDoctorTime && (
                      <div>
                        <span className="text-gray-300">With Doctor Valid: </span>
                        <span className={this.getValidationColor(patient.withDoctorTimeValid)}>
                          {patient.withDoctorTimeValid ? '✓' : '✗'}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span className="text-gray-300">Time Call Count:</span>
                      <span className="text-blue-400">{timeCallCount}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Time System Tests */}
          <div className="bg-gray-700 p-3 rounded lg:col-span-2">
            <h4 className="font-medium text-white mb-2">Time System Tests</h4>
            
            <div className="space-y-2">
              <button
                onClick={this.handleLogTimeInfo}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-500 mr-2"
              >
                Log Time Info
              </button>

              <button
                onClick={() => this.handleLogWaitTimes(patientsWithWaitTimes)}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-500 mr-2"
              >
                Log Wait Times
              </button>

              <button
                onClick={this.handleResetCounters}
                className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-500"
              >
                Reset Counters
              </button>
            </div>

            <div className="mt-2 text-xs text-gray-400">
              Check the browser console for detailed logging output
            </div>
          </div>
        </div>
      </div>
    );
  }
}

// Export the wrapped component
export const WaitTimeDiagnostic = withContexts(WaitTimeDiagnosticClass);