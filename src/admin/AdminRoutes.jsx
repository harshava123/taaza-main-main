import React, { useState, useEffect } from 'react';
import { useAdmin } from '../context/AdminContext';
import AdminSidebar from './components/AdminSidebar';
import AdminHeader from './components/AdminHeader';
import DashboardHome from './pages/DashboardHome';
import ProductsManagement from './pages/ProductsManagement';
import CategoriesManagement from './pages/CategoriesManagement';
import OrdersManagement from './pages/OrdersManagement';
import Analytics from './pages/Analytics';
import Billing from './pages/Billing';
import Banners from './pages/Banners';
import EmployeeManagement from './pages/EmployeeManagement';

const AdminRoutes = () => {
  const { admin, logout } = useAdmin();
  const [activePage, setActivePage] = useState(() => 'billing');

  useEffect(() => {
    localStorage.setItem('adminActivePage', activePage);
  }, [activePage]);

  const renderPage = () => {
    switch (activePage) {
      case 'billing':
        return <Billing />;
      case 'dashboard':
        return <DashboardHome />;
      case 'products':
        return <ProductsManagement />;
      case 'categories':
        return <CategoriesManagement />;
      case 'orders':
        return <OrdersManagement />;
      case 'analytics':
        return <Analytics />;
      case 'banners':
        return <Banners />;
      case 'employees':
        return <EmployeeManagement />;
      default:
        return <DashboardHome />;
    }
  };

  if (!admin) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar activePage={activePage} setActivePage={setActivePage} />
      <div className="flex-1 flex flex-col overflow-hidden">
        {activePage !== 'billing' && <AdminHeader admin={admin} onLogout={logout} />}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 pl-6 pr-6 pt-3 pb-3">
          {renderPage()}
        </main>
      </div>
    </div>
  );
};

export default AdminRoutes;
