import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Users, 
  School, 
  Trophy, 
  MapPin, 
  ShoppingBag, 
  Package, 
  Calendar, 
  Target,
  Key
} from 'lucide-react';
import { useAcademyStore } from '../stores/academyStore';
import { useSportsStore } from '../stores/sportsStore';
import { useCourtStore } from '../stores/courtStore';
import { useUserStore } from '../stores/userStore';
import { useStoreManagementStore } from '../stores/storeManagementStore';
import { useOrderStore } from '../stores/orderStore';
import { useGatePassStore } from '../stores/gatePassStore';

const ProjectServices = () => {
  const { projectId } = useParams();
  
  const { academyOptions, fetchAcademies } = useAcademyStore();
  const { sports, fetchSports } = useSportsStore();
  const { courts, fetchCourts } = useCourtStore();
  const { users, fetchUsers } = useUserStore();
  const { products, fetchProducts } = useStoreManagementStore();
  const { orders, fetchOrders } = useOrderStore();
  const { gatePasses, fetchGatePasses } = useGatePassStore();

  useEffect(() => {
    if (projectId) {
      fetchAcademies(projectId);
      fetchSports(projectId);
      fetchCourts(projectId);
      fetchUsers(projectId);
      fetchProducts(projectId);
      fetchOrders(projectId);
      fetchGatePasses(projectId);
    }
  }, [projectId, fetchAcademies, fetchSports, fetchCourts, fetchUsers, fetchProducts, fetchOrders, fetchGatePasses]);

  const stats = {
    users: users.length,
    academies: academyOptions.length,
    sports: sports.length,
    courts: courts.length,
    products: products.length,
    orders: orders.length,
    gatePasses: gatePasses.length
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Project Services Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <h3 className="font-semibold">Users</h3>
              <p className="text-2xl font-bold text-blue-600">{stats.users}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <School className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <h3 className="font-semibold">Academies</h3>
              <p className="text-2xl font-bold text-green-600">{stats.academies}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <Trophy className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <h3 className="font-semibold">Sports</h3>
              <p className="text-2xl font-bold text-purple-600">{stats.sports}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <MapPin className="h-8 w-8 text-orange-600 mr-3" />
            <div>
              <h3 className="font-semibold">Courts</h3>
              <p className="text-2xl font-bold text-orange-600">{stats.courts}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <ShoppingBag className="h-8 w-8 text-indigo-600 mr-3" />
            <div>
              <h3 className="font-semibold">Products</h3>
              <p className="text-2xl font-bold text-indigo-600">{stats.products}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-pink-600 mr-3" />
            <div>
              <h3 className="font-semibold">Orders</h3>
              <p className="text-2xl font-bold text-pink-600">{stats.orders}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <Key className="h-8 w-8 text-red-600 mr-3" />
            <div>
              <h3 className="font-semibold">Gate Passes</h3>
              <p className="text-2xl font-bold text-red-600">{stats.gatePasses}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectServices;
