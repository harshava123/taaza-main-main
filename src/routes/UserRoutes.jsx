import React, { useEffect, useState } from 'react';
import { useCart } from '../context/CartContext';
import Home from '../pages/Home';
import Cart from '../pages/Cart';
import Checkout from '../pages/Checkout';
import OrderSuccess from '../pages/OrderSuccess';
import Footer from '../components/Footer';
import BottomNavBar from '../components/BottomNavBar';
import Categories from '../pages/Categories';
import Search from '../pages/Search';
import CategoryPage from '../pages/CategoryPage';
import CartSummaryBar from '../components/CartSummaryBar';
import { getCategories, getProducts } from '../services/firebaseService';
import ProductDetail from '../pages/ProductDetail';
import ThermalPrinterTest from '../components/ThermalPrinterTest';

const UserRoutes = ({ onAdminClick }) => {
  const [currentPage, setCurrentPage] = useState('home');
  const [categoryKey, setCategoryKey] = useState(null);
  const [subcategoryKey, setSubcategoryKey] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const { getTotalItems, getTotalPrice } = useCart();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [lastOrderId, setLastOrderId] = useState(null);

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

  const navigateToHome = () => setCurrentPage('home');
  const navigateToCart = () => setCurrentPage('cart');
  const navigateToCheckout = () => setCurrentPage('checkout');
  const navigateToSuccess = (orderId) => {
    setLastOrderId(orderId);
    setCurrentPage('success');
  };
  const navigateToCategories = () => setCurrentPage('categories');
  const navigateToSearch = () => setCurrentPage('search');
  const navigateToCategoryPage = (key, subKey = 'all') => {
    setCategoryKey(key);
    setSubcategoryKey(subKey);
    setCurrentPage('category');
  };
  const navigateToProductDetail = (product) => {
    setSelectedProduct(product);
    setCurrentPage('productDetail');
  };
  const navigateToPrinterTest = () => setCurrentPage('printerTest');
  const handleHeaderNavigate = (tab) => {
    if (tab === 'home') navigateToHome();
    else if (tab === 'categories') navigateToCategories();
    else if (tab === 'search') navigateToSearch();
    else if (tab === 'cart') navigateToCart();
    else if (tab === 'printerTest') navigateToPrinterTest();
  };
  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home onNavigateToCart={navigateToCart} onNavigateToCategory={navigateToCategoryPage} onNavigate={handleHeaderNavigate} activeTab="home" cartCount={getTotalItems()} query={searchQuery} setQuery={setSearchQuery} onProductClick={navigateToProductDetail} onAdminClick={onAdminClick} />;
      case 'cart':
        return <Cart onNavigateToHome={navigateToHome} onNavigateToCheckout={navigateToCheckout} onNavigate={handleHeaderNavigate} activeTab="cart" cartCount={getTotalItems()} query={searchQuery} setQuery={setSearchQuery} onAdminClick={onAdminClick} />;
      case 'checkout':
        return <Checkout onNavigateToCart={navigateToCart} onNavigateToSuccess={navigateToSuccess} onNavigate={handleHeaderNavigate} activeTab="checkout" cartCount={getTotalItems()} query={searchQuery} setQuery={setSearchQuery} onAdminClick={onAdminClick} />;
      case 'success':
        return <OrderSuccess orderId={lastOrderId} onNavigateToHome={navigateToHome} onNavigate={handleHeaderNavigate} activeTab="home" cartCount={getTotalItems()} query={searchQuery} setQuery={setSearchQuery} onAdminClick={onAdminClick} />;
      case 'categories':
        return <Categories onNavigateToCategory={navigateToCategoryPage} onNavigate={handleHeaderNavigate} activeTab="categories" cartCount={getTotalItems()} query={searchQuery} setQuery={setSearchQuery} onAdminClick={onAdminClick} />;
      case 'search':
        return (
          <Search
            onNavigate={handleHeaderNavigate}
            activeTab="search"
            cartCount={getTotalItems()}
            query={searchQuery}
            setQuery={setSearchQuery}
            onNavigateToCategoryPage={navigateToCategoryPage}
            onProductClick={navigateToProductDetail}
            onAdminClick={onAdminClick}
          />
        );
      case 'category': {
        const cat = categories.find(c => c.key === categoryKey);
        if (!cat) return <div className="p-8 text-center text-gray-500">Category not found.</div>;
        return <CategoryPage category={cat} products={products} initialSubcategory={subcategoryKey} onNavigateToSubcategory={navigateToCategoryPage} onNavigate={handleHeaderNavigate} activeTab="categories" cartCount={getTotalItems()} query={searchQuery} setQuery={setSearchQuery} onProductClick={navigateToProductDetail} onAdminClick={onAdminClick} />;
      }
      case 'productDetail':
        return (
          <ProductDetail
            product={selectedProduct}
            onNavigate={handleHeaderNavigate}
            activeTab="home"
            cartCount={getTotalItems()}
            query={searchQuery}
            setQuery={setSearchQuery}
            onBack={() => setCurrentPage('home')}
            onAdminClick={onAdminClick}
          />
        );
      case 'printerTest':
        return (
          <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
              <div className="mb-6">
                <button
                  onClick={navigateToHome}
                  className="text-blue-600 hover:text-blue-800 mb-4 inline-flex items-center"
                >
                  ← Back to Home
                </button>
                <h1 className="text-3xl font-bold text-gray-900">Thermal Printer Test</h1>
                <p className="text-gray-600 mt-2">Test your Retsol 82 UE thermal printer connection and functionality</p>
              </div>
              <ThermalPrinterTest />
            </div>
          </div>
        );
      default:
        return <Home onNavigateToCart={navigateToCart} onNavigateToCategory={navigateToCategoryPage} onNavigate={handleHeaderNavigate} activeTab="home" cartCount={getTotalItems()} query={searchQuery} setQuery={setSearchQuery} onProductClick={navigateToProductDetail} onAdminClick={onAdminClick} />;
    }
  };
  const getActiveTab = () => {
    switch (currentPage) {
      case 'home': return 'home';
      case 'categories': return 'categories';
      case 'search': return 'search';
      case 'cart': return 'home';
      case 'checkout': return 'home';
      case 'success': return 'home';
      case 'category': return 'home';
      case 'productDetail': return 'home';
      case 'printerTest': return 'home';
      default: return 'home';
    }
  };
  const showCartSummaryBar = !['cart', 'checkout', 'success'].includes(currentPage);
  return (
    <div className="App min-h-screen flex flex-col">
      <div className="flex-1 pb-16 md:pb-0">
        {renderPage()}
        {showCartSummaryBar && (
          <CartSummaryBar
            itemCount={getTotalItems()}
            totalPrice={getTotalPrice()}
            onCheckout={navigateToCheckout}
          />
        )}
      </div>
      <Footer />
      <BottomNavBar
        activeTab={getActiveTab()}
        onTabChange={(tab) => {
          if (tab === 'home') navigateToHome();
          else if (tab === 'categories') navigateToCategories();
          else if (tab === 'search') navigateToSearch();
        }}
        cartItemCount={getTotalItems()}
        onCartClick={navigateToCart}
        onAccountClick={() => window.location.href = '/login'}
      />
    </div>
  );
};

export default UserRoutes; 