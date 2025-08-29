import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AdminProvider, useAdmin } from './context/AdminContext';
import { UserAuthProvider } from './context/UserAuthContext';
import UserRoutes from './routes/UserRoutes';
import AdminRoutes from './admin/AdminRoutes';
import Login from './pages/Login';
 
function RequireAdmin({ children }) {
  const { admin, loading } = useAdmin();
  const location = useLocation();
 
  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
 
  // If not admin and not loading, redirect to login
  if (!admin) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
 
  return children;
}
 
const App = () => (
  <AdminProvider>
    <CartProvider>
      <UserAuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<UserRoutes />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={
              <RequireAdmin>
                <AdminRoutes />
              </RequireAdmin>
            } />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
      </UserAuthProvider>
    </CartProvider>
  </AdminProvider>
);
 
export default App;