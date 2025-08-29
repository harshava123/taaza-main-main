import React, { useState } from 'react';
import { MdStar, MdEdit, MdCheck } from 'react-icons/md';
import { useCart } from '../context/CartContext';

const ProductCard = ({ product, onPriceUpdate, onCardClick, editable }) => {
  const { items, updateQuantity, addToCart, removeFromCart } = useCart();
  const cartItem = items.find(item => item.id === product.id);
  const quantity = cartItem ? cartItem.quantity : 0;

  const [editing, setEditing] = useState(false);
  const [price, setPrice] = useState(product.pricePerKg || product.price || '');

  const handleEditClick = (e) => {
    e.stopPropagation();
    setEditing(true);
  };

  const handlePriceChange = (e) => {
    setPrice(e.target.value);
  };

  const handlePriceSave = (e) => {
    e.stopPropagation();
    setEditing(false);
    if (onPriceUpdate && price !== (product.pricePerKg || product.price)) {
      onPriceUpdate(product, price);
    }
  };

  // Handler to prevent click bubbling from buttons
  const stopPropagation = (e) => e.stopPropagation();

  return (
    <div
      className="card p-4 hover:shadow-md transition-shadow duration-200 cursor-pointer relative"
      onClick={() => onCardClick && onCardClick(product)}
      tabIndex={0}
      role="button"
      aria-label={`View details for ${product.name}`}
    >
      <div className="relative mb-3">
        <img 
          src={product.image} 
          alt={product.name}
          className="w-full h-32 object-cover rounded-lg"
        />
        {product.bestSeller && (
          <span className="absolute top-2 right-2 bg-yellow-400 text-white flex items-center justify-center rounded-full shadow p-1" title="Best Seller">
            <MdStar className="w-4 h-4 text-yellow-700" />
          </span>
        )}
      </div>
      <div className="space-y-2">
        <h3 className="font-semibold text-gray-800 text-sm">{product.name}</h3>
        <div className="flex items-center gap-2 mt-2">
          {editable ? (
            editing ? (
              <>
                <input
                  type="number"
                  className="border px-2 py-1 rounded w-20 text-sm"
                  value={price}
                  onChange={handlePriceChange}
                  onBlur={handlePriceSave}
                  onKeyDown={e => { if (e.key === 'Enter') handlePriceSave(e); }}
                  autoFocus
                />
                <button onClick={handlePriceSave} className="text-green-600"><MdCheck /></button>
              </>
            ) : (
              <>
                <span className="text-red-700 font-bold text-base leading-tight">₹{price} <span className='text-xs text-gray-500'>/kg</span></span>
                <button onClick={handleEditClick} className="text-gray-500 hover:text-blue-600" title="Edit Price"><MdEdit /></button>
              </>
            )
          ) : (
            <>
              <span className="text-red-700 font-bold text-base leading-tight">₹{price} <span className='text-xs text-gray-500'>/kg</span></span>
              {quantity === 0 ? (
                <button
                  onClick={(e) => { stopPropagation(e); addToCart(product); }}
                  className="bg-red-700 hover:bg-red-800 text-white text-xs px-3 py-1 rounded-full transition-colors duration-200"
                >
                  Add to Cart
                </button>
              ) : (
                <div className="flex items-center space-x-2" onClick={stopPropagation}>
                  <button
                    onClick={(e) => { stopPropagation(e); if (quantity === 1) removeFromCart(product.id); else updateQuantity(product.id, quantity - 1); }}
                    className="w-7 h-7 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full flex items-center justify-center text-base font-bold"
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <span className="w-6 text-center font-medium text-sm">{quantity}</span>
                  <button
                    onClick={(e) => { stopPropagation(e); updateQuantity(product.id, quantity + 1); }}
                    className="w-7 h-7 bg-red-700 hover:bg-red-800 text-white rounded-full flex items-center justify-center text-base font-bold"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard; 