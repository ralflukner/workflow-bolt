import React from 'react';
import { X } from 'lucide-react';

interface ReportModalProps {
  onClose: () => void;
  reportContent: string;
}

export const ReportModal: React.FC<ReportModalProps> = ({ onClose, reportContent }) => {
  // Simple HTML escaping to prevent break-out in print window
  const escapeHtml = (unsafe: string): string =>
    unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  const handleDownload = () => {
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'patient-flow-report.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html lang="en">
          <head>
            <title>Patient Flow Report</title>
            <style>
              body {
                font-family: monospace;
                white-space: pre-wrap;
                padding: 20px;
              }
            </style>
          </head>
          <body>
            ${escapeHtml(reportContent).replace(/\n/g, '<br>')}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.onafterprint = () => printWindow.close();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-6xl max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Patient Flow Report</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        <pre className="bg-gray-700 p-4 rounded text-white font-mono text-sm whitespace-pre-wrap overflow-auto">
          {reportContent}
        </pre>
        <div className="flex justify-end mt-4">
          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors mr-2"
          >
            Download
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500 transition-colors mr-2"
          >
            Print
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};