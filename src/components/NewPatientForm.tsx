import React, { useState } from 'react';
import { usePatientContext } from '../hooks/usePatientContext';
import { useTimeContext } from '../hooks/useTimeContext';
import { Patient } from '../types';

interface NewPatientFormProps {
  onClose: () => void;
}

const NewPatientForm: React.FC<NewPatientFormProps> = ({ onClose }) => {
  const { addPatient } = usePatientContext();
  const { getCurrentTime } = useTimeContext();

  const [formData, setFormData] = useState({
    name: '',
    dob: '',
    provider: '',
    appointmentDate: '',
    appointmentTime: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Parse time with AM/PM
    const [hours, minutes] = formData.appointmentTime.split(':');
    let hour = parseInt(hours);
    const isPM = hour >= 12;
    if (!isPM && hour === 12) hour = 0;
    if (isPM && hour !== 12) hour += 12;

    // Use the selected appointment date if provided, otherwise use current date
    let appointmentDate;
    if (formData.appointmentDate) {
      appointmentDate = new Date(formData.appointmentDate);
    } else {
      appointmentDate = new Date(getCurrentTime());
    }
    
    // Set the time portion of the appointment date
    appointmentDate.setHours(hour, parseInt(minutes, 10), 0, 0);

    const newPatient: Omit<Patient, 'id'> = {
      name: formData.name,
      dob: formData.dob,
      provider: formData.provider,
      appointmentTime: appointmentDate.toISOString(),
      status: 'scheduled',
    };

    addPatient(newPatient);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-semibold text-white mb-4">Add New Patient</h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-300 mb-1" htmlFor="name">
              Patient Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
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
              onChange={handleChange}
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
              onChange={handleChange}
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
              onChange={handleChange}
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
              onChange={handleChange}
              className="w-full bg-gray-700 text-white border border-gray-600 rounded p-2"
              required
            />
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
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
};

export default NewPatientForm;