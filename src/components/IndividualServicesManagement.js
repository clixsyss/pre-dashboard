import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  DollarSign,
  X,
  ArrowLeft
} from 'lucide-react';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  orderBy, 
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

const IndividualServicesManagement = ({ projectId, selectedCategory, onBack }) => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  
  const [formData, setFormData] = useState({
    englishTitle: '',
    arabicTitle: '',
    englishDescription: '',
    arabicDescription: '',
    price: '',
    status: 'draft' // 'available' or 'draft'
  });

  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');

  // Fetch services for the selected category
  const fetchServices = useCallback(async () => {
    if (!projectId || !selectedCategory) return;
    
    setLoading(true);
    try {
      const q = query(
        collection(db, `projects/${projectId}/serviceCategories/${selectedCategory.id}/services`),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const servicesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setServices(servicesData);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId, selectedCategory]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.englishTitle.trim()) {
      newErrors.englishTitle = 'English title is required';
    }

    if (!formData.arabicTitle.trim()) {
      newErrors.arabicTitle = 'Arabic title is required';
    }

    if (!formData.englishDescription.trim()) {
      newErrors.englishDescription = 'English description is required';
    }

    if (!formData.arabicDescription.trim()) {
      newErrors.arabicDescription = 'Arabic description is required';
    }

    if (!formData.price.trim()) {
      newErrors.price = 'Price is required';
    } else if (isNaN(parseFloat(formData.price)) || parseFloat(formData.price) < 0) {
      newErrors.price = 'Please enter a valid price';
    }


    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const serviceData = {
        englishTitle: formData.englishTitle.trim(),
        arabicTitle: formData.arabicTitle.trim(),
        englishDescription: formData.englishDescription.trim(),
        arabicDescription: formData.arabicDescription.trim(),
        price: parseFloat(formData.price),
        categoryId: selectedCategory.id,
        categoryName: selectedCategory.englishTitle,
        createdAt: editingService ? editingService.createdAt : serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      if (editingService) {
        // Update existing service
        await updateDoc(doc(db, `projects/${projectId}/serviceCategories/${selectedCategory.id}/services`, editingService.id), serviceData);
        setSuccess('Service updated successfully!');
      } else {
        // Create new service
        await addDoc(collection(db, `projects/${projectId}/serviceCategories/${selectedCategory.id}/services`), serviceData);
        setSuccess('Service created successfully!');
      }

      // Reset form and close modal
      resetForm();
      setShowModal(false);
      fetchServices();
    } catch (error) {
      console.error('Error saving service:', error);
      setErrors({ submit: 'Failed to save service. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      englishTitle: '',
      arabicTitle: '',
      englishDescription: '',
      arabicDescription: '',
      price: '',
      status: 'draft'
    });
    setEditingService(null);
    setErrors({});
  };

  // Handle edit
  const handleEdit = (service) => {
    setEditingService(service);
    setFormData({
      englishTitle: service.englishTitle,
      arabicTitle: service.arabicTitle,
      englishDescription: service.englishDescription,
      arabicDescription: service.arabicDescription,
      price: service.price.toString(),
      status: service.status || 'draft'
    });
    setShowModal(true);
  };

  // Handle status toggle
  const handleStatusToggle = async (serviceId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'available' ? 'draft' : 'available';
      await updateDoc(doc(db, `projects/${projectId}/serviceCategories/${selectedCategory.id}/services`, serviceId), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      setSuccess(`Service ${newStatus === 'available' ? 'published' : 'moved to draft'} successfully!`);
      fetchServices();
    } catch (error) {
      console.error('Error updating status:', error);
      setErrors({ submit: 'Failed to update status. Please try again.' });
    }
  };

  // Handle delete
  const handleDelete = async (serviceId) => {
    if (!window.confirm('Are you sure you want to delete this service?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, `projects/${projectId}/serviceCategories/${selectedCategory.id}/services`, serviceId));
      setSuccess('Service deleted successfully!');
      fetchServices();
    } catch (error) {
      console.error('Error deleting service:', error);
      setErrors({ submit: 'Failed to delete service. Please try again.' });
    }
  };


  // Clear success message
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  return (
    <div className="individual-services-management">
      <div className="page-header">
        <div className="header-content">
          <div className="header-left">
            <button onClick={onBack} className="back-btn">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="header-text">
              <h2>{selectedCategory?.englishTitle} Services</h2>
              <p className="header-subtitle">{selectedCategory?.arabicTitle}</p>
            </div>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="btn-primary"
          >
            <Plus className="h-4 w-4" />
            Add Service
          </button>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="success-message">
          {success}
        </div>
      )}

      {/* Error Message */}
      {errors.submit && (
        <div className="error-message">
          {errors.submit}
        </div>
      )}

      {/* Services List */}
      <div className="services-list">
        {loading ? (
          <div className="loading">Loading services...</div>
        ) : services.length === 0 ? (
          <div className="empty-state">
            <DollarSign className="h-12 w-12 text-gray-400" />
            <h3>No services in this category</h3>
            <p>Add services to this category to get started</p>
          </div>
        ) : (
          services.map((service) => (
            <div key={service.id} className="service-item">
              <div className="service-content">
                <div className="service-header">
                  <div className="service-title-section">
                    <h3 className="service-title">{service.englishTitle}</h3>
                    <div className={`status-badge ${service.status || 'draft'}`}>
                      {service.status === 'available' ? 'Available' : 'Draft'}
                    </div>
                  </div>
                  <div className="service-price">
                    <DollarSign className="h-4 w-4" />
                    <span>{service.price}</span>
                  </div>
                </div>
                
                <p className="service-subtitle">{service.arabicTitle}</p>
                
                <div className="service-descriptions">
                  <div className="description-section">
                    <h4>English Description:</h4>
                    <p>{service.englishDescription}</p>
                  </div>
                  <div className="description-section">
                    <h4>Arabic Description:</h4>
                    <p>{service.arabicDescription}</p>
                  </div>
                </div>
              </div>
              
              <div className="service-actions">
                <button
                  onClick={() => handleStatusToggle(service.id, service.status || 'draft')}
                  className={`action-btn status-btn ${service.status === 'available' ? 'available' : 'draft'}`}
                  title={service.status === 'available' ? 'Move to Draft' : 'Make Available'}
                >
                  {service.status === 'available' ? 'Draft' : 'Publish'}
                </button>
                <button
                  onClick={() => handleEdit(service)}
                  className="action-btn edit-btn"
                  title="Edit Service"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(service.id)}
                  className="action-btn delete-btn"
                  title="Delete Service"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Service Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content service-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingService ? 'Edit Service' : 'Add Service'}</h3>
              <button onClick={() => setShowModal(false)} className="close-btn">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="service-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="englishTitle">English Title *</label>
                  <input
                    type="text"
                    id="englishTitle"
                    name="englishTitle"
                    value={formData.englishTitle}
                    onChange={handleInputChange}
                    className={errors.englishTitle ? 'error' : ''}
                    placeholder="e.g., Plumbing Repair"
                  />
                  {errors.englishTitle && <span className="error-text">{errors.englishTitle}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="arabicTitle">Arabic Title *</label>
                  <input
                    type="text"
                    id="arabicTitle"
                    name="arabicTitle"
                    value={formData.arabicTitle}
                    onChange={handleInputChange}
                    className={errors.arabicTitle ? 'error' : ''}
                    placeholder="e.g., إصلاح السباكة"
                  />
                  {errors.arabicTitle && <span className="error-text">{errors.arabicTitle}</span>}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="englishDescription">English Description *</label>
                <textarea
                  id="englishDescription"
                  name="englishDescription"
                  value={formData.englishDescription}
                  onChange={handleInputChange}
                  className={errors.englishDescription ? 'error' : ''}
                  placeholder="Describe the service in English..."
                  rows="3"
                />
                {errors.englishDescription && <span className="error-text">{errors.englishDescription}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="arabicDescription">Arabic Description *</label>
                <textarea
                  id="arabicDescription"
                  name="arabicDescription"
                  value={formData.arabicDescription}
                  onChange={handleInputChange}
                  className={errors.arabicDescription ? 'error' : ''}
                  placeholder="وصف الخدمة باللغة العربية..."
                  rows="3"
                />
                {errors.arabicDescription && <span className="error-text">{errors.arabicDescription}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="price">Price (EGP) *</label>
                <div className="price-input">
                  <DollarSign className="h-4 w-4" />
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    className={errors.price ? 'error' : ''}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>
                {errors.price && <span className="error-text">{errors.price}</span>}
              </div>


              {/* Status Section */}
              <div className="form-group">
                <label className="form-section-label">Status</label>
                <div className="status-toggle">
                  <label className="status-option">
                    <input
                      type="radio"
                      name="status"
                      value="draft"
                      checked={formData.status === 'draft'}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    />
                    <span className="status-label draft">Draft</span>
                  </label>
                  <label className="status-option">
                    <input
                      type="radio"
                      name="status"
                      value="available"
                      checked={formData.status === 'available'}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    />
                    <span className="status-label available">Available</span>
                  </label>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : (editingService ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Add CSS styles
const styles = `
  .form-section {
    margin: 24px 0;
    padding: 20px;
    background: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #e9ecef;
  }

  .form-section-title {
    font-size: 16px;
    font-weight: 600;
    color: #495057;
    margin: 0 0 8px 0;
  }

  .form-section-description {
    font-size: 14px;
    color: #6c757d;
    margin: 0 0 16px 0;
  }

  .time-slot-preview {
    margin-top: 16px;
    padding: 12px;
    background: white;
    border-radius: 6px;
    border: 1px solid #dee2e6;
  }

  .preview-label {
    font-size: 14px;
    font-weight: 500;
    color: #495057;
    margin-bottom: 8px;
    display: block;
  }

  .preview-slots {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .preview-slot {
    background: #e3f2fd;
    color: #1976d2;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 16px;
    margin-bottom: 16px;
  }

  @media (max-width: 768px) {
    .form-row {
      grid-template-columns: 1fr;
    }
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export default IndividualServicesManagement;
