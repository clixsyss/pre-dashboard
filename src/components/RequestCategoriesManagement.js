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
  Settings,
  FileText,
  Type,
  Hash,
  DollarSign,
  ToggleLeft,
  ToggleRight,
  Phone,
  Mail
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

const RequestCategoriesManagement = ({ projectId, onCategorySelect }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [showFieldsModal, setShowFieldsModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [showFieldEditModal, setShowFieldEditModal] = useState(false);
  
  const [formData, setFormData] = useState({
    englishTitle: '',
    arabicTitle: '',
    image: null,
    imageUrl: '',
    status: 'draft', // 'available' or 'draft'
    fields: [], // Array of field objects
    allowMediaUpload: false,
    mediaRequired: false,
    description: ''
  });

  const [fieldFormData, setFieldFormData] = useState({
    fieldName: '',
    fieldType: 'text', // 'text', 'number', 'currency', 'description'
    required: false,
    placeholder: ''
  });

  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');

  // Field types configuration
  const fieldTypes = [
    { value: 'text', label: 'Text', icon: Type },
    { value: 'number', label: 'Number', icon: Hash },
    { value: 'currency', label: 'Currency', icon: DollarSign },
    { value: 'description', label: 'Description (Long Text)', icon: FileText },
    { value: 'phone', label: 'Phone Number', icon: Phone },
    { value: 'email', label: 'Email Address', icon: Mail }
  ];

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    if (!projectId) return;
    
    setLoading(true);
    try {
      const q = query(
        collection(db, `projects/${projectId}/requestCategories`),
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
      setErrors({ fetch: 'Failed to fetch categories' });
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Upload image to Firebase Storage
  const uploadImage = async (imageFile) => {
    const imageRef = storageRef(storage, `projects/${projectId}/request-categories/${Date.now()}_${imageFile.name}`);
    const snapshot = await uploadBytes(imageRef, imageFile);
    return await getDownloadURL(snapshot.ref);
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

    if (formData.fields.length === 0) {
      newErrors.fields = 'At least one field is required';
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
      let imageUrl = formData.imageUrl;

      // Upload new image if provided
      if (formData.image) {
        imageUrl = await uploadImage(formData.image);
      }

      const categoryData = {
        englishTitle: formData.englishTitle.trim(),
        arabicTitle: formData.arabicTitle.trim(),
        imageUrl,
        status: formData.status,
        fields: formData.fields,
        allowMediaUpload: formData.allowMediaUpload,
        mediaRequired: formData.allowMediaUpload ? formData.mediaRequired : false,
        description: formData.description.trim(),
        createdAt: editingCategory ? editingCategory.createdAt : serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      if (editingCategory) {
        // Update existing category
        await updateDoc(doc(db, `projects/${projectId}/requestCategories`, editingCategory.id), categoryData);
        setSuccess('Request category updated successfully!');
      } else {
        // Create new category
        await addDoc(collection(db, `projects/${projectId}/requestCategories`), categoryData);
        setSuccess('Request category created successfully!');
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
      fields: [],
      allowMediaUpload: false,
      mediaRequired: false,
      description: ''
    });
    setEditingCategory(null);
    setErrors({});
  };

  // Handle edit
  const handleEdit = (category) => {
    setFormData({
      englishTitle: category.englishTitle || '',
      arabicTitle: category.arabicTitle || '',
      image: null,
      imageUrl: category.imageUrl || '',
      status: category.status || 'draft',
      fields: category.fields || [],
      allowMediaUpload: category.allowMediaUpload || false,
      mediaRequired: category.mediaRequired || false,
      description: category.description || ''
    });
    setEditingCategory(category);
    setShowModal(true);
  };

  // Handle delete
  const handleDelete = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    
    try {
      setLoading(true);
      await deleteDoc(doc(db, `projects/${projectId}/requestCategories`, categoryId));
      setSuccess('Category deleted successfully!');
      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      setErrors({ delete: 'Failed to delete category' });
    } finally {
      setLoading(false);
    }
  };

  // Handle field management
  const addField = () => {
    if (!fieldFormData.fieldName.trim()) {
      setErrors({ fieldName: 'Field name is required' });
      return;
    }

    const newField = {
      id: Date.now().toString(),
      fieldName: fieldFormData.fieldName.trim(),
      fieldType: fieldFormData.fieldType,
      required: fieldFormData.required,
      placeholder: fieldFormData.placeholder.trim()
    };

    setFormData(prev => ({
      ...prev,
      fields: [...prev.fields, newField]
    }));

    setFieldFormData({
      fieldName: '',
      fieldType: 'text',
      required: false,
      placeholder: ''
    });
    setErrors({});
  };

  const removeField = (fieldId) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.filter(field => field.id !== fieldId)
    }));
  };

  const openFieldsModal = (category) => {
    setSelectedCategory(category);
    setShowFieldsModal(true);
  };

  // Handle field editing
  const handleEditField = (field) => {
    setEditingField(field);
    setFieldFormData({
      fieldName: field.fieldName,
      fieldType: field.fieldType,
      required: field.required,
      placeholder: field.placeholder || ''
    });
    setShowFieldEditModal(true);
  };

  const handleUpdateField = () => {
    if (!editingField || !fieldFormData.fieldName.trim()) {
      setErrors({ fieldName: 'Field name is required' });
      return;
    }

    const updatedField = {
      ...editingField,
      fieldName: fieldFormData.fieldName.trim(),
      fieldType: fieldFormData.fieldType,
      required: fieldFormData.required,
      placeholder: fieldFormData.placeholder.trim()
    };

    // Update the field in the selected category
    setSelectedCategory(prev => ({
      ...prev,
      fields: prev.fields.map(field => 
        field.id === editingField.id ? updatedField : field
      )
    }));

    // Update the field in the main form data if we're editing a category
    if (editingCategory && editingCategory.id === selectedCategory.id) {
      setFormData(prev => ({
        ...prev,
        fields: prev.fields.map(field => 
          field.id === editingField.id ? updatedField : field
        )
      }));
    }

    // Reset form
    setFieldFormData({
      fieldName: '',
      fieldType: 'text',
      required: false,
      placeholder: ''
    });
    setEditingField(null);
    setShowFieldEditModal(false);
    setErrors({});
  };

  const handleDeleteField = async (fieldId) => {
    if (!window.confirm('Are you sure you want to delete this field?')) return;

    // Remove field from selected category
    setSelectedCategory(prev => ({
      ...prev,
      fields: prev.fields.filter(field => field.id !== fieldId)
    }));

    // Update the field in the main form data if we're editing a category
    if (editingCategory && editingCategory.id === selectedCategory.id) {
      setFormData(prev => ({
        ...prev,
        fields: prev.fields.filter(field => field.id !== fieldId)
      }));
    }

    // Save the updated category
    try {
      await updateDoc(doc(db, `projects/${projectId}/requestCategories`, selectedCategory.id), {
        fields: selectedCategory.fields.filter(field => field.id !== fieldId),
        updatedAt: serverTimestamp()
      });
      setSuccess('Field deleted successfully!');
      fetchCategories();
    } catch (error) {
      console.error('Error deleting field:', error);
      setErrors({ delete: 'Failed to delete field' });
    }
  };

  const handleSaveFields = async () => {
    try {
      await updateDoc(doc(db, `projects/${projectId}/requestCategories`, selectedCategory.id), {
        fields: selectedCategory.fields,
        updatedAt: serverTimestamp()
      });
      setSuccess('Fields updated successfully!');
      setShowFieldsModal(false);
      fetchCategories();
    } catch (error) {
      console.error('Error saving fields:', error);
      setErrors({ save: 'Failed to save fields' });
    }
  };

  const getFieldTypeIcon = (fieldType) => {
    const fieldTypeConfig = fieldTypes.find(ft => ft.value === fieldType);
    return fieldTypeConfig ? fieldTypeConfig.icon : Type;
  };

  const getFieldTypeLabel = (fieldType) => {
    const fieldTypeConfig = fieldTypes.find(ft => ft.value === fieldType);
    return fieldTypeConfig ? fieldTypeConfig.label : fieldType;
  };

  if (loading && categories.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Request Categories</h2>
          <p className="text-gray-600">Manage request categories and their form fields</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Add Category
        </button>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
          <button
            onClick={() => setSuccess('')}
            className="ml-2 text-green-600 hover:text-green-800"
          >
            ×
          </button>
        </div>
      )}

      {/* Error Message */}
      {Object.keys(errors).length > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {Object.values(errors).join(', ')}
          <button
            onClick={() => setErrors({})}
            className="ml-2 text-red-600 hover:text-red-800"
          >
            ×
          </button>
        </div>
      )}

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <div key={category.id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {category.imageUrl ? (
                    <img
                      src={category.imageUrl}
                      alt={category.englishTitle}
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Image className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{category.englishTitle}</h3>
                    <p className="text-sm text-gray-600">{category.arabicTitle}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  category.status === 'available' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {category.status}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <FileText className="h-4 w-4 mr-2" />
                  {category.fields?.length || 0} fields
                </div>
                {category.allowMediaUpload && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Upload className="h-4 w-4 mr-2" />
                    Media upload enabled
                  </div>
                )}
                {category.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">{category.description}</p>
                )}
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(category)}
                  className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </button>
                <button
                  onClick={() => openFieldsModal(category)}
                  className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Fields
                </button>
                <button
                  onClick={() => handleDelete(category.id)}
                  className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 flex items-center justify-center"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingCategory ? 'Edit Category' : 'Create New Category'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    English Title *
                  </label>
                  <input
                    type="text"
                    value={formData.englishTitle}
                    onChange={(e) => setFormData(prev => ({ ...prev, englishTitle: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Enter English title"
                  />
                  {errors.englishTitle && (
                    <p className="text-red-500 text-xs mt-1">{errors.englishTitle}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Arabic Title *
                  </label>
                  <input
                    type="text"
                    value={formData.arabicTitle}
                    onChange={(e) => setFormData(prev => ({ ...prev, arabicTitle: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Enter Arabic title"
                  />
                  {errors.arabicTitle && (
                    <p className="text-red-500 text-xs mt-1">{errors.arabicTitle}</p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  rows="3"
                  placeholder="Enter category description"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Image
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.files[0] }))}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                  />
                  {formData.imageUrl && (
                    <img
                      src={formData.imageUrl}
                      alt="Preview"
                      className="h-16 w-16 rounded-lg object-cover"
                    />
                  )}
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="draft">Draft</option>
                  <option value="available">Available</option>
                </select>
              </div>

              {/* Media Upload Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Allow Media Upload
                  </label>
                  <p className="text-sm text-gray-500">Allow users to upload files/images with their requests</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, allowMediaUpload: !prev.allowMediaUpload }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.allowMediaUpload ? 'bg-red-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.allowMediaUpload ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {formData.allowMediaUpload && (
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Media Required
                    </label>
                    <p className="text-sm text-gray-500">If enabled, users must attach at least one file</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, mediaRequired: !prev.mediaRequired }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      formData.mediaRequired ? 'bg-red-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.mediaRequired ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              )}

              {/* Form Fields */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Form Fields *
                </label>
                <div className="space-y-4">
                  {/* Add Field Form */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Add New Field</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <input
                          type="text"
                          value={fieldFormData.fieldName}
                          onChange={(e) => setFieldFormData(prev => ({ ...prev, fieldName: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                          placeholder="Field name"
                        />
                        {errors.fieldName && (
                          <p className="text-red-500 text-xs mt-1">{errors.fieldName}</p>
                        )}
                      </div>
                      <div>
                        <select
                          value={fieldFormData.fieldType}
                          onChange={(e) => setFieldFormData(prev => ({ ...prev, fieldType: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        >
                          {fieldTypes.map(type => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <input
                          type="text"
                          value={fieldFormData.placeholder}
                          onChange={(e) => setFieldFormData(prev => ({ ...prev, placeholder: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                          placeholder="Placeholder text"
                        />
                      </div>
                      <div className="flex items-center">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={fieldFormData.required}
                            onChange={(e) => setFieldFormData(prev => ({ ...prev, required: e.target.checked }))}
                            className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">Required</span>
                        </label>
                        <button
                          type="button"
                          onClick={addField}
                          className="ml-4 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 text-sm"
                        >
                          Add Field
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Existing Fields */}
                  <div className="space-y-2">
                    {formData.fields.map((field) => {
                      const FieldIcon = getFieldTypeIcon(field.fieldType);
                      return (
                        <div key={field.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center space-x-3">
                            <FieldIcon className="h-4 w-4 text-gray-500" />
                            <div>
                              <span className="font-medium text-gray-900">{field.fieldName}</span>
                              <span className="text-sm text-gray-500 ml-2">
                                ({getFieldTypeLabel(field.fieldType)})
                              </span>
                              {field.required && (
                                <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                                  Required
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeField(field.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {errors.fields && (
                  <p className="text-red-500 text-xs mt-1">{errors.fields}</p>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : (editingCategory ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fields Management Modal */}
      {showFieldsModal && selectedCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Manage Fields - {selectedCategory.englishTitle}
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {selectedCategory.fields?.map((field) => {
                  const FieldIcon = getFieldTypeIcon(field.fieldType);
                  return (
                    <div key={field.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <FieldIcon className="h-5 w-5 text-gray-500" />
                        <div>
                          <div className="font-medium text-gray-900">{field.fieldName}</div>
                          <div className="text-sm text-gray-500">
                            {getFieldTypeLabel(field.fieldType)} • {field.required ? 'Required' : 'Optional'}
                          </div>
                          {field.placeholder && (
                            <div className="text-xs text-gray-400 mt-1">
                              Placeholder: {field.placeholder}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditField(field)}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="Edit field"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteField(field.id)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Delete field"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
                {(!selectedCategory.fields || selectedCategory.fields.length === 0) && (
                  <div className="text-center py-8 text-gray-500">
                    No fields configured for this category
                  </div>
                )}
              </div>
              <div className="flex justify-between pt-4 border-t border-gray-200 mt-6">
                <button
                  onClick={() => setShowFieldsModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Close
                </button>
                <button
                  onClick={handleSaveFields}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Field Edit Modal */}
      {showFieldEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Edit Field
              </h3>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Field Name *
                </label>
                <input
                  type="text"
                  value={fieldFormData.fieldName}
                  onChange={(e) => setFieldFormData(prev => ({ ...prev, fieldName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter field name"
                />
                {errors.fieldName && (
                  <p className="text-red-500 text-xs mt-1">{errors.fieldName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Field Type
                </label>
                <select
                  value={fieldFormData.fieldType}
                  onChange={(e) => setFieldFormData(prev => ({ ...prev, fieldType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  {fieldTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Placeholder Text
                </label>
                <input
                  type="text"
                  value={fieldFormData.placeholder}
                  onChange={(e) => setFieldFormData(prev => ({ ...prev, placeholder: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter placeholder text"
                />
              </div>

              <div className="flex items-center">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={fieldFormData.required}
                    onChange={(e) => setFieldFormData(prev => ({ ...prev, required: e.target.checked }))}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Required field</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowFieldEditModal(false);
                  setEditingField(null);
                  setFieldFormData({
                    fieldName: '',
                    fieldType: 'text',
                    required: false,
                    placeholder: ''
                  });
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateField}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Update Field
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestCategoriesManagement;
