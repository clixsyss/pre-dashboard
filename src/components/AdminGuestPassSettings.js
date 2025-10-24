import React, { useState, useEffect } from 'react';
import { MapPin, Settings, Save, AlertCircle, CheckCircle, Loader, Lock, Target } from 'lucide-react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { MapContainer, TileLayer, Marker, Circle, Popup, useMapEvents } from 'react-leaflet';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Map click handler component
function MapClickHandler({ enabled, onMapClick }) {
  useMapEvents({
    click: (e) => {
      if (enabled) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

const AdminGuestPassSettings = ({ projectId }) => {
  const { isSuperAdmin } = useAdminAuth();
  const isSuper = isSuperAdmin();
  
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [editingProject, setEditingProject] = useState(null);
  const [mapCenter, setMapCenter] = useState([24.7136, 46.6753]); // Default: Riyadh, Saudi Arabia
  const [mapZoom, setMapZoom] = useState(11);
  const [mapClickMode, setMapClickMode] = useState(false);
  const [selectedProjectForPin, setSelectedProjectForPin] = useState(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setErrorMessage('');

      const projectsSnapshot = await getDocs(collection(db, 'projects'));
      let projectsData = projectsSnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name || 'Unnamed Project',
        description: doc.data().description || '',
        location: doc.data().location || '',
        latitude: doc.data().latitude || null,
        longitude: doc.data().longitude || null,
        radiusMeters: doc.data().radiusMeters || 500,
        restrictionEnabled: doc.data().restrictionEnabled || false,
      }));

      // If projectId is provided, always show only that project
      if (projectId) {
        projectsData = projectsData.filter(p => p.id === projectId);
        console.log(`Filtering to show only current project: ${projectId}`);
      }

      setProjects(projectsData);

      // Set map center to first project with coordinates
      const projectWithCoords = projectsData.find(p => p.latitude && p.longitude);
      if (projectWithCoords) {
        setMapCenter([projectWithCoords.latitude, projectWithCoords.longitude]);
        setMapZoom(13);
      }

      console.log('Fetched projects:', projectsData);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setErrorMessage('Failed to load projects. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRestriction = async (projectId, currentValue) => {
    try {
      setSaving(true);
      setErrorMessage('');
      setSuccessMessage('');

      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        restrictionEnabled: !currentValue,
        updatedAt: new Date(),
      });

      // Update local state
      setProjects(prevProjects =>
        prevProjects.map(p =>
          p.id === projectId ? { ...p, restrictionEnabled: !currentValue } : p
        )
      );

      setSuccessMessage(`Location restriction ${!currentValue ? 'enabled' : 'disabled'} successfully`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error toggling restriction:', error);
      setErrorMessage('Failed to update restriction. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateLocation = async (projectId, updates) => {
    // Only super admins can update location coordinates
    if (!isSuper && (updates.latitude || updates.longitude || updates.radiusMeters)) {
      setErrorMessage('Only Super Admins can configure location coordinates and radius.');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    try {
      setSaving(true);
      setErrorMessage('');
      setSuccessMessage('');

      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        ...updates,
        updatedAt: new Date(),
      });

      // Update local state
      setProjects(prevProjects =>
        prevProjects.map(p =>
          p.id === projectId ? { ...p, ...updates } : p
        )
      );

      setSuccessMessage('Location settings updated successfully');
      setEditingProject(null);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating location:', error);
      setErrorMessage('Failed to update location settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const startEditingProject = (project) => {
    // Only super admins can edit location coordinates
    if (!isSuper) {
      setErrorMessage('Only Super Admins can configure location coordinates and radius.');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    setEditingProject({
      id: project.id,
      latitude: project.latitude || '',
      longitude: project.longitude || '',
      radiusMeters: project.radiusMeters || 500,
    });
  };

  const enableMapPinMode = (project) => {
    if (!isSuper) {
      setErrorMessage('Only Super Admins can configure location coordinates.');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    setSelectedProjectForPin(project);
    setMapClickMode(true);
    setSuccessMessage(`Click on the map to set location for ${project.name}`);
    
    // Center map on project if it has coordinates
    if (project.latitude && project.longitude) {
      setMapCenter([project.latitude, project.longitude]);
      setMapZoom(15);
    }
  };

  const handleMapClick = (lat, lng) => {
    if (!mapClickMode || !selectedProjectForPin) return;

    // Update the project with new coordinates
    handleUpdateLocation(selectedProjectForPin.id, {
      latitude: lat,
      longitude: lng,
      radiusMeters: selectedProjectForPin.radiusMeters || 500,
    });

    // Exit pin mode
    setMapClickMode(false);
    setSelectedProjectForPin(null);
    setSuccessMessage(`Location set successfully for ${selectedProjectForPin.name}`);
  };

  const saveEditingProject = () => {
    if (!editingProject) return;

    const { id, latitude, longitude, radiusMeters } = editingProject;

    // Validate inputs
    if (!latitude || !longitude) {
      setErrorMessage('Latitude and Longitude are required');
      return;
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const radius = parseInt(radiusMeters);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      setErrorMessage('Invalid latitude (must be between -90 and 90)');
      return;
    }

    if (isNaN(lng) || lng < -180 || lng > 180) {
      setErrorMessage('Invalid longitude (must be between -180 and 180)');
      return;
    }

    if (isNaN(radius) || radius < 50 || radius > 10000) {
      setErrorMessage('Invalid radius (must be between 50 and 10,000 meters)');
      return;
    }

    handleUpdateLocation(id, {
      latitude: lat,
      longitude: lng,
      radiusMeters: radius,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="animate-spin h-8 w-8 text-blue-500" />
        <span className="ml-3 text-gray-600">Loading projects...</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <MapPin className="h-6 w-6 mr-2 text-blue-600" />
              Location Settings
            </h2>
            <p className="mt-2 text-gray-600">
              Control location-based guest pass restrictions for this project. Users will only be able to generate passes when physically present at the project location.
            </p>
          </div>
          {!isSuper && (
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg">
              <Lock className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-amber-800 font-medium">Limited Access</span>
            </div>
          )}
        </div>
        {!isSuper && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> You can enable/disable location restrictions, but only Super Admins can configure GPS coordinates and radius settings.
            </p>
          </div>
        )}
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
          <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
          <span className="text-green-800">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
          <span className="text-red-800">{errorMessage}</span>
        </div>
      )}

      {/* Map View - Show when there are projects with coordinates */}
      {projects.length > 0 && projects.some(p => p.latitude && p.longitude) && (
        <div className="mb-6 bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-blue-600" />
              Project Location Map
            </h3>
            {mapClickMode && (
              <button
                onClick={() => {
                  setMapClickMode(false);
                  setSelectedProjectForPin(null);
                  setSuccessMessage('');
                }}
                className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200"
              >
                Cancel Pin Mode
              </button>
            )}
          </div>
          
          {mapClickMode && (
            <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center">
                <Target className="h-5 w-5 text-blue-600 mr-2" />
                <span className="text-sm text-blue-800 font-medium">
                  Click on the map to set location for {selectedProjectForPin?.name}
                </span>
              </div>
            </div>
          )}
          
          <div className={`h-96 rounded-lg overflow-hidden border-2 ${mapClickMode ? 'border-blue-500 cursor-crosshair' : 'border-gray-200'}`}>
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              style={{ height: '100%', width: '100%', cursor: mapClickMode ? 'crosshair' : 'grab' }}
              key={`${mapCenter[0]}-${mapCenter[1]}-${mapZoom}`}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapClickHandler enabled={mapClickMode} onMapClick={handleMapClick} />
              {projects
                .filter(p => p.latitude && p.longitude)
                .map(project => (
                  <React.Fragment key={project.id}>
                    <Marker position={[project.latitude, project.longitude]}>
                      <Popup>
                        <div className="text-center">
                          <strong>{project.name}</strong>
                          <br />
                          <span className="text-sm text-gray-600">{project.location}</span>
                          <br />
                          <span className={`text-xs ${project.restrictionEnabled ? 'text-green-600' : 'text-gray-400'}`}>
                            {project.restrictionEnabled ? '✓ Restriction Active' : '○ Restriction Inactive'}
                          </span>
                        </div>
                      </Popup>
                    </Marker>
                    {project.restrictionEnabled && (
                      <Circle
                        center={[project.latitude, project.longitude]}
                        radius={project.radiusMeters}
                        pathOptions={{
                          color: project.restrictionEnabled ? '#10b981' : '#94a3b8',
                          fillColor: project.restrictionEnabled ? '#10b981' : '#94a3b8',
                          fillOpacity: 0.15,
                        }}
                      />
                    )}
                  </React.Fragment>
                ))}
            </MapContainer>
          </div>
          <div className="mt-2 text-sm text-gray-500 flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              <span>Green circle indicates active restriction zone. {isSuper && 'Click "Pin Location" to set coordinates on map.'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Projects List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Coordinates
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Radius (m)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Restriction
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {projects.map((project) => (
                <tr key={project.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{project.name}</div>
                    <div className="text-xs text-gray-500">{project.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{project.location || 'Not set'}</div>
                  </td>
                  <td className="px-6 py-4">
                    {editingProject && editingProject.id === project.id ? (
                      <div className="space-y-2">
                        <input
                          type="number"
                          step="0.000001"
                          value={editingProject.latitude}
                          onChange={(e) =>
                            setEditingProject({ ...editingProject, latitude: e.target.value })
                          }
                          placeholder="Latitude"
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="number"
                          step="0.000001"
                          value={editingProject.longitude}
                          onChange={(e) =>
                            setEditingProject({ ...editingProject, longitude: e.target.value })
                          }
                          placeholder="Longitude"
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    ) : (
                      <div className="text-sm text-gray-600">
                        {project.latitude && project.longitude ? (
                          <>
                            <div>Lat: {project.latitude.toFixed(6)}</div>
                            <div>Lng: {project.longitude.toFixed(6)}</div>
                          </>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400 italic">Not configured</span>
                            {!isSuper && (
                              <Lock className="h-3 w-3 text-gray-400" />
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingProject && editingProject.id === project.id ? (
                      <input
                        type="number"
                        min="50"
                        max="10000"
                        step="50"
                        value={editingProject.radiusMeters}
                        onChange={(e) =>
                          setEditingProject({ ...editingProject, radiusMeters: e.target.value })
                        }
                        className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <div className="text-sm text-gray-900">{project.radiusMeters || 500}m</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleRestriction(project.id, project.restrictionEnabled)}
                      disabled={saving || !project.latitude || !project.longitude}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        project.restrictionEnabled
                          ? 'bg-green-600'
                          : 'bg-gray-200'
                      } ${
                        (!project.latitude || !project.longitude) && 'opacity-50 cursor-not-allowed'
                      }`}
                      title={
                        !project.latitude || !project.longitude
                          ? 'Please configure coordinates first'
                          : project.restrictionEnabled
                          ? 'Click to disable restriction'
                          : 'Click to enable restriction'
                      }
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          project.restrictionEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {editingProject && editingProject.id === project.id ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={saveEditingProject}
                          disabled={saving}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                          <Save className="h-4 w-4 mr-1" />
                          Save
                        </button>
                        <button
                          onClick={() => setEditingProject(null)}
                          disabled={saving}
                          className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : isSuper ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => enableMapPinMode(project)}
                          className="inline-flex items-center px-3 py-1 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          title="Click to pin location on map"
                        >
                          <Target className="h-4 w-4 mr-1" />
                          Pin Location
                        </button>
                        <button
                          onClick={() => startEditingProject(project)}
                          className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <Settings className="h-4 w-4 mr-1" />
                          Manual
                        </button>
                      </div>
                    ) : (
                      <button
                        disabled
                        className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-400 bg-gray-50 cursor-not-allowed"
                        title="Only Super Admins can configure location settings"
                      >
                        <Lock className="h-4 w-4 mr-1" />
                        Locked
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {projects.length === 0 && (
          <div className="text-center py-12">
            <MapPin className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No projects found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Projects will appear here once they are created.
            </p>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">How it works:</h4>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          {isSuper ? (
            <>
              <li>Configure GPS coordinates and radius for this project location</li>
              <li>Enable the restriction toggle to activate location-based validation</li>
              <li>Users will need to be within the specified radius to generate guest passes</li>
            </>
          ) : (
            <>
              <li>Toggle location restrictions on/off for this project</li>
              <li>GPS coordinates and radius are configured by Super Admins</li>
              <li>When enabled, users must be within the project location to generate passes</li>
            </>
          )}
          <li>Changes take effect immediately via real-time Firestore updates</li>
        </ul>
      </div>
    </div>
  );
};

export default AdminGuestPassSettings;

