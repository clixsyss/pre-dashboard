import React, { useState } from 'react';
import { 
  Settings, 
  Users, 
  Building
} from 'lucide-react';
import ServiceCategoriesManagement from './ServiceCategoriesManagement';
import IndividualServicesManagement from './IndividualServicesManagement';
import ServiceBookingRequests from './ServiceBookingRequests';

const ServicesManagement = ({ projectId }) => {
  const [activeTab, setActiveTab] = useState('categories');
  const [selectedCategory, setSelectedCategory] = useState(null);

  const tabs = [
    { 
      id: 'categories', 
      name: 'Service Categories', 
      icon: Building, 
      color: 'blue',
      description: 'Manage service categories and availability'
    },
    { 
      id: 'bookings', 
      name: 'Booking Requests', 
      icon: Users, 
      color: 'green',
      description: 'View and manage service booking requests'
    }
  ];

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setActiveTab('services');
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setActiveTab('categories');
  };

  if (activeTab === 'services' && selectedCategory) {
    return (
      <IndividualServicesManagement
        projectId={projectId}
        selectedCategory={selectedCategory}
        onBack={handleBackToCategories}
      />
    );
  }

  return (
    <div className="services-management">
      <div className="page-header">
        <div className="header-content">
          <div className="header-left">
            <div className="header-icon">
              <Settings className="h-6 w-6" />
            </div>
            <div className="header-text">
              <h1>Services Management</h1>
              <p>Manage service categories, individual services, and booking requests</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="tabs-navigation">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            >
              <div className="tab-icon">
                <Icon className="h-5 w-5" />
              </div>
              <div className="tab-content">
                <span className="tab-name">{tab.name}</span>
                <span className="tab-description">{tab.description}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="tab-content-area">
        {activeTab === 'categories' && (
          <div className="categories-section">
            <ServiceCategoriesManagement 
              projectId={projectId} 
              onCategorySelect={handleCategorySelect}
            />
          </div>
        )}
        
        {activeTab === 'bookings' && (
          <div className="bookings-section">
            <ServiceBookingRequests projectId={projectId} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ServicesManagement;
