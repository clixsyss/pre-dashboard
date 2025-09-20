import React from 'react';
import { useAdminAuth } from '../contexts/AdminAuthContext';

const TestComponent = () => {
  console.log('🔥 TestComponent: Component is being called!');
  
  const { currentAdmin, loading } = useAdminAuth();

  console.log('TestComponent: Rendering with admin:', currentAdmin);
  console.log('TestComponent: Hook values:', { loading, hasAdmin: !!currentAdmin });

  return (
    <div style={{ padding: '20px', backgroundColor: 'lightblue', minHeight: '100vh' }}>
      <h1>TEST COMPONENT - NON-SUPER ADMIN</h1>
      <div style={{ backgroundColor: 'white', padding: '20px', margin: '20px 0' }}>
        <h2>Admin Info:</h2>
        <p><strong>Loading:</strong> {loading.toString()}</p>
        <p><strong>Admin Exists:</strong> {currentAdmin ? 'YES' : 'NO'}</p>
        <p><strong>Admin Email:</strong> {currentAdmin?.email || 'N/A'}</p>
        <p><strong>Account Type:</strong> {currentAdmin?.accountType || 'N/A'}</p>
        <p><strong>Is Active:</strong> {currentAdmin?.isActive?.toString() || 'N/A'}</p>
        <p><strong>Assigned Projects:</strong> {JSON.stringify(currentAdmin?.assignedProjects) || 'N/A'}</p>
      </div>
      
      <div style={{ backgroundColor: 'yellow', padding: '20px' }}>
        <h2>If you can see this, the routing works!</h2>
        <p>The issue is specifically with the ProjectSelection component.</p>
      </div>
    </div>
  );
};

export default TestComponent;
