# 💰 Screenshot Money Tracker

A web application that analyzes screenshots to automatically track your expenses and income using OCR (Optical Character Recognition).

## Features

- **Drag & Drop Interface**: Easy-to-use interface for uploading multiple screenshots
- **Smart OCR Analysis**: Uses Tesseract.js to extract text from images
- **Automatic Detection**: Identifies amounts and transaction types (spent/received)
- **Summary Dashboard**: View totals for spent, received, and net balance
- **Transaction List**: See all detected transactions with details
- **Mobile Responsive**: Works on all devices

## How to Use

1. **Open the Application**: Simply open `index.html` in your web browser
2. **Upload Screenshots**: 
   - Click the upload area or drag and drop screenshot files
   - Supports multiple screenshots at once
   - Works with PNG, JPG, and other image formats
3. **Analyze**: Click the "Analyze Screenshots" button
4. **View Results**: See your total spent, received, and net balance

## What Screenshots Work Best?

The app works best with screenshots that contain:
- Clear, readable text
- Dollar amounts with $ symbol (e.g., $25.99)
- Transaction keywords like "paid", "received", "payment", "deposit"
- Payment confirmations, receipts, bank transfers, Venmo/PayPal screenshots

## Examples of Compatible Screenshots

- ✅ Payment app confirmations (Venmo, PayPal, Zelle)
- ✅ Bank transaction notifications
- ✅ Online shopping receipts
- ✅ Mobile banking app screenshots
- ✅ E-wallet transactions

## Technology Stack

- **HTML5**: Structure
- **CSS3**: Styling with gradients and animations
- **JavaScript (ES6+)**: Core functionality
- **Tesseract.js**: OCR engine for text extraction

## Browser Compatibility

Works on all modern browsers:
- Chrome/Edge (recommended)
- Firefox
- Safari

## Privacy

All processing happens locally in your browser. No screenshots are uploaded to any server.

## Tips for Best Results

1. Ensure screenshots have good contrast and are not blurry
2. Include the full transaction amount in the screenshot
3. Make sure text is horizontal (not rotated)
4. For better accuracy, crop screenshots to show only the transaction details

## Limitations

- OCR accuracy depends on image quality
- Currently optimized for English text and USD currency
- Large batches may take some time to process
- Works best with digital screenshots (not photos of screens)
