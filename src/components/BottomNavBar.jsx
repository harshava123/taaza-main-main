import React from 'react';
import { MdShoppingCart, MdAccountCircle } from 'react-icons/md';

const navItems = [
  {
    id: 'home',
    label: 'Taaza',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="mx-auto">
        <path d="M12 17c2.5 0 4.5-2 4.5-4.5" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="8.5" cy="10" r="1" fill="currentColor"/>
        <circle cx="15.5" cy="10" r="1" fill="currentColor"/>
      </svg>
    )
  },
  {
    id: 'categories',
    label: 'Categories',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="mx-auto">
        <rect x="4" y="4" width="16" height="3" rx="1.5" fill="none" strokeWidth="1.5"/>
        <rect x="4" y="10.5" width="16" height="3" rx="1.5" fill="none" strokeWidth="1.5"/>
        <rect x="4" y="17" width="16" height="3" rx="1.5" fill="none" strokeWidth="1.5"/>
      </svg>
    )
  },
  {
    id: 'search',
    label: 'Search',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="mx-auto">
        <circle cx="11" cy="11" r="6" strokeWidth="1.5"/>
        <line x1="16.5" y1="16.5" x2="21" y2="21" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    )
  },
  {
    id: 'cart',
    label: 'Cart',
    icon: (
      <span className="relative block">
        <MdShoppingCart className="w-6 h-6 mx-auto" />
      </span>
    )
  }
];

const BottomNavBar = ({ activeTab = 'home', onTabChange, cartItemCount, onCartClick, onAccountClick }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-50 shadow-[0_-1px_8px_0_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-around ">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              if (item.id === 'cart' && onCartClick) onCartClick();
              else if (item.id === 'account' && onAccountClick) onAccountClick();
              else if (onTabChange) onTabChange(item.id);
            }}
            className={`flex flex-col items-center px-2 pt-1 pb-0.5 w-1/5 transition-colors duration-200 ${
              activeTab === item.id
                ? 'text-red-700 font-semibold'
                : 'text-gray-500 hover:text-red-700'
            }`}
          >
            <span className="relative">
            {item.icon}
              {item.id === 'cart' && cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                  {cartItemCount}
                </span>
              )}
            </span>
            <span className="text-xs mt-0.5">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default BottomNavBar; 