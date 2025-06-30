/**
 * Higher-Order Component for accessing multiple React contexts in class components
 * Replaces multiple useContext hooks to eliminate React hooks from production code
 */

import React, { Component, ComponentType } from 'react';
import { PatientContext } from '../context/PatientContextDef';
import { PatientContextType } from '../context/PatientContextType';
import { TimeContext } from '../context/TimeContextDef';
import { TimeMode } from '../types';

// Define TimeContextType to match the one in TimeContextDef.ts
interface TimeContextType {
  timeMode: TimeMode;
  toggleSimulation: () => void;
  adjustTime: (minutesToAdd: number, newTime?: Date) => void;
  getCurrentTime: () => Date;
  formatTime: (date: Date) => string;
  formatDateTime: (date: Date) => string;
}

export interface WithContextsProps {
  patientContext: PatientContextType;
  timeContext: TimeContextType;
}

/**
 * HOC that provides both PatientContext and TimeContext to class components
 */
export function withContexts<P extends object>(
  WrappedComponent: ComponentType<P & WithContextsProps>
) {
  return class WithContexts extends Component<P> {
    render() {
      return (
        <PatientContext.Consumer>
          {(patientContext) => (
            <TimeContext.Consumer>
              {(timeContext) => {
                // Ensure contexts are available
                if (!patientContext || !timeContext) {
                  console.error('Context not available in withContexts HOC');
                  return <div>Context Error</div>;
                }
                
                return (
                  <WrappedComponent
                    {...(this.props as P)}
                    patientContext={patientContext}
                    timeContext={timeContext}
                  />
                );
              }}
            </TimeContext.Consumer>
          )}
        </PatientContext.Consumer>
      );
    }
  };
}

export default withContexts;