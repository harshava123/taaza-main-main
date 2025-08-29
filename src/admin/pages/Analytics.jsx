import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';

// Helper to sum fields in an array
const sum = (arr, field) => arr.reduce((acc, item) => acc + (Number(item[field]) || 0), 0);

const Analytics = () => {
  const [orders, setOrders] = useState([]);
  const [stock, setStock] = useState({ birds: 0, eggs: 0, goats: 0 });
  const [sales, setSales] = useState({ birds: 0, eggs: 0, goats: 0 });
  const [cash, setCash] = useState(0);
  const [payment, setPayment] = useState(0);
  const [shopExp, setShopExp] = useState(0);
  const [lessPayments, setLessPayments] = useState(0);
  const [onlinePay, setOnlinePay] = useState(0);
  const [credits, setCredits] = useState(0);
  const [damages, setDamages] = useState(0);
  const [self, setSelf] = useState(0);
  const [cStock, setCStock] = useState(0);
  const [fStock, setFStock] = useState(0);
  const [change, setChange] = useState(0);
  const [mutton, setMutton] = useState(0);
  const [maggi, setMaggi] = useState(0);
  const [gross, setGross] = useState(0);
  const [totalSale, setTotalSale] = useState(0);
  const [todaySale, setTodaySale] = useState(0);
  const [yesterdaySale, setYesterdaySale] = useState(0);
  const [avg, setAvg] = useState(0);

  // Placeholder: Fetch orders and calculate analytics
  useEffect(() => {
    const fetchOrders = async () => {
      // Fetch orders from Firestore
      const snapshot = await getDocs(collection(db, 'orders'));
      const data = snapshot.docs.map(doc => doc.data());
      setOrders(data);
      // Example calculations (replace with real logic as needed)
      setTotalSale(sum(data, 'total'));
      setGross(sum(data, 'total'));
      setTodaySale(sum(data.filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString()), 'total'));
      setYesterdaySale(sum(data.filter(o => new Date(o.createdAt).toDateString() === new Date(Date.now() - 86400000).toDateString()), 'total'));
      setAvg(data.length ? sum(data, 'total') / data.length : 0);
      // Example: set stock and sales for birds, eggs, goats
      setStock({ birds: 64, eggs: 4123, goats: 0 });
      setSales({ birds: 54, eggs: 1032, goats: 0 });
      setCash(19100);
      setPayment(4000);
      setShopExp(1550);
      setLessPayments(280);
      setOnlinePay(0);
      setCredits(0);
      setDamages(390);
      setSelf(70);
      setCStock(1000);
      setFStock(900);
      setChange(17800);
      setMutton(7800);
      setMaggi(50);
    };
    fetchOrders();
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow mt-8">
      <h2 className="text-2xl font-bold mb-6">Analytics Dashboard</h2>
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div>
          <h3 className="font-semibold mb-2">Sales & Summary</h3>
          <div>Yesterday's Sale: <b>{yesterdaySale}</b></div>
          <div>Today's Sale: <b>{todaySale}</b></div>
          <div>Total Sale: <b>{totalSale}</b></div>
          <div>Gross: <b>{gross}</b></div>
          <div>Average Sale: <b>{avg.toFixed(2)}</b></div>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Stock & Sale</h3>
          <div>Birds: Stock <b>{stock.birds}</b> / Sale <b>{sales.birds}</b></div>
          <div>Eggs: Stock <b>{stock.eggs}</b> / Sale <b>{sales.eggs}</b></div>
          <div>Goats: Stock <b>{stock.goats}</b> / Sale <b>{sales.goats}</b></div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div>
          <h3 className="font-semibold mb-2">Cash & Payments</h3>
          <div>Cash: <b>{cash}</b></div>
          <div>Payment: <b>{payment}</b></div>
          <div>Shop Expenses: <b>{shopExp}</b></div>
          <div>Less Payments: <b>{lessPayments}</b></div>
          <div>Online Payment: <b>{onlinePay}</b></div>
          <div>Credits: <b>{credits}</b></div>
          <div>Damages: <b>{damages}</b></div>
          <div>Self: <b>{self}</b></div>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Other</h3>
          <div>C-Stock: <b>{cStock}</b></div>
          <div>F-Stock: <b>{fStock}</b></div>
          <div>Change: <b>{change}</b></div>
          <div>Mutton: <b>{mutton}</b></div>
          <div>Maggi: <b>{maggi}</b></div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
