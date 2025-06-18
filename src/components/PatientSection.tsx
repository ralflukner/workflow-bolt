import { ChevronDown } from 'lucide-react';
import PatientList from './PatientList';
import type { PatientApptStatus } from '../types';

interface PatientSectionProps {
  id: string;
  title: string;
  status: PatientApptStatus;
  isExpanded: boolean;
  onToggle: (sectionId: string) => void;
  scrollPosition?: number;
  onScroll?: (position: number) => void;
}

export const PatientSection: React.FC<PatientSectionProps> = ({
  id,
  title,
  status,
  isExpanded,
  onToggle,
  scrollPosition,
  onScroll
}) => {
  return (
    <div>
      <button 
        onClick={() => onToggle(id)}
        className="w-full text-left mb-2 md:hidden flex items-center justify-between bg-gray-800 p-3 rounded"
      >
        <span className="text-white font-semibold">{title}</span>
        <ChevronDown 
          size={20} 
          className={`text-white transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
        />
      </button>
      {/* Small-screens: toggle; ≥md: always shown */}
 <div className={`${isExpanded ? 'block' : 'hidden'} md:block`}>
        <PatientList 
          status={status} 
          title={title} 
          scrollPosition={scrollPosition}
          onScroll={onScroll}
        />
      </div>
    </div>
  );
};