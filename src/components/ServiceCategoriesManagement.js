import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Upload, 
  Image, 
  Clock,
  Calendar,
  X,
  Wrench,
  Settings
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
import { 
  ref as storageRef, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, storage } from '../config/firebase';

const ServiceCategoriesManagement = ({ projectId, onCategorySelect }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  const [formData, setFormData] = useState({
    englishTitle: '',
    arabicTitle: '',
    image: null,
    imageUrl: '',
    status: 'draft', // 'available' or 'draft'
    availability: {
      sunday: { available: true, startTime: '09:00', endTime: '17:00' },
      monday: { available: true, startTime: '09:00', endTime: '17:00' },
      tuesday: { available: true, startTime: '09:00', endTime: '17:00' },
      wednesday: { available: true, startTime: '09:00', endTime: '17:00' },
      thursday: { available: true, startTime: '09:00', endTime: '17:00' },
      friday: { available: true, startTime: '09:00', endTime: '17:00' },
      saturday: { available: true, startTime: '09:00', endTime: '17:00' }
    }
  });

  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    if (!projectId) return;
    
    setLoading(true);
    try {
      const q = query(
        collection(db, `projects/${projectId}/serviceCategories`),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const categoriesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

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


  // Handle availability changes
  const handleAvailabilityChange = (day, field, value) => {
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: {
          ...prev.availability[day],
          [field]: field === 'available' ? value === 'true' : value
        }
      }
    }));
  };

  // Handle image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({ ...prev, image: 'Please select a valid image file' }));
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, image: 'Image size must be less than 5MB' }));
      return;
    }

    setFormData(prev => ({ ...prev, image: file }));
    setErrors(prev => ({ ...prev, image: '' }));
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

    if (!editingCategory && !formData.image && !formData.imageUrl) {
      newErrors.image = 'Service image is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Upload image to Firebase Storage
  const uploadImage = async (file) => {
    const imageRef = storageRef(storage, `serviceCategories/${projectId}/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(imageRef, file);
    return await getDownloadURL(snapshot.ref);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      let imageUrl = formData.imageUrl;

      // Upload new image if provided
      if (formData.image) {
        imageUrl = await uploadImage(formData.image);
      }

      const categoryData = {
        englishTitle: formData.englishTitle.trim(),
        arabicTitle: formData.arabicTitle.trim(),
        imageUrl,
        availability: formData.availability,
        createdAt: editingCategory ? editingCategory.createdAt : serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      if (editingCategory) {
        // Update existing category
        await updateDoc(doc(db, `projects/${projectId}/serviceCategories`, editingCategory.id), categoryData);
        setSuccess('Service category updated successfully!');
      } else {
        // Create new category
        await addDoc(collection(db, `projects/${projectId}/serviceCategories`), categoryData);
        setSuccess('Service category created successfully!');
      }

      // Reset form and close modal
      resetForm();
      setShowModal(false);
      fetchCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      setErrors({ submit: 'Failed to save category. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      englishTitle: '',
      arabicTitle: '',
      image: null,
      imageUrl: '',
      status: 'draft',
      availability: {
        sunday: { available: true, startTime: '09:00', endTime: '17:00' },
        monday: { available: true, startTime: '09:00', endTime: '17:00' },
        tuesday: { available: true, startTime: '09:00', endTime: '17:00' },
        wednesday: { available: true, startTime: '09:00', endTime: '17:00' },
        thursday: { available: true, startTime: '09:00', endTime: '17:00' },
        friday: { available: true, startTime: '09:00', endTime: '17:00' },
        saturday: { available: true, startTime: '09:00', endTime: '17:00' }
      }
    });
    setEditingCategory(null);
    setErrors({});
  };

  // Handle edit
  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      englishTitle: category.englishTitle,
      arabicTitle: category.arabicTitle,
      image: null,
      imageUrl: category.imageUrl,
      status: category.status || 'draft',
      availability: category.availability
    });
    setShowModal(true);
  };

  // Handle delete
  const handleDelete = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this service category? This will also delete all services in this category.')) {
      return;
    }

    try {
      // Delete image from storage if it exists
      const category = categories.find(c => c.id === categoryId);
      if (category?.imageUrl) {
        try {
          const imageRef = storageRef(storage, category.imageUrl);
          await deleteObject(imageRef);
        } catch (error) {
          console.log('Image not found in storage, continuing with deletion');
        }
      }

      await deleteDoc(doc(db, `projects/${projectId}/serviceCategories`, categoryId));
      setSuccess('Service category deleted successfully!');
      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      setErrors({ submit: 'Failed to delete category. Please try again.' });
    }
  };

  // Handle availability modal
  const handleAvailabilityClick = (category) => {
    setSelectedCategory(category);
    setShowAvailabilityModal(true);
  };

  // Handle status toggle
  const handleStatusToggle = async (categoryId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'available' ? 'draft' : 'available';
      await updateDoc(doc(db, `projects/${projectId}/serviceCategories`, categoryId), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      setSuccess(`Category ${newStatus === 'available' ? 'published' : 'moved to draft'} successfully!`);
      fetchCategories();
    } catch (error) {
      console.error('Error updating status:', error);
      setErrors({ submit: 'Failed to update status. Please try again.' });
    }
  };

  // Update availability
  const updateAvailability = async (updatedAvailability) => {
    try {
      await updateDoc(doc(db, `projects/${projectId}/serviceCategories`, selectedCategory.id), {
        availability: updatedAvailability,
        updatedAt: serverTimestamp()
      });
      setSuccess('Availability updated successfully!');
      setShowAvailabilityModal(false);
      fetchCategories();
    } catch (error) {
      console.error('Error updating availability:', error);
      setErrors({ submit: 'Failed to update availability. Please try again.' });
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
    <div className="service-categories-management">
      <div className="page-header">
        <div className="header-content">
          <h2>Service Categories Management</h2>
          <button 
            onClick={() => setShowModal(true)}
            className="btn-primary"
          >
            <Plus className="h-4 w-4" />
            Add Category
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

      {/* Categories Grid */}
      <div className="categories-grid">
        {loading ? (
          <div className="loading">Loading categories...</div>
        ) : categories.length === 0 ? (
          <div className="empty-state">
            <Image className="h-12 w-12 text-gray-400" />
            <h3>No service categories</h3>
            <p>Create your first service category to get started</p>
          </div>
        ) : (
          categories.map((category) => (
            <div key={category.id} className="category-card">
              <div className="category-image">
                {category.imageUrl ? (
                  <img src={category.imageUrl} alt={category.englishTitle} />
                ) : (
                  <div className="placeholder-image">
                    <Wrench className="h-12 w-12 text-gray-400" />
                  </div>
                )}
              </div>
              
              <div className="category-content">
                <div className="category-header">
                  <h3 className="category-title">{category.englishTitle}</h3>
                  <div className={`status-badge ${category.status || 'draft'}`}>
                    {category.status === 'available' ? 'Available' : 'Draft'}
                  </div>
                </div>
                <p className="category-subtitle">{category.arabicTitle}</p>
                
                <div className="category-availability">
                  <Clock className="h-4 w-4" />
                  <span>Availability</span>
                </div>
              </div>
              
              <div className="category-actions">
                <button
                  onClick={() => handleStatusToggle(category.id, category.status || 'draft')}
                  className={`action-btn status-btn ${category.status === 'available' ? 'available' : 'draft'}`}
                  title={category.status === 'available' ? 'Move to Draft' : 'Make Available'}
                >
                  {category.status === 'available' ? 'Draft' : 'Publish'}
                </button>
                <button
                  onClick={() => onCategorySelect && onCategorySelect(category)}
                  className="action-btn manage-btn"
                  title="Manage Services"
                >
                  <Settings className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleAvailabilityClick(category)}
                  className="action-btn availability-btn"
                  title="Manage Availability"
                >
                  <Calendar className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleEdit(category)}
                  className="action-btn edit-btn"
                  title="Edit Category"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(category.id)}
                  className="action-btn delete-btn"
                  title="Delete Category"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Category Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingCategory ? 'Edit Service Category' : 'Add Service Category'}</h3>
              <button onClick={() => setShowModal(false)} className="close-btn">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="category-form">
              <div className="form-group">
                <label htmlFor="englishTitle">English Title *</label>
                <input
                  type="text"
                  id="englishTitle"
                  name="englishTitle"
                  value={formData.englishTitle}
                  onChange={handleInputChange}
                  className={errors.englishTitle ? 'error' : ''}
                  placeholder="e.g., Home Maintenance"
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
                  placeholder="e.g., صيانة المنزل"
                />
                {errors.arabicTitle && <span className="error-text">{errors.arabicTitle}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="image">Service Image *</label>
                <div className="image-upload">
                  <input
                    type="file"
                    id="image"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="file-input"
                  />
                  <label htmlFor="image" className="file-label">
                    <Upload className="h-4 w-4" />
                    Choose Photo
                  </label>
                  {formData.image && (
                    <div className="image-preview">
                      <img src={URL.createObjectURL(formData.image)} alt="Preview" />
                    </div>
                  )}
                  {formData.imageUrl && !formData.image && (
                    <div className="image-preview">
                      <img src={formData.imageUrl} alt="Current" />
                    </div>
                  )}
                </div>
                {errors.image && <span className="error-text">{errors.image}</span>}
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

              {/* Availability Section */}
              <div className="form-group">
                <label className="form-section-label">Availability Times</label>
                <div className="availability-section">
                  {Object.entries(formData.availability).map(([day, schedule]) => (
                    <div key={day} className="availability-row">
                      <div className="day-label">
                        <span className="day-name">{day.charAt(0).toUpperCase() + day.slice(1)}</span>
                      </div>
                      
                      <div className="availability-controls">
                        <select
                          value={schedule.available.toString()}
                          onChange={(e) => handleAvailabilityChange(day, 'available', e.target.value)}
                          className="availability-select"
                        >
                          <option value="true">Available</option>
                          <option value="false">Not Available</option>
                        </select>
                        
                        {schedule.available && (
                          <>
                            <input
                              type="time"
                              value={schedule.startTime}
                              onChange={(e) => handleAvailabilityChange(day, 'startTime', e.target.value)}
                              className="time-input"
                            />
                            <span className="time-separator">to</span>
                            <input
                              type="time"
                              value={schedule.endTime}
                              onChange={(e) => handleAvailabilityChange(day, 'endTime', e.target.value)}
                              className="time-input"
                            />
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : (editingCategory ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Availability Modal */}
      {showAvailabilityModal && selectedCategory && (
        <AvailabilityModal
          category={selectedCategory}
          onClose={() => setShowAvailabilityModal(false)}
          onSave={updateAvailability}
        />
      )}
    </div>
  );
};

// Availability Modal Component
const AvailabilityModal = ({ category, onClose, onSave }) => {
  const [availability, setAvailability] = useState(category.availability);

  const handleAvailabilityChange = (day, field, value) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: field === 'available' ? value === 'true' : value
      }
    }));
  };

  const handleSave = () => {
    onSave(availability);
  };

  const days = [
    { key: 'sunday', label: 'Sunday' },
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content availability-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Manage Availability - {category.englishTitle}</h3>
          <button onClick={onClose} className="close-btn">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="availability-content">
          {days.map((day) => (
            <div key={day.key} className="availability-row">
              <div className="day-label">
                <span>{day.label}</span>
              </div>
              
              <div className="availability-controls">
                <select
                  value={availability[day.key].available.toString()}
                  onChange={(e) => handleAvailabilityChange(day.key, 'available', e.target.value)}
                  className="availability-select"
                >
                  <option value="true">Available</option>
                  <option value="false">Not Available</option>
                </select>
                
                {availability[day.key].available && (
                  <>
                    <input
                      type="time"
                      value={availability[day.key].startTime}
                      onChange={(e) => handleAvailabilityChange(day.key, 'startTime', e.target.value)}
                      className="time-input"
                    />
                    <span className="time-separator">to</span>
                    <input
                      type="time"
                      value={availability[day.key].endTime}
                      onChange={(e) => handleAvailabilityChange(day.key, 'endTime', e.target.value)}
                      className="time-input"
                    />
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="modal-actions">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button onClick={handleSave} className="btn-primary">
            Save Availability
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceCategoriesManagement;
