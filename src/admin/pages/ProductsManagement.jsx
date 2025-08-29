import React, { useState, useEffect } from 'react';
import { 
  MdAdd, 
  MdEdit, 
  MdDelete, 
  MdSearch,
  MdVisibility,
  MdVisibilityOff,
  MdMoreVert,
  MdStar,
  MdStarBorder
} from 'react-icons/md';
import { getProducts, addProduct, updateProduct, deleteProduct, getCategories, updateCategory } from '../../services/firebaseService';

// Utility to remove undefined and empty string fields
function cleanObject(obj) {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== undefined && v !== '')
  );
}

const ProductsManagement = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    subcategory: '',
    price: '',
    originalPrice: '',
    discount: '',
    weight: '',
    unit: 'kg',
    image: '',
    description: '',
    status: 'active',
    bestSeller: false,
  });
  const [imageFile, setImageFile] = useState(null);
  const [customCategory, setCustomCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [openMenuId, setOpenMenuId] = useState(null);

  // Fetch products from Firestore
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

  useEffect(() => {
    const selectedCat = categories.find(cat => cat.key === formData.category);
    setSubcategories(selectedCat && selectedCat.subcategories ? selectedCat.subcategories : []);
  }, [formData.category, categories]);

  // Helper to convert file to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let imageBase64 = formData.image;
    if (imageFile) {
      imageBase64 = await fileToBase64(imageFile);
    }
    const productData = {
      ...formData,
      image: imageBase64,
      price: Number(formData.price),
      pricePerKg: formData.pricePerKg ? Number(formData.pricePerKg) : undefined,
      serves: formData.serves ? Number(formData.serves) : undefined,
      pieces: formData.pieces ? Number(formData.pieces) : undefined,
      grams: formData.grams ? Number(formData.grams) : undefined,
      protein: formData.protein ? Number(formData.protein) : undefined,
      fat: formData.fat ? Number(formData.fat) : undefined,
      carbs: formData.carbs ? Number(formData.carbs) : undefined,
      category: formData.category,
      subcategory: formData.subcategory,
      status: formData.status || 'active',
      bestSeller: !!formData.bestSeller,
      unit: formData.unit || 'kg',
    };
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, cleanObject(productData));
      } else {
        await addProduct(cleanObject(productData));
        // Add as subcategory to the selected category
        const cat = categories.find(c => c.key === formData.category);
        if (cat) {
          const newSub = {
            name: formData.name,
            key: formData.name.toLowerCase().replace(/\s+/g, '-'),
            image: imageBase64
          };
          const updatedSubs = Array.isArray(cat.subcategories) ? [...cat.subcategories, newSub] : [newSub];
          await updateCategory(cat.id, { ...cat, subcategories: updatedSubs });
        }
      }
      const data = await getProducts();
      setProducts(data);
      setShowAddModal(false);
      setEditingProduct(null);
      setFormData({
        name: '',
        category: '',
        subcategory: '',
        price: '',
        originalPrice: '',
        discount: '',
        weight: '',
        unit: 'kg',
        image: '',
        description: '',
        status: 'active',
        bestSeller: false,
      });
      setImageFile(null);
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({ ...product, bestSeller: !!product.bestSeller, unit: product.unit || 'kg' });
    setShowAddModal(true);
  };

  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(productId);
        setProducts(products.filter(p => p.id !== productId));
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  // Update filteredProducts to filter by category and status
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || product.category === filterCategory;
    const matchesStatus = !filterStatus || (product.status || 'active') === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusColor = (status) => {
    return status === 'active' ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100';
  };

  // Helper to get category and subcategory names from keys
  const getCategoryName = (key) => categories.find(cat => cat.key === key)?.name || key;
  const getSubcategoryName = (catKey, subKey) => {
    const cat = categories.find(cat => cat.key === catKey);
    if (!cat || !cat.subcategories) return subKey;
    return cat.subcategories.find(sub => sub.key === subKey)?.name || subKey;
  };

  // Add grams to unit options if not present
  const unitOptions = [
    { value: 'kg', label: 'kg' },
    { value: 'pcs', label: 'pcs' },
    { value: 'packet', label: 'packet' },
  ];

  // Helper to determine category type
  const getCategoryType = (catKey) => {
    if (!catKey) return '';
    const catObj = categories.find(cat => cat.key === catKey);
    if (!catObj) return '';
    const key = (catObj.key || '').toLowerCase();
    const name = (catObj.name || '').toLowerCase();
    if (key.includes('chicken') || key.includes('mutton') || name.includes('chicken') || name.includes('mutton')) return 'meat';
    if (key.includes('egg') || name.includes('egg')) return 'eggs';
    if (key.includes('masala') || name.includes('masala')) return 'masala';
    return '';
  };

  const categoryType = getCategoryType(formData.category);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products Management</h1>
          <p className="text-gray-600 mt-2">Manage your product catalog</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          <MdAdd className="w-5 h-5" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="relative">
              <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          {/* Category filter */}
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat.key} value={cat.key}>{cat.name}</option>
            ))}
          </select>
          {/* Status filter */}
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="out-of-stock">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Best Sellers Section */}
      {filteredProducts.some(p => p.bestSeller) && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-yellow-600 mb-4 flex items-center gap-2">
            <MdStar className="w-6 h-6 text-yellow-500" />
            Best Sellers
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.filter(p => p.bestSeller).map((product) => {
              const cat = categories.find(c => c.key === product.category);
              const qtyLeft = cat && typeof cat.quantityLeft !== 'undefined' ? cat.quantityLeft : 0;
              const wholeQty = cat && typeof cat.wholeQuantity !== 'undefined' ? cat.wholeQuantity : 0;
              return (
                <div key={product.id} className="relative flex flex-col bg-white rounded-xl border border-yellow-200 shadow p-4 hover:shadow-md transition">
                  <div className="flex items-center gap-3 mb-3">
                    <img
                      className="h-14 w-14 rounded-lg object-cover border"
                      src={product.image}
                      alt={product.name}
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 text-base truncate flex items-center gap-1">
                        {product.name}
                        <MdStar className="w-4 h-4 text-yellow-500" title="Best Seller" />
                      </div>
                      <div className="mt-1">
                        <span className="inline-block bg-blue-100 text-blue-700 text-xs font-medium rounded px-2 py-0.5 mr-2">{getCategoryName(product.category)}</span>
                        <span className="inline-block bg-gray-100 text-gray-800 text-xs font-medium rounded px-2 py-0.5">{qtyLeft} / {wholeQty}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div>
                      {product.pricePerKg ? (
                        <span className="inline-block bg-yellow-100 text-yellow-700 text-sm font-semibold rounded px-3 py-1">₹{product.pricePerKg} <span className="text-xs">/kg</span></span>
                      ) : (
                        <span className="inline-block bg-yellow-50 text-yellow-700 text-sm font-semibold rounded px-3 py-1">₹{product.price}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Products ({filteredProducts.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Item Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Cost</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredProducts.map((product) => {
                const cat = categories.find(c => c.key === product.category);
                const qtyLeft = cat && typeof cat.quantityLeft !== 'undefined' ? cat.quantityLeft : 0;
                const wholeQty = cat && typeof cat.wholeQuantity !== 'undefined' ? cat.wholeQuantity : 0;
                return (
                  <tr key={product.id} className="hover:bg-gray-50 transition">
                    {/* Item Name + Image + Category Quantity Left */}
                    <td className="px-6 py-4 align-middle font-medium text-gray-900 text-base">
                      <div className="flex items-center gap-3">
                        <img
                          className="h-10 w-10 rounded-lg object-cover border"
                        src={product.image}
                        alt={product.name}
                      />
                        <span className="ml-2 font-semibold text-gray-900 truncate">{product.name}</span>
                    </div>
                  </td>
                    {/* Category */}
                    <td className="px-6 py-4 align-middle">
                      <span className="inline-block bg-blue-100 text-blue-700 text-xs font-medium rounded px-2 py-0.5">{getCategoryName(product.category)}</span>
                  </td>
                    {/* Cost */}
                    <td className="px-6 py-4 align-middle">
                      {product.pricePerKg ? (
                        <span className="inline-block bg-yellow-100 text-yellow-700 text-sm font-semibold rounded px-3 py-1">₹{product.pricePerKg} <span className="text-xs">/kg</span></span>
                      ) : (
                        <span className="inline-block bg-yellow-50 text-yellow-700 text-sm font-semibold rounded px-3 py-1">₹{product.price}</span>
                    )}
                  </td>
                    {/* Quantity */}
                    <td className="px-6 py-4 align-middle">
                      <span className="inline-block bg-gray-100 text-gray-800 text-xs font-medium rounded px-2 py-0.5">
                        {qtyLeft} / {wholeQty}
                    </span>
                  </td>
                    {/* Actions: Kebab menu */}
                    <td className="px-6 py-4 align-middle text-center relative">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === product.id ? null : product.id)}
                        className="p-2 rounded-full hover:bg-gray-100 focus:outline-none"
                        aria-label="Actions"
                      >
                        <MdMoreVert className="w-6 h-6 text-gray-600" />
                      </button>
                      {openMenuId === product.id && (
                        <div className="absolute right-6 top-10 z-10 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-32">
                          <button
                            onClick={() => { setOpenMenuId(null); handleEdit(product); }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Edit
                      </button>
                      <button
                            onClick={() => { setOpenMenuId(null); handleDelete(product.id); }}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      >
                            Delete
                      </button>
                    </div>
                      )}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50">
          {/* Overlay */}
          <div className="fixed inset-0 bg-black bg-opacity-40 transition-opacity" onClick={() => { setShowAddModal(false); setEditingProduct(null); }} />
          {/* Add Product: Centered Card */}
          <div className="fixed inset-0 flex items-center justify-center animate-fadeInScale">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl p-8 border border-gray-200 overflow-hidden">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-2">{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Column 1: Basic Info */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                      <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                        <option value="">Select Category</option>
                        {categories.map(cat => (
                          <option key={cat.key} value={cat.key}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select value={formData.status || 'active'} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="out-of-stock">Out of Stock</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm text-gray-700">Best Seller</span>
                      <button type="button" onClick={() => setFormData({ ...formData, bestSeller: !formData.bestSeller })} className={`p-2 rounded-full border ${formData.bestSeller ? 'bg-yellow-100 border-yellow-400' : 'bg-gray-100 border-gray-300'} hover:bg-yellow-200 transition`} title="Mark as Best Seller">
                        {formData.bestSeller ? <MdStar className="w-5 h-5 text-yellow-500" /> : <MdStarBorder className="w-5 h-5 text-gray-400" />}
                      </button>
                    </div>
                  </div>
                  {/* Column 2: Price, Image, Description */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cost per kg (₹)</label>
                      <input type="number" value={formData.pricePerKg || ''} onChange={e => setFormData({ ...formData, pricePerKg: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                      <input type="file" accept="image/*" onChange={async e => {
                        setImageFile(e.target.files[0]);
                        if (e.target.files[0]) {
                          const base64 = await fileToBase64(e.target.files[0]);
                          setFormData({...formData, image: base64});
                        }
                      }} className="mb-2" />
                      <input type="url" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm" placeholder="Or paste image URL or base64" />
                      {formData.image && (
                        <img src={formData.image} alt="Preview" className="mt-2 rounded-lg max-h-24 object-contain border" />
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" rows={3} placeholder="Product description..." />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end space-x-3 pt-4">
                  <button type="button" onClick={() => { setShowAddModal(false); setEditingProduct(null); setFormData({ name: '', category: '', price: '', image: '', description: '', status: 'active', bestSeller: false, }); }} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">{editingProduct ? 'Update' : 'Add'} Product</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsManagement; 