import { create } from 'zustand';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, where, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';

export const useOrderStore = create((set, get) => ({
  orders: [],
  selectedOrder: null,
  loading: false,
  error: null,

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setSelectedOrder: (order) => set({ selectedOrder: order }),

  fetchOrders: async (projectId, filters = {}) => {
    try {
      set({ loading: true, error: null });
      let q = collection(db, `projects/${projectId}/orders`);
      
      // Apply filters
      if (filters.status) {
        q = query(q, where('status', '==', filters.status));
      }
      if (filters.userId) {
        q = query(q, where('userId', '==', filters.userId));
      }
      if (filters.date) {
        q = query(q, where('orderDate', '==', filters.date));
      }
      
      // Order by date
      q = query(q, orderBy('orderDate', 'desc'));
      
      const querySnapshot = await getDocs(q);
      const ordersData = querySnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      set({ orders: ordersData });
    } catch (error) {
      console.error("Error fetching orders:", error);
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  addOrder: async (projectId, orderData) => {
    try {
      set({ loading: true, error: null });
      const newOrder = {
        orderNumber: orderData.orderNumber || `ORD-${Date.now()}`,
        userId: orderData.userId,
        userName: orderData.userName,
        userEmail: orderData.userEmail,
        items: orderData.items || [],
        subtotal: orderData.subtotal || 0,
        tax: orderData.tax || 0,
        shipping: orderData.shipping || 0,
        total: orderData.total || 0,
        status: orderData.status || 'pending', // pending, confirmed, processing, shipped, delivered, cancelled
        paymentStatus: orderData.paymentStatus || 'pending', // pending, paid, failed, refunded
        paymentMethod: orderData.paymentMethod || '',
        shippingAddress: orderData.shippingAddress || {},
        billingAddress: orderData.billingAddress || {},
        notes: orderData.notes || '',
        orderDate: orderData.orderDate || new Date().toISOString(),
        estimatedDelivery: orderData.estimatedDelivery || '',
        actualDelivery: orderData.actualDelivery || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, `projects/${projectId}/orders`), newOrder);
      newOrder.id = docRef.id;

      set((state) => ({
        orders: [newOrder, ...state.orders]
      }));

      return docRef.id;
    } catch (error) {
      console.error("Error adding order:", error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateOrderStatus: async (projectId, orderId, status) => {
    try {
      set({ loading: true, error: null });
      const orderRef = doc(db, `projects/${projectId}/orders`, orderId);
      
      await updateDoc(orderRef, { 
        status,
        updatedAt: serverTimestamp()
      });

      set((state) => ({
        orders: state.orders.map(order => 
          order.id === orderId ? { ...order, status } : order
        )
      }));
    } catch (error) {
      console.error("Error updating order status:", error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updatePaymentStatus: async (projectId, orderId, paymentStatus) => {
    try {
      set({ loading: true, error: null });
      const orderRef = doc(db, `projects/${projectId}/orders`, orderId);
      
      await updateDoc(orderRef, { 
        paymentStatus,
        updatedAt: serverTimestamp()
      });

      set((state) => ({
        orders: state.orders.map(order => 
          order.id === orderId ? { ...order, paymentStatus } : order
        )
      }));
    } catch (error) {
      console.error("Error updating payment status:", error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  addOrderItem: async (projectId, orderId, itemData) => {
    try {
      set({ loading: true, error: null });
      const orderRef = doc(db, `projects/${projectId}/orders`, orderId);
      const currentOrder = get().orders.find(o => o.id === orderId);
      
      if (currentOrder) {
        const newItems = [...currentOrder.items, {
          productId: itemData.productId,
          productName: itemData.productName,
          quantity: itemData.quantity,
          unitPrice: itemData.unitPrice,
          totalPrice: itemData.quantity * itemData.unitPrice
        }];

        const newSubtotal = newItems.reduce((sum, item) => sum + item.totalPrice, 0);
        const newTotal = newSubtotal + (currentOrder.tax || 0) + (currentOrder.shipping || 0);

        await updateDoc(orderRef, { 
          items: newItems,
          subtotal: newSubtotal,
          total: newTotal,
          updatedAt: serverTimestamp()
        });

        set((state) => ({
          orders: state.orders.map(order => 
            order.id === orderId ? { 
              ...order, 
              items: newItems,
              subtotal: newSubtotal,
              total: newTotal
            } : order
          )
        }));
      }
    } catch (error) {
      console.error("Error adding order item:", error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  getOrdersByStatus: (status) => {
    return get().orders.filter(order => order.status === status);
  },

  getOrdersByUser: (userId) => {
    return get().orders.filter(order => order.userId === userId);
  },

  getPendingOrders: () => {
    return get().orders.filter(order => order.status === 'pending');
  },

  getConfirmedOrders: () => {
    return get().orders.filter(order => order.status === 'confirmed');
  },

  getProcessingOrders: () => {
    return get().orders.filter(order => order.status === 'processing');
  },

  getShippedOrders: () => {
    return get().orders.filter(order => order.status === 'shipped');
  },

  getDeliveredOrders: () => {
    return get().orders.filter(order => order.status === 'delivered');
  },

  getCancelledOrders: () => {
    return get().orders.filter(order => order.status === 'cancelled');
  },

  getOrdersByDateRange: (startDate, endDate) => {
    return get().orders.filter(order => 
      order.orderDate >= startDate && order.orderDate <= endDate
    );
  },

  calculateOrderStats: () => {
    const orders = get().orders;
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
    const pendingOrders = orders.filter(order => order.status === 'pending').length;
    const completedOrders = orders.filter(order => order.status === 'delivered').length;

    return {
      totalOrders,
      totalRevenue,
      pendingOrders,
      completedOrders,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0
    };
  },

  clearOrders: () => set({ orders: [], selectedOrder: null })
}));
