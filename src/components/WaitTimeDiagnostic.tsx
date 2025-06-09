import React, { useState, useEffect } from 'react';
import { usePatientContext } from '../hooks/usePatientContext';
import { useTimeContext } from '../hooks/useTimeContext';
import { Patient } from '../types';

export const WaitTimeDiagnostic: React.FC = () => {
  const {
    patients,
    getWaitTime,
    tickCounter
  } = usePatientContext();

  const { getCurrentTime, timeMode, formatDateTime } = useTimeContext();
  
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [timeCallCount, setTimeCallCount] = useState<number>(0);
  const [lastTickCounter, setLastTickCounter] = useState<number>(0);
  const [tickChangeCount, setTickChangeCount] = useState<number>(0);

  // Track time updates
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const newTime = getCurrentTime();
        setCurrentTime(newTime);
        setTimeCallCount(prev => prev + 1);
      } catch (error) {
        console.error('Error calling getCurrentTime:', error);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [getCurrentTime]);

  // Track tick counter changes
  useEffect(() => {
    if (tickCounter !== lastTickCounter) {
      setLastTickCounter(tickCounter);
      setTickChangeCount(prev => prev + 1);
    }
  }, [tickCounter, lastTickCounter]);

  // Get patients with wait times for analysis
  const patientsWithWaitTimes = patients
    .filter(p => p.checkInTime)
    .map(patient => ({
      ...patient,
      waitTime: getWaitTime(patient),
      checkInTimeValid: !isNaN(new Date(patient.checkInTime!).getTime()),
      withDoctorTimeValid: patient.withDoctorTime ? !isNaN(new Date(patient.withDoctorTime).getTime()) : null,
    }));

  const getWaitTimeColor = (waitTime: number) => {
    if (waitTime === 0) return 'text-gray-400';
    if (waitTime < 15) return 'text-green-400';
    if (waitTime < 30) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getValidationColor = (isValid: boolean | null) => {
    if (isValid === null) return 'text-gray-400';
    return isValid ? 'text-green-400' : 'text-red-400';
  };

  // Test wait time calculation manually
  const testWaitTimeCalculation = (patient: Patient) => {
    if (!patient.checkInTime) return 'No check-in time';

    try {
      const checkInTime = new Date(patient.checkInTime);
      const endTime = patient.withDoctorTime 
        ? new Date(patient.withDoctorTime)
        : getCurrentTime();

      const waitTimeMs = endTime.valueOf() - checkInTime.valueOf();
      const waitTimeMinutes = Math.max(0, Math.floor(waitTimeMs / 60000));

      return `${waitTimeMinutes} min (${checkInTime.toLocaleTimeString()} → ${endTime.toLocaleTimeString()})`;
    } catch (error) {
      return `Error: ${error}`;
    }
  };

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
          
          {patientsWithWaitTimes.length === 0 ? (
            <div className="text-gray-400 text-sm">No patients with check-in times</div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {patientsWithWaitTimes.map((patient) => (
                <div key={patient.id} className="bg-gray-600 p-2 rounded text-xs">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-white font-medium">{patient.name}</span>
                    <span className={`font-bold ${getWaitTimeColor(patient.waitTime)}`}>
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
                      <span className={getValidationColor(patient.checkInTimeValid)}>
                        {patient.checkInTimeValid ? '✓' : '✗'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-1">
                    <span className="text-gray-300">Calculation: </span>
                    <span className="text-blue-300">
                      {testWaitTimeCalculation(patient)}
                    </span>
                  </div>

                  {patient.withDoctorTime && (
                    <div>
                      <span className="text-gray-300">With Doctor Valid: </span>
                      <span className={getValidationColor(patient.withDoctorTimeValid)}>
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
              onClick={() => {
                console.log('getCurrentTime test:', getCurrentTime());
                console.log('Direct new Date():', new Date());
                console.log('timeMode:', timeMode);
              }}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-500 mr-2"
            >
              Log Time Info
            </button>

            <button
              onClick={() => {
                patientsWithWaitTimes.forEach(patient => {
                  console.log(`${patient.name}:`, {
                    checkInTime: patient.checkInTime,
                    waitTime: patient.waitTime,
                    calculation: testWaitTimeCalculation(patient)
                  });
                });
              }}
              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-500 mr-2"
            >
              Log Wait Times
            </button>

            <button
              onClick={() => setTimeCallCount(0)}
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
}; 