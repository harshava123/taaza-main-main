import React, { useState } from 'react';
import {
  MdDashboard,
  MdInventory,
  MdCategory,
  MdShoppingCart,
  MdAnalytics,
  MdSettings,
  MdLogout,
  MdReceipt,
  MdChevronLeft,
  MdChevronRight,
  MdImage,
  MdPeople
} from 'react-icons/md';

const AdminSidebar = ({ activePage, setActivePage }) => {
  const [collapsed, setCollapsed] = useState(false);
  const menuItems = [
    { id: 'billing', label: 'Billing', icon: MdReceipt },
    { id: 'orders', label: 'Orders', icon: MdShoppingCart },
    { id: 'dashboard', label: 'Dashboard', icon: MdDashboard },
    { id: 'products', label: 'Products', icon: MdInventory },
    { id: 'categories', label: 'Categories', icon: MdCategory },
    { id: 'analytics', label: 'Analytics', icon: MdAnalytics },
    { id: 'banners', label: 'Banners', icon: MdImage },
    { id: 'employees', label: 'Employees', icon: MdPeople },
  ];

  return (
    <div className={`relative h-full bg-white shadow-lg transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}>
      <div className={`flex items-center justify-between p-6 ${collapsed ? 'justify-center' : ''}`}>
        <div className={`${collapsed ? 'hidden' : ''}`}>
          <h1 className="text-2xl font-bold text-gray-800">Taaza Admin</h1>
          <p className="text-sm text-gray-600 mt-1">Management Panel</p>
        </div>
        <button
          className="ml-2 p-2 rounded hover:bg-gray-100 transition-colors"
          onClick={() => setCollapsed((prev) => !prev)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <MdChevronRight size={24} /> : <MdChevronLeft size={24} />}
        </button>
      </div>
      <nav className="mt-6">
        <div className="px-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`w-full flex items-center ${collapsed ? 'justify-center' : ''} px-4 py-3 text-left rounded-lg mb-2 transition-colors duration-200 ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className={`w-5 h-5 ${collapsed ? '' : 'mr-3'} ${isActive ? 'text-blue-700' : 'text-gray-500'}`} />
                {!collapsed && <span className="font-medium">{item.label}</span>}
              </button>
            );
          })}
        </div>
      </nav>
      <div className={`absolute bottom-0 ${collapsed ? 'w-20' : 'w-64'} p-4 border-t border-gray-200`}>
        <button className={`w-full flex items-center ${collapsed ? 'justify-center' : ''} px-4 py-3 text-left rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200`}>
          <MdSettings className={`w-5 h-5 ${collapsed ? '' : 'mr-3'} text-gray-500`} />
          {!collapsed && <span className="font-medium">Settings</span>}
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;