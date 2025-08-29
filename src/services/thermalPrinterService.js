import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';

class ThermalPrinterService {
  constructor() {
    this.isNative = Capacitor.isNativePlatform();
    this.platform = null;
    this.pluginAvailable = false;
    this.initializePlatform();
  }

  async initializePlatform() {
    if (this.isNative) {
      const info = await Device.getInfo();
      this.platform = info.platform;
      
      // Check if thermal printer plugin is available
      if (this.platform === 'android') {
        this.pluginAvailable = await this.checkPluginAvailability();
      }
    }
  }

  async checkPluginAvailability() {
    try {
      if (window.ThermalPrinter) {
        const result = await window.ThermalPrinter.isAvailable();
        return result && result.available;
      }
    } catch (error) {
      console.log('Thermal printer plugin not available:', error);
    }
    return false;
  }

  // Format receipt data for thermal printer
  formatReceiptData(orderData) {
    const {
      orderId,
      products,
      total,
      paymentMethod,
      createdAt
    } = orderData;

    const date = new Date(createdAt);
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = date.toLocaleDateString('en-GB');

    // Format for 80mm thermal printer (Retsol 82 UE)
    const receipt = {
      header: [
        { text: 'TAAZA CHIKEN AND MUTTON', align: 'center', bold: true, size: 'large' },
        { text: 'PH.NO: 8008469048', align: 'center', size: 'normal' },
        { text: '', type: 'divider' }
      ],
      orderInfo: [
        { text: `TIME: ${timeStr}`, align: 'left' },
        { text: `DATE: ${dateStr}`, align: 'right' },
        { text: `BILL: ${orderId.replace('ADM-', 'A/').replace('CUS-', 'C/')}`, align: 'left' },
        { text: `TYPE: RETAIL`, align: 'right' },
        { text: '', type: 'divider' }
      ],
      title: [
        { text: 'BILL OF SUPPLY', align: 'center', bold: true, size: 'large' },
        { text: '', type: 'divider' }
      ],
      tableHeader: [
        { text: 'ITEM NAME', width: 30, align: 'left' },
        { text: 'QTY', width: 8, align: 'right' },
        { text: 'RATE', width: 12, align: 'right' },
        { text: 'TOTAL', width: 15, align: 'right' }
      ],
      items: products.map(product => [
        { text: product.name || 'Unknown', width: 30, align: 'left' },
        { text: String(product.qty || product.weight || 1), width: 8, align: 'right' },
        { text: `₹${Number(product.pricePerKg || product.price || 0).toFixed(2)}`, width: 12, align: 'right' },
        { text: `₹${Number(product.total).toFixed(2)}`, width: 15, align: 'right' }
      ]),
      summary: [
        { text: '', type: 'divider' },
        { text: 'TOTAL', align: 'left', bold: true },
        { text: `₹${Number(total).toFixed(2)}`, align: 'right', bold: true },
        { text: `ITEMS/QTY: ${products.length}/${products.reduce((sum, p) => sum + Number(p.weight || p.qty || 1), 0)}`, align: 'left' },
        { text: '', type: 'divider' },
        { text: `TENDERED: ₹${Number(total).toFixed(2)}`, align: 'left' },
        { text: `${paymentMethod.toUpperCase()}: ₹${Number(total).toFixed(2)}`, align: 'left' },
        { text: 'REDEEM POINTS(OPTS): ₹0.00', align: 'left' },
        { text: '', type: 'divider' }
      ],
      footer: [
        { text: 'THANK YOU.....VISIT AGAIN', align: 'center', bold: true },
        { text: '', type: 'spacer' },
        { text: '', type: 'spacer' }
      ]
    };

    return receipt;
  }

  // Print receipt using native Android thermal printer
  async printReceiptNative(orderData) {
    if (!this.isNative || this.platform !== 'android') {
      throw new Error('Native printing is only available on Android');
    }

    if (!this.pluginAvailable) {
      throw new Error('Thermal printer plugin not available. Please check if the printer is connected.');
    }

    try {
      const receiptData = this.formatReceiptData(orderData);
      
      // Call native Android plugin for thermal printing
      const result = await this.callNativePrinter(receiptData);
      
      if (result.success) {
        console.log('Receipt printed successfully');
        return { success: true, message: 'Receipt printed successfully' };
      } else {
        throw new Error(result.error || 'Printing failed');
      }
    } catch (error) {
      console.error('Native printing error:', error);
      throw error;
    }
  }

  // Call native Android printer plugin
  async callNativePrinter(receiptData) {
    try {
      if (window.ThermalPrinter) {
        // First check if printer is available
        const availability = await window.ThermalPrinter.isAvailable();
        if (!availability.available) {
          throw new Error('Thermal printer not available. Please check connection.');
        }

        // Get printer status
        const status = await window.ThermalPrinter.getStatus();
        if (!status.connected) {
          throw new Error('Printer not connected. Please check USB connection.');
        }

        // Print the receipt
        return await window.ThermalPrinter.printReceipt(receiptData);
      } else {
        throw new Error('Thermal printer plugin not available');
      }
    } catch (error) {
      console.error('Error calling native printer:', error);
      throw error;
    }
  }

  // Fallback to web printing (for development/testing)
  async printReceiptWeb(orderData) {
    try {
      const receiptData = this.formatReceiptData(orderData);
      
      // Create a printable receipt element
      const printElement = this.createPrintableElement(receiptData);
      
      // Trigger print dialog
      const printWindow = window.open('', '_blank');
      printWindow.document.write(printElement.outerHTML);
      printWindow.document.close();
      
      // Wait for content to load then print
      printWindow.onload = () => {
        printWindow.print();
        printWindow.close();
      };
      
      return { success: true, message: 'Print dialog opened' };
    } catch (error) {
      console.error('Web printing error:', error);
      throw error;
    }
  }

  // Create printable HTML element
  createPrintableElement(receiptData) {
    const container = document.createElement('div');
    container.style.cssText = `
      font-family: 'Courier New', monospace;
      font-size: 12px;
      line-height: 1.2;
      width: 80mm;
      max-width: 80mm;
      margin: 0 auto;
      padding: 5mm;
      background: white;
      color: black;
    `;

    // Add header
    receiptData.header.forEach(item => {
      if (item.type === 'divider') {
        container.appendChild(this.createDivider());
      } else {
        container.appendChild(this.createTextElement(item));
      }
    });

    // Add order info
    receiptData.orderInfo.forEach(item => {
      if (item.type === 'divider') {
        container.appendChild(this.createDivider());
      } else {
        container.appendChild(this.createTextElement(item));
      }
    });

    // Add title
    receiptData.title.forEach(item => {
      if (item.type === 'divider') {
        container.appendChild(this.createDivider());
      } else {
        container.appendChild(this.createTextElement(item));
      }
    });

    // Add table header
    const tableHeader = this.createTableRow(receiptData.tableHeader);
    container.appendChild(tableHeader);

    // Add items
    receiptData.items.forEach(item => {
      const row = this.createTableRow(item);
      container.appendChild(row);
    });

    // Add summary
    receiptData.summary.forEach(item => {
      if (item.type === 'divider') {
        container.appendChild(this.createDivider());
      } else {
        container.appendChild(this.createTextElement(item));
      }
    });

    // Add footer
    receiptData.footer.forEach(item => {
      if (item.type === 'spacer') {
        container.appendChild(this.createSpacer());
      } else {
        container.appendChild(this.createTextElement(item));
      }
    });

    return container;
  }

  createTextElement(item) {
    const element = document.createElement('div');
    element.textContent = item.text;
    
    if (item.align === 'center') {
      element.style.textAlign = 'center';
    } else if (item.align === 'right') {
      element.style.textAlign = 'right';
    }
    
    if (item.bold) {
      element.style.fontWeight = 'bold';
    }
    
    if (item.size === 'large') {
      element.style.fontSize = '14px';
    }
    
    element.style.marginBottom = '2px';
    return element;
  }

  createDivider() {
    const divider = document.createElement('div');
    divider.style.cssText = `
      border-top: 1px dashed #000;
      margin: 3px 0;
      height: 0;
    `;
    return divider;
  }

  createSpacer() {
    const spacer = document.createElement('div');
    spacer.style.height = '8px';
    return spacer;
  }

  createTableRow(columns) {
    const row = document.createElement('div');
    row.style.cssText = `
      display: flex;
      justify-content: space-between;
      margin-bottom: 2px;
    `;

    columns.forEach(column => {
      const cell = document.createElement('span');
      cell.textContent = column.text;
      cell.style.width = column.width ? `${column.width}px` : 'auto';
      cell.style.textAlign = column.align || 'left';
      row.appendChild(cell);
    });

    return row;
  }

  // Main print method - automatically chooses native or web printing
  async printReceipt(orderData) {
    try {
      if (this.isNative && this.platform === 'android') {
        return await this.printReceiptNative(orderData);
      } else {
        return await this.printReceiptWeb(orderData);
      }
    } catch (error) {
      console.error('Printing failed:', error);
      throw error;
    }
  }

  // Check if thermal printer is available
  async isThermalPrinterAvailable() {
    if (this.isNative && this.platform === 'android') {
      try {
        if (window.ThermalPrinter) {
          const result = await window.ThermalPrinter.isAvailable();
          return result && result.available;
        }
      } catch (error) {
        console.error('Error checking thermal printer availability:', error);
      }
    }
    return false;
  }

  // Get printer status
  async getPrinterStatus() {
    if (this.isNative && this.platform === 'android') {
      try {
        if (window.ThermalPrinter) {
          return await window.ThermalPrinter.getStatus();
        }
      } catch (error) {
        console.error('Error getting printer status:', error);
      }
    }
    return { connected: false, status: 'Not available' };
  }
}

// Create and export a singleton instance
const thermalPrinterService = new ThermalPrinterService();
export default thermalPrinterService;

