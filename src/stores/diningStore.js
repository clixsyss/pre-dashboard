import { create } from 'zustand';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { uploadBytes, getDownloadURL, ref as storageRef } from 'firebase/storage';
import { db, storage } from '../config/firebase';

export const useDiningStore = create((set, get) => ({
  shops: [],
  productsByShop: {},
  categories: [],
  user: null,
  loading: false,
  error: null,

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setUser: (userData) => set({ user: userData }),

  fetchShops: async (projectId) => {
    try {
      set({ loading: true, error: null });
      const querySnapshot = await getDocs(collection(db, `projects/${projectId}/shops`));
      const shopData = [];

      for (const docSnap of querySnapshot.docs) {
        const shop = { id: docSnap.id, ...docSnap.data() };
        shopData.push(shop);
        await get().fetchProducts(projectId, shop.id);
      }

      set({ shops: shopData });
    } catch (error) {
      console.error("Error fetching shops:", error);
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  fetchCategories: async (projectId) => {
    try {
      set({ loading: true, error: null });
      const querySnapshot = await getDocs(collection(db, `projects/${projectId}/categories`));
      const categoryData = querySnapshot.docs.map(docSnap => docSnap.data().name);
      set({ categories: categoryData });
    } catch (error) {
      console.error("Error fetching categories:", error);
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  addCategory: async (projectId, newCategory) => {
    try {
      set({ loading: true, error: null });
      if (!get().categories.includes(newCategory)) {
        await addDoc(collection(db, `projects/${projectId}/categories`), { 
          name: newCategory,
          createdAt: serverTimestamp()
        });
        
        set((state) => ({
          categories: [...state.categories, newCategory]
        }));
      }
    } catch (error) {
      console.error("Error adding category:", error);
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  fetchProducts: async (projectId, shopId) => {
    try {
      const querySnapshot = await getDocs(collection(db, `projects/${projectId}/shops/${shopId}/products`));
      const productData = querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      
      set((state) => ({
        productsByShop: { ...state.productsByShop, [shopId]: productData }
      }));
    } catch (error) {
      console.error("Error fetching products:", error);
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

  addShop: async (projectId, shopData) => {
    try {
      set({ loading: true, error: null });
      let imageUrl = "";
      if (shopData.imageFile) {
        imageUrl = await get().uploadImage(shopData.imageFile, `projects/${projectId}/shops/${shopData.imageFile.name}`);
      }

      const newShop = {
        name: shopData.name,
        deliveryTime: shopData.deliveryTime,
        location: shopData.location,
        image: imageUrl,
        rating: 0,
        categories: shopData.categories || [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, `projects/${projectId}/shops`), newShop);
      newShop.id = docRef.id;

      set((state) => ({
        shops: [...state.shops, newShop],
        productsByShop: { ...state.productsByShop, [docRef.id]: [] }
      }));

      return docRef.id;
    } catch (error) {
      console.error("Error adding shop:", error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateShop: async (projectId, shopId, shopData) => {
    try {
      set({ loading: true, error: null });
      const shopRef = doc(db, `projects/${projectId}/shops`, shopId);
      
      let imageUrl = shopData.image;
      if (shopData.imageFile) {
        imageUrl = await get().uploadImage(shopData.imageFile, `projects/${projectId}/shops/${shopData.imageFile.name}`);
      }

      const updateData = {
        name: shopData.name,
        deliveryTime: shopData.deliveryTime,
        location: shopData.location,
        categories: shopData.categories || [],
        updatedAt: serverTimestamp()
      };

      if (imageUrl) {
        updateData.image = imageUrl;
      }

      await updateDoc(shopRef, updateData);

      set((state) => ({
        shops: state.shops.map(shop => 
          shop.id === shopId ? { ...shop, ...updateData } : shop
        )
      }));
    } catch (error) {
      console.error("Error updating shop:", error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deleteShop: async (projectId, shopId) => {
    try {
      set({ loading: true, error: null });
      await deleteDoc(doc(db, `projects/${projectId}/shops`, shopId));
      
      set((state) => {
        const newProductsByShop = { ...state.productsByShop };
        delete newProductsByShop[shopId];
        
        return {
          shops: state.shops.filter(shop => shop.id !== shopId),
          productsByShop: newProductsByShop
        };
      });
    } catch (error) {
      console.error("Error deleting shop:", error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  addProduct: async (projectId, shopId, productData) => {
    try {
      set({ loading: true, error: null });
      let imageUrl = "";
      if (productData.imageFile) {
        imageUrl = await get().uploadImage(productData.imageFile, `projects/${projectId}/shops/${shopId}/products/${productData.imageFile.name}`);
      }

      const newProduct = {
        name: productData.name,
        description: productData.description,
        price: productData.price,
        category: productData.category,
        image: imageUrl,
        available: productData.available !== undefined ? productData.available : true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, `projects/${projectId}/shops/${shopId}/products`), newProduct);
      newProduct.id = docRef.id;

      set((state) => ({
        productsByShop: {
          ...state.productsByShop,
          [shopId]: [...(state.productsByShop[shopId] || []), newProduct]
        }
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

  updateProduct: async (projectId, shopId, productId, productData) => {
    try {
      set({ loading: true, error: null });
      const productRef = doc(db, `projects/${projectId}/shops/${shopId}/products`, productId);
      
      let imageUrl = productData.image;
      if (productData.imageFile) {
        imageUrl = await get().uploadImage(productData.imageFile, `projects/${projectId}/shops/${shopId}/products/${productData.imageFile.name}`);
      }

      const updateData = {
        name: productData.name,
        description: productData.description,
        price: productData.price,
        category: productData.category,
        available: productData.available,
        updatedAt: serverTimestamp()
      };

      if (imageUrl) {
        updateData.image = imageUrl;
      }

      await updateDoc(productRef, updateData);

      set((state) => ({
        productsByShop: {
          ...state.productsByShop,
          [shopId]: (state.productsByShop[shopId] || []).map(product => 
            product.id === productId ? { ...product, ...updateData } : product
          )
        }
      }));
    } catch (error) {
      console.error("Error updating product:", error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deleteProduct: async (projectId, shopId, productId) => {
    try {
      set({ loading: true, error: null });
      await deleteDoc(doc(db, `projects/${projectId}/shops/${shopId}/products`, productId));
      
      set((state) => ({
        productsByShop: {
          ...state.productsByShop,
          [shopId]: (state.productsByShop[shopId] || []).filter(product => product.id !== productId)
        }
      }));
    } catch (error) {
      console.error("Error deleting product:", error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  clearDining: () => set({ shops: [], productsByShop: {}, categories: [], user: null })
}));