import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAcademyStore } from '../stores/academyStore';
import { useSportsStore } from '../stores/sportsStore';
import { useCourtStore } from '../stores/courtStore';

const StoreTest = () => {
  const { projectId } = useParams();
  
  const { academyOptions, fetchAcademies, loading: academyLoading } = useAcademyStore();
  const { sports, fetchSports, loading: sportsLoading } = useSportsStore();
  const { courts, fetchCourts, loading: courtLoading } = useCourtStore();

  useEffect(() => {
    if (projectId) {
      console.log('Fetching data for project:', projectId);
      fetchAcademies(projectId);
      fetchSports(projectId);
      fetchCourts(projectId);
    }
  }, [projectId, fetchAcademies, fetchSports, fetchCourts]);

  const isLoading = academyLoading || sportsLoading || courtLoading;

  if (isLoading) {
    return <div>Loading stores...</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Store Test Component</h2>
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold">Academies: {academyOptions.length}</h3>
          <pre className="text-xs bg-gray-100 p-2 rounded">
            {JSON.stringify(academyOptions, null, 2)}
          </pre>
        </div>
        
        <div>
          <h3 className="font-semibold">Sports: {sports.length}</h3>
          <pre className="text-xs bg-gray-100 p-2 rounded">
            {JSON.stringify(sports, null, 2)}
          </pre>
        </div>
        
        <div>
          <h3 className="font-semibold">Courts: {courts.length}</h3>
          <pre className="text-xs bg-gray-100 p-2 rounded">
            {JSON.stringify(courts, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default StoreTest;
