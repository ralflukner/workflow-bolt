import React, { useEffect } from 'react';
import { useTimeContext } from '../hooks/useTimeContext';
import { Clock, ChevronLeft, ChevronRight } from 'lucide-react';

const TimeControl: React.FC = () => {
  const { timeMode, toggleSimulation, adjustTime, getCurrentTime, formatTime } = useTimeContext();
  const [currentTime, setCurrentTime] = React.useState(getCurrentTime());
  const [timeInput, setTimeInput] = React.useState(() => {
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    const h = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${h.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  });
  const [dateInput, setDateInput] = React.useState(
    currentTime.toISOString().split('T')[0]
  );
  const [isPM, setIsPM] = React.useState(currentTime.getHours() >= 12);

  // Update states when time changes
  useEffect(() => {
    const newCurrentTime = getCurrentTime();
    setCurrentTime(newCurrentTime);

    if (!timeMode.simulated) {
      // Only update inputs in real-time mode
      const hours = newCurrentTime.getHours();
      const minutes = newCurrentTime.getMinutes();
      const h = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
      setTimeInput(`${h.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
      setDateInput(newCurrentTime.toISOString().split('T')[0]);
      setIsPM(hours >= 12);
    }
  }, [timeMode.currentTime, timeMode.simulated, getCurrentTime]);

  const updateTimeInputFromDate = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const h = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    setTimeInput(`${h.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
    setIsPM(hours >= 12);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTimeInput(value);

    if (timeMode.simulated) {
      if (/^\d{1,2}:\d{2}$/.test(value)) {
        const [hours, minutes] = value.split(':');
        let hour = parseInt(hours);
        if (hour > 12) hour = 12;
        if (isPM && hour !== 12) hour += 12;
        if (!isPM && hour === 12) hour = 0;
        const newTime = new Date(currentTime);
        newTime.setHours(hour, parseInt(minutes));
        adjustTime(0, newTime);
      }
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDateInput(value);

    if (timeMode.simulated) {
      const [hours, minutes] = timeInput.split(':');
      const newTime = new Date(value);
      if (hours && minutes) {
        let hour = parseInt(hours);
        if (isPM && hour !== 12) hour += 12;
        if (!isPM && hour === 12) hour = 0;
        newTime.setHours(hour, parseInt(minutes));
      } else {
        const currentHours = currentTime.getHours();
        const currentMinutes = currentTime.getMinutes();
        newTime.setHours(currentHours, currentMinutes);
      }
      adjustTime(0, newTime);
    }
  };

  const togglePeriod = () => {
    const newIsPM = !isPM;
    setIsPM(newIsPM);
    if (timeInput) {
      const [hours, minutes] = timeInput.split(':');
      let hour = parseInt(hours);
      if (hour > 12) hour = 12;
      if (newIsPM && hour !== 12) hour += 12;
      if (!newIsPM && hour === 12) hour = 0;
      const newTime = new Date(currentTime);
      newTime.setHours(hour, parseInt(minutes));
      adjustTime(0, newTime);
    }
  };

  const handleTimeAdjustment = (minutesToAdd: number) => {
    const newTime = new Date(currentTime.getTime() + minutesToAdd * 60000);
    updateTimeInputFromDate(newTime);
    adjustTime(minutesToAdd, undefined);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 shadow-md">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-white flex items-center">
          <Clock className="mr-2 flex-shrink-0" size={20} />
          Time Control
        </h2>
        <div className="text-right flex items-center gap-2">
          {timeMode.simulated ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                <input
                  type="date"
                  value={dateInput}
                  onChange={handleDateChange}
                  className={`bg-gray-700 text-white rounded px-2 py-1 w-36 transition-all ${
                    timeMode.currentTime.startsWith(dateInput) ? 'border-2 border-blue-500 font-semibold' : 'border border-gray-600'
                  }`}
                />
              </div>
              <div className="flex items-center">
                <input
                  type="text"
                  value={timeInput}
                  onChange={handleTimeChange}
                  placeholder="09:00"
                  pattern="\d{1,2}:\d{2}"
                  className={`bg-gray-700 text-white text-xl rounded px-2 py-1 w-20 transition-all ${
                    timeMode.currentTime ? 'border-2 border-blue-500 font-bold' : 'border border-gray-600 font-normal'
                  }`}
                />
                <button
                  onClick={togglePeriod}
                  className={`text-white text-xl ml-1 flex-shrink-0 transition-all ${
                    timeMode.currentTime ? 'text-blue-400 font-bold' : 'text-gray-300 font-normal hover:text-blue-400'
                  }`}
                >
                  {isPM ? 'PM' : 'AM'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <p className="text-white whitespace-nowrap">
                {currentTime.toLocaleDateString('en-US', { 
                  timeZone: 'America/Chicago',
                  month: 'numeric',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </p>
              <p className="text-xl font-bold text-white whitespace-nowrap">
                {formatTime(currentTime)}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mb-4">
        <label className="inline-flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            checked={timeMode.simulated}
            onChange={toggleSimulation}
            className="sr-only peer" 
          />
          <div className="relative w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
          <span className="ms-3 text-sm font-medium text-white">
            {timeMode.simulated ? 'Simulation Mode' : 'Real-Time Mode'}
          </span>
        </label>
      </div>

      {timeMode.simulated && (
        <div className="flex space-x-2 mt-2">
          <button 
            onClick={() => handleTimeAdjustment(-15)}
            className="flex-1 px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
          >
            <span className="flex items-center justify-center">
              <ChevronLeft size={16} className="mr-1" />15m
            </span>
          </button>
          <button 
            onClick={() => handleTimeAdjustment(-5)}
            className="flex-1 px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
          >
            <span className="flex items-center justify-center">
              <ChevronLeft size={16} className="mr-1" />5m
            </span>
          </button>
          <button 
            onClick={() => handleTimeAdjustment(5)}
            className="flex-1 px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
          >
            <span className="flex items-center justify-center">
              5m<ChevronRight size={16} className="ml-1" />
            </span>
          </button>
          <button 
            onClick={() => handleTimeAdjustment(15)}
            className="flex-1 px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
          >
            <span className="flex items-center justify-center">
              15m<ChevronRight size={16} className="ml-1" />
            </span>
          </button>
        </div>
      )}
    </div>
  );
};

export default TimeControl;
