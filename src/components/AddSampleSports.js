import React, { useState } from 'react';
import { useSportsStore } from '../stores/sportsStore';
import { defaultSports } from '../data/defaultSports';
import { Plus, CheckCircle, AlertCircle, Info, Loader2 } from 'lucide-react';

const AddSampleSports = ({ projectId }) => {
  const { addSport, sports } = useSportsStore();
  const [isLoading, setIsLoading] = useState(false);
  const [successCount, setSuccessCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [showDetails, setShowDetails] = useState(false);

  const handleAddSampleSports = async () => {
    if (window.confirm(`This will add ${defaultSports.length} pre-configured sports to your project. Continue?`)) {
      setIsLoading(true);
      setSuccessCount(0);
      setErrorCount(0);

      try {
        const results = await Promise.allSettled(
          defaultSports.map(sport => addSport(projectId, sport))
        );

        let success = 0;
        let errors = 0;

        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            success++;
          } else {
            errors++;
            console.error(`Failed to add ${defaultSports[index].name}:`, result.reason);
          }
        });

        setSuccessCount(success);
        setErrorCount(errors);

        if (success > 0) {
          // Refresh the sports list
          window.location.reload();
        }
      } catch (error) {
        console.error('Error adding sample sports:', error);
        setErrorCount(defaultSports.length);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const getSportsByCategory = () => {
    const categories = {};
    defaultSports.forEach(sport => {
      if (!categories[sport.category]) {
        categories[sport.category] = [];
      }
      categories[sport.category].push(sport);
    });
    return categories;
  };

  const categories = getSportsByCategory();

  return (
    <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            <Info className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-blue-900">Quick Sports Setup</h3>
          </div>
          <p className="text-sm text-blue-700 mb-3">
            Add {defaultSports.length} pre-configured sports to get started with courts management. 
            This includes popular sports with proper rules, equipment, and specifications.
          </p>
          
          {sports.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
              <div className="flex items-center">
                <AlertCircle className="w-4 h-4 text-yellow-600 mr-2" />
                <span className="text-sm text-yellow-800">
                  No sports available. You need to add sports before creating courts.
                </span>
              </div>
            </div>
          )}

          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-blue-600 hover:text-blue-800 underline cursor-pointer"
          >
            {showDetails ? 'Hide Sports Details' : 'View Sports Details'}
          </button>
        </div>

        <button
          onClick={handleAddSampleSports}
          disabled={isLoading}
          className={`inline-flex items-center px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
            isLoading
              ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg transform hover:scale-105'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Adding Sports...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Add All Sports
            </>
          )}
        </button>
      </div>

      {/* Results Display */}
      {(successCount > 0 || errorCount > 0) && (
        <div className="mb-4 p-4 rounded-lg border">
          {successCount > 0 && (
            <div className="flex items-center text-green-700 mb-2">
              <CheckCircle className="w-4 h-4 mr-2" />
              <span className="font-medium">Successfully added {successCount} sports</span>
            </div>
          )}
          {errorCount > 0 && (
            <div className="flex items-center text-red-700">
              <AlertCircle className="w-4 h-4 mr-2" />
              <span className="font-medium">Failed to add {errorCount} sports</span>
            </div>
          )}
        </div>
      )}

      {/* Sports Details */}
      {showDetails && (
        <div className="mt-4 space-y-4">
          <h4 className="font-medium text-blue-900">Available Sports ({defaultSports.length})</h4>
          
          {Object.entries(categories).map(([category, categorySports]) => (
            <div key={category} className="bg-white rounded-lg p-4 border border-blue-100">
              <h5 className="font-medium text-blue-800 mb-3">{category}</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {categorySports.map((sport, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <h6 className="font-medium text-gray-900 text-sm">{sport.name}</h6>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        sport.difficulty === 'Beginner' ? 'bg-green-100 text-green-800' :
                        sport.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {sport.difficulty}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{sport.description}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>👥 {sport.maxParticipants} max</span>
                      <span>⏱️ {sport.duration}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Current Sports Count */}
      {sports.length > 0 && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center text-green-700">
            <CheckCircle className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">
              You currently have {sports.length} sports configured in your project.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddSampleSports;
