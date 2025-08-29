package com.taaza.app;

import android.content.Context;
import android.hardware.usb.UsbDevice;
import android.hardware.usb.UsbDeviceConnection;
import android.hardware.usb.UsbManager;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

@CapacitorPlugin(name = "ThermalPrinter")
public class ThermalPrinterPlugin extends Plugin {
    private static final String TAG = "ThermalPrinter";
    private UsbManager usbManager;
    private UsbDevice printerDevice;
    private UsbDeviceConnection connection;
    
    // ESC/POS commands for thermal printer
    private static final byte[] ESC = {0x1B};
    private static final byte[] GS = {0x1D};
    private static final byte[] INIT = {0x1B, 0x40}; // Initialize printer
    private static final byte[] ALIGN_CENTER = {0x1B, 0x61, 0x01}; // Center alignment
    private static final byte[] ALIGN_LEFT = {0x1B, 0x61, 0x00}; // Left alignment
    private static final byte[] ALIGN_RIGHT = {0x1B, 0x61, 0x02}; // Right alignment
    private static final byte[] BOLD_ON = {0x1B, 0x45, 0x01}; // Bold on
    private static final byte[] BOLD_OFF = {0x1B, 0x45, 0x00}; // Bold off
    private static final byte[] DOUBLE_HEIGHT = {0x1B, 0x21, 0x10}; // Double height
    private static final byte[] NORMAL_SIZE = {0x1B, 0x21, 0x00}; // Normal size
    private static final byte[] DOUBLE_WIDTH = {0x1B, 0x21, 0x20}; // Double width
    private static final byte[] LINE_FEED = {0x0A}; // Line feed
    private static final byte[] CUT_PAPER = {0x1D, 0x56, 0x00}; // Cut paper
    private static final byte[] NEW_LINE = {0x0D, 0x0A}; // New line

    @Override
    public void load() {
        super.load();
        usbManager = (UsbManager) getContext().getSystemService(Context.USB_SERVICE);
    }

    @PluginMethod
    public void isAvailable(PluginCall call) {
        JSObject result = new JSObject();
        boolean available = findPrinterDevice();
        result.put("available", available);
        call.resolve(result);
    }

    @PluginMethod
    public void getStatus(PluginCall call) {
        JSObject result = new JSObject();
        if (printerDevice != null && connection != null) {
            result.put("connected", true);
            result.put("status", "Connected to " + printerDevice.getDeviceName());
        } else {
            result.put("connected", false);
            result.put("status", "No printer connected");
        }
        call.resolve(result);
    }

    @PluginMethod
    public void printReceipt(PluginCall call) {
        try {
            if (!findPrinterDevice()) {
                call.reject("No thermal printer found");
                return;
            }

            JSObject receiptData = call.getData();
            if (receiptData == null) {
                call.reject("No receipt data provided");
                return;
            }

            // Format and print the receipt
            byte[] printData = formatReceiptForPrinter(receiptData);
            boolean success = sendToPrinter(printData);

            JSObject result = new JSObject();
            if (success) {
                result.put("success", true);
                result.put("message", "Receipt printed successfully");
            } else {
                result.put("success", false);
                result.put("error", "Failed to print receipt");
            }
            call.resolve(result);

        } catch (Exception e) {
            Log.e(TAG, "Error printing receipt", e);
            call.reject("Error printing receipt: " + e.getMessage());
        }
    }

    private boolean findPrinterDevice() {
        if (usbManager == null) return false;

        HashMap<String, UsbDevice> deviceList = usbManager.getDeviceList();
        for (UsbDevice device : deviceList.values()) {
            // Look for Retsol 82 UE or similar thermal printer
            // You may need to adjust these vendor/product IDs based on your specific printer
            if (isThermalPrinter(device)) {
                printerDevice = device;
                connection = usbManager.openDevice(device);
                if (connection != null) {
                    Log.i(TAG, "Found thermal printer: " + device.getDeviceName());
                    return true;
                }
            }
        }
        return false;
    }

    private boolean isThermalPrinter(UsbDevice device) {
        // Common thermal printer vendor IDs
        int[] thermalPrinterVendors = {
            0x0483, // STMicroelectronics
            0x04B8, // Epson
            0x0525, // PLX Technology
            0x0BDA, // Realtek
            0x1A86, // QinHeng Electronics
            0x2341, // Arduino
            0x2A03, // Arduino
            0x0403, // FTDI
            0x067B, // Prolific Technology
            0x10C4, // Silicon Labs
        };

        // Check if device vendor ID matches known thermal printer vendors
        for (int vendorId : thermalPrinterVendors) {
            if (device.getVendorId() == vendorId) {
                return true;
            }
        }

        // Also check by device name (common thermal printer names)
        String deviceName = device.getDeviceName().toLowerCase();
        String[] thermalPrinterNames = {
            "thermal", "printer", "receipt", "pos", "retsol", "82ue", "82 ue"
        };

        for (String name : thermalPrinterNames) {
            if (deviceName.contains(name)) {
                return true;
            }
        }

        return false;
    }

    private byte[] formatReceiptForPrinter(JSObject receiptData) throws JSONException {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();

        try {
            // Initialize printer
            outputStream.write(INIT);
            outputStream.write(LINE_FEED);

            // Print header
            JSONArray header = receiptData.getJSONArray("header");
            for (int i = 0; i < header.length(); i++) {
                JSONObject item = header.getJSONObject(i);
                if (item.has("type") && item.getString("type").equals("divider")) {
                    outputStream.write(createDividerLine());
                } else {
                    outputStream.write(formatTextItem(item));
                }
            }

            // Print order info
            JSONArray orderInfo = receiptData.getJSONArray("orderInfo");
            for (int i = 0; i < orderInfo.length(); i++) {
                JSONObject item = orderInfo.getJSONObject(i);
                if (item.has("type") && item.getString("type").equals("divider")) {
                    outputStream.write(createDividerLine());
                } else {
                    outputStream.write(formatTextItem(item));
                }
            }

            // Print title
            JSONArray title = receiptData.getJSONArray("title");
            for (int i = 0; i < title.length(); i++) {
                JSONObject item = title.getJSONObject(i);
                if (item.has("type") && item.getString("type").equals("divider")) {
                    outputStream.write(createDividerLine());
                } else {
                    outputStream.write(formatTextItem(item));
                }
            }

            // Print table header
            JSONArray tableHeader = receiptData.getJSONArray("tableHeader");
            outputStream.write(formatTableRow(tableHeader));

            // Print items
            JSONArray items = receiptData.getJSONArray("items");
            for (int i = 0; i < items.length(); i++) {
                JSONArray item = items.getJSONArray(i);
                outputStream.write(formatTableRow(item));
            }

            // Print summary
            JSONArray summary = receiptData.getJSONArray("summary");
            for (int i = 0; i < summary.length(); i++) {
                JSONObject item = summary.getJSONObject(i);
                if (item.has("type") && item.getString("type").equals("divider")) {
                    outputStream.write(createDividerLine());
                } else {
                    outputStream.write(formatTextItem(item));
                }
            }

            // Print footer
            JSONArray footer = receiptData.getJSONArray("footer");
            for (int i = 0; i < footer.length(); i++) {
                JSONObject item = footer.getJSONObject(i);
                if (item.has("type") && item.getString("type").equals("spacer")) {
                    outputStream.write(LINE_FEED);
                } else {
                    outputStream.write(formatTextItem(item));
                }
            }

            // Cut paper and add final spacing
            outputStream.write(LINE_FEED);
            outputStream.write(LINE_FEED);
            outputStream.write(CUT_PAPER);

        } catch (IOException e) {
            Log.e(TAG, "Error formatting receipt", e);
        }

        return outputStream.toByteArray();
    }

    private byte[] formatTextItem(JSONObject item) throws JSONException {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();

        try {
            String text = item.getString("text");
            String align = item.optString("align", "left");
            boolean bold = item.optBoolean("bold", false);
            String size = item.optString("size", "normal");

            // Set alignment
            if ("center".equals(align)) {
                outputStream.write(ALIGN_CENTER);
            } else if ("right".equals(align)) {
                outputStream.write(ALIGN_RIGHT);
            } else {
                outputStream.write(ALIGN_LEFT);
            }

            // Set text size
            if ("large".equals(size)) {
                outputStream.write(DOUBLE_HEIGHT);
                outputStream.write(DOUBLE_WIDTH);
            } else {
                outputStream.write(NORMAL_SIZE);
            }

            // Set bold
            if (bold) {
                outputStream.write(BOLD_ON);
            }

            // Add text
            outputStream.write(text.getBytes(StandardCharsets.UTF_8));
            outputStream.write(NEW_LINE);

            // Reset formatting
            if (bold) {
                outputStream.write(BOLD_OFF);
            }
            if (!"normal".equals(size)) {
                outputStream.write(NORMAL_SIZE);
            }

        } catch (IOException e) {
            Log.e(TAG, "Error formatting text item", e);
        }

        return outputStream.toByteArray();
    }

    private byte[] formatTableRow(JSONArray columns) throws JSONException {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();

        try {
            // Set left alignment for table
            outputStream.write(ALIGN_LEFT);
            outputStream.write(NORMAL_SIZE);

            // Format each column
            for (int i = 0; i < columns.length(); i++) {
                JSONObject column = columns.getJSONObject(i);
                String text = column.getString("text");
                String align = column.optString("align", "left");
                int width = column.optInt("width", 0);

                // Pad text to fit column width
                if (width > 0) {
                    text = padText(text, width, align);
                }

                outputStream.write(text.getBytes(StandardCharsets.UTF_8));
                
                // Add spacing between columns
                if (i < columns.length() - 1) {
                    outputStream.write("  ".getBytes(StandardCharsets.UTF_8));
                }
            }

            outputStream.write(NEW_LINE);

        } catch (IOException e) {
            Log.e(TAG, "Error formatting table row", e);
        }

        return outputStream.toByteArray();
    }

    private String padText(String text, int width, String align) {
        if (text.length() >= width) {
            return text.substring(0, width);
        }

        int padding = width - text.length();
        if ("right".equals(align)) {
            return " ".repeat(padding) + text;
        } else if ("center".equals(align)) {
            int leftPadding = padding / 2;
            int rightPadding = padding - leftPadding;
            return " ".repeat(leftPadding) + text + " ".repeat(rightPadding);
        } else {
            return text + " ".repeat(padding);
        }
    }

    private byte[] createDividerLine() {
        return "----------------------------------------\n".getBytes(StandardCharsets.UTF_8);
    }

    private boolean sendToPrinter(byte[] data) {
        if (connection == null || printerDevice == null) {
            Log.e(TAG, "No printer connection available");
            return false;
        }

        try {
            // Find the appropriate USB endpoint for bulk transfer
            int endpoint = findBulkOutEndpoint(printerDevice);
            if (endpoint == -1) {
                Log.e(TAG, "No bulk out endpoint found");
                return false;
            }

            // Send data in chunks (USB has packet size limits)
            int chunkSize = 64; // Common USB packet size
            int offset = 0;
            
            while (offset < data.length) {
                int length = Math.min(chunkSize, data.length - offset);
                byte[] chunk = new byte[length];
                System.arraycopy(data, offset, chunk, 0, length);
                
                int bytesWritten = connection.bulkTransfer(
                    printerDevice.getInterface(0).getEndpoint(endpoint),
                    chunk,
                    length,
                    5000 // 5 second timeout
                );
                
                if (bytesWritten < 0) {
                    Log.e(TAG, "Failed to write chunk at offset " + offset);
                    return false;
                }
                
                offset += bytesWritten;
            }

            Log.i(TAG, "Successfully sent " + data.length + " bytes to printer");
            return true;

        } catch (Exception e) {
            Log.e(TAG, "Error sending data to printer", e);
            return false;
        }
    }

    private int findBulkOutEndpoint(UsbDevice device) {
        for (int i = 0; i < device.getInterfaceCount(); i++) {
            for (int j = 0; j < device.getInterface(i).getEndpointCount(); j++) {
                if (device.getInterface(i).getEndpoint(j).getDirection() == 
                    android.hardware.usb.UsbConstants.USB_DIR_OUT &&
                    device.getInterface(i).getEndpoint(j).getType() == 
                    android.hardware.usb.UsbConstants.USB_ENDPOINT_XFER_BULK) {
                    return device.getInterface(i).getEndpoint(j).getEndpointNumber();
                }
            }
        }
        return -1;
    }
}

