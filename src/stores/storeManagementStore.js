import { create } from 'zustand';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, where, orderBy } from 'firebase/firestore';
import { uploadBytes, getDownloadURL, ref as storageRef } from 'firebase/storage';
import { db, storage } from '../config/firebase';

export const useStoreManagementStore = create((set, get) => ({
  stores: [],
  products: [],
  categories: [],
  inventory: {},
  orders: [],
  loading: false,
  error: null,

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  fetchStores: async (projectId) => {
    try {
      set({ loading: true, error: null });
      const querySnapshot = await getDocs(collection(db, `projects/${projectId}/stores`));
      
      // Fetch stores with their rating data
      const storesWithRatings = await Promise.all(
        querySnapshot.docs.map(async (docSnap) => {
          const storeData = docSnap.data();
          
          // Fetch ratings for this store
          try {
            const ratingsRef = collection(db, `projects/${projectId}/ratings`);
            const ratingsQuery = query(ratingsRef, where('storeId', '==', docSnap.id));
            const ratingsSnapshot = await getDocs(ratingsQuery);
            
            const ratings = ratingsSnapshot.docs.map(ratingDoc => ratingDoc.data().rating);
            const averageRating = ratings.length > 0 
              ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
              : 0;
            
            return {
              id: docSnap.id,
              ...storeData,
              rating: parseFloat(averageRating.toFixed(1)),
              reviewCount: ratings.length
            };
          } catch (ratingError) {
            console.error('Error fetching ratings for store:', docSnap.id, ratingError);
            return {
              id: docSnap.id,
              ...storeData,
              rating: 0,
              reviewCount: 0
            };
          }
        })
      );
      
      set({ stores: storesWithRatings });
    } catch (error) {
      console.error("Error fetching stores:", error);
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  fetchProducts: async (projectId) => {
    try {
      set({ loading: true, error: null });
      const querySnapshot = await getDocs(collection(db, `projects/${projectId}/products`));
      const productsData = querySnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      set({ products: productsData });
    } catch (error) {
      console.error("Error fetching products:", error);
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  fetchCategories: async (projectId) => {
    try {
      set({ loading: true, error: null });
      const querySnapshot = await getDocs(collection(db, `projects/${projectId}/productCategories`));
      const categoriesData = querySnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      set({ categories: categoriesData });
    } catch (error) {
      console.error("Error fetching categories:", error);
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  addStore: async (projectId, storeData) => {
    try {
      set({ loading: true, error: null });
      let imageUrl = "";
      if (storeData.imageFile) {
        imageUrl = await get().uploadImage(storeData.imageFile, `projects/${projectId}/stores/${storeData.imageFile.name}`);
      }

      const newStore = {
        name: storeData.name,
        location: storeData.location,
        averageDeliveryTime: storeData.averageDeliveryTime,
        deliveryFee: storeData.deliveryFee || 0, // Add delivery fee support
        status: storeData.status || 'active', // Add status field
        image: imageUrl,
        contactInfo: storeData.contactInfo || {},
        workingDays: storeData.workingDays || {},
        workingHours: storeData.workingHours || {},
        specialNotes: storeData.specialNotes || '',
        rating: 0, // Will be implemented later with user ratings
        reviewCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, `projects/${projectId}/stores`), newStore);
      newStore.id = docRef.id;

      set((state) => ({
        stores: [...state.stores, newStore]
      }));

      return docRef.id;
    } catch (error) {
      console.error("Error adding store:", error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateStore: async (projectId, storeId, storeData) => {
    try {
      set({ loading: true, error: null });
      const storeRef = doc(db, `projects/${projectId}/stores`, storeId);
      
      let imageUrl = storeData.image;
      if (storeData.imageFile) {
        imageUrl = await get().uploadImage(storeData.imageFile, `projects/${projectId}/stores/${storeData.imageFile.name}`);
      }

      const updateData = {
        name: storeData.name,
        location: storeData.location,
        averageDeliveryTime: storeData.averageDeliveryTime,
        deliveryFee: storeData.deliveryFee || 0, // Add delivery fee support
        status: storeData.status || 'active', // Add status field
        contactInfo: storeData.contactInfo || {},
        workingDays: storeData.workingDays || {},
        workingHours: storeData.workingHours || {},
        specialNotes: storeData.specialNotes || '',
        updatedAt: serverTimestamp()
      };

      if (imageUrl) {
        updateData.image = imageUrl;
      }

      await updateDoc(storeRef, updateData);

      // Update local stores state
      set((state) => ({
        stores: state.stores.map(store => 
          store.id === storeId ? { ...store, ...updateData } : store
        )
      }));

      // Update orders that reference this store to reflect the new store information
      set((state) => ({
        orders: state.orders.map(order => {
          // Check if any item in the order references this store
          const hasStoreReference = order.items?.some(item => item.storeId === storeId);
          
          if (hasStoreReference) {
            return {
              ...order,
              storeId: storeId,
              storeName: storeData.name,
              location: storeData.location,
              deliveryFee: storeData.deliveryFee || 0
            };
          }
          return order;
        })
      }));

      return storeId;
    } catch (error) {
      console.error("Error updating store:", error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deleteStore: async (projectId, storeId) => {
    try {
      set({ loading: true, error: null });
      await deleteDoc(doc(db, `projects/${projectId}/stores`, storeId));
      
      set((state) => ({
        stores: state.stores.filter(store => store.id !== storeId),
        products: state.products.filter(product => product.storeId !== storeId)
      }));

      return storeId;
    } catch (error) {
      console.error("Error deleting store:", error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deleteStoreProduct: async (projectId, storeId, productId) => {
    try {
      set({ loading: true, error: null });
      await deleteDoc(doc(db, `projects/${projectId}/stores/${storeId}/products`, productId));
      
      set((state) => ({
        products: state.products.filter(product => product.id !== productId)
      }));

      return productId;
    } catch (error) {
      console.error("Error deleting product:", error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  addProduct: async (projectId, storeId, productData) => {
    try {
      set({ loading: true, error: null });
      let imageUrl = "";
      if (productData.imageFile) {
        imageUrl = await get().uploadImage(productData.imageFile, `projects/${projectId}/stores/${storeId}/products/${productData.imageFile.name}`);
      }

      const newProduct = {
        name: productData.name,
        description: productData.description || '',
        category: productData.category,
        price: productData.price,
        image: imageUrl,
        storeId: storeId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, `projects/${projectId}/stores/${storeId}/products`), newProduct);
      newProduct.id = docRef.id;

      // Update local state
      set((state) => ({
        products: [...state.products, newProduct]
      }));

      return docRef.id;
    } catch (error) {
      console.error("Error adding product:", error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  fetchStoreProducts: async (projectId, storeId) => {
    try {
      const querySnapshot = await getDocs(collection(db, `projects/${projectId}/stores/${storeId}/products`));
      const productData = querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      
      set((state) => ({
        products: [...state.products.filter(p => p.storeId !== storeId), ...productData]
      }));

      return productData;
    } catch (error) {
      console.error("Error fetching store products:", error);
      return [];
    }
  },

  updateProduct: async (projectId, storeId, productId, productData) => {
    try {
      set({ loading: true, error: null });
      const productRef = doc(db, `projects/${projectId}/stores/${storeId}/products`, productId);
      
      let imageUrl = productData.image;
      if (productData.imageFile) {
        imageUrl = await get().uploadImage(productData.imageFile, `projects/${projectId}/stores/${storeId}/products/${productData.imageFile.name}`);
      }

      const updateData = {
        name: productData.name,
        description: productData.description || '',
        category: productData.category,
        price: productData.price,
        updatedAt: serverTimestamp()
      };

      if (imageUrl) {
        updateData.image = imageUrl;
      }

      await updateDoc(productRef, updateData);

      // Update local state
      set((state) => ({
        products: state.products.map(product => 
          product.id === productId ? { ...product, ...updateData } : product
        )
      }));

      return productId;
    } catch (error) {
      console.error("Error updating product:", error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deleteProduct: async (projectId, storeId, productId) => {
    try {
      set({ loading: true, error: null });
      await deleteDoc(doc(db, `projects/${projectId}/stores/${storeId}/products`, productId));
      
      set((state) => ({
        products: state.products.filter(product => product.id !== productId)
      }));

      return productId;
    } catch (error) {
      console.error("Error deleting product:", error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateProductStock: async (projectId, productId, quantity, operation = 'add') => {
    try {
      set({ loading: true, error: null });
      const productRef = doc(db, `projects/${projectId}/products`, productId);
      const currentProduct = get().products.find(p => p.id === productId);
      
      if (currentProduct) {
        let newQuantity = currentProduct.stockQuantity;
        if (operation === 'add') {
          newQuantity += quantity;
        } else if (operation === 'subtract') {
          newQuantity = Math.max(0, newQuantity - quantity);
        } else if (operation === 'set') {
          newQuantity = quantity;
        }

        await updateDoc(productRef, { 
          stockQuantity: newQuantity,
          updatedAt: serverTimestamp()
        });

        set((state) => ({
          products: state.products.map(product => 
            product.id === productId ? { ...product, stockQuantity: newQuantity } : product
          )
        }));
      }
    } catch (error) {
      console.error("Error updating product stock:", error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  uploadImage: async (file, path) => {
    try {
      // Validate file
      if (!file) {
        throw new Error('No file provided');
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image');
      }
      
      // Check file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error('File size must be less than 5MB');
      }
      
      // Generate unique filename to avoid conflicts
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop();
      const uniqueFileName = `${timestamp}-${Math.random().toString(36).substring(2)}.${fileExtension}`;
      const uniquePath = path.replace(file.name, uniqueFileName);
      
      const storagePath = storageRef(storage, uniquePath);
      const snapshot = await uploadBytes(storagePath, file);
      return await getDownloadURL(snapshot.ref);
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  },

  getProductsByCategory: (category) => {
    return get().products.filter(product => product.category === category);
  },

  getLowStockProducts: () => {
    return get().products.filter(product => 
      product.stockQuantity <= product.minStockLevel
    );
  },

  getOutOfStockProducts: () => {
    return get().products.filter(product => product.stockQuantity === 0);
  },

  // Order Management Functions
  fetchOrders: async (projectId) => {
    try {
      set({ loading: true, error: null });
      console.log('Fetching orders for project:', projectId);
      
      const querySnapshot = await getDocs(
        query(
          collection(db, `projects/${projectId}/orders`),
          orderBy('createdAt', 'desc')
        )
      );
      const ordersData = querySnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));

      console.log('Raw orders data:', ordersData);

      // Fetch store information and user information for each order
      const ordersWithStoreInfo = await Promise.all(
        ordersData.map(async (order) => {
          // Get storeId from the first item in the order (since all items should be from the same store)
          const storeId = order.items?.[0]?.storeId;
          const storeName = order.items?.[0]?.storeName;
          
          console.log(`Processing order ${order.id}:`, { storeId, storeName, items: order.items });
          
          let orderWithInfo = { ...order };
          
          // Fetch store information
          if (storeId) {
            try {
              const storeDoc = await getDocs(
                query(
                  collection(db, `projects/${projectId}/stores`),
                  where('__name__', '==', storeId)
                )
              );
              
              if (!storeDoc.empty) {
                const storeData = storeDoc.docs[0].data();
                console.log(`Found store data for ${storeId}:`, storeData);
                orderWithInfo = {
                  ...orderWithInfo,
                  storeId: storeId,
                  storeName: storeData.name || storeName || 'Unknown Store',
                  location: storeData.location || 'No location',
                  deliveryFee: storeData.deliveryFee || 0
                };
              } else {
                console.log(`No store found for ID: ${storeId}`);
                orderWithInfo = {
                  ...orderWithInfo,
                  storeId: storeId,
                  storeName: storeName || 'Unknown Store',
                  location: 'No location',
                  deliveryFee: 0
                };
              }
            } catch (error) {
              console.error(`Error fetching store info for order ${order.id}:`, error);
              orderWithInfo = {
                ...orderWithInfo,
                storeId: storeId,
                storeName: storeName || 'Unknown Store',
                location: 'No location',
                deliveryFee: 0
              };
            }
          } else {
            console.log(`No storeId found in order ${order.id}`);
            orderWithInfo = {
              ...orderWithInfo,
              storeId: null,
              storeName: 'Unknown Store',
              location: 'No location',
              deliveryFee: 0
            };
          }
          
          // Fetch user information
          if (order.userId) {
            try {
              const userDoc = await getDocs(
                query(
                  collection(db, 'users'),
                  where('__name__', '==', order.userId)
                )
              );
              
                             if (!userDoc.empty) {
                 const userData = userDoc.docs[0].data();
                 console.log(`Found user data for ${order.userId}:`, userData);
                 orderWithInfo = {
                   ...orderWithInfo,
                   userName: userData.firstName && userData.lastName ? 
                     `${userData.firstName} ${userData.lastName}` : 
                     userData.fullName || userData.displayName || 'Unknown User',
                   userPhone: userData.phone || userData.phoneNumber || 'No phone'
                 };
               } else {
                 console.log(`No user found for ID: ${order.userId}`);
                 orderWithInfo = {
                   ...orderWithInfo,
                   userName: 'Unknown User',
                   userPhone: 'No phone'
                 };
               }
                         } catch (error) {
               console.error(`Error fetching user info for order ${order.id}:`, error);
               orderWithInfo = {
                 ...orderWithInfo,
                 userName: 'Unknown User',
                 userPhone: 'No phone'
               };
             }
                     } else {
             orderWithInfo = {
               ...orderWithInfo,
               userName: 'Unknown User',
               userPhone: 'No phone'
             };
           }
          
          return orderWithInfo;
        })
      );

      console.log('Orders with store info:', ordersWithStoreInfo);
      set({ orders: ordersWithStoreInfo });
    } catch (error) {
      console.error("Error fetching orders:", error);
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  fetchOrdersByStore: async (projectId, storeId) => {
    try {
      const querySnapshot = await getDocs(
        query(
          collection(db, `projects/${projectId}/orders`),
          where('storeId', '==', storeId),
          orderBy('createdAt', 'desc')
        )
      );
      const ordersData = querySnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));

      // Fetch store information for each order
      const ordersWithStoreInfo = await Promise.all(
        ordersData.map(async (order) => {
          // Get storeId from the first item in the order
          const storeId = order.items?.[0]?.storeId;
          const storeName = order.items?.[0]?.storeName;
          
          try {
            const storeDoc = await getDocs(
              query(
                collection(db, `projects/${projectId}/stores`),
                where('__name__', '==', storeId)
              )
            );
            
            if (!storeDoc.empty) {
              const storeData = storeDoc.docs[0].data();
              return {
                ...order,
                storeId: storeId,
                storeName: storeData.name || storeName || 'Unknown Store',
                location: storeData.location || 'No location',
                deliveryFee: storeData.deliveryFee || 0
              };
            }
          } catch (error) {
            console.error(`Error fetching store info for order ${order.id}:`, error);
          }
          
          return {
            ...order,
            storeId: storeId || null,
            storeName: storeName || 'Unknown Store',
            location: 'No location',
            deliveryFee: 0
          };
        })
      );

      return ordersWithStoreInfo;
    } catch (error) {
      console.error("Error fetching store orders:", error);
      return [];
    }
  },

  updateOrderStatus: async (projectId, orderId, newStatus) => {
    try {
      set({ loading: true, error: null });
      const orderRef = doc(db, `projects/${projectId}/orders`, orderId);
      
      await updateDoc(orderRef, { 
        status: newStatus,
        updatedAt: serverTimestamp()
      });

      // Update local state
      set((state) => ({
        orders: state.orders.map(order => 
          order.id === orderId ? { ...order, status: newStatus, updatedAt: new Date() } : order
        )
      }));

      return true;
    } catch (error) {
      console.error("Error updating order status:", error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  getOrderById: (orderId) => {
    return get().orders.find(order => order.id === orderId);
  },

  getOrdersByStatus: (status) => {
    return get().orders.filter(order => order.status === status);
  },

  getOrdersByDateRange: (startDate, endDate) => {
    return get().orders.filter(order => {
      const orderDate = order.createdAt?.toDate?.() || new Date(order.createdAt);
      return orderDate >= startDate && orderDate <= endDate;
    });
  },

  // Refresh orders with latest store information
  refreshOrdersWithStoreInfo: async (projectId) => {
    try {
      console.log('Refreshing orders with store info for project:', projectId);
      await get().fetchOrders(projectId);
    } catch (error) {
      console.error('Error refreshing orders:', error);
    }
  },

  clearStoreManagement: () => set({ stores: [], products: [], categories: [], inventory: {} })
}));
