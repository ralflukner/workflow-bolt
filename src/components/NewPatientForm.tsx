import React, { Component } from 'react';
import { withContexts, WithContextsProps } from './withContexts';
import { Patient } from '../types';

interface NewPatientFormProps {
  onClose: () => void;
}

interface FormData {
  name: string;
  dob: string;
  provider: string;
  appointmentDate: string;
  appointmentTime: string;
}

interface State {
  formData: FormData;
}

class NewPatientFormClass extends Component<NewPatientFormProps & WithContextsProps, State> {
  constructor(props: NewPatientFormProps & WithContextsProps) {
    super(props);

    this.state = {
      formData: {
        name: '',
        dob: '',
        provider: 'Dr. Lukner',
        appointmentDate: '',
        appointmentTime: '',
      }
    };
  }

  handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    this.setState(prevState => ({
      formData: { ...prevState.formData, [name]: value }
    }));
  };

  handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const { patientContext, timeContext } = this.props;
    
    // Parse time with AM/PM
    const [hours, minutes] = this.state.formData.appointmentTime.split(':');
    let hour = parseInt(hours);
    const isPM = hour >= 12;
    if (!isPM && hour === 12) hour = 0;
    if (isPM && hour !== 12) hour += 12;

    // Use the selected appointment date if provided, otherwise use current date
    let appointmentDate;
    if (this.state.formData.appointmentDate) {
      appointmentDate = new Date(this.state.formData.appointmentDate);
    } else {
      // Use TimeContext to get current time
      appointmentDate = new Date(timeContext.getCurrentTime());
    }

    // Set the time portion of the appointment date
    appointmentDate.setHours(hour, parseInt(minutes, 10), 0, 0);

    const newPatient: Omit<Patient, 'id'> = {
      name: this.state.formData.name,
      dob: this.state.formData.dob,
      provider: this.state.formData.provider,
      appointmentTime: appointmentDate.toISOString(),
      status: 'scheduled',
    };

    patientContext.addPatient(newPatient);
    this.props.onClose();
  };

  render() {
    const { formData } = this.state;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
          <h2 className="text-xl font-semibold text-white mb-4">Add New Patient</h2>

          <form onSubmit={this.handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-300 mb-1" htmlFor="name">
                Patient Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={this.handleChange}
                className="w-full bg-gray-700 text-white border border-gray-600 rounded p-2"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-300 mb-1" htmlFor="dob">
                Date of Birth
              </label>
              <input
                type="date"
                id="dob"
                name="dob"
                value={formData.dob}
                onChange={this.handleChange}
                className="w-full bg-gray-700 text-white border border-gray-600 rounded p-2"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-300 mb-1" htmlFor="provider">
                Provider
              </label>
              <select
                id="provider"
                name="provider"
                value={formData.provider}
                onChange={this.handleChange}
                className="w-full bg-gray-700 text-white border border-gray-600 rounded p-2"
                required
              >
                <option value="Dr. Lukner">Dr. Lukner</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-gray-300 mb-1" htmlFor="appointmentDate">
                Appointment Date
              </label>
              <input
                type="date"
                id="appointmentDate"
                name="appointmentDate"
                value={formData.appointmentDate}
                onChange={this.handleChange}
                className="w-full bg-gray-700 text-white border border-gray-600 rounded p-2"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-300 mb-1" htmlFor="appointmentTime">
                Appointment Time
              </label>
              <input
                type="time"
                id="appointmentTime"
                name="appointmentTime"
                value={formData.appointmentTime}
                onChange={this.handleChange}
                className="w-full bg-gray-700 text-white border border-gray-600 rounded p-2"
                required
              />
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={this.props.onClose}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors"
              >
                Add Patient
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }
}

// Export the wrapped component
const NewPatientForm = withContexts(NewPatientFormClass);
export default NewPatientForm;