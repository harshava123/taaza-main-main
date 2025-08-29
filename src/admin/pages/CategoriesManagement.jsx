import React, { useState, useEffect } from 'react';
import { 
  MdAdd, 
  MdEdit, 
  MdDelete, 
  MdSearch,
  MdMoreVert,
  MdExpandMore,
  MdExpandLess,
  MdInventory,
  MdAddCircle,
  MdRemoveCircle
} from 'react-icons/md';
import { addCategory, getCategories, updateCategory, deleteCategory } from '../../services/firebaseService';

const CategoriesManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [expandedCategoryId, setExpandedCategoryId] = useState(null);
  const [actionMenu, setActionMenu] = useState({ open: false, categoryId: null, anchor: null });
  const [formData, setFormData] = useState({
    name: '',
    key: '',
    image: '',
    subcategories: []
  });

  // Stock items for key dropdown
  const stockItems = [
    { value: 'birds', label: 'Birds' },
    { value: 'goats', label: 'Goats' },
    { value: 'eggs', label: 'Eggs' },
    { value: 'bEggs', label: 'B.Eggs' },
    { value: 'masala', label: 'Masala' } // Added Masala
  ];
  // Remove subcategory modal, handlers, and related state
  // Remove openSubcategoryModal, handleSubcategorySubmit, handleDeleteSubcategory, showSubcategoryModal, subcategoryForm, subcategoryEditIndex, activeCategory, subActionMenu
  // Remove subcategory add/edit/delete buttons and modal from the render
  // Only display subcategories as images/names under each category
  const [detailsModal, setDetailsModal] = useState({ open: false, category: null });
  const [stockUpdateModal, setStockUpdateModal] = useState({ open: false, category: null });
  const [stockUpdateData, setStockUpdateData] = useState({ type: 'add', amount: '', pieces: '', pieceCost: '', reason: '' });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    setLoading(false);
    };
    fetchCategories();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
    if (editingCategory) {
        await updateCategory(editingCategory.id, formData);
    } else {
        await addCategory({ ...formData, productCount: 0 });
      }
      const updatedCategories = await getCategories();
      setCategories(updatedCategories);
    } catch (error) {
      console.error('Error saving category:', error);
    }
    setShowAddModal(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      key: '',
      image: '',
      subcategories: []
    });
  };

  // Update handleEdit to close details modal and open edit modal
  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData(category);
    setShowAddModal(true);
    setDetailsModal({ open: false, category: null }); // Close details modal
    setActionMenu({ open: false, categoryId: null, anchor: null });
  };

  const handleDelete = async (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await deleteCategory(categoryId);
        // Update local state after successful deletion
      setCategories(categories.filter(c => c.id !== categoryId));
        // Close any open modals
        setDetailsModal({ open: false, category: null });
        setActionMenu({ open: false, categoryId: null, anchor: null });
        // Show success message
        alert('Category deleted successfully!');
      } catch (error) {
        console.error('Error deleting category:', error);
        alert('Error deleting category. Please try again.');
      }
    } else {
      setActionMenu({ open: false, categoryId: null, anchor: null });
    }
  };

  const toggleExpanded = (categoryId) => {
    setExpandedCategoryId(prev => (prev === categoryId ? null : categoryId));
  };

  // Remove subcategory handlers
  // Remove openSubcategoryModal, handleSubcategorySubmit, handleDeleteSubcategory, showSubcategoryModal, subcategoryForm, subcategoryEditIndex, activeCategory, subActionMenu
  // Remove subcategory add/edit/delete buttons and modal from the render
  // Only display subcategories as images/names under each category
  const [subActionMenu, setSubActionMenu] = useState({ open: false, categoryId: null, subIndex: null });
  const [subcategoryEditIndex, setSubcategoryEditIndex] = useState(null);
  const [subcategoryForm, setSubcategoryForm] = useState({ name: '', key: '', image: '' });
  const [activeCategory, setActiveCategory] = useState(null);

  // Stock update handlers
  const openStockUpdateModal = (category) => {
    setStockUpdateModal({ open: true, category });
    setStockUpdateData({ type: 'add', amount: '', pieces: '', pieceCost: '', reason: '' });
    setActionMenu({ open: false, categoryId: null, anchor: null });
  };

  const handleStockUpdate = async (e) => {
    e.preventDefault();
    if (!stockUpdateModal.category || !stockUpdateData.amount) return;

    const isEggs = stockUpdateModal.category.name.toLowerCase().includes('egg');
    const isMasala = stockUpdateModal.category.name.toLowerCase().includes('masala');
    const currentStock = stockUpdateModal.category.wholeQuantity || 0;
    const updateAmount = Number(stockUpdateData.amount);
    let newStock;

    if (stockUpdateData.type === 'add') {
      newStock = currentStock + updateAmount;
    } else {
      newStock = Math.max(0, currentStock - updateAmount);
    }

    // Prepare update data
    const updateData = {
      ...stockUpdateModal.category,
      wholeQuantity: newStock
    };

    // For eggs, also store pieces if provided
    if (isEggs && stockUpdateData.pieces) {
      updateData.pieces = stockUpdateData.pieces;
    }

    // For masala, store piece cost if provided
    if (isMasala && stockUpdateData.pieceCost) {
      updateData.pieceCost = Number(stockUpdateData.pieceCost);
    }

    try {
      await updateCategory(stockUpdateModal.category.id, updateData);
      
      // Update local state
      const updatedCategories = await getCategories();
      setCategories(updatedCategories);
      
      // Close modal and reset
      setStockUpdateModal({ open: false, category: null });
      setStockUpdateData({ type: 'add', amount: '', pieces: '', pieceCost: '', reason: '' });
      
      // Show success message
      let unit, additionalInfo = '';
      if (isEggs) {
        unit = 'trays';
        if (stockUpdateData.pieces) additionalInfo = ` (${stockUpdateData.pieces} pieces)`;
      } else if (isMasala) {
        unit = 'pieces';
        if (stockUpdateData.pieceCost) additionalInfo = ` (₹${stockUpdateData.pieceCost}/piece)`;
      } else {
        unit = 'kg';
      }
      alert(`Stock updated successfully! New quantity: ${newStock} ${unit}${additionalInfo}`);
    } catch (error) {
      console.error('Error updating stock:', error);
      alert('Error updating stock. Please try again.');
    }
  };

  // Helper function to get unit for category
  const getUnitForCategory = (categoryName) => {
    const name = categoryName.toLowerCase();
    if (name.includes('egg')) return 'trays';
    if (name.includes('masala')) return 'pieces';
    return 'kg';
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.key.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Categories</h1>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center px-3 py-1.5 border border-blue-600 text-blue-600 rounded hover:bg-blue-50 transition-colors text-sm"
        >
          <MdAdd className="w-5 h-5 mr-1" /> Add
        </button>
      </div>
      {/* Search */}
      <div className="bg-white rounded border border-gray-200 p-2 flex items-center">
        <MdSearch className="text-gray-400 w-5 h-5 ml-2 mr-2" />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent outline-none text-sm px-2 py-1"
          />
      </div>
      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCategories.map((category) => (
          <div
            key={category.id}
            className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col relative group shadow-sm hover:shadow-md transition-shadow cursor-pointer min-h-[180px]"
            onClick={e => {
              if (e.target.closest('.cat-kebab')) return;
              setDetailsModal({ open: true, category });
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
              <img
                src={category.image}
                alt={category.name}
                  className="w-14 h-14 object-cover rounded-full border border-gray-200 bg-gray-50 shadow-sm"
                />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 leading-tight">{category.name}</h3>
                  <div className="flex gap-2 mt-1">
                    
                    <span className="text-xs bg-blue-50 text-blue-700 rounded-full px-2 py-0.5 font-medium">{category.subcategories.length} subcategories</span>
            </div>
            
                </div>
              </div>
                <button
                className="cat-kebab p-2 rounded-full hover:bg-gray-100 ml-2"
                onClick={e => {
                  e.stopPropagation();
                  setActionMenu({ open: actionMenu.categoryId !== category.id || !actionMenu.open, categoryId: category.id, anchor: e.currentTarget });
                }}
                aria-label="Actions"
              >
                <MdMoreVert className="w-6 h-6 text-gray-400" />
              </button>
                              {actionMenu.open && actionMenu.categoryId === category.id && (
                  <div className="absolute right-5 top-16 z-10 bg-white border border-gray-200 rounded-xl shadow-lg w-40">
                    <button onClick={() => handleEdit(category)} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2">
                      <MdEdit className="w-4 h-4" /> Edit
                    </button>
                    <button onClick={() => openStockUpdateModal(category)} className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-gray-50 flex items-center gap-2">
                      <MdInventory className="w-4 h-4" /> Update Stock
                    </button>
                    <button onClick={() => handleDelete(category.id)} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 flex items-center gap-2">
                      <MdDelete className="w-4 h-4" /> Delete
                </button>
                  </div>
                )}
              </div>
            {/* Subcategory images row */}
            <div className="flex items-center gap-2 mt-4">
              {category.subcategories.slice(0, 3).map((sub, idx) => (
                sub.image ? (
                  <img
                    key={sub.key}
                    src={sub.image}
                    alt={sub.name}
                    className="w-8 h-8 rounded-full border border-gray-200 object-cover bg-gray-100 shadow-sm"
                    title={sub.name}
                  />
                ) : (
                  <div
                    key={sub.key}
                    className="w-8 h-8 rounded-full border border-gray-200 bg-gray-100 flex items-center justify-center text-xs text-gray-400 shadow-sm"
                    title={sub.name}
                  >
                    {sub.name.charAt(0)}
                  </div>
                )
              ))}
              {category.subcategories.length > 3 && (
                <span className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600">+{category.subcategories.length - 3}</span>
              )}
            </div>
          </div>
        ))}
        {/* Add Category Card */}
        <button
          onClick={() => {
            setShowAddModal(true);
            setEditingCategory(null);
            setFormData({ name: '', key: '', image: '', subcategories: [] });
          }}
          className="flex flex-col items-center justify-center bg-white border-2 border-dashed border-blue-300 hover:border-blue-500 rounded-2xl min-h-[180px] h-full w-full p-8 cursor-pointer transition-all"
        >
          <span className="text-4xl text-blue-500 mb-2"><MdAdd /></span>
          <span className="text-lg font-semibold text-blue-600">Add Category</span>
        </button>
      </div>
      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-sm relative shadow-2xl border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
              {editingCategory ? 'Edit Category' : 'Add Category'}
            </h3>
            {/* Image Preview */}
            <div className="flex flex-col items-center mb-4">
              {formData.image ? (
                <img
                  src={formData.image}
                  alt={formData.name || 'Category'}
                  className="w-20 h-20 object-cover rounded-full border-2 border-blue-200 shadow mb-2"
                />
              ) : (
                <div className="w-20 h-20 rounded-full border-2 border-gray-200 bg-gray-100 flex items-center justify-center text-3xl text-gray-400 shadow mb-2">
                  {(formData.name || 'C').charAt(0)}
                </div>
              )}
              <span className="text-xs text-gray-400">Image Preview</span>
            </div>
            <form onSubmit={async (e) => {
              await handleSubmit(e);
              setShowAddModal(false);
              if (editingCategory) setDetailsModal({ open: true, category: editingCategory });
            }} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Key</label>
                {editingCategory ? (
                <input
                  type="text"
                  value={formData.key}
                  onChange={(e) => setFormData({...formData, key: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="e.g., chicken"
                  required
                />
                ) : (
                  <select
                    value={formData.key}
                    onChange={(e) => setFormData({...formData, key: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    required
                  >
                    <option value="">Select a stock item</option>
                    {stockItems.map(item => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Image URL</label>
                <input
                  type="url"
                  value={formData.image}
                  onChange={(e) => setFormData({...formData, image: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Paste image URL or base64 string"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingCategory(null);
                    setFormData({
                      name: '',
                      key: '',
                      image: '',
                      subcategories: [],
                      wholeQuantity: 0
                    });
                    if (editingCategory) setDetailsModal({ open: true, category: editingCategory });
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                  {editingCategory ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Subcategory Modal */}
      {/* Subcategory Modal */}
      {/* Subcategory Modal */}
      {detailsModal.open && detailsModal.category && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 transition-opacity">
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg relative shadow-2xl">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-2xl"
              onClick={() => setDetailsModal({ open: false, category: null })}
              aria-label="Close"
            >
              ×
            </button>
            <div className="flex flex-col items-center mb-6">
              <img src={detailsModal.category.image} alt={detailsModal.category.name} className="w-20 h-20 object-cover rounded-full border-2 border-blue-200 shadow mb-2" />
              <h2 className="text-2xl font-bold text-gray-900 mb-1">{detailsModal.category.name}</h2>
              <div className="text-xs text-gray-500 mb-1">Key: {detailsModal.category.key}</div>
            
            </div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-base font-medium text-gray-700">Subcategories</span>
              
            </div>
            <ul className="space-y-2 mb-6">
              {detailsModal.category.subcategories.map((sub, idx) => (
                <li key={sub.key} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2 relative">
                  <div className="flex items-center gap-2">
                    {sub.image ? (
                      <img
                        src={sub.image}
                        alt={sub.name}
                        className="w-8 h-8 rounded-full border border-gray-200 object-cover bg-gray-100 shadow-sm"
                        title={sub.name}
                      />
                    ) : (
                      <div
                        className="w-8 h-8 rounded-full border border-gray-200 bg-gray-100 flex items-center justify-center text-xs text-gray-400 shadow-sm"
                        title={sub.name}
                      >
                        {sub.name.charAt(0)}
                      </div>
                    )}
                    <span>{sub.name}</span>
                  </div>
                  <button
                    className="p-1 rounded-full hover:bg-gray-100"
                    onClick={() => setSubcategoryEditIndex(idx)}
                    aria-label="Subcategory actions"
                  >
                    <MdMoreVert className="w-5 h-5 text-gray-400" />
                  </button>
                  {subcategoryEditIndex === idx && (
                    <div className="absolute right-2 top-10 z-20 bg-white border border-gray-200 rounded-xl shadow-lg w-28">
                      <button onClick={() => { setSubcategoryEditIndex(null); }} className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50">Cancel</button>
                      <button onClick={() => {
                        setSubcategoryForm({ name: sub.name, key: sub.key, image: sub.image });
                        setSubcategoryEditIndex(null);
                      }} className="w-full text-left px-3 py-2 text-xs">Edit</button>
                      <button onClick={() => {
                        // This part would require a deleteCategory function for subcategories
                        // For now, we'll just close the modal
                        setSubcategoryEditIndex(null);
                      }} className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-gray-50">Delete</button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => handleEdit(detailsModal.category)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                Edit Category
              </button>
              <button
                onClick={() => handleDelete(detailsModal.category.id)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
              >
                Delete Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Update Modal */}
      {stockUpdateModal.open && stockUpdateModal.category && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md relative shadow-2xl border border-gray-100">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-2xl"
              onClick={() => setStockUpdateModal({ open: false, category: null })}
              aria-label="Close"
            >
              ×
            </button>
            
            <div className="flex flex-col items-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                <MdInventory className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Update Stock</h2>
              <p className="text-sm text-gray-600 text-center">
                {stockUpdateModal.category.name} - Current: {stockUpdateModal.category.wholeQuantity ?? 0} {getUnitForCategory(stockUpdateModal.category.name)}
                {stockUpdateModal.category.name.toLowerCase().includes('egg') && stockUpdateModal.category.pieces && ` (${stockUpdateModal.category.pieces} pieces)`}
                {stockUpdateModal.category.name.toLowerCase().includes('masala') && stockUpdateModal.category.pieceCost && ` (₹${stockUpdateModal.category.pieceCost}/piece)`}
              </p>
            </div>

            <form onSubmit={handleStockUpdate} className="space-y-4">
              {/* Update Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Update Type</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStockUpdateData({ ...stockUpdateData, type: 'add' })}
                    className={`flex-1 py-2 px-3 rounded-lg border-2 font-medium transition-colors ${
                      stockUpdateData.type === 'add'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <MdAddCircle className="w-4 h-4 inline mr-1" />
                    Add Stock
                  </button>
                  <button
                    type="button"
                    onClick={() => setStockUpdateData({ ...stockUpdateData, type: 'remove' })}
                    className={`flex-1 py-2 px-3 rounded-lg border-2 font-medium transition-colors ${
                      stockUpdateData.type === 'remove'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <MdRemoveCircle className="w-4 h-4 inline mr-1" />
                    Remove Stock
                  </button>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {stockUpdateModal.category.name.toLowerCase().includes('masala')
                    ? 'No.of pieces'
                    : `Amount (${getUnitForCategory(stockUpdateModal.category.name)})`}
                </label>
                <input
                  type="number"
                  min="0"
                  step={stockUpdateModal.category.name.toLowerCase().includes('egg') || stockUpdateModal.category.name.toLowerCase().includes('masala') ? "1" : "0.1"}
                  value={stockUpdateData.amount}
                  onChange={(e) => setStockUpdateData({ ...stockUpdateData, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={`Enter amount to ${stockUpdateData.type}`}
                  required
                />
              </div>

              {/* Pieces field for eggs */}
              {stockUpdateModal.category.name.toLowerCase().includes('egg') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pieces (Optional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={stockUpdateData.pieces}
                    onChange={(e) => setStockUpdateData({ ...stockUpdateData, pieces: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Number of individual pieces"
                  />
                </div>
              )}

              {/* Piece cost field for masala */}
              {stockUpdateModal.category.name.toLowerCase().includes('masala') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Piece Cost (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={stockUpdateData.pieceCost}
                    onChange={(e) => setStockUpdateData({ ...stockUpdateData, pieceCost: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Cost per piece"
                  />
                </div>
              )}

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason (Optional)
                </label>
                <input
                  type="text"
                  value={stockUpdateData.reason}
                  onChange={(e) => setStockUpdateData({ ...stockUpdateData, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., New stock arrival, Sales deduction"
                />
              </div>

              {/* Preview */}
              {stockUpdateData.amount && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">
                    <strong>Preview:</strong> {stockUpdateModal.category.wholeQuantity ?? 0} {getUnitForCategory(stockUpdateModal.category.name)} 
                    {stockUpdateData.type === 'add' ? ' + ' : ' - '} 
                    {stockUpdateData.amount} {getUnitForCategory(stockUpdateModal.category.name)} = 
                    <span className="font-semibold text-blue-700">
                      {' '}
                      {stockUpdateData.type === 'add' 
                        ? (stockUpdateModal.category.wholeQuantity ?? 0) + Number(stockUpdateData.amount)
                        : Math.max(0, (stockUpdateModal.category.wholeQuantity ?? 0) - Number(stockUpdateData.amount))
                      } {getUnitForCategory(stockUpdateModal.category.name)}
                      {stockUpdateModal.category.name.toLowerCase().includes('egg') && stockUpdateData.pieces && ` (${stockUpdateData.pieces} pieces)`}
                      {stockUpdateModal.category.name.toLowerCase().includes('masala') && stockUpdateData.pieceCost && ` (₹${stockUpdateData.pieceCost}/piece)`}
                    </span>
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setStockUpdateModal({ open: false, category: null })}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!stockUpdateData.amount}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    stockUpdateData.amount
                      ? stockUpdateData.type === 'add'
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {stockUpdateData.type === 'add' ? 'Add Stock' : 'Remove Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoriesManagement; 