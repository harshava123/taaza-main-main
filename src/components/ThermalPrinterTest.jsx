import React, { useState, useEffect } from 'react';
import thermalPrinterService from '../services/thermalPrinterService';

const ThermalPrinterTest = () => {
  const [printerStatus, setPrinterStatus] = useState('Unknown');
  const [isAvailable, setIsAvailable] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkPrinterStatus();
  }, []);

  const checkPrinterStatus = async () => {
    try {
      setIsLoading(true);
      
      // Check if printer is available
      const available = await thermalPrinterService.isThermalPrinterAvailable();
      setIsAvailable(available);
      
      // Get printer status
      const status = await thermalPrinterService.getPrinterStatus();
      setPrinterStatus(status.status);
      setDeviceInfo(status);
      
    } catch (error) {
      console.error('Error checking printer status:', error);
      setPrinterStatus('Error: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const testPrint = async () => {
    try {
      setIsLoading(true);
      
      // Create test order data
      const testOrder = {
        orderId: 'TEST-001',
        products: [
          { name: 'Test Product 1', qty: 2, price: 100, total: 200 },
          { name: 'Test Product 2', qty: 1, price: 150, total: 150 }
        ],
        total: 350,
        paymentMethod: 'CASH',
        createdAt: new Date().toISOString()
      };

      const result = await thermalPrinterService.printReceipt(testOrder);
      
      if (result.success) {
        alert('Test print successful!');
      } else {
        alert('Test print failed: ' + result.error);
      }
      
    } catch (error) {
      console.error('Test print error:', error);
      alert('Test print error: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-center">Thermal Printer Test</h2>
      
      <div className="space-y-4">
        <div className="p-3 bg-gray-100 rounded">
          <h3 className="font-semibold mb-2">Printer Status</h3>
          <p className="text-sm">
            <span className="font-medium">Status:</span> {printerStatus}
          </p>
          <p className="text-sm">
            <span className="font-medium">Available:</span> {isAvailable ? 'Yes' : 'No'}
          </p>
          {deviceInfo && deviceInfo.deviceName && (
            <p className="text-sm">
              <span className="font-medium">Device:</span> {deviceInfo.deviceName}
            </p>
          )}
        </div>

        <div className="flex space-x-3">
          <button
            onClick={checkPrinterStatus}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? 'Checking...' : 'Check Status'}
          </button>
          
          <button
            onClick={testPrint}
            disabled={isLoading || !isAvailable}
            className="flex-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            {isLoading ? 'Printing...' : 'Test Print'}
          </button>
        </div>

        <div className="text-xs text-gray-600 text-center">
          <p>Make sure your Retsol 82 UE printer is connected via USB</p>
          <p>Android 7.1.2 should automatically detect the printer</p>
        </div>
      </div>
    </div>
  );
};

export default ThermalPrinterTest;
