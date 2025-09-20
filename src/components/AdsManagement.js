import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Image as ImageIcon,
  Save,
  X,
  GripVertical,
  BarChart3
} from 'lucide-react';

// Import ads service functions
import {
  getAds,
  createAd,
  updateAd,
  deleteAd,
  uploadAdImage,
  deleteAdImage,
  toggleAdStatus,
} from '../services/adsService';

const AdsManagement = ({ projectId }) => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAd, setEditingAd] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    linkUrl: '',
    order: 0,
    isActive: true,
    imageFile: null,
    imageUrl: ''
  });

  const loadAds = useCallback(async () => {
    try {
      setLoading(true);
      const adsData = await getAds(projectId);
      setAds(adsData);
    } catch (error) {
      console.error('Error loading ads:', error);
      alert('Error loading ads');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadAds();
  }, [loadAds]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setUploading(true);
      let imageUrl = formData.imageUrl;
      let imagePath = '';

      // Upload image if new file selected
      if (formData.imageFile) {
        const uploadResult = await uploadAdImage(projectId, formData.imageFile);
        imageUrl = uploadResult.url;
        imagePath = uploadResult.path;

        // Delete old image if editing and had previous image
        if (editingAd && editingAd.imagePath && editingAd.imagePath !== imagePath) {
          try {
            await deleteAdImage(editingAd.imagePath);
          } catch (error) {
            console.error('Error deleting old image:', error);
          }
        }
      }

      const adData = {
        linkUrl: formData.linkUrl.trim(),
        order: parseInt(formData.order) || 0,
        isActive: formData.isActive,
        imageUrl,
        imagePath
      };

      if (editingAd) {
        await updateAd(projectId, editingAd.id, adData);
      } else {
        await createAd(projectId, adData);
      }

      await loadAds();
      resetForm();
      setShowModal(false);
    } catch (error) {
      console.error('Error saving ad:', error);
      alert('Error saving ad');
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (ad) => {
    setEditingAd(ad);
    setFormData({
      linkUrl: ad.linkUrl || '',
      order: ad.order || 0,
      isActive: ad.isActive !== false,
      imageFile: null,
      imageUrl: ad.imageUrl || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (ad) => {
    if (!window.confirm('Are you sure you want to delete this ad?')) return;

    try {
      await deleteAd(projectId, ad.id);
      await loadAds();
    } catch (error) {
      console.error('Error deleting ad:', error);
      alert('Error deleting ad');
    }
  };

  const handleToggleStatus = async (ad) => {
    try {
      await toggleAdStatus(projectId, ad.id, !ad.isActive);
      await loadAds();
    } catch (error) {
      console.error('Error toggling ad status:', error);
      alert('Error updating ad status');
    }
  };

  const resetForm = () => {
    setFormData({
      linkUrl: '',
      order: ads.length,
      isActive: true,
      imageFile: null,
      imageUrl: ''
    });
    setEditingAd(null);
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('Image size should be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file');
        return;
      }
      setFormData({ ...formData, imageFile: file });
    }
  };

  const getActiveAdsCount = () => ads.filter(ad => ad.isActive).length;
  const getTotalAdsCount = () => ads.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Ads Management</h2>
          <p className="text-gray-600">Manage promotional banners and advertisements</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add New Ad
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Ads</p>
              <p className="text-xl font-bold text-gray-900">{getTotalAdsCount()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Eye className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Ads</p>
              <p className="text-xl font-bold text-gray-900">{getActiveAdsCount()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <EyeOff className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Hidden Ads</p>
              <p className="text-xl font-bold text-gray-900">{getTotalAdsCount() - getActiveAdsCount()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Ads List */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">All Ads</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {ads.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <ImageIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No ads created yet</p>
              <p className="text-sm">Create your first ad to get started</p>
            </div>
          ) : (
            ads.map((ad, index) => (
              <div key={ad.id} className="p-4 flex items-center gap-4">
                <div className="flex-shrink-0">
                  <div className="p-2 bg-gray-100 rounded-lg cursor-grab">
                    <GripVertical className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
                
                <div className="flex-1 flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                    {ad.imageUrl ? (
                      <img 
                        src={ad.imageUrl} 
                        alt={ad.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-gray-400">
                        Order: {ad.order}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        ad.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {ad.isActive ? 'Active' : 'Hidden'}
                      </span>
                      {ad.linkUrl && (
                        <span className="text-xs text-blue-600">
                          Has Link
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleStatus(ad)}
                    className={`p-2 rounded-lg transition-colors ${
                      ad.isActive 
                        ? 'text-green-600 hover:bg-green-100' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    title={ad.isActive ? 'Hide ad' : 'Show ad'}
                  >
                    {ad.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  
                  <button
                    onClick={() => handleEdit(ad)}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                    title="Edit ad"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => handleDelete(ad)}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                    title="Delete ad"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingAd ? 'Edit Ad' : 'Add New Ad'}
                </h3>
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 space-y-4">

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Link URL
                </label>
                <input
                  type="url"
                  value={formData.linkUrl}
                  onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                    Active
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Banner Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {formData.imageUrl && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 mb-1">Current image:</p>
                    <img 
                      src={formData.imageUrl} 
                      alt="Current" 
                      className="w-20 h-12 object-cover rounded border"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {editingAd ? 'Update' : 'Create'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdsManagement;
