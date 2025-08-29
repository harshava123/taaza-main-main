import React, { useEffect, useState } from 'react';
import { getCategories, getProducts } from '../services/firebaseService';
import ProductCard from '../components/ProductCard';
import Header from '../components/Header';

const Search = ({ onNavigate, activeTab, cartCount, query, setQuery, onNavigateToCategoryPage, onProductClick, onAdminClick }) => {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  // Track if the search bar is focused
  const [searchFocused, setSearchFocused] = useState(false);

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

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getProducts();
        setProducts(data);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };
    fetchProducts();
  }, []);

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.category.toLowerCase().includes(query.toLowerCase())
  );

  // Flatten all subcategories (excluding 'all') from all categories
  const allSubcategories = categories.flatMap(cat =>
    (cat.subcategories || []).filter(sub => sub.key !== 'all').map(sub => ({
      ...sub,
      parent: cat.name,
      parentKey: cat.key
    }))
  );

  // Priority order for categories
  const categoryPriority = ['chicken', 'mutton', 'eggs', 'masala'];
  function getCategoryPriority(catKeyOrName) {
    const key = (catKeyOrName || '').toLowerCase();
    for (let i = 0; i < categoryPriority.length; i++) {
      if (key.includes(categoryPriority[i])) return i;
    }
    return categoryPriority.length;
  }

  // Sort allSubcategories by parent category priority only
  const sortedSubcategories = [...allSubcategories].sort((a, b) => getCategoryPriority(a.parentKey) - getCategoryPriority(b.parentKey));

  // Sort filteredProducts by their category priority
  const sortedFilteredProducts = filteredProducts.sort((a, b) => getCategoryPriority(a.category) - getCategoryPriority(b.category));

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
      <div className="max-w-md mx-auto px-4 py-4">
        {/* Section Search Bar (mobile only) */}
        <div className="mb-4 md:hidden">
          <input
            type="text"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm bg-white"
            placeholder="Search for any delicious product..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            aria-label="Search for products"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
          />
        </div>
        {/* Categories or Results */}
        {/* Show subcategories in priority order when search bar is focused or query is empty */}
        {(searchFocused || query.trim() === '') ? (
          <>
            <div className="mb-2">
              <div className="font-semibold text-base text-gray-800">All Subcategories</div>
              <div className="text-xs text-gray-500">Explore all available subcategories</div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {sortedSubcategories.map((sub) => (
                <button
                  key={sub.key + '-' + sub.parentKey}
                  className="flex flex-col items-center focus:outline-none"
                  onClick={() => onNavigateToCategoryPage && onNavigateToCategoryPage(sub.parentKey, sub.key)}
                >
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-gray-200 mb-1">
                    <img src={sub.image} alt={sub.name} className="object-cover w-full h-full" />
                  </div>
                  <span className="text-xs text-gray-700 text-center font-medium leading-tight">
                    {sub.name}
                  </span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="mb-2 font-semibold text-base text-gray-800">Search Results</div>
            {sortedFilteredProducts.length === 0 ? (
              <div className="text-gray-500 text-sm">No products found.</div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {sortedFilteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} onAddToCart={() => {}} onCardClick={onProductClick} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Search; 