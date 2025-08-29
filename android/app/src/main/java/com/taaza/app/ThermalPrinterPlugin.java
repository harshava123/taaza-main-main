package com.taaza.app;

import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.hardware.usb.UsbDevice;
import android.hardware.usb.UsbDeviceConnection;
import android.hardware.usb.UsbManager;
import android.hardware.usb.UsbEndpoint;
import android.hardware.usb.UsbInterface;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

@CapacitorPlugin(name = "ThermalPrinter")
public class ThermalPrinterPlugin extends Plugin {
    private static final String TAG = "ThermalPrinterPlugin";
    
    // ESC/POS Commands
    private static final byte[] ESC_INIT = {0x1B, 0x40}; // Initialize printer
    private static final byte[] ESC_ALIGN_CENTER = {0x1B, 0x61, 0x01}; // Center alignment
    private static final byte[] ESC_ALIGN_LEFT = {0x1B, 0x61, 0x00}; // Left alignment
    private static final byte[] ESC_ALIGN_RIGHT = {0x1B, 0x61, 0x02}; // Right alignment
    private static final byte[] ESC_FONT_NORMAL = {0x1B, 0x21, 0x00}; // Normal font
    private static final byte[] ESC_FONT_BOLD = {0x1B, 0x45, 0x01}; // Bold font
    private static final byte[] ESC_FONT_LARGE = {0x1B, 0x21, 0x11}; // Large font
    private static final byte[] ESC_CUT_PAPER = {0x1D, 0x56, 0x00}; // Cut paper
    private static final byte[] ESC_FEED_LINE = {0x0A}; // Feed line
    private static final byte[] ESC_FEED_PAPER = {0x0C}; // Feed paper
    
    private UsbManager usbManager;
    private UsbDevice printerDevice;
    private UsbDeviceConnection connection;
    private UsbEndpoint bulkOutEndpoint;
    
    // USB Permission handling
    private static final String ACTION_USB_PERMISSION = "com.taaza.app.USB_PERMISSION";
    private PendingIntent permissionIntent;
    private BroadcastReceiver permissionReceiver;
    
    @Override
    public void load() {
        super.load();
        usbManager = (UsbManager) getContext().getSystemService(Context.USB_SERVICE);
        
        // Initialize permission intent
        permissionIntent = PendingIntent.getBroadcast(
            getContext(), 
            0, 
            new Intent(ACTION_USB_PERMISSION), 
            PendingIntent.FLAG_MUTABLE
        );
        
        // Register permission receiver
        permissionReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                String action = intent.getAction();
                if (ACTION_USB_PERMISSION.equals(action)) {
                    synchronized (this) {
                        UsbDevice device = intent.getParcelableExtra(UsbManager.EXTRA_DEVICE);
                        if (intent.getBooleanExtra(UsbManager.EXTRA_PERMISSION_GRANTED, false)) {
                            if (device != null) {
                                connectToPrinter(device);
                            }
                        }
                    }
                }
            }
        };
        
        IntentFilter filter = new IntentFilter(ACTION_USB_PERMISSION);
        getContext().registerReceiver(permissionReceiver, filter);
    }
    
    @Override
    public void handleOnDestroy() {
        super.handleOnDestroy();
        if (permissionReceiver != null) {
            getContext().unregisterReceiver(permissionReceiver);
        }
        if (connection != null) {
            connection.close();
        }
    }
    
    @PluginMethod
    public void isAvailable(PluginCall call) {
        JSObject result = new JSObject();
        
        if (findPrinterDevice()) {
            result.put("available", true);
            result.put("deviceName", printerDevice.getDeviceName());
            result.put("vendorId", printerDevice.getVendorId());
            result.put("productId", printerDevice.getProductId());
        } else {
            result.put("available", false);
        }
        
        call.resolve(result);
    }
    
    @PluginMethod
    public void getStatus(PluginCall call) {
        JSObject result = new JSObject();
        
        if (printerDevice != null && connection != null) {
            result.put("connected", true);
            result.put("deviceName", printerDevice.getDeviceName());
            result.put("vendorId", printerDevice.getVendorId());
            result.put("productId", printerDevice.getProductId());
        } else {
            result.put("connected", false);
        }
        
        call.resolve(result);
    }
    
    @PluginMethod
    public void printReceipt(PluginCall call) {
        try {
            String receiptData = call.getString("data");
            if (receiptData == null) {
                call.reject("Receipt data is required");
                return;
            }
            
            if (!findPrinterDevice()) {
                call.reject("Thermal printer not found");
                return;
            }
            
            if (connection == null) {
                call.reject("Printer not connected");
                return;
            }
            
            // Format and send receipt data
            byte[] formattedData = formatReceiptForPrinter(receiptData);
            if (sendToPrinter(formattedData)) {
                call.resolve();
            } else {
                call.reject("Failed to print receipt");
            }
            
        } catch (Exception e) {
            Log.e(TAG, "Error printing receipt", e);
            call.reject("Error printing receipt: " + e.getMessage());
        }
    }
    
    private boolean findPrinterDevice() {
        if (usbManager == null) return false;
        
        HashMap<String, UsbDevice> deviceList = usbManager.getDeviceList();
        for (UsbDevice device : deviceList.values()) {
            if (isThermalPrinter(device)) {
                printerDevice = device;
                
                // Check if we have permission
                if (!usbManager.hasPermission(device)) {
                    // Request permission
                    usbManager.requestPermission(device, permissionIntent);
                    return false;
                }
                
                // Connect to printer
                return connectToPrinter(device);
            }
        }
        return false;
    }
    
    private boolean connectToPrinter(UsbDevice device) {
        if (device == null) return false;
        
        connection = usbManager.openDevice(device);
        if (connection == null) return false;
        
        // Find bulk out endpoint
        bulkOutEndpoint = findBulkOutEndpoint(device);
        if (bulkOutEndpoint == null) {
            connection.close();
            connection = null;
            return false;
        }
        
        // Initialize printer
        return sendToPrinter(ESC_INIT);
    }
    
    private boolean isThermalPrinter(UsbDevice device) {
        // Retsol 82 UE specific vendor/product IDs
        if (device.getVendorId() == 0x1A86) {
            int productId = device.getProductId();
            return productId == 0x7523 || productId == 0x7522;
        }
        
        // Common thermal printer vendor IDs
        int vendorId = device.getVendorId();
        return vendorId == 0x0483 || vendorId == 0x04B8 || vendorId == 0x0525 || 
               vendorId == 0x0416 || vendorId == 0x0BDA || vendorId == 0x1A86;
    }
    
    private UsbEndpoint findBulkOutEndpoint(UsbDevice device) {
        int interfaceCount = device.getInterfaceCount();
        for (int i = 0; i < interfaceCount; i++) {
            UsbInterface intf = device.getInterface(i);
            int endpointCount = intf.getEndpointCount();
            for (int j = 0; j < endpointCount; j++) {
                UsbEndpoint endpoint = intf.getEndpoint(j);
                if (endpoint.getType() == UsbEndpoint.USB_ENDPOINT_XFER_BULK && 
                    endpoint.getDirection() == UsbEndpoint.USB_DIR_OUT) {
                    return endpoint;
                }
            }
        }
        return null;
    }
    
    private byte[] formatReceiptForPrinter(String receiptData) {
        // Simple formatting - you can enhance this based on your needs
        StringBuilder formatted = new StringBuilder();
        
        // Add header
        formatted.append("=== TAAZA MEAT SHOP ===\n");
        formatted.append("Receipt\n");
        formatted.append("=====================\n\n");
        
        // Add receipt data
        formatted.append(receiptData);
        
        // Add footer
        formatted.append("\n\n=====================\n");
        formatted.append("Thank you for shopping!\n");
        formatted.append("=====================\n\n\n\n");
        
        return formatted.toString().getBytes(StandardCharsets.UTF_8);
    }
    
    private boolean sendToPrinter(byte[] data) {
        if (connection == null || bulkOutEndpoint == null) return false;
        
        try {
            int bytesWritten = connection.bulkTransfer(bulkOutEndpoint, data, data.length, 5000);
            return bytesWritten == data.length;
        } catch (Exception e) {
            Log.e(TAG, "Error sending data to printer", e);
            return false;
        }
    }
}

