import React, { useState } from 'react';
import RequestCategoriesManagement from './RequestCategoriesManagement';
import RequestSubmissionsManagement from './RequestSubmissionsManagement';

const RequestsManagement = ({ projectId, activeTab = 'categories' }) => {
  const [selectedCategory, setSelectedCategory] = useState(null);

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
  };

  if (activeTab === 'submissions' && selectedCategory) {
    return (
      <RequestSubmissionsManagement
        projectId={projectId}
        selectedCategory={selectedCategory}
        onBack={handleBackToCategories}
      />
    );
  }

  // Show categories management for categories tab
  if (activeTab === 'categories') {
    return (
      <RequestCategoriesManagement 
        projectId={projectId} 
        onCategorySelect={handleCategorySelect}
      />
    );
  }

  // Show submissions management for submissions tab
  if (activeTab === 'submissions') {
    return (
      <RequestSubmissionsManagement projectId={projectId} />
    );
  }

  return null;
};

export default RequestsManagement;
