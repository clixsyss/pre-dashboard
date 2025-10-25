import React, { useState } from 'react';
import { Download, CheckCircle, AlertCircle } from 'lucide-react';
import dataExportService from '../services/dataExportService';

const ExportButton = ({ dataType, userId, projectId, className = '' }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState(null);

  const handleExport = async () => {
    setIsExporting(true);
    setExportStatus(null);

    try {
      const format = 'csv'; // Export as CSV
      
      let result;
      let message = '';
      
      if (dataType === 'all') {
        // Export user activity report
        result = await dataExportService.exportUserActivityReport(format);
        message = 'User activity report exported successfully as CSV';
      } else if (dataType === 'orders') {
        // Export detailed orders report
        result = await dataExportService.exportOrdersReport(format);
        message = 'Orders report exported successfully as CSV';
      } else if (dataType === 'bookings') {
        // Export detailed bookings report
        result = await dataExportService.exportBookingsReport(format);
        message = 'Bookings report exported successfully as CSV';
      } else if (dataType === 'gatePasses') {
        // Export detailed gate passes report
        result = await dataExportService.exportGatePassesReport(format);
        message = 'Gate passes report exported successfully as CSV';
      } else if (dataType === 'guestPasses') {
        // Export detailed guest passes report
        result = await dataExportService.exportGuestPassesReport(format);
        message = 'Guest passes report exported successfully as CSV';
      } else {
        // Export individual data type
        result = await dataExportService.exportData(dataType, format);
        message = `Exported ${dataType} successfully as CSV`;
      }

      setExportStatus({
        type: 'success',
        message,
        result
      });
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setExportStatus(null);
      }, 3000);
    } catch (error) {
      console.error('Export error:', error);
      setExportStatus({
        type: 'error',
        message: `Export failed: ${error.message}`
      });
      
      // Auto-hide error message after 5 seconds
      setTimeout(() => {
        setExportStatus(null);
      }, 5000);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <button
        onClick={handleExport}
        disabled={isExporting}
        className={`${className || 'px-5 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400'} transition-all duration-200 flex items-center space-x-2 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isExporting ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span className="font-medium">Exporting...</span>
          </>
        ) : (
          <>
            <Download className="h-5 w-5" />
            <span className="font-medium">Export</span>
          </>
        )}
      </button>

      {/* Export Status Toast */}
      {exportStatus && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg border-2 ${
          exportStatus.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center space-x-2">
            {exportStatus.type === 'success' ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <span className="font-medium">{exportStatus.message}</span>
          </div>
        </div>
      )}
    </>
  );
};

export default ExportButton;
