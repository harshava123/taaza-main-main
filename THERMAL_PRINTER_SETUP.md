# Thermal Printer Setup Guide - Retsol 82 UE

## 🎯 Overview
This guide will help you set up your Retsol 82 UE thermal printer with your TAAZA application on Android 7.1.2.

## ✅ What's Already Configured

### 1. **Android Plugin** (`ThermalPrinterPlugin.java`)
- USB device detection for Retsol 82 UE printer
- ESC/POS command support for thermal printing
- Automatic permission handling
- Support for 80mm thermal paper

### 2. **Web Service** (`thermalPrinterService.js`)
- Receipt formatting for thermal printer
- Native Android plugin integration
- Fallback web printing for development
- Automatic platform detection

### 3. **Android Configuration**
- USB permissions in `AndroidManifest.xml`
- Device filtering for thermal printers
- USB permission handling in `MainActivity.java`

### 4. **Test Interface**
- Thermal printer test component
- Connection status checking
- Test printing functionality

## 🚀 Building the APK

### Step 1: Open in Android Studio
1. Open Android Studio
2. Select "Open an existing project"
3. Navigate to your project folder and select the `android` folder
4. Wait for Gradle sync to complete

### Step 2: Build Configuration
1. In Android Studio, go to `Build` → `Make Project`
2. Wait for the build to complete
3. If successful, go to `Build` → `Build Bundle(s) / APK(s)` → `Build APK(s)`

### Step 3: Locate the APK
The APK will be generated at:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

## 📱 Installing and Testing

### Step 1: Install APK
1. Transfer the APK to your Android 7.1.2 device
2. Enable "Install from unknown sources" in device settings
3. Install the APK

### Step 2: Connect Printer
1. Connect your Retsol 82 UE printer via USB to your Android device
2. The app will automatically detect the printer
3. Grant USB permissions when prompted

### Step 3: Test Printing
1. Open the app
2. Click the "🖨️ Test Thermal Printer" button on the home page
3. Check printer connection status
4. Try a test print

## 🔧 Troubleshooting

### Printer Not Detected
- Check USB cable connection
- Verify printer is powered on
- Check if USB debugging is enabled on device
- Try different USB ports

### Permission Denied
- Go to device settings → Apps → Your App → Permissions
- Enable USB permissions
- Reconnect the printer

### Print Quality Issues
- Check thermal paper alignment
- Clean printer head if needed
- Verify paper width (80mm)

## 📋 Printer Specifications

- **Model**: Retsol 82 UE
- **Paper Width**: 80mm
- **Interface**: USB
- **Commands**: ESC/POS
- **Vendor ID**: 0x1A86
- **Product ID**: 0x7523 / 0x7522

## 🎨 Receipt Format

The system automatically formats receipts with:
- Company header (TAAZA CHIKEN AND MUTTON)
- Order details (time, date, bill number)
- Product table (item, quantity, rate, total)
- Payment summary
- Thank you message

## 🔄 Integration with Orders

To print receipts from your order flow:

```javascript
import thermalPrinterService from '../services/thermalPrinterService';

// When order is completed
const printResult = await thermalPrinterService.printReceipt(orderData);
if (printResult.success) {
  console.log('Receipt printed successfully');
} else {
  console.error('Printing failed:', printResult.error);
}
```

## 📞 Support

If you encounter issues:
1. Check the Android Studio logcat for error messages
2. Verify USB permissions are granted
3. Test with the built-in test component
4. Ensure printer drivers are compatible with Android 7.1.2

## 🎉 Success Indicators

- Printer shows as "Connected" in the test component
- Test print produces readable output
- No error messages in the app
- Receipt formatting matches your requirements

---

**Note**: This setup is specifically configured for Android 7.1.2 and the Retsol 82 UE thermal printer. For other devices or printers, you may need to adjust the vendor/product IDs in the device filter.
