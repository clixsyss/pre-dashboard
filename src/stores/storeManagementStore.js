import { create } from 'zustand';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { uploadBytes, getDownloadURL, ref as storageRef } from 'firebase/storage';
import { db, storage } from '../config/firebase';

export const useStoreManagementStore = create((set, get) => ({
  stores: [],
  products: [],
  categories: [],
  inventory: {},
  loading: false,
  error: null,

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  fetchStores: async (projectId) => {
    try {
      set({ loading: true, error: null });
      const querySnapshot = await getDocs(collection(db, `projects/${projectId}/stores`));
      const storesData = querySnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      set({ stores: storesData });
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

      set((state) => ({
        stores: state.stores.map(store => 
          store.id === storeId ? { ...store, ...updateData } : store
        )
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
      const storagePath = storageRef(storage, path);
      const snapshot = await uploadBytes(storagePath, file);
      return await getDownloadURL(snapshot.ref);
    } catch (error) {
      console.error("Error uploading image:", error);
      return null;
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

  clearStoreManagement: () => set({ stores: [], products: [], categories: [], inventory: {} })
}));
