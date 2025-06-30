/**
 * Higher-Order Component for accessing multiple React contexts in class components
 * Replaces multiple useContext hooks to eliminate React hooks from production code
 */

import React, { Component, ComponentType } from 'react';
import { PatientContext } from '../context/PatientContextDef';
import { PatientContextType } from '../context/PatientContextType';
import { TimeContext } from '../context/TimeContextDef';
import { TimeContextType } from '../context/TimeContextType';

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
              {(timeContext) => (
                <WrappedComponent
                  {...(this.props as P)}
                  patientContext={patientContext}
                  timeContext={timeContext}
                />
              )}
            </TimeContext.Consumer>
          )}
        </PatientContext.Consumer>
      );
    }
  };
}

export default withContexts;