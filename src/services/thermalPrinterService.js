import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';

class ThermalPrinterService {
    constructor() {
        this.isNative = false;
        this.platform = 'web';
        this.pluginAvailable = false;
        this.initializePlatform();
    }

    async initializePlatform() {
        try {
            const info = await Device.getInfo();
            this.platform = info.platform;
            
            if (this.platform === 'android') {
                this.isNative = true;
                await this.checkPluginAvailability();
            }
        } catch (error) {
            console.warn('Could not determine platform:', error);
        }
    }

    async checkPluginAvailability() {
        try {
            if (typeof window !== 'undefined' && window.ThermalPrinter) {
                const result = await window.ThermalPrinter.isAvailable();
                this.pluginAvailable = result.available;
            }
        } catch (error) {
            console.warn('Plugin availability check failed:', error);
            this.pluginAvailable = false;
        }
    }

    formatReceiptData(orderData) {
        const { items, total, orderNumber, date, time } = orderData;
        
        let receiptText = '';
        
        // Header
        receiptText += '=== TAAZA MEAT SHOP ===\n';
        receiptText += 'Receipt\n';
        receiptText += '=====================\n\n';
        
        // Order Info
        receiptText += `Order #: ${orderNumber}\n`;
        receiptText += `Date: ${date}\n`;
        receiptText += `Time: ${time}\n`;
        receiptText += '=====================\n\n';
        
        // Items
        receiptText += 'ITEMS:\n';
        items.forEach(item => {
            receiptText += `${item.name.padEnd(20)} ${item.quantity}x ${item.price.toFixed(2)}\n`;
        });
        
        receiptText += '\n=====================\n';
        receiptText += `TOTAL: ${total.toFixed(2)}\n`;
        receiptText += '=====================\n\n';
        
        // Footer
        receiptText += 'Thank you for shopping!\n';
        receiptText += '=====================\n\n\n\n';
        
        return receiptText;
    }

    async printReceiptNative(receiptData) {
        if (!this.pluginAvailable) {
            throw new Error('Thermal printer plugin not available');
        }

        try {
            await this.callNativePrinter(receiptData);
            return { success: true, message: 'Receipt printed successfully' };
        } catch (error) {
            console.error('Native printing failed:', error);
            throw error;
        }
    }

    async callNativePrinter(receiptData) {
        try {
            // Check if printer is available
            const availableResult = await window.ThermalPrinter.isAvailable();
            if (!availableResult.available) {
                throw new Error('Thermal printer not available');
            }

            // Get printer status
            const statusResult = await window.ThermalPrinter.getStatus();
            if (!statusResult.connected) {
                throw new Error('Thermal printer not connected');
            }

            // Print receipt
            await window.ThermalPrinter.printReceipt({ data: receiptData });
            
        } catch (error) {
            console.error('Native printer call failed:', error);
            throw error;
        }
    }

    async printReceiptWeb(receiptData) {
        try {
            const printableElement = this.createPrintableElement(receiptData);
            const printWindow = window.open('', '_blank');
            
            if (printWindow) {
                printWindow.document.write(printableElement.outerHTML);
                printWindow.document.close();
                printWindow.focus();
                
                setTimeout(() => {
                    printWindow.print();
                    printWindow.close();
                }, 500);
                
                return { success: true, message: 'Receipt sent to browser print dialog' };
            } else {
                throw new Error('Could not open print window');
            }
        } catch (error) {
            console.error('Web printing failed:', error);
            throw error;
        }
    }

    createPrintableElement(receiptData) {
        const container = document.createElement('div');
        container.style.fontFamily = 'monospace';
        container.style.fontSize = '12px';
        container.style.lineHeight = '1.2';
        container.style.padding = '20px';
        container.style.maxWidth = '400px';
        container.style.margin = '0 auto';
        
        // Add receipt content
        const lines = receiptData.split('\n');
        lines.forEach(line => {
            if (line.trim()) {
                const lineElement = this.createTextElement(line);
                container.appendChild(lineElement);
            } else {
                container.appendChild(this.createSpacer());
            }
        });
        
        return container;
    }

    createTextElement(text) {
        const element = document.createElement('div');
        element.textContent = text;
        element.style.margin = '2px 0';
        return element;
    }

    createDivider() {
        const element = document.createElement('div');
        element.textContent = '----------------------------------------';
        element.style.margin = '5px 0';
        element.style.textAlign = 'center';
        return element;
    }

    createSpacer() {
        const element = document.createElement('div');
        element.style.height = '10px';
        return element;
    }

    createTableRow(columns) {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.margin = '2px 0';
        
        columns.forEach(column => {
            const cell = document.createElement('span');
            cell.textContent = column.text;
            cell.style.flex = column.width || 1;
            cell.style.textAlign = column.align || 'left';
            row.appendChild(cell);
        });
        
        return row;
    }

    async printReceipt(orderData) {
        try {
            const receiptData = this.formatReceiptData(orderData);
            
            if (this.isNative && this.pluginAvailable) {
                return await this.printReceiptNative(receiptData);
            } else {
                return await this.printReceiptWeb(receiptData);
            }
        } catch (error) {
            console.error('Printing failed:', error);
            throw error;
        }
    }

    async isThermalPrinterAvailable() {
        if (this.isNative && this.pluginAvailable) {
            try {
                const result = await window.ThermalPrinter.isAvailable();
                return result.available;
            } catch (error) {
                console.warn('Could not check printer availability:', error);
                return false;
            }
        }
        return false;
    }

    async getPrinterStatus() {
        if (this.isNative && this.pluginAvailable) {
            try {
                return await window.ThermalPrinter.getStatus();
            } catch (error) {
                console.warn('Could not get printer status:', error);
                return { connected: false, error: error.message };
            }
        }
        return { connected: false, platform: 'web' };
    }
}

export default new ThermalPrinterService();

