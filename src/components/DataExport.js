import React, { useState } from 'react';
import { Download, FileText, Database, User, ShoppingCart, Calendar, Key, CheckCircle, AlertCircle } from 'lucide-react';
import dataExportService from '../services/dataExportService';

const DataExport = () => {
  const [selectedDataTypes, setSelectedDataTypes] = useState([]);
  const [exportFormat, setExportFormat] = useState('json');
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState(null);

  const dataTypes = [
    {
      id: 'profile',
      name: 'Profile Data',
      description: 'Your personal information and account details',
      icon: User,
      color: 'blue'
    },
    {
      id: 'gatePasses',
      name: 'Gate Passes',
      description: 'All your gate pass records and access logs',
      icon: Key,
      color: 'green'
    },
    {
      id: 'guestPasses',
      name: 'Guest Passes',
      description: 'Guest pass requests and approvals',
      icon: User,
      color: 'purple'
    },
    {
      id: 'orders',
      name: 'Store Orders',
      description: 'Your purchase history and order details',
      icon: ShoppingCart,
      color: 'orange'
    },
    {
      id: 'bookings',
      name: 'Bookings',
      description: 'Court and academy reservations',
      icon: Calendar,
      color: 'indigo'
    },
    {
      id: 'all',
      name: 'All Data',
      description: 'Complete export of all your data',
      icon: Database,
      color: 'red'
    }
  ];

  const handleDataTypeToggle = (dataTypeId) => {
    if (dataTypeId === 'all') {
      setSelectedDataTypes(['all']);
    } else {
      setSelectedDataTypes(prev => {
        const filtered = prev.filter(id => id !== 'all');
        if (filtered.includes(dataTypeId)) {
          return filtered.filter(id => id !== dataTypeId);
        } else {
          return [...filtered, dataTypeId];
        }
      });
    }
  };

  const handleExport = async () => {
    if (selectedDataTypes.length === 0) {
      setExportStatus({
        type: 'error',
        message: 'Please select at least one data type to export'
      });
      return;
    }

    setIsExporting(true);
    setExportStatus(null);

    try {
      let results = [];
      
      if (selectedDataTypes.includes('all')) {
        // Use the new separate export method for cleaner organization
        const result = await dataExportService.exportAllDataSeparate(exportFormat);
        results = result.results;
        
        setExportStatus({
          type: 'success',
          message: `Successfully exported all data types as separate files`,
          details: results,
          summary: result.summary
        });
      } else {
        // Export individual data types
        for (const dataType of selectedDataTypes) {
          const result = await dataExportService.exportData(dataType, exportFormat);
          results.push(result);
        }

        setExportStatus({
          type: 'success',
          message: `Successfully exported ${results.length} data type(s)`,
          details: results
        });
      }
    } catch (error) {
      console.error('Export error:', error);
      setExportStatus({
        type: 'error',
        message: `Export failed: ${error.message}`
      });
    } finally {
      setIsExporting(false);
    }
  };

  const getColorClasses = (color) => {
    const colorMap = {
      blue: 'bg-blue-50 border-blue-200 text-blue-700',
      green: 'bg-green-50 border-green-200 text-green-700',
      purple: 'bg-purple-50 border-purple-200 text-purple-700',
      orange: 'bg-orange-50 border-orange-200 text-orange-700',
      indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700',
      red: 'bg-red-50 border-red-200 text-red-700'
    };
    return colorMap[color] || 'bg-gray-50 border-gray-200 text-gray-700';
  };

  const getSelectedColorClasses = (color) => {
    const colorMap = {
      blue: 'bg-blue-100 border-blue-300 text-blue-800',
      green: 'bg-green-100 border-green-300 text-green-800',
      purple: 'bg-purple-100 border-purple-300 text-purple-800',
      orange: 'bg-orange-100 border-orange-300 text-orange-800',
      indigo: 'bg-indigo-100 border-indigo-300 text-indigo-800',
      red: 'bg-red-100 border-red-300 text-red-800'
    };
    return colorMap[color] || 'bg-gray-100 border-gray-300 text-gray-800';
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 bg-blue-100 rounded-full">
            <Download className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Export Your Data</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Download your personal data including gate passes, store purchases, bookings, and profile information. 
          Choose the data types you want to export and select your preferred format.
        </p>
      </div>

      {/* Export Status */}
      {exportStatus && (
        <div className={`p-4 rounded-lg border-2 ${
          exportStatus.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center">
            {exportStatus.type === 'success' ? (
              <CheckCircle className="h-5 w-5 mr-2" />
            ) : (
              <AlertCircle className="h-5 w-5 mr-2" />
            )}
            <span className="font-medium">{exportStatus.message}</span>
          </div>
          {exportStatus.details && (
            <div className="mt-2 text-sm">
              <p>Exported files:</p>
              <ul className="list-disc list-inside ml-4">
                {exportStatus.details.map((detail, index) => (
                  <li key={index}>
                    {detail.dataType} ({detail.recordCount || 0} records) - {detail.success ? 'Success' : 'Failed'}
                    {detail.filename && <span className="text-gray-600"> - {detail.filename}</span>}
                  </li>
                ))}
              </ul>
              {exportStatus.summary && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <p className="font-semibold text-blue-900">Export Summary:</p>
                  <p className="text-blue-800">Total Files: {exportStatus.summary.totalFiles}</p>
                  <p className="text-blue-800">Total Records: {exportStatus.summary.totalRecords}</p>
                  <p className="text-blue-800">Format: {exportStatus.summary.format.toUpperCase()}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Data Type Selection */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Data to Export</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dataTypes.map((dataType) => {
            const Icon = dataType.icon;
            const isSelected = selectedDataTypes.includes(dataType.id);
            const colorClasses = isSelected 
              ? getSelectedColorClasses(dataType.color)
              : getColorClasses(dataType.color);
            
            return (
              <button
                key={dataType.id}
                onClick={() => handleDataTypeToggle(dataType.id)}
                className={`p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md ${
                  isSelected ? 'ring-2 ring-offset-2 ring-blue-500' : ''
                } ${colorClasses}`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="font-semibold text-sm mb-1">{dataType.name}</h3>
                    <p className="text-xs opacity-75">{dataType.description}</p>
                  </div>
                  {isSelected && (
                    <CheckCircle className="h-5 w-5 flex-shrink-0" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Export Format Selection */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Export Format</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setExportFormat('json')}
            className={`p-4 rounded-lg border-2 transition-all duration-200 ${
              exportFormat === 'json'
                ? 'bg-blue-50 border-blue-300 text-blue-800 ring-2 ring-blue-500 ring-offset-2'
                : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center space-x-3">
              <FileText className="h-6 w-6" />
              <div className="text-left">
                <h3 className="font-semibold">JSON Format</h3>
                <p className="text-sm opacity-75">Structured data, easy to import</p>
              </div>
            </div>
          </button>
          
          <button
            onClick={() => setExportFormat('csv')}
            className={`p-4 rounded-lg border-2 transition-all duration-200 ${
              exportFormat === 'csv'
                ? 'bg-blue-50 border-blue-300 text-blue-800 ring-2 ring-blue-500 ring-offset-2'
                : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Database className="h-6 w-6" />
              <div className="text-left">
                <h3 className="font-semibold">CSV Format</h3>
                <p className="text-sm opacity-75">Spreadsheet compatible</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Export Button */}
      <div className="flex justify-center">
        <button
          onClick={handleExport}
          disabled={isExporting || selectedDataTypes.length === 0}
          className={`px-8 py-4 rounded-lg font-semibold text-white transition-all duration-200 flex items-center space-x-2 ${
            isExporting || selectedDataTypes.length === 0
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg'
          }`}
        >
          {isExporting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Exporting...</span>
            </>
          ) : (
            <>
              <Download className="h-5 w-5" />
              <span>Export Data</span>
            </>
          )}
        </button>
      </div>

      {/* Information */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">Export Information</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Your data will be downloaded as separate files for each selected type</li>
          <li>• JSON format preserves all data structure and relationships</li>
          <li>• CSV format is compatible with Excel and Google Sheets</li>
          <li>• All timestamps are included in ISO format for easy processing</li>
          <li>• Export includes all your historical data up to the current date</li>
        </ul>
      </div>
    </div>
  );
};

export default DataExport;
