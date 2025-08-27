import React, { useState } from 'react';
import { initializeSportsForAllProjects } from '../utils/projectInitializer';
import { defaultSports } from '../data/defaultSports';
import { 
  Play, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  Loader2, 
  Database,
  RefreshCw
} from 'lucide-react';

const ProjectSportsInitializer = () => {
  const [isInitializing, setIsInitializing] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [results, setResults] = useState(null);
  const [projectStatus, setProjectStatus] = useState([]);
  const [showDetails, setShowDetails] = useState(false);

  const handleInitializeAllProjects = async () => {
    if (window.confirm('This will add default sports to ALL projects that don\'t have them. Continue?')) {
      setIsInitializing(true);
      setResults(null);
      
      try {
        const result = await initializeSportsForAllProjects();
        setResults(result);
        
        // Refresh project status
        await checkAllProjectsStatus();
      } catch (error) {
        console.error('Error initializing sports:', error);
        setResults({ error: error.message });
      } finally {
        setIsInitializing(false);
      }
    }
  };

  const checkAllProjectsStatus = async () => {
    setIsChecking(true);
    
    try {
      // This would need to be implemented to get all projects and check their sports
      // For now, we'll show a placeholder
      setProjectStatus([
        { id: 'project1', name: 'Project 1', sportsCount: defaultSports.length, status: 'complete' },
        { id: 'project2', name: 'Project 2', sportsCount: 0, status: 'pending' },
        { id: 'project3', name: 'Project 3', sportsCount: defaultSports.length, status: 'complete' }
      ]);
    } catch (error) {
      console.error('Error checking project status:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'complete': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'complete': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <AlertCircle className="w-4 h-4" />;
      case 'error': return <AlertCircle className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Project Sports Initializer</h3>
          <p className="text-sm text-gray-600 mt-1">
            Automatically add default sports to all projects that don't have them
          </p>
        </div>
        <button
          onClick={checkAllProjectsStatus}
          disabled={isChecking}
          className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          {isChecking ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          {isChecking ? 'Checking...' : 'Check Status'}
        </button>
      </div>

      {/* Action Section */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-blue-900">Bulk Sports Initialization</h4>
            <p className="text-sm text-blue-700 mt-1">
              This will add {defaultSports.length} pre-configured sports to all projects that don't have them yet.
            </p>
          </div>
          <button
            onClick={handleInitializeAllProjects}
            disabled={isInitializing}
            className={`inline-flex items-center px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              isInitializing
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg transform hover:scale-105'
            }`}
          >
            {isInitializing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Initializing...
              </>
              ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Initialize All Projects
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results Display */}
      {results && (
        <div className="mb-6 p-4 rounded-lg border">
          {results.error ? (
            <div className="flex items-center text-red-700">
              <AlertCircle className="w-5 h-5 mr-2" />
              <div>
                <strong>Error:</strong> {results.error}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center text-green-700">
                <CheckCircle className="w-5 h-5 mr-2" />
                <strong>Initialization Complete!</strong>
              </div>
              <div className="text-sm text-gray-600">
                Processed {results.projectsProcessed} projects and added {results.totalSportsAdded} sports total.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Project Status */}
      {projectStatus.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">Project Status</h4>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-sm text-blue-600 hover:text-blue-800 underline cursor-pointer"
            >
              {showDetails ? 'Hide Details' : 'Show Details'}
            </button>
          </div>
          
          {showDetails && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projectStatus.map((project) => (
                  <div key={project.id} className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium text-gray-900 text-sm">{project.name}</h5>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                        {getStatusIcon(project.status)}
                        <span className="ml-1">{project.status}</span>
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <div className="flex items-center">
                        <Database className="w-4 h-4 mr-1 text-gray-400" />
                        {project.sportsCount} sports
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info Section */}
      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-start">
          <Info className="w-5 h-5 text-gray-500 mr-2 mt-0.5" />
          <div className="text-sm text-gray-600">
            <strong>What this does:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Scans all existing projects in your system</li>
              <li>Identifies projects without sports configuration</li>
              <li>Automatically adds the complete set of default sports</li>
              <li>Includes: Paddle, Basketball, Football, Rugby, Tennis, Squash, and more</li>
              <li>Each sport comes with proper rules, equipment, and specifications</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectSportsInitializer;
