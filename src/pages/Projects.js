import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';


const Projects = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to project selection page
    navigate('/project-selection');
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to project selection...</p>
      </div>
    </div>
  );
};

export default Projects;
