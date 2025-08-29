import React, { useState, useEffect } from 'react';
import HeroBanner from '../components/HeroBanner';
import SectionHeading from '../components/SectionHeading';
import ProductCard from '../components/ProductCard';
import BottomNavBar from '../components/BottomNavBar';
import Header from '../components/Header';
import { useCart } from '../context/CartContext';
import { getProducts, getCategories } from '../services/firebaseService';

const Home = ({ onNavigateToCart, onNavigateToCategory, onNavigate, activeTab, cartCount, query, setQuery, onProductClick, onAdminClick }) => {
  const { addToCart, getTotalItems } = useCart();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null); // NEW

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

  const bestsellers = products.filter(product => product.bestSeller);

  // Case-insensitive category filtering
  const getProductsByCategory = (categoryKey) => {
    return products.filter(p => 
      p.category && p.category.toLowerCase() === categoryKey.toLowerCase()
    );
  };

  // Inline price update handler
  const handlePriceUpdate = (product, newPrice) => {
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, pricePerKg: newPrice } : p));
    // TODO: Optionally update price in backend here
  };

  // Products to show: all if no category selected, else filtered
  const visibleProducts = selectedCategory ? getProductsByCategory(selectedCategory) : products;

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

      {/* Thermal Printer Test Button */}
      <div className="max-w-7xl mx-auto px-4 py-2">
        <button
          onClick={() => onNavigate('printerTest')}
          className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors duration-200"
        >
          🖨️ Test Thermal Printer
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Category Navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {sortedCategories.map(cat => (
            <button
              key={cat.id}
              className={`px-4 py-2 rounded-lg font-semibold border ${selectedCategory === cat.key ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 text-gray-700 border-gray-300'}`}
              onClick={() => setSelectedCategory(cat.key)}
            >
              {cat.name}
            </button>
          ))}
          <button
            className={`px-4 py-2 rounded-lg font-semibold border ${!selectedCategory ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 text-gray-700 border-gray-300'}`}
            onClick={() => setSelectedCategory(null)}
          >
            All
          </button>
        </div>

        {/* Bestsellers Section */}
        <section className="mb-8">
          <SectionHeading 
            title="Bestsellers" 
            subtitle="Most popular items with great discounts"
            showViewAll={true}
          />
          <div className="md:hidden -mx-4 px-1 overflow-x-auto">
            <div className="flex space-x-4 pb-2">
              {bestsellers.map((product) => (
                <div key={product.id} className="min-w-[220px] max-w-[70vw] flex-shrink-0">
                  <ProductCard
                    product={product}
                    onPriceUpdate={handlePriceUpdate}
                    onCardClick={onProductClick}
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="hidden md:grid md:grid-cols-4 gap-4">
            {bestsellers.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onPriceUpdate={handlePriceUpdate}
                onCardClick={onProductClick}
              />
            ))}
          </div>
        </section>

        {/* Products by Category or All */}
        <section>
          <SectionHeading 
            title={selectedCategory ? sortedCategories.find(c => c.key === selectedCategory)?.name || 'Products' : 'All Products'}
            subtitle={`${visibleProducts.length} items available`}
          />
          <div className="space-y-12">
            {/* Group products by dynamic categories if no category selected */}
            {selectedCategory
              ? (
                <div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {visibleProducts.map(product => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onPriceUpdate={handlePriceUpdate}
                        onCardClick={onProductClick}
                      />
                    ))}
                  </div>
                </div>
              )
              : (
                sortedCategories.map((cat) => {
                  const catProducts = getProductsByCategory(cat.key);
                  if (catProducts.length === 0) return null;
                  return (
                    <div key={cat.id} className="">
                      <div className="flex items-center mb-4 gap-4">
                        {cat.image && (
                          <img src={cat.image} alt={cat.name} className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 shadow-sm" />
                        )}
                        <h3 className="text-xl md:text-2xl font-bold text-gray-800">{cat.name}</h3>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {catProducts.map((product) => (
                          <ProductCard
                            key={product.id}
                            product={product}
                            onPriceUpdate={handlePriceUpdate}
                            onCardClick={onProductClick}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
          </div>
        </section>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNavBar
        activeCategory={null}
        onCategoryChange={() => {}}
        cartItemCount={getTotalItems()}
        onCartClick={onNavigateToCart}
      />
    </div>
  );
};

export default Home; 