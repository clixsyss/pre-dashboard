import React from 'react';
import { MapPin, Plus } from 'lucide-react';

const Courts = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Courts Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage sports courts and facilities
          </p>
        </div>
        <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
          <Plus className="w-4 h-4 mr-2" />
          Add Court
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow-soft p-12 text-center">
        <MapPin className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Courts Management</h3>
        <p className="mt-1 text-sm text-gray-500">
          This feature is coming soon. You'll be able to manage courts, availability, and pricing.
        </p>
      </div>
    </div>
  );
};

export default Courts;
