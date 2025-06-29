import React from 'react';
// import { useTimeContext } from '../hooks/useTimeContext';
import { Clock, ChevronLeft, ChevronRight } from 'lucide-react';

interface TimeControlProps {
  timeMode: any;
  toggleSimulation: () => void;
  adjustTime: (minutes: number, newTime?: Date) => void;
  getCurrentTime: () => Date;
  formatTime: (date: Date) => string;
}

// NOTE: useEffect is not allowed in this project. See docs/NO_USE_EFFECT_POLICY.md
class TimeControl extends React.Component<TimeControlProps, any> {
  intervalId: any;

  constructor(props: TimeControlProps) {
    super(props);
    const currentTime = props.getCurrentTime();
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    const h = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    this.state = {
      currentTime,
      timeInput: `${h.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
      dateInput: currentTime.toISOString().split('T')[0],
      isPM: hours >= 12,
    };
  }

  componentDidMount() {
    this.intervalId = setInterval(() => {
      const currentTime = this.props.getCurrentTime();
      this.setState({ currentTime });
      if (!this.props.timeMode.simulated) {
        const hours = currentTime.getHours();
        const minutes = currentTime.getMinutes();
        const h = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
        this.setState({
          timeInput: `${h.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
          dateInput: currentTime.toISOString().split('T')[0],
          isPM: hours >= 12,
        });
      }
    }, 1000);
  }

  componentWillUnmount() {
    clearInterval(this.intervalId);
  }

  updateTimeInputFromDate = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const h = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    this.setState({
      timeInput: `${h.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
      isPM: hours >= 12,
    });
  };

  handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    this.setState({ timeInput: value });
    const { timeMode, adjustTime } = this.props;
    const { isPM, currentTime } = this.state;
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

  handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    this.setState({ dateInput: value });
    const { timeMode, adjustTime } = this.props;
    const { timeInput, isPM, currentTime } = this.state;
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

  togglePeriod = () => {
    const newIsPM = !this.state.isPM;
    this.setState({ isPM: newIsPM });
    const { timeInput, currentTime } = this.state;
    const { adjustTime, timeMode } = this.props;
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

  handleTimeAdjustment = (minutesToAdd: number) => {
    const { currentTime } = this.state;
    const { adjustTime } = this.props;
    const newTime = new Date(currentTime.getTime() + minutesToAdd * 60000);
    this.updateTimeInputFromDate(newTime);
    adjustTime(minutesToAdd, undefined);
  };

  render() {
    const { timeMode, toggleSimulation, formatTime } = this.props;
    const { currentTime, timeInput, dateInput, isPM } = this.state;
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
                    onChange={this.handleDateChange}
                    className={`bg-gray-700 text-white rounded px-2 py-1 w-36 transition-all ${
                      timeMode.currentTime.startsWith(dateInput) ? 'border-2 border-blue-500 font-semibold' : 'border border-gray-600'
                    }`}
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="text"
                    value={timeInput}
                    onChange={this.handleTimeChange}
                    placeholder="09:00"
                    pattern="\d{1,2}:\d{2}"
                    className={`bg-gray-700 text-white text-xl rounded px-2 py-1 w-20 transition-all ${
                      timeMode.currentTime ? 'border-2 border-blue-500 font-bold' : 'border border-gray-600 font-normal'
                    }`}
                  />
                  <button
                    onClick={this.togglePeriod}
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
                  {`${currentTime.getMonth() + 1}/${currentTime.getDate()}/${currentTime.getFullYear()}`}
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
              onClick={() => this.handleTimeAdjustment(-15)}
              className="flex-1 px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
            >
              <span className="flex items-center justify-center">
                <ChevronLeft size={16} className="mr-1" />15m
              </span>
            </button>
            <button
              onClick={() => this.handleTimeAdjustment(-5)}
              className="flex-1 px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
            >
              <span className="flex items-center justify-center">
                <ChevronLeft size={16} className="mr-1" />5m
              </span>
            </button>
            <button
              onClick={() => this.handleTimeAdjustment(5)}
              className="flex-1 px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
            >
              <span className="flex items-center justify-center">
                5m<ChevronRight size={16} className="ml-1" />
              </span>
            </button>
            <button
              onClick={() => this.handleTimeAdjustment(15)}
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
  }
}

export default TimeControl;
