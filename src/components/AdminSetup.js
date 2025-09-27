import React, { useState } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Shield, CheckCircle, AlertCircle } from 'lucide-react';

const AdminSetup = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  const checkAdminStatus = async () => {
    if (!currentUser) return;
    
    try {
      // Check admins collection
      const adminDoc = await getDoc(doc(db, 'admins', currentUser.uid));
      if (adminDoc.exists()) {
        setIsAdmin(true);
        setMessage('✅ You are already an admin!');
        return;
      }
      
      // Check users collection for admin role
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists() && userDoc.data().role === 'admin') {
        setIsAdmin(true);
        setMessage('✅ You have admin role in users collection!');
        return;
      }
      
      setIsAdmin(false);
      setMessage('❌ You are not an admin. Click the button below to add yourself as admin.');
    } catch (error) {
      console.error('Error checking admin status:', error);
      setMessage('❌ Error checking admin status');
    }
  };

  const addAsAdmin = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    setMessage('');
    
    try {
      // Add to admins collection
      await setDoc(doc(db, 'admins', currentUser.uid), {
        email: currentUser.email,
        displayName: currentUser.displayName || 'Admin User',
        createdAt: new Date(),
        role: 'admin',
        permissions: ['all']
      });
      
      // Also update users collection
      await setDoc(doc(db, 'users', currentUser.uid), {
        role: 'admin'
      }, { merge: true });
      
      setIsAdmin(true);
      setMessage('✅ Successfully added as admin! Please refresh the page.');
      
    } catch (error) {
      console.error('Error adding admin:', error);
      setMessage('❌ Error adding admin: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    checkAdminStatus();
  }, [currentUser, checkAdminStatus]);

  if (!currentUser) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
          <p className="text-yellow-800">Please log in to check admin status.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center mb-4">
        <Shield className="h-6 w-6 text-blue-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">Admin Setup</h3>
      </div>
      
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-600 mb-2">
            <strong>User:</strong> {currentUser.email} ({currentUser.uid})
          </p>
        </div>
        
        {message && (
          <div className={`p-3 rounded-lg ${
            message.includes('✅') ? 'bg-green-50 border border-green-200' : 
            message.includes('❌') ? 'bg-red-50 border border-red-200' : 
            'bg-blue-50 border border-blue-200'
          }`}>
            <div className="flex items-center">
              {message.includes('✅') ? (
                <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
              ) : message.includes('❌') ? (
                <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
              ) : null}
              <p className={`text-sm ${
                message.includes('✅') ? 'text-green-800' : 
                message.includes('❌') ? 'text-red-800' : 
                'text-blue-800'
              }`}>
                {message}
              </p>
            </div>
          </div>
        )}
        
        {!isAdmin && (
          <button
            onClick={addAsAdmin}
            disabled={loading}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Adding...' : 'Add Me as Admin'}
          </button>
        )}
        
        <button
          onClick={checkAdminStatus}
          className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Check Admin Status
        </button>
      </div>
    </div>
  );
};

export default AdminSetup;
