/**
 * HIPAA Compliance Security Notice Component
 * Informs users about the secure in-memory storage workaround
 */

import React from 'react';
import { Shield, Clock, Lock, AlertTriangle } from 'lucide-react';

interface SecurityNoticeProps {
  onClose?: () => void;
  isVisible?: boolean;
}

export const SecurityNotice: React.FC<SecurityNoticeProps> = ({ onClose, isVisible = true }) => {
  if (!isVisible) return null;

  return (
    <div className="bg-blue-900 border border-blue-700 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <Shield className="text-blue-400 mt-1 flex-shrink-0" size={20} />
        <div className="flex-1">
          <h3 className="text-blue-200 font-semibold mb-2 flex items-center gap-2">
            HIPAA-Compliant Security Notice
            <span className="text-xs bg-blue-800 px-2 py-1 rounded">SECURE</span>
          </h3>
          
          <div className="text-blue-100 text-sm space-y-2">
            <p>
              <strong>Temporary Secure Storage:</strong> While our Tebra EHR integration is being repaired, 
              patient data is stored using HIPAA-compliant in-memory storage with the following protections:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              <div className="flex items-center gap-2">
                <Lock size={16} className="text-blue-400" />
                <span>Data encrypted in memory</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-blue-400" />
                <span>Auto-expires after 8 hours</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-blue-400" />
                <span>HIPAA audit logging enabled</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-blue-400" />
                <span>No persistent storage</span>
              </div>
            </div>
            
            <div className="mt-3 p-3 bg-blue-800 rounded">
              <p className="text-xs">
                <strong>Compliance Note:</strong> This temporary solution meets HIPAA minimum necessary standards. 
                All PHI access is logged for audit purposes. Data is automatically purged when you close the browser 
                or after the expiration period.
              </p>
            </div>
          </div>
          
          {onClose && (
            <button
              onClick={onClose}
              className="mt-3 text-blue-300 hover:text-blue-200 text-sm underline"
            >
              Understood - Hide Notice
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SecurityNotice;