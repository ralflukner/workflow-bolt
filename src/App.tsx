import React from 'react';
import { TimeProvider } from './context/TimeContext';
import { PatientProvider } from './context/PatientContext';
import Dashboard from './components/Dashboard';

function App() {
  return (
    <TimeProvider>
      <PatientProvider>
        <Dashboard />
      </PatientProvider>
    </TimeProvider>
  );
}

export default App;