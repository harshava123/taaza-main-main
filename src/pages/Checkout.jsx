import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import Header from '../components/Header';
import { getCategories, updateCategory } from '../services/firebaseService';
// Add Firestore imports
import { db } from '../config/firebase';
import { collection, addDoc, Timestamp, doc, getDoc, setDoc, runTransaction } from 'firebase/firestore';

function generateOrderId(type = 'customer') {
  const now = new Date();
  const datePart = now.toISOString().slice(0,10).replace(/-/g, '');
  const randomPart = Math.floor(1000 + Math.random() * 9000); // 4-digit random
  const prefix = type === 'admin' ? 'ADM' : 'CUS';
  return `${prefix}-${datePart}-${randomPart}`;
}

async function getNextCustomerOrderNumber() {
  const counterRef = doc(db, 'orderCounters', 'customer');
  return await runTransaction(db, async (transaction) => {
    const counterDoc = await transaction.get(counterRef);
    let nextNumber = 1;
    if (counterDoc.exists()) {
      nextNumber = (counterDoc.data().current || 0) + 1;
    }
    transaction.set(counterRef, { current: nextNumber });
    return nextNumber;
  });
}

const Checkout = ({ onNavigateToCart, onNavigateToSuccess, onNavigate, activeTab, cartCount, query, setQuery, onAdminClick }) => {
  const { items, getTotalPrice, clearCart } = useCart();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    notes: ''
  });
  const [lastOrderId, setLastOrderId] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Deduct purchased quantity from category wholeQuantity
    const categories = await getCategories();
    for (const item of items) {
      const cat = categories.find(c => c.key === item.category);
      if (cat && typeof cat.wholeQuantity === 'number') {
        const newQty = Math.max(0, cat.wholeQuantity - item.quantity);
        const newQtyLeft = Math.max(0, (cat.quantityLeft ?? cat.wholeQuantity) - item.quantity);
        await updateCategory(cat.id, { ...cat, wholeQuantity: newQty, quantityLeft: newQtyLeft });
      }
    }
    // Store order in Firestore
    const nextNumber = await getNextCustomerOrderNumber();
    const now = new Date();
    const datePart = now.toISOString().slice(0,10).replace(/-/g, '');
    const orderId = `CUS-${datePart}-${String(nextNumber).padStart(5, '0')}`;
    const orderData = {
      orderId,
      customer: formData.name,
      phone: formData.phone,
      notes: formData.notes,
      items: items.map(item => ({
        id: item.id,
        name: item.name,
        category: item.category,
        qty: item.quantity,
        price: item.price,
        total: item.price * item.quantity,
        image: item.image,
        weight: item.weight || null,
        pricePerKg: item.pricePerKg || null,
      })),
      total: getTotalPrice(),
      status: 'pending',
      createdAt: Timestamp.now(),
      paymentMethod: 'cash', // or set dynamically if you add payment selection
      // Add more fields as needed
    };
    await addDoc(collection(db, 'orders'), orderData);
    setLastOrderId(orderId);
    clearCart();
    onNavigateToSuccess(orderId);
  };

  const isFormValid = formData.name.trim() && formData.phone.trim();

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

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Customer Information Form */}
          <div>
            <div className="card p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Customer Information</h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Enter your phone number"
                  />
                </div>

                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                    Order Notes (Optional)
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Any special instructions for your order..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={!isFormValid}
                  className={`w-full py-3 text-lg font-medium rounded-lg transition-colors duration-200 ${
                    isFormValid
                      ? 'bg-red-700 hover:bg-red-800 text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Place Order
                </button>
              </form>
            </div>

            {/* Payment Information */}
            <div className="card p-6 mt-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Payment</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-600 text-sm">
                  Payment will be collected at the store when you pick up your order.
                </p>
                <p className="text-gray-600 text-sm mt-2">
                  We accept cash, cards, and digital payments.
                </p>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <div className="card p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Order Summary</h2>
              
              <div className="space-y-3 mb-4">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                      <div>
                        <h3 className="font-medium text-gray-800">{item.name}</h3>
                        <p className="text-gray-600 text-sm">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <p className="font-medium">₹{item.price * item.quantity}</p>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">₹{getTotalPrice()}</span>
                </div>

                <div className="border-t pt-2">
                  <div className="flex justify-between">
                    <span className="font-bold text-lg">Total</span>
                    <span className="font-bold text-lg text-red-700">₹{getTotalPrice()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Store Information */}
            <div className="card p-6 mt-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Store Information</h2>
              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>Phone:</strong> +91 98765 43210</p>
                <p><strong>Hours:</strong> 9:00 AM - 9:00 PM (Daily)</p>
                <p className="text-red-700 font-medium mt-3">
                  Please collect your order within 30 minutes of placing it.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout; 