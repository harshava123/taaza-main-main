import React, { useState, useEffect } from 'react';
import { getCategories } from '../services/firebaseService';
import Header from '../components/Header';

const Categories = ({ onNavigateToCategory, onNavigate, activeTab, cartCount, query, setQuery, onAdminClick }) => {
  const [openIndex, setOpenIndex] = useState(-1);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  const handleCategoryClick = (idx) => {
    setOpenIndex(openIndex === idx ? -1 : idx);
  };

  const handleSubcategoryClick = (cat, sub) => {
    if (onNavigateToCategory) onNavigateToCategory(cat.key, sub.key);
  };

  // Priority order for categories
  const categoryPriority = ['chicken', 'mutton', 'eggs', 'masala'];
  function getCategoryPriority(cat) {
    const key = (cat.key || '').toLowerCase();
    const name = (cat.name || '').toLowerCase();
    for (let i = 0; i < categoryPriority.length; i++) {
      if (key.includes(categoryPriority[i]) || name.includes(categoryPriority[i])) return i;
    }
    return categoryPriority.length;
  }
  const sortedCategories = [...categories].sort((a, b) => getCategoryPriority(a) - getCategoryPriority(b));

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <Header
        activeTab={activeTab}
        onNavigate={onNavigate}
        cartCount={cartCount}
        query={query}
        setQuery={setQuery}
        onAdminClick={onAdminClick}
      />
      <div className="max-w-md mx-auto px-4 py-6 md:max-w-lg md:px-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8 text-center tracking-tight">All Categories</h1>
        <div className="space-y-5">
          {sortedCategories.map((cat, idx) => (
            <div
              key={cat.name}
              className="bg-white rounded-2xl border border-gray-100 shadow-lg transition-shadow hover:shadow-xl"
            >
              <button
                className="w-full flex items-center px-5 py-4 focus:outline-none group transition-colors duration-150"
                onClick={() => handleCategoryClick(idx)}
              >
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-12 h-12 rounded-full object-cover mr-4 border-2 border-gray-200 group-hover:border-red-700 transition-all"
                />
                <div className="flex-1 text-left">
                  <div className="font-semibold text-gray-900 text-lg group-hover:text-red-700 transition-colors">{cat.name}</div>
                  <div className="text-xs text-gray-500 mt-1">{cat.subtitle}</div>
                </div>
                <span
                  className={`ml-2 text-gray-400 group-hover:text-red-700 transition-transform duration-200 ${openIndex === idx ? 'rotate-180' : ''}`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </span>
              </button>
              <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${openIndex === idx ? 'max-h-52 opacity-100 py-3' : 'max-h-0 opacity-0 py-0'}`}
              >
                {cat.subcategories.length > 0 && (
                  <div className="px-5 pt-1 grid grid-cols-3 gap-4">
                    {cat.subcategories.map((sub) => (
                      <button
                        key={sub.name}
                        className="flex flex-col items-center focus:outline-none group"
                        onClick={() => handleSubcategoryClick(cat, sub)}
                      >
                        <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-gray-200 group-hover:border-red-700 bg-gray-50 group-hover:bg-red-50 shadow-sm mb-1 transition-all">
                          <img src={sub.image} alt={sub.name} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-200" />
                        </div>
                        <span className="text-xs text-gray-700 text-center font-medium group-hover:text-red-700 transition-colors leading-tight">
                          {sub.name}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Categories; 