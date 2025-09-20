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
    <div className="services-management-content">
      

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
