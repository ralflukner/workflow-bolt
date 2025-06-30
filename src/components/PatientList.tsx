import React from 'react';
import { withContexts, WithContextsProps } from './withContexts';
import { PatientApptStatus } from '../types';
import PatientCard from './PatientCard';

interface PatientListProps {
  status: PatientApptStatus;
  title: string;
  scrollPosition?: number;
  onScroll?: (position: number) => void;
}

// NOTE: useEffect is not allowed in this project. See docs/NO_USE_EFFECT_POLICY.md
class PatientListClass extends React.Component<PatientListProps & WithContextsProps> {
  scrollContainerRef: React.RefObject<HTMLDivElement>;

  constructor(props: PatientListProps & WithContextsProps) {
    super(props);
    this.scrollContainerRef = React.createRef();
  }

  componentDidUpdate(prevProps: PatientListProps & WithContextsProps) {
    // Sync scroll position when it changes from parent
    if (
      this.props.scrollPosition !== undefined &&
      this.props.scrollPosition !== prevProps.scrollPosition &&
      this.scrollContainerRef.current
    ) {
      const maxScroll = this.scrollContainerRef.current.scrollHeight - this.scrollContainerRef.current.clientHeight;
      this.scrollContainerRef.current.scrollTop = this.props.scrollPosition * maxScroll;
    }
  }

  handleScroll = () => {
    const { onScroll } = this.props;
    if (this.scrollContainerRef.current && onScroll) {
      const maxScroll = this.scrollContainerRef.current.scrollHeight - this.scrollContainerRef.current.clientHeight;
      const relativePosition = maxScroll > 0 ? this.scrollContainerRef.current.scrollTop / maxScroll : 0;
      onScroll(relativePosition);
    }
  };

  render() {
    const { title, status, patientContext } = this.props;
    const patients = patientContext.getPatientsByStatus(status);

    const getHeaderColor = () => {
      switch (status) {
        case 'scheduled': return 'bg-gray-700';
        case 'Confirmed': return 'bg-green-800';
        case 'Rescheduled': return 'bg-orange-700';
        case 'Cancelled': return 'bg-red-700';
        case 'No Show': return 'bg-red-800';
        case 'arrived': return 'bg-amber-700';
        case 'appt-prep': return 'bg-purple-700';
        case 'ready-for-md': return 'bg-cyan-700';
        case 'With Doctor': return 'bg-blue-700';
        case 'seen-by-md': return 'bg-teal-700';
        case 'completed': return 'bg-green-700';
        default: return 'bg-gray-700';
      }
    };

    return (
      <div className="bg-gray-800 rounded-lg shadow-md mb-6 overflow-hidden">
        <div className={`${getHeaderColor()} px-4 py-3`}>
          <h2 className="text-white font-semibold flex items-center justify-between">
            <span>{title}</span>
            <span className="bg-gray-800 text-white text-sm px-2 py-1 rounded-full">
              {patients.length}
            </span>
          </h2>
        </div>
        <div
          ref={this.scrollContainerRef}
          className="p-4 max-h-[400px] overflow-y-auto"
          onScroll={this.handleScroll}
        >
          {patients.length === 0 ? (
            <p className="text-gray-400 text-center py-4">No patients in this category</p>
          ) : (
            <div className="space-y-4">
              {patients.map((patient) => (
                <PatientCard key={patient.id} patient={patient} />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
}

// Export the wrapped component
const PatientList = withContexts(PatientListClass);
export default PatientList;