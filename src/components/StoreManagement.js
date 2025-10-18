import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Search, 
  Package,
  Store,
  DollarSign,
  Tag,
  MapPin,
  Star,
  Clock,
  Bell
} from 'lucide-react';
import { useStoreManagementStore } from '../stores/storeManagementStore';
import { useDiningStore } from '../stores/diningStore';
import { useUINotificationStore } from '../stores/uiNotificationStore';
import NotificationManagement from './NotificationManagement';

const StoreManagement = ({ projectId, onViewStore }) => {
  const [activeTab, setActiveTab] = useState('stores');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [selectedStore, setSelectedStore] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isEditProductModalOpen, setIsEditProductModalOpen] = useState(false);
  const [isViewProductModalOpen, setIsViewProductModalOpen] = useState(false);
  const [modalType, setModalType] = useState('store'); // 'store' or 'product'
  const [storeImagePreview, setStoreImagePreview] = useState(null);
  const [productImagePreview, setProductImagePreview] = useState(null);

  // Store management store
  const {
    stores,
    products,
    categories,
    loading: storeLoading,
    error: storeError,
    fetchStores,
    fetchProducts,
    fetchCategories,
    addStore,
    updateStore,
    deleteStore,
    addProduct,
    updateProduct,
    deleteProduct,
    fetchStoreProducts,
    clearStoreManagement
  } = useStoreManagementStore();

  // UI Notification store
  const { error: showError } = useUINotificationStore();

  // Dining store for shops and products
  const {
    shops,
    productsByShop,
    loading: diningLoading,
    error: diningError,
    fetchShops,
    fetchCategories: fetchDiningCategories,
    deleteShop
  } = useDiningStore();

  useEffect(() => {
    if (projectId) {
      // Fetch all store-related data
      fetchStores(projectId);
      fetchProducts(projectId);
      fetchCategories(projectId);
      fetchShops(projectId);
      fetchDiningCategories(projectId);
    }

    return () => {
      clearStoreManagement();
    };
  }, [projectId, fetchStores, fetchProducts, fetchCategories, fetchShops, fetchDiningCategories, clearStoreManagement]);

  // Filtered data
  const filteredStores = stores.filter(store => {
    const matchesSearch = store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         store.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         store.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || store.type === categoryFilter;
    const matchesStatus = statusFilter === 'all' || store.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    const matchesPrice = priceRange === 'all' || 
                        (priceRange === 'low' && product.price <= 50) ||
                        (priceRange === 'medium' && product.price > 50 && product.price <= 200) ||
                        (priceRange === 'high' && product.price > 200);
    
    return matchesSearch && matchesCategory && matchesPrice;
  });

  const filteredShops = shops.filter(shop => {
    const matchesSearch = shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shop.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || 
                           shop.categories?.some(cat => cat === categoryFilter);
    
    return matchesSearch && matchesCategory;
  });

  // Stats
  const getStats = () => {
    const totalStores = stores.length + shops.length;
    const totalProducts = products.length + Object.values(productsByShop).flat().length;
    const lowStockProducts = products.filter(p => p.stockQuantity <= p.minStockLevel).length;
    const outOfStockProducts = products.filter(p => p.stockQuantity === 0).length;
    
    return { totalStores, totalProducts, lowStockProducts, outOfStockProducts };
  };

  const stats = getStats();

  // Modal handlers
  const openAddModal = (type) => {
    setModalType(type);
    if (type === 'store') {
      resetStoreForm();
    }
    setIsAddModalOpen(true);
  };

  const openEditModal = (item, type) => {
    setModalType(type);
    if (type === 'store') {
      setSelectedStore(item);
      // Populate form with existing store data
      setStoreForm({
        name: item.name || '',
        location: item.location || '',
        averageDeliveryTime: item.averageDeliveryTime || '',
        deliveryFee: item.deliveryFee || 0, // Add delivery fee field
        status: item.status || 'active', // Add status field
        workingDays: {
          monday: item.workingHours?.monday ? true : false,
          tuesday: item.workingHours?.tuesday ? true : false,
          wednesday: item.workingHours?.wednesday ? true : false,
          thursday: item.workingHours?.thursday ? true : false,
          friday: item.workingHours?.friday ? true : false,
          saturday: item.workingHours?.saturday ? true : false,
          sunday: item.workingHours?.sunday ? true : false
        },
        workingHours: {
          open: item.workingHours?.open || '',
          close: item.workingHours?.close || ''
        },
        specialNotes: item.specialNotes || '',
        contactInfo: {
          phone: item.contactInfo?.phone || '',
          email: item.contactInfo?.email || '',
          website: item.contactInfo?.website || ''
        },
        imageFile: null
      });
    } else {
      setSelectedProduct(item);
    }
    setIsEditModalOpen(true);
  };

  const openViewModal = (item, type) => {
    setModalType(type);
    if (type === 'store') {
      setSelectedStore(item);
      // Use the onViewStore prop if available, otherwise use the existing modal
      if (onViewStore) {
        onViewStore(item);
        return;
      }
    } else {
      setSelectedProduct(item);
    }
    setIsViewModalOpen(true);
  };

  const closeModals = () => {
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setIsViewModalOpen(false);
    setIsProductModalOpen(false);
    setIsEditProductModalOpen(false);
    setIsViewProductModalOpen(false);
    setSelectedStore(null);
    setSelectedProduct(null);
    setStoreImagePreview(null);
    setProductImagePreview(null);
  };

  const openProductModal = async (store) => {
    setSelectedStore(store);
    setIsProductModalOpen(true);
    // Fetch products for this store
    await fetchStoreProducts(projectId, store.id);
  };

  const openEditProductModal = (product, store) => {
    setSelectedProduct(product);
    setSelectedStore(store);
    setProductForm({
      name: product.name,
      price: product.price,
      category: product.category,
      description: product.description || '',
      image: product.image || '',
      imageFile: null
    });
    setProductImagePreview(null);
    setIsEditProductModalOpen(true);
  };

  const openViewProductModal = (product, store) => {
    setSelectedProduct(product);
    setSelectedStore(store);
    setIsViewProductModalOpen(true);
  };

  // Store form state
  const [storeForm, setStoreForm] = useState({
    name: '',
    location: '',
    averageDeliveryTime: '',
    deliveryFee: 0, // Add delivery fee field
    status: 'active', // Add status field
    workingDays: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: false,
      sunday: false
    },
    workingHours: {
      open: '',
      close: ''
    },
    specialNotes: '',
    contactInfo: {
      phone: '',
      email: '',
      website: ''
    },
    imageFile: null
  });

  // Product form state
  const [productForm, setProductForm] = useState({
    name: '',
    price: '',
    category: '',
    description: '',
    imageFile: null
  });

  // Store form validation
  const [storeFormErrors, setStoreFormErrors] = useState({});
  const [productFormErrors, setProductFormErrors] = useState({});

  const validateStoreForm = () => {
    const errors = {};
    if (!storeForm.name.trim()) errors.name = 'Store name is required';
    if (!storeForm.location.trim()) errors.location = 'Location is required';
    if (!storeForm.averageDeliveryTime.trim()) errors.averageDeliveryTime = 'Average delivery time is required';
    
    setStoreFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateProductForm = () => {
    const errors = {};
    if (!productForm.name.trim()) errors.name = 'Product name is required';
    if (!productForm.price || productForm.price <= 0) errors.price = 'Valid price is required';
    if (!productForm.category) errors.category = 'Category is required';
    
    setProductFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetStoreForm = () => {
    setStoreForm({
      name: '',
      location: '',
      averageDeliveryTime: '',
      deliveryFee: 0, // Add delivery fee field
      status: 'active', // Add status field
      workingDays: {
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: false,
        sunday: false
      },
      workingHours: {
        open: '',
        close: ''
      },
      specialNotes: '',
      contactInfo: {
        phone: '',
        email: '',
        website: ''
      },
      imageFile: null
    });
    setStoreFormErrors({});
    setStoreImagePreview(null);
  };

  const resetProductForm = () => {
    setProductForm({
      name: '',
      price: '',
      category: '',
      description: '',
      imageFile: null
    });
    setProductFormErrors({});
    setProductImagePreview(null);
  };

  const handleStoreFormChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setStoreForm(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setStoreForm(prev => ({
        ...prev,
        [field]: value
      }));
    }
    
    // Handle image preview
    if (field === 'imageFile' && value) {
      const reader = new FileReader();
      reader.onload = (e) => setStoreImagePreview(e.target.result);
      reader.readAsDataURL(value);
    } else if (field === 'imageFile' && !value) {
      setStoreImagePreview(null);
    }
  };

  const handleProductFormChange = (field, value) => {
    setProductForm(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Handle image preview
    if (field === 'imageFile' && value) {
      const reader = new FileReader();
      reader.onload = (e) => setProductImagePreview(e.target.result);
      reader.readAsDataURL(value);
    } else if (field === 'imageFile' && !value) {
      setProductImagePreview(null);
    }
  };

  const handleAddProduct = async (storeId) => {
    if (!validateProductForm()) return;
    
    try {
      await addProduct(projectId, storeId, productForm);
      resetProductForm();
      setProductImagePreview(null);
      // Refresh the products list
      await fetchStoreProducts(projectId, storeId);
    } catch (error) {
      console.error('Error adding product:', error);
      showError(`Error adding product: ${error.message}`);
    }
  };

  const handleEditProduct = async () => {
    if (!validateProductForm() || !selectedProduct || !selectedStore) return;
    
    try {
      await updateProduct(projectId, selectedStore.id, selectedProduct.id, productForm);
      resetProductForm();
      setProductImagePreview(null);
      setIsEditProductModalOpen(false);
      // Refresh the products list
      await fetchStoreProducts(projectId, selectedStore.id);
    } catch (error) {
      console.error('Error updating product:', error);
      showError(`Error updating product: ${error.message}`);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!selectedStore) return;
    
    if (window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      try {
        await deleteProduct(projectId, selectedStore.id, productId);
        // Refresh the products list
        await fetchStoreProducts(projectId, selectedStore.id);
      } catch (error) {
        console.error('Error deleting product:', error);
        showError(`Error deleting product: ${error.message}`);
      }
    }
  };

  const handleAddStore = async () => {
    if (!validateStoreForm()) return;
    
    try {
      await addStore(projectId, storeForm);
      resetStoreForm();
      closeModals();
      setStoreImagePreview(null);
    } catch (error) {
      console.error('Error adding store:', error);
      showError(`Error adding store: ${error.message}`);
    }
  };

  const handleEditStore = async () => {
    if (!validateStoreForm()) return;
    
    try {
      await updateStore(projectId, selectedStore.id, storeForm);
      closeModals();
      setStoreImagePreview(null);
    } catch (error) {
      console.error('Error updating store:', error);
      showError(`Error updating store: ${error.message}`);
    }
  };

  const handleDeleteStore = async (storeId) => {
    if (window.confirm('Are you sure you want to delete this store? This action cannot be undone.')) {
      try {
        await deleteStore(projectId, storeId);
      } catch (error) {
        console.error('Error deleting store:', error);
      }
    }
  };

  if (storeLoading || diningLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading store data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Store Management</h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage retail stores, shops, and product inventory
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => openAddModal('store')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Store
          </button>
          
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Store className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Stores</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalStores}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Package className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Package className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Low Stock</p>
              <p className="text-2xl font-bold text-gray-900">{stats.lowStockProducts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <Package className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Out of Stock</p>
              <p className="text-2xl font-bold text-gray-900">{stats.outOfStockProducts}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('stores')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'stores'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Store className="h-4 w-4 inline mr-2" />
              Retail Stores
            </button>
            <button
              onClick={() => setActiveTab('shops')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'shops'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <ShoppingBag className="h-4 w-4 inline mr-2" />
              Food & Shops
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'products'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Package className="h-4 w-4 inline mr-2" />
              Products
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'inventory'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Tag className="h-4 w-4 inline mr-2" />
              Inventory
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'notifications'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Bell className="h-4 w-4 inline mr-2" />
              Notifications
            </button>
          </nav>
        </div>

        {/* Search and Filters */}
        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search stores, shops, or products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>

          {activeTab === 'products' && (
            <div className="mt-4">
              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Prices</option>
                <option value="low">Low (≤ EGP 500)</option>
                <option value="medium">Medium (EGP 501 - EGP 2000)</option>
                <option value="high">High (&gt; EGP 2000)</option>
              </select>
            </div>
          )}
        </div>

        {/* Tab Content */}
        <div className="p-6">
                    {/* Retail Stores Tab */}
          {activeTab === 'stores' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Retail Stores</h3>
                <span className="text-sm text-gray-500">{filteredStores.length} stores</span>
              </div>

              {filteredStores.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredStores.map(store => (
                    <div key={store.id} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start space-x-4">
                        {/* Store Image */}
                        <div className="flex-shrink-0">
                          <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                            {store.image ? (
                              <img 
                                src={store.image} 
                                alt={store.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div 
                              className={`w-full h-full flex items-center justify-center text-gray-400 ${store.image ? 'hidden' : 'flex'}`}
                            >
                              <Store className="h-8 w-8" />
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 truncate">{store.name}</h4>
                          <div className="flex items-center text-sm text-gray-500 mt-2">
                            <MapPin className="h-4 w-4 mr-1" />
                            {store.location}
                          </div>
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <Clock className="h-4 w-4 mr-1" />
                            {store.averageDeliveryTime} delivery
                          </div>
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <DollarSign className="h-4 w-4 mr-1" />
                            {store.deliveryFee > 0 ? `$${store.deliveryFee} delivery fee` : 'Free delivery'}
                          </div>
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              store.status === 'active' ? 'bg-green-100 text-green-800' :
                              store.status === 'inactive' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {store.status || 'active'}
                            </span>
                          </div>
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <Star className="h-4 w-4 mr-1" />
                            <div className="flex items-center gap-1">
                              <span className="font-medium">{store.rating ? store.rating.toFixed(1) : '0.0'}</span>
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`h-3 w-3 ${
                                      star <= (store.rating || 0) 
                                        ? 'text-yellow-400 fill-current' 
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-xs text-gray-400">
                                {(store.reviewCount || 0) === 0 ? 'No reviews yet' : `(${store.reviewCount} reviews)`}
                              </span>
                            </div>
                          </div>
                        </div>
                      
                      {/* Action Buttons */}
                      <div className="flex justify-end space-x-1 mt-3 pt-3 border-t border-gray-100">
                          <button
                            onClick={() => openViewModal(store, 'store')}
                            className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(store, 'store')}
                            className="p-1 text-green-600 hover:text-green-900 hover:bg-green-50 rounded"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openProductModal(store)}
                            className="p-1 text-purple-600 hover:text-purple-900 hover:bg-purple-50 rounded"
                            title="Manage Products"
                          >
                            <Package className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteStore(store.id)}
                            className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Store className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No retail stores found</h3>
                  <p className="text-gray-600">Get started by adding your first retail store.</p>
                </div>
              )}
            </div>
          )}

          {/* Food & Shops Tab */}
          {activeTab === 'shops' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Food & Shops</h3>
                <span className="text-sm text-gray-500">{filteredShops.length} shops</span>
              </div>

              {filteredShops.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredShops.map(shop => (
                    <div key={shop.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{shop.name}</h4>
                          <div className="flex items-center text-sm text-gray-600 mt-1">
                            <MapPin className="h-4 w-4 mr-1" />
                            {shop.location}
                          </div>
                          <div className="flex items-center text-sm text-gray-500 mt-2">
                            <Clock className="h-4 w-4 mr-1" />
                            {shop.deliveryTime} min delivery
                          </div>
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <Star className="h-4 w-4 mr-1" />
                            {shop.rating || 0} rating
                          </div>
                        </div>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => openViewModal(shop, 'shop')}
                            className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(shop, 'shop')}
                            className="p-1 text-green-600 hover:text-green-900 hover:bg-green-50 rounded"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteShop(projectId, shop.id)}
                            className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No shops found</h3>
                  <p className="text-gray-600">Get started by adding your first shop.</p>
                </div>
              )}
            </div>
          )}

          {/* Products Tab */}
          {activeTab === 'products' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Products</h3>
                <span className="text-sm text-gray-500">{filteredProducts.length} products</span>
              </div>

              {filteredProducts.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Stock
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredProducts.map(product => (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                {product.image ? (
                                  <img className="h-10 w-10 rounded-lg object-cover" src={product.image} alt={product.name} />
                                ) : (
                                  <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center">
                                    <Package className="h-5 w-5 text-gray-400" />
                                  </div>
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                <div className="text-sm text-gray-500">{product.sku}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {product.category}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className="font-medium text-green-600">EGP {product.price}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              product.stockQuantity === 0 
                                ? 'bg-red-100 text-red-800'
                                : product.stockQuantity <= product.minStockLevel
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-green-100 text-green-800'
                            }`}>
                              {product.stockQuantity} {product.unit}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              product.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {product.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => openViewModal(product, 'product')}
                                className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => openEditModal(product, 'product')}
                                className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                  <p className="text-gray-600">Get started by adding your first product.</p>
                </div>
              )}
            </div>
          )}

          {/* Inventory Tab */}
          {activeTab === 'inventory' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Low Stock Products */}
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Package className="h-5 w-5 mr-2 text-yellow-600" />
                    Low Stock Products
                  </h3>
                  {products.filter(p => p.stockQuantity <= p.minStockLevel && p.stockQuantity > 0).length > 0 ? (
                    <div className="space-y-2">
                      {products
                        .filter(p => p.stockQuantity <= p.minStockLevel && p.stockQuantity > 0)
                        .slice(0, 5)
                        .map(product => (
                          <div key={product.id} className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                            <span className="text-sm font-medium">{product.name}</span>
                            <span className="text-xs text-yellow-700">{product.stockQuantity} left</span>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No low stock products</p>
                  )}
                </div>

                {/* Out of Stock Products */}
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Package className="h-5 w-5 mr-2 text-red-600" />
                    Out of Stock Products
                  </h3>
                  {products.filter(p => p.stockQuantity === 0).length > 0 ? (
                    <div className="space-y-2">
                      {products
                        .filter(p => p.stockQuantity === 0)
                        .slice(0, 5)
                        .map(product => (
                          <div key={product.id} className="flex items-center justify-between p-2 bg-red-50 rounded">
                            <span className="text-sm font-medium">{product.name}</span>
                            <span className="text-xs text-red-700">Out of stock</span>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No out of stock products</p>
                  )}
                </div>
              </div>

              {/* Stock Management */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stock Update</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Product</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="">Select a product</option>
                      {products.map(product => (
                        <option key={product.id} value={product.id}>{product.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Operation</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="add">Add Stock</option>
                      <option value="subtract">Subtract Stock</option>
                      <option value="set">Set Stock</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter quantity"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Update Stock
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <NotificationManagement projectId={projectId} />
          )}
        </div>
      </div>

      {/* Error Display */}
      {(storeError || diningError) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                {storeError && <p>{storeError}</p>}
                {diningError && <p>{diningError}</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Store Management Modals */}
      {(isAddModalOpen || isEditModalOpen || isViewModalOpen) && modalType === 'store' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[75vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900">
                {isAddModalOpen ? 'Add New Store' :
                 isEditModalOpen ? 'Edit Store' :
                 'Store Details'}
              </h2>
              <button
                onClick={closeModals}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              {isViewModalOpen ? (
                // View Store Details
                <div className="space-y-6">
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-2">Store Name</label>
                       <p className="text-lg font-semibold text-gray-900">{selectedStore?.name}</p>
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                       <p className="text-gray-900">{selectedStore?.location}</p>
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-2">Average Delivery Time</label>
                       <p className="text-gray-900">{selectedStore?.averageDeliveryTime}</p>
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Fee</label>
                       <p className="text-gray-900">
                         {selectedStore?.deliveryFee > 0 ? `$${selectedStore.deliveryFee}` : 'Free delivery'}
                       </p>
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                       <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                         selectedStore?.status === 'active' ? 'bg-green-100 text-green-800' :
                         selectedStore?.status === 'inactive' ? 'bg-red-100 text-red-800' :
                         'bg-yellow-100 text-yellow-800'
                       }`}>
                         {selectedStore?.status || 'active'}
                       </span>
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                       <div className="flex items-center">
                         <div className="flex items-center text-yellow-400">
                           {[1, 2, 3, 4, 5].map((star) => (
                             <svg key={star} className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                               <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                             </svg>
                           ))}
                         </div>
                         <span className="ml-2 text-sm text-gray-600">(Coming soon - User ratings)</span>
                       </div>
                     </div>
                   </div>

                  {/* Contact Information */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Contact Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {selectedStore?.contactInfo?.phone && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                          <p className="text-gray-900">{selectedStore.contactInfo.phone}</p>
                        </div>
                      )}
                      {selectedStore?.contactInfo?.email && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                          <p className="text-gray-900">{selectedStore.contactInfo.email}</p>
                        </div>
                      )}
                      {selectedStore?.contactInfo?.website && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                          <p className="text-gray-900">{selectedStore.contactInfo.website}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Working Hours */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Working Hours</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Working Days</label>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(selectedStore?.workingDays || {}).map(([day, isWorking]) => (
                            <span key={day} className={`px-3 py-1 text-sm font-medium rounded-full capitalize ${
                              isWorking ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {day} {isWorking ? '✓' : '✗'}
                            </span>
                          ))}
                        </div>
                      </div>
                      {selectedStore?.workingHours?.open && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Hours</label>
                          <p className="text-gray-900">{selectedStore.workingHours.open}</p>
                        </div>
                      )}
                      {selectedStore?.specialNotes && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Special Notes</label>
                          <p className="text-gray-900">{selectedStore.specialNotes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                // Add/Edit Store Form
                <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Store Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={storeForm.name}
                        onChange={(e) => handleStoreFormChange('name', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          storeFormErrors.name ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Enter store name"
                      />
                      {storeFormErrors.name && (
                        <p className="mt-1 text-sm text-red-600">{storeFormErrors.name}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Store Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={storeForm.type}
                        onChange={(e) => handleStoreFormChange('type', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          storeFormErrors.type ? 'border-red-300' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Select store type</option>
                        <option value="sports">Sports & Fitness</option>
                        <option value="retail">General Retail</option>
                        <option value="food">Food & Beverage</option>
                        <option value="wellness">Health & Wellness</option>
                        <option value="entertainment">Entertainment</option>
                        <option value="services">Services</option>
                        <option value="other">Other</option>
                      </select>
                      {storeFormErrors.type && (
                        <p className="mt-1 text-sm text-red-600">{storeFormErrors.type}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Location <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={storeForm.location}
                        onChange={(e) => handleStoreFormChange('location', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          storeFormErrors.location ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Enter store location"
                      />
                      {storeFormErrors.location && (
                        <p className="mt-1 text-sm text-red-600">{storeFormErrors.location}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Average Delivery Time <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={storeForm.averageDeliveryTime}
                        onChange={(e) => handleStoreFormChange('averageDeliveryTime', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          storeFormErrors.averageDeliveryTime ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="e.g., 30 min"
                      />
                      {storeFormErrors.averageDeliveryTime && (
                        <p className="mt-1 text-sm text-red-600">{storeFormErrors.averageDeliveryTime}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Delivery Fee
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={storeForm.deliveryFee}
                          onChange={(e) => handleStoreFormChange('deliveryFee', parseFloat(e.target.value) || 0)}
                          className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0.00"
                        />
                      </div>
                      <p className="mt-1 text-sm text-gray-500">Set to 0 for free delivery</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                      <select
                        value={storeForm.status}
                        onChange={(e) => handleStoreFormChange('status', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="maintenance">Maintenance</option>
                      </select>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={storeForm.description}
                      onChange={(e) => handleStoreFormChange('description', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter store description"
                    />
                  </div>

                  {/* Contact Information */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Contact Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                        <input
                          type="tel"
                          value={storeForm.contactInfo.phone}
                          onChange={(e) => handleStoreFormChange('contactInfo.phone', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter phone number"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <input
                          type="email"
                          value={storeForm.contactInfo.email}
                          onChange={(e) => handleStoreFormChange('contactInfo.email', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter email address"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                        <input
                          type="url"
                          value={storeForm.contactInfo.website}
                          onChange={(e) => handleStoreFormChange('contactInfo.website', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter website URL"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Working Hours */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Working Hours</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(storeForm.workingDays).map(([day, isChecked]) => (
                        <div key={day} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`working-day-${day}`}
                            checked={isChecked}
                            onChange={(e) => handleStoreFormChange(`workingDays.${day}`, e.target.checked)}
                            className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor={`working-day-${day}`} className="text-sm font-medium text-gray-700 capitalize">{day}</label>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">All-Day Hours</label>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="all-day-hours"
                          checked={Object.values(storeForm.workingDays).every(checked => checked)}
                          onChange={(e) => {
                            const newWorkingDays = {
                              monday: e.target.checked,
                              tuesday: e.target.checked,
                              wednesday: e.target.checked,
                              thursday: e.target.checked,
                              friday: e.target.checked,
                              saturday: e.target.checked,
                              sunday: e.target.checked
                            };
                            handleStoreFormChange('workingDays', newWorkingDays);
                          }}
                          className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="all-day-hours" className="text-sm font-medium text-gray-700">All days have the same hours</label>
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Working Hours</label>
                      <input
                        type="text"
                        value={storeForm.workingHours.open}
                        onChange={(e) => handleStoreFormChange('workingHours.open', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., 9:00 AM - 6:00 PM"
                      />
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Special Notes</label>
                      <textarea
                        value={storeForm.specialNotes}
                        onChange={(e) => handleStoreFormChange('specialNotes', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter any special notes or exceptions"
                      />
                    </div>
                  </div>

                  {/* Store Image */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Store Image</label>
                    
                    {/* Image Preview */}
                    {(storeImagePreview || storeForm.image) && (
                      <div className="mb-3">
                        <div className="w-32 h-32 rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200">
                          <img 
                            src={storeImagePreview || storeForm.image} 
                            alt="Store preview"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                          <div className="w-full h-full flex items-center justify-center text-gray-400 hidden">
                            <Store className="h-8 w-8" />
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Preview</p>
                      </div>
                    )}
                    
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleStoreFormChange('imageFile', e.target.files[0])}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="mt-1 text-sm text-gray-500">Upload an image for the store (optional, max 5MB)</p>
                  </div>
                </form>
              )}
            </div>

            <div className="flex items-center justify-end p-6 border-t border-gray-100 space-x-3">
              <button
                onClick={closeModals}
                className="px-6 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              
              {!isViewModalOpen && (
                <button
                  onClick={isAddModalOpen ? handleAddStore : handleEditStore}
                  className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {isAddModalOpen ? 'Add Store' : 'Update Store'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Product Modals (placeholder for now) */}
      {(isAddModalOpen || isEditModalOpen || isViewModalOpen) && modalType === 'product' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[75vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900">
                {isAddModalOpen ? 'Add New Product' :
                 isEditModalOpen ? 'Edit Product' :
                 'Product Details'}
              </h2>
              <button
                onClick={closeModals}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-600">
                Product management functionality will be implemented here.
              </p>
            </div>
            <div className="flex items-center justify-end p-6 border-t border-gray-100">
              <button
                onClick={closeModals}
                className="px-6 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Management Modal */}
      {isProductModalOpen && selectedStore && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[75vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Manage Products</h2>
                <p className="text-sm text-gray-600 mt-1">{selectedStore.name}</p>
              </div>
              <button
                onClick={closeModals}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              {/* Add Product Form */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Product</h3>
                <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={(e) => e.preventDefault()}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={productForm.name}
                      onChange={(e) => handleProductFormChange('name', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        productFormErrors.name ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter product name"
                    />
                    {productFormErrors.name && (
                      <p className="mt-1 text-sm text-red-600">{productFormErrors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={productForm.price}
                        onChange={(e) => handleProductFormChange('price', parseFloat(e.target.value))}
                        className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          productFormErrors.price ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="0.00"
                      />
                    </div>
                    {productFormErrors.price && (
                      <p className="mt-1 text-sm text-red-600">{productFormErrors.price}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={productForm.category}
                      onChange={(e) => handleProductFormChange('category', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        productFormErrors.category ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select category</option>
                      <option value="food">Food & Beverage</option>
                      <option value="drinks">Drinks</option>
                      <option value="desserts">Desserts</option>
                      <option value="snacks">Snacks</option>
                      <option value="meals">Meals</option>
                      <option value="other">Other</option>
                    </select>
                    {productFormErrors.category && (
                      <p className="mt-1 text-sm text-red-600">{productFormErrors.category}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Product Image</label>
                    
                    {/* Image Preview */}
                    {(productImagePreview || productForm.image) && (
                      <div className="mb-3">
                        <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200">
                          <img 
                            src={productImagePreview || productForm.image} 
                            alt="Product preview"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                          <div className="w-full h-full flex items-center justify-center text-gray-400 hidden">
                            <Package className="h-6 w-6" />
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Preview</p>
                      </div>
                    )}
                    
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleProductFormChange('imageFile', e.target.files[0])}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="mt-1 text-sm text-gray-500">Upload an image for the product (optional, max 5MB)</p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={productForm.description}
                      onChange={(e) => handleProductFormChange('description', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter product description (optional)"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <button
                      onClick={() => handleAddProduct(selectedStore.id)}
                      className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Add Product
                    </button>
                  </div>
                </form>
              </div>

              {/* Products List */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Products</h3>
                {products.filter(product => product.storeId === selectedStore.id).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products.filter(product => product.storeId === selectedStore.id).map(product => (
                      <div key={product.id} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start space-x-4">
                          {/* Product Image */}
                          <div className="flex-shrink-0">
                            <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                              {product.image ? (
                                <img 
                                  src={product.image} 
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div 
                                className={`w-full h-full flex items-center justify-center text-gray-400 ${product.image ? 'hidden' : 'flex'}`}
                              >
                                <Package className="h-8 w-8" />
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 truncate">{product.name}</h4>
                            <p className="text-lg font-bold text-green-600">EGP {product.price}</p>
                            <p className="text-sm text-gray-600 mt-1">{product.category}</p>
                            {product.description && (
                              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{product.description}</p>
                            )}
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex justify-end space-x-1 mt-3 pt-3 border-t border-gray-100">
                          <button
                            onClick={() => openViewProductModal(product, selectedStore)}
                            className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded"
                            title="View Product"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openEditProductModal(product, selectedStore)}
                            className="p-1 text-green-600 hover:text-green-900 hover:bg-green-50 rounded"
                            title="Edit Product"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded"
                            title="Delete Product"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
                    <p className="text-gray-600">Add your first product using the form above.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {isEditProductModalOpen && selectedProduct && selectedStore && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[75vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900">Edit Product</h2>
              <button
                onClick={closeModals}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
                    <input
                      type="text"
                      value={productForm.name}
                      onChange={(e) => handleProductFormChange('name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter product name"
                    />
                    {productFormErrors.name && (
                      <p className="mt-1 text-sm text-red-600">{productFormErrors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Price</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={productForm.price}
                      onChange={(e) => handleProductFormChange('price', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter price"
                    />
                    {productFormErrors.price && (
                      <p className="mt-1 text-sm text-red-600">{productFormErrors.price}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      value={productForm.category}
                      onChange={(e) => handleProductFormChange('category', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select category</option>
                      <option value="food">Food</option>
                      <option value="drinks">Drinks</option>
                      <option value="desserts">Desserts</option>
                      <option value="snacks">Snacks</option>
                      <option value="meals">Meals</option>
                      <option value="other">Other</option>
                    </select>
                    {productFormErrors.category && (
                      <p className="mt-1 text-sm text-red-600">{productFormErrors.category}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Product Image</label>
                    
                    {/* Image Preview */}
                    {(productImagePreview || productForm.image) && (
                      <div className="mb-3">
                        <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200">
                          <img 
                            src={productImagePreview || productForm.image} 
                            alt="Product preview"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                          <div className="w-full h-full flex items-center justify-center text-gray-400 hidden">
                            <Package className="h-6 w-6" />
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Preview</p>
                      </div>
                    )}
                    
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleProductFormChange('imageFile', e.target.files[0])}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="mt-1 text-sm text-gray-500">Upload an image for the product (optional, max 5MB)</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={productForm.description}
                    onChange={(e) => handleProductFormChange('description', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter product description (optional)"
                  />
                </div>
              </form>
            </div>

            <div className="flex items-center justify-end p-6 border-t border-gray-100 space-x-3">
              <button
                onClick={closeModals}
                className="px-6 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              
              <button
                onClick={handleEditProduct}
                className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Update Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Product Modal */}
      {isViewProductModalOpen && selectedProduct && selectedStore && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[75vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900">Product Details</h2>
              <button
                onClick={closeModals}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-6">
                {/* Product Image */}
                <div className="text-center">
                  <div className="w-32 h-32 rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200 mx-auto">
                    {selectedProduct.image ? (
                      <img 
                        src={selectedProduct.image} 
                        alt={selectedProduct.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className={`w-full h-full flex items-center justify-center text-gray-400 ${selectedProduct.image ? 'hidden' : 'flex'}`}
                    >
                      <Package className="h-12 w-12" />
                    </div>
                  </div>
                </div>

                {/* Product Details */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{selectedProduct.name}</h3>
                    <p className="text-2xl font-bold text-green-600">EGP {selectedProduct.price}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Category</label>
                      <p className="text-sm text-gray-900 capitalize">{selectedProduct.category}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Store</label>
                      <p className="text-sm text-gray-900">{selectedStore.name}</p>
                    </div>
                  </div>

                  {selectedProduct.description && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <p className="text-sm text-gray-900">{selectedProduct.description}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end p-6 border-t border-gray-100 space-x-3">
              <button
                onClick={closeModals}
                className="px-6 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
              
              <button
                onClick={() => {
                  closeModals();
                  openEditProductModal(selectedProduct, selectedStore);
                }}
                className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Edit Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreManagement;
