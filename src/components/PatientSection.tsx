import React from 'react';
import { ChevronDown } from 'lucide-react';
import PatientList from './PatientList';

interface PatientSectionProps {
  id: string;
  title: string;
  status: string;
  isExpanded: boolean;
  onToggle: (sectionId: string) => void;
}

export const PatientSection: React.FC<PatientSectionProps> = ({
  id,
  title,
  status,
  isExpanded,
  onToggle
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
      <div className={`${isExpanded || window.innerWidth >= 768 ? 'block' : 'hidden'} md:block`}>
        <PatientList status={status as any} title={title} />
      </div>
    </div>
  );
};