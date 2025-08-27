import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Users, 
  MapPin, 
  ArrowLeft,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Calendar,
  School,
  Trophy,
  Target,
  ShoppingBag,
  Package,
  Key
} from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';

const ProjectDashboard = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [projectUsers, setProjectUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Get current active tab from URL
  const getActiveTab = () => {
    const path = window.location.pathname;
    if (path.includes('/bookings')) return 'bookings';
    if (path.includes('/academies')) return 'academies';
    if (path.includes('/sports')) return 'sports';
    if (path.includes('/courts')) return 'courts';
    if (path.includes('/events')) return 'events';
    if (path.includes('/store')) return 'store';
    if (path.includes('/orders')) return 'orders';
    if (path.includes('/gatepass')) return 'gatepass';
    return 'dashboard'; // Default to dashboard/users
  };

  useEffect(() => {
    console.log('ProjectDashboard useEffect - projectId:', projectId);
    if (projectId) {
      const loadData = async () => {
        try {
          console.log('Loading data for project:', projectId);
          
          const projectDoc = await getDocs(query(collection(db, 'projects'), where('__name__', '==', projectId)));
          if (!projectDoc.empty) {
            const projectData = { id: projectId, ...projectDoc.docs[0].data() };
            console.log('Project data loaded:', projectData);
            setProject(projectData);
          } else {
            console.log('No project found with ID:', projectId);
          }
          
          // Fetch users who belong to this project
          setLoading(true);
          const usersSnapshot = await getDocs(collection(db, 'users'));
          const usersData = usersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

          // Filter users who belong to this specific project
          const projectUsersData = usersData.filter(user => {
            if (user.projects && Array.isArray(user.projects)) {
              return user.projects.some(project => project.projectId === projectId);
            }
            return false;
          });

          console.log('Project users loaded:', projectUsersData.length);
          setProjectUsers(projectUsersData);
          setFilteredUsers(projectUsersData);
        } catch (err) {
          console.error('Error loading project data:', err);
        } finally {
          setLoading(false);
        }
      };
      
      loadData();
    } else {
      console.log('No projectId provided');
    }
  }, [projectId]);

  useEffect(() => {
    if (searchTerm || statusFilter !== 'all') {
      let filtered = [...projectUsers];

      if (searchTerm) {
        filtered = filtered.filter(user => 
          user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      if (statusFilter !== 'all') {
        filtered = filtered.filter(user => user.registrationStatus === statusFilter);
      }

      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(projectUsers);
    }
  }, [searchTerm, statusFilter, projectUsers]);



  const getProjectStats = () => {
    const totalUsers = projectUsers.length;
    const activeUsers = projectUsers.filter(user => user.registrationStatus === 'completed').length;
    const pendingUsers = projectUsers.filter(user => user.registrationStatus === 'pending').length;

    return { totalUsers, activeUsers, pendingUsers };
  };

  const handleBackToProjects = () => {
    navigate('/projects');
  };

  const handleUserAction = (action, user) => {
    switch (action) {
      case 'view':
        // Navigate to user details page
        navigate(`/project/${projectId}/users/${user.id}`);
        break;
      case 'edit':
        // Navigate to edit user page
        navigate(`/project/${projectId}/users/${user.id}/edit`);
        break;
      case 'delete':
        // Handle delete user
        console.log('Delete user:', user.id);
        break;
      default:
        break;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading project data...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Project not found</h3>
          <button
            onClick={handleBackToProjects}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  const stats = getProjectStats();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBackToProjects}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
                <div className="flex items-center text-gray-600 mt-1">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>{project.location}</span>
                  <span className="mx-2">•</span>
                  <span className="capitalize">{project.type}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Plus className="h-4 w-4 mr-2 inline" />
                Add User
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Project Services Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => navigate(`/project/${projectId}/dashboard`)}
              className={`flex items-center px-3 py-4 text-sm font-medium border-b-2 transition-colors ${
                getActiveTab() === 'dashboard'
                  ? 'text-blue-600 border-blue-500'
                  : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className="h-4 w-4 mr-2" />
              Users
            </button>
            <button
              onClick={() => navigate(`/project/${projectId}/bookings`)}
              className={`flex items-center px-3 py-4 text-sm font-medium border-b-2 transition-colors ${
                getActiveTab() === 'bookings'
                  ? 'text-blue-600 border-blue-500'
                  : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Bookings
            </button>
            <button
              onClick={() => navigate(`/project/${projectId}/academies`)}
              className={`flex items-center px-3 py-4 text-sm font-medium border-b-2 transition-colors ${
                getActiveTab() === 'academies'
                  ? 'text-blue-600 border-blue-500'
                  : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <School className="h-4 w-4 mr-2" />
              Academies
            </button>
            <button
              onClick={() => navigate(`/project/${projectId}/sports`)}
              className={`flex items-center px-3 py-4 text-sm font-medium border-b-2 transition-colors ${
                getActiveTab() === 'sports'
                  ? 'text-blue-600 border-blue-500'
                  : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Trophy className="h-4 w-4 mr-2" />
              Sports
            </button>
            <button
              onClick={() => navigate(`/project/${projectId}/courts`)}
              className={`flex items-center px-3 py-4 text-sm font-medium border-b-2 transition-colors ${
                getActiveTab() === 'courts'
                  ? 'text-blue-600 border-blue-500'
                  : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <MapPin className="h-4 w-4 mr-2" />
              Courts
            </button>
            <button
              onClick={() => navigate(`/project/${projectId}/events`)}
              className={`flex items-center px-3 py-4 text-sm font-medium border-b-2 transition-colors ${
                getActiveTab() === 'events'
                  ? 'text-blue-600 border-blue-500'
                  : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Target className="h-4 w-4 mr-2" />
              Events
            </button>
            <button
              onClick={() => navigate(`/project/${projectId}/store`)}
              className={`flex items-center px-3 py-4 text-sm font-medium border-b-2 transition-colors ${
                getActiveTab() === 'store'
                  ? 'text-blue-600 border-blue-500'
                  : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <ShoppingBag className="h-4 w-4 mr-2" />
              Store
            </button>
            <button
              onClick={() => navigate(`/project/${projectId}/orders`)}
              className={`flex items-center px-3 py-4 text-sm font-medium border-b-2 transition-colors ${
                getActiveTab() === 'orders'
                  ? 'text-blue-600 border-blue-500'
                  : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Package className="h-4 w-4 mr-2" />
              Orders
            </button>
            <button
              onClick={() => navigate(`/project/${projectId}/gatepass`)}
              className={`flex items-center px-3 py-4 text-sm font-medium border-b-2 transition-colors ${
                getActiveTab() === 'gatepass'
                  ? 'text-blue-600 border-blue-500'
                  : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Key className="h-4 w-4 mr-2" />
              Gate Pass
            </button>
          </nav>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Users className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingUsers}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Users Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Project Users</h2>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="incomplete">Incomplete</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => {
                  const userProject = user.projects?.find(p => p.projectId === projectId);
                  return (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">
                                {user.firstName?.[0]}{user.lastName?.[0]}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {userProject?.unit || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="capitalize">{userProject?.role || 'N/A'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.registrationStatus === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : user.registrationStatus === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.registrationStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleUserAction('view', user)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleUserAction('edit', user)}
                            className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleUserAction('delete', user)}
                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-600">No users match your search criteria in this project.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectDashboard;
