import React, { useEffect, useState } from 'react';
import { db } from '../config/firebase';
import { collection, getDocs } from 'firebase/firestore';

const HeroBanner = () => {
  const [banners, setBanners] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  
  useEffect(() => {
    const fetchBanners = async () => {
      const snap = await getDocs(collection(db, 'banners'));
      setBanners(snap.docs.map(doc => doc.data()));
    };
    fetchBanners();
  }, []);

  useEffect(() => {
    if (!banners.length) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  if (!banners.length) return null;

  return (
    <div className="relative h-48 md:h-64 overflow-hidden rounded-lg mb-6 shadow-lg">
      {banners.map((banner, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          <img
            src={banner.url}
            alt={banner.title || `Banner ${index + 1}`}
            className="w-full h-full object-cover"
          />
          {/* Vignette and text overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
          <div className="absolute bottom-6 left-6 text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-1 drop-shadow-lg">{banner.title}</h2>
            <p className="text-base md:text-lg opacity-90 drop-shadow-lg">{banner.description}</p>
          </div>
        </div>
      ))}
      {/* Dots indicator */}
      <div className="absolute bottom-2 right-4 flex space-x-2 z-20">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-2 h-2 rounded-full transition-colors duration-200 ${
              index === currentSlide ? 'bg-white' : 'bg-white bg-opacity-50'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroBanner; 