import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  setDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Products CRUD operations
export const getProducts = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'products'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting products:', error);
    throw error;
  }
};

export const getProduct = async (id) => {
  try {
    const docRef = doc(db, 'products', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting product:', error);
    throw error;
  }
};

export const addProduct = async (productData) => {
  try {
    const docRef = await addDoc(collection(db, 'products'), {
      ...productData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding product:', error);
    throw error;
  }
};

export const updateProduct = async (id, productData) => {
  try {
    const docRef = doc(db, 'products', id);
    await updateDoc(docRef, {
      ...productData,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

export const deleteProduct = async (id) => {
  try {
    await deleteDoc(doc(db, 'products', id));
    return true;
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};

// Categories CRUD operations
export const getCategories = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'categories'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting categories:', error);
    throw error;
  }
};

export const addCategory = async (categoryData) => {
  try {
    const docRef = await addDoc(collection(db, 'categories'), {
      ...categoryData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding category:', error);
    throw error;
  }
};

export const updateCategory = async (id, categoryData) => {
  try {
    const docRef = doc(db, 'categories', id);
    await updateDoc(docRef, {
      ...categoryData,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
};

export const deleteCategory = async (id) => {
  try {
    await deleteDoc(doc(db, 'categories', id));
    return true;
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
};

// Orders CRUD operations
export const getOrders = async () => {
  try {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting orders:', error);
    throw error;
  }
};

export const getOrder = async (id) => {
  try {
    const docRef = doc(db, 'orders', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting order:', error);
    throw error;
  }
};

export const updateOrderStatus = async (id, status) => {
  try {
    const docRef = doc(db, 'orders', id);
    await updateDoc(docRef, {
      status,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
};

// Analytics
export const getAnalytics = async () => {
  try {
    const ordersSnapshot = await getDocs(collection(db, 'orders'));
    const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
    const pendingOrders = orders.filter(order => order.status === 'pending').length;
    const completedOrders = orders.filter(order => order.status === 'completed').length;
    
    return {
      totalOrders,
      totalRevenue,
      pendingOrders,
      completedOrders
    };
  } catch (error) {
    console.error('Error getting analytics:', error);
    throw error;
  }
}; 

// Daily Stock Management
export const getDailyStock = async (dateStr) => {
  try {
    const docRef = doc(db, 'dailyStock', dateStr);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting daily stock:', error);
    throw error;
  }
};

export const setDailyStock = async (dateStr, stockData) => {
  try {
    const docRef = doc(db, 'dailyStock', dateStr);
    await updateDoc(docRef, {
      ...stockData,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    // If doc doesn't exist, create it
    try {
      await setDoc(doc(db, 'dailyStock', dateStr), {
        ...stockData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return true;
    } catch (err) {
      console.error('Error setting daily stock:', err);
      throw err;
    }
  }
};

export const updateDailyStock = async (dateStr, stockData) => {
  try {
    const docRef = doc(db, 'dailyStock', dateStr);
    await updateDoc(docRef, {
      ...stockData,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error('Error updating daily stock:', error);
    throw error;
  }
};

export const getStockHistory = async (limit = 30) => {
  try {
    const q = query(collection(db, 'dailyStock'), orderBy('date', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.slice(0, limit).map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting stock history:', error);
    throw error;
  }
}; 

// Employee Management
export const getEmployees = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'employees'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting employees:', error);
    throw error;
  }
};

export const addEmployee = async (employeeData) => {
  try {
    const docRef = await addDoc(collection(db, 'employees'), {
      ...employeeData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      salaryHistory: [],
      leaveHistory: [],
      advanceHistory: []
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding employee:', error);
    throw error;
  }
};

export const updateEmployee = async (id, employeeData) => {
  try {
    const docRef = doc(db, 'employees', id);
    await updateDoc(docRef, {
      ...employeeData,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error updating employee:', error);
    throw error;
  }
};

export const deleteEmployee = async (id) => {
  try {
    await deleteDoc(doc(db, 'employees', id));
    return true;
  } catch (error) {
    console.error('Error deleting employee:', error);
    throw error;
  }
};

export const updateEmployeeSalary = async (employeeId, salaryData) => {
  try {
    const docRef = doc(db, 'employees', employeeId);
    const employeeDoc = await getDoc(docRef);
    if (!employeeDoc.exists()) throw new Error('Employee not found');
    
    const currentData = employeeDoc.data();
    const salaryHistory = currentData.salaryHistory || [];
    
    await updateDoc(docRef, {
      salaryHistory: [...salaryHistory, { ...salaryData, date: Date.now() }],
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error updating employee salary:', error);
    throw error;
  }
};

export const updateEmployeeLeave = async (employeeId, leaveData) => {
  try {
    const docRef = doc(db, 'employees', employeeId);
    const employeeDoc = await getDoc(docRef);
    if (!employeeDoc.exists()) throw new Error('Employee not found');
    
    const currentData = employeeDoc.data();
    const leaveHistory = currentData.leaveHistory || [];
    // Calculate number of days (inclusive)
    let days = 1;
    if (leaveData.startDate && leaveData.endDate) {
      const start = new Date(leaveData.startDate);
      const end = new Date(leaveData.endDate);
      days = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
      if (days < 1) days = 1;
    }
    await updateDoc(docRef, {
      leaveHistory: [...leaveHistory, { ...leaveData, days, date: Date.now() }],
      updatedAt: serverTimestamp()
    });
    return days;
  } catch (error) {
    console.error('Error updating employee leave:', error);
    throw error;
  }
};

export const updateEmployeeAdvance = async (employeeId, advanceData) => {
  try {
    const docRef = doc(db, 'employees', employeeId);
    const employeeDoc = await getDoc(docRef);
    if (!employeeDoc.exists()) throw new Error('Employee not found');
    
    const currentData = employeeDoc.data();
    const advanceHistory = currentData.advanceHistory || [];
    
    await updateDoc(docRef, {
      advanceHistory: [...advanceHistory, { ...advanceData, date: Date.now() }],
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error updating employee advance:', error);
    throw error;
  }
};

export const getEmployeeHistory = async (employeeId) => {
  try {
    const docRef = doc(db, 'employees', employeeId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting employee history:', error);
    throw error;
  }
}; 