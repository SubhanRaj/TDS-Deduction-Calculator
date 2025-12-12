# TDS & GST Deduction Calculator

A professional web-based tool to calculate TDS (Tax Deducted at Source) and GST (Goods and Services Tax) deductions from payments. Perfect for freelancers, contractors, and businesses who need to track deductions from government or private companies.

## ✨ Key Features

### 💰 **Smart Calculation**
- Automatic TDS/GST calculation based on amount (2.24% for ≤₹25K, 4.24% for >₹25K)
- Flexible deduction percentage selector with custom rates (2.24%, 2.40%, 2.43%, 4.24%, or custom)
- Bidirectional calculation (enter billed or received amount)
- Real-time updates across all bills

### 📊 **Summary Dashboard**
- Total bill count and date range
- Average deduction percentage
- Highest bill amount tracking
- Auto-hides when no data

### 📝 **Bill Management**
- Add multiple bills with invoice numbers and dates
- Auto-fill today's date for new bills
- Individual row actions (delete, clear, copy)
- Bulk operations with import/export
- Confirmation dialogs to prevent accidental deletions

### 💾 **Data Persistence & Import/Export**
- Auto-save to browser localStorage (works offline)
- Export to Excel with timestamped filenames
- Export to PDF with company header and totals
- Import existing bills from Excel
- Professional print layout

### 🎨 **User Experience**
- Beautiful toast notifications for all actions (with offline fallback)
- Modern confirmation dialogs with SweetAlert2
- Cross-platform keyboard shortcuts (Ctrl/Cmd)
- Copy totals or individual bills to clipboard
- Company name and PAN number fields
- Mobile-optimized responsive design
- ARIA labels and accessibility features

### ⌨️ **Keyboard Shortcuts**
- **Ctrl/Cmd + N** - Add new bill
- **Ctrl/Cmd + E** - Export to Excel
- **Ctrl/Cmd + S** - Save data locally
- **Enter** - Calculate (when in amount fields)

### 📱 **Mobile Optimized**
- Larger touch targets (44px minimum)
- Responsive table layout
- Smooth touch scrolling
- Highlight active rows

## 🛠️ Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Framework**: Bootstrap 5.3
- **Icons**: Font Awesome 5.15
- **Libraries**: 
  - XLSX.js (Excel export/import)
  - jsPDF + autoTable (PDF generation)
  - Toastr (toast notifications)
  - SweetAlert2 (beautiful confirmation dialogs)
  - jQuery 3.6 (for Toastr support)
- **Storage**: LocalStorage API (offline capability)

## 🚀 How to Use

### Basic Calculation
1. **Enter Company/Your Name** (optional) - Appears in exports and prints
2. **Enter PAN Number** (optional) - Included in PDF reports
3. **Select Deduction Percentage** - Choose from preset rates or enter custom
4. **Enter Amount** - Input either billed or received amount
5. **Click Calculate** - Or press Enter to compute

### Managing Bills
1. **Add Bill** - Click "+ Add Bill" or press Ctrl/Cmd+N
2. **Enter Details** - Bill number, date (auto-filled), and amount
3. **Auto-Calculate** - Deductions calculate automatically
4. **Track Summary** - View dashboard statistics
5. **Export/Print** - Save your data in multiple formats

### Import Existing Data
1. **Prepare Excel File** - Columns: "Bill Number", "Date", "Bill Amount (₹)", "Amount Received (₹)"
2. **Click Import Excel** button
3. **Select File** - Bills are automatically imported and calculated

### Export Options
- **Excel**: Timestamped filename with all bill data
- **PDF**: Professional report with company header and totals
- **Print**: Clean layout without buttons
- **Copy**: Quick copy of totals or individual bills

## 💻 Local Development

To run this project locally, follow these steps:

1. Clone the repository:
   ```sh
   git clone https://github.com/SubhanRaj/TDS-Deduction-Calculator
   ```
2. Open the project folder:
   ```sh
   cd TDS-Deduction-Calculator
   ```
3. Open `index.html` in your browser - No build process required!

### Offline Capability
Works 100% offline once loaded. All CDN resources have graceful fallbacks.

## 🎯 Use Cases

- **Freelancers**: Track TDS deductions from client payments
- **Contractors**: Manage government contract deductions
- **Small Businesses**: Calculate GST and TDS for multiple invoices
- **Accountants**: Quick deduction calculations for clients
- **Invoice Management**: Keep records with export capabilities

## 🌐 Browser Compatibility

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## 📝 License
This project is licensed under the MIT License. See the [LICENSE](license) file for more information.
