document.addEventListener("DOMContentLoaded", function () {
  // Configure Toastr
  if (typeof toastr !== "undefined") {
    toastr.options = {
      closeButton: true,
      progressBar: true,
      positionClass: "toast-top-right",
      timeOut: 3000,
      extendedTimeOut: 1000,
      showEasing: "swing",
      hideEasing: "linear",
      showMethod: "fadeIn",
      hideMethod: "fadeOut",
    };
  }
  
  loadFromLocalStorage();
  setupKeyboardShortcuts();
  setupCompanyInfoListeners();
  
  // Show auto-save notification on load
  setTimeout(() => {
    showToast("💾 Your data is saved automatically to this browser", "info");
  }, 1000);
});

// Toast notification helper (works offline if CDN fails)
function showToast(message, type = "success") {
  if (typeof toastr !== "undefined") {
    switch (type) {
      case "success":
        toastr.success(message);
        break;
      case "error":
        toastr.error(message);
        break;
      case "info":
        toastr.info(message);
        break;
      case "warning":
        toastr.warning(message);
        break;
      default:
        toastr.success(message);
    }
  } else {
    // Fallback for offline mode
    console.log(`${type.toUpperCase()}: ${message}`);
  }
}

// Keyboard shortcuts (cross-platform Ctrl/Cmd)
function setupKeyboardShortcuts() {
  document.addEventListener("keydown", function (e) {
    const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
    const modKey = isMac ? e.metaKey : e.ctrlKey;

    // Prevent default browser shortcuts
    if (modKey) {
      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        addRow();
      } else if (e.key === "e" || e.key === "E") {
        e.preventDefault();
        exportToExcel();
      } else if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        saveToLocalStorage(true);
      }
    }

    // Enter key to calculate
    if (e.key === "Enter" && (e.target.id === "manualBilled" || e.target.id === "manualReceived")) {
      e.preventDefault();
      manualCalculation();
    }
  });
}

// Company info listeners
function setupCompanyInfoListeners() {
  document.getElementById("companyName").addEventListener("change", function() {
    saveToLocalStorage(true);
  });
  document.getElementById("panNumber").addEventListener("change", function() {
    saveToLocalStorage(true);
  });
}

function handlePercentageChange() {
  const select = document.getElementById("deductionPercentageSelect");
  const customInput = document.getElementById("customPercentage");
  
  if (select.value === "custom") {
    customInput.style.display = "block";
    customInput.focus();
  } else {
    customInput.style.display = "none";
    customInput.value = "";
  }
  
  // Recalculate if there are values
  if (document.getElementById("manualBilled").value || document.getElementById("manualReceived").value) {
    manualCalculation();
  }
}

function applyCustomPercentage() {
  const customValue = parseFloat(document.getElementById("customPercentage").value);
  if (customValue && customValue > 0) {
    manualCalculation();
  }
}

function getSelectedPercentage(billedAmount) {
  const select = document.getElementById("deductionPercentageSelect");
  const customInput = document.getElementById("customPercentage");
  
  if (select.value === "auto") {
    // Use default logic
    return billedAmount > 25000 ? 4.24 : 2.24;
  } else if (select.value === "custom") {
    // Use custom percentage
    const customValue = parseFloat(customInput.value);
    return customValue && customValue > 0 ? customValue : (billedAmount > 25000 ? 4.24 : 2.24);
  } else {
    // Use selected percentage
    return parseFloat(select.value);
  }
}

function getDeductionDetails(percentage) {
  // Round to 2 decimal places for comparison to handle floating point precision
  const rounded = Math.round(percentage * 100) / 100;
  
  if (Math.abs(rounded - 4.24) < 0.01) {
    return "2% GST + 2.24% TDS";
  } else if (Math.abs(rounded - 2.24) < 0.01) {
    return "2.24% TDS";
  } else if (Math.abs(rounded - 2.40) < 0.01) {
    return "2.40% TDS";
  } else if (Math.abs(rounded - 2.43) < 0.01) {
    return "2.43% TDS";
  } else {
    return rounded.toFixed(2) + "% Deduction";
  }
}

function manualCalculation() {
  let billed = parseFloat(document.getElementById("manualBilled").value) || 0;
  let received =
    parseFloat(document.getElementById("manualReceived").value) || 0;
  let percentage = 0;
  let deductionDetails = "";

  // Input validation
  if (billed < 0 || received < 0) {
    showToast("Amount cannot be negative!", "error");
    return;
  }

  if (billed) {
    percentage = getSelectedPercentage(billed);
    deductionDetails = getDeductionDetails(percentage);
    received = billed - (billed * percentage) / 100;
  } else if (received) {
    // For received amount, we need to calculate backwards
    // First get the percentage based on a rough estimate
    let estimatedBilled = received / (1 - 2.24 / 100);
    percentage = getSelectedPercentage(estimatedBilled);
    
    // Recalculate billed amount with correct percentage
    billed = received / (1 - percentage / 100);
    deductionDetails = getDeductionDetails(percentage);
  }

  document.getElementById("manualBilled").value = billed.toFixed(2);
  document.getElementById("manualReceived").value = received.toFixed(2);
  document.getElementById("manualDeduction").innerText = (
    billed - received
  ).toFixed(2);
  document.getElementById("manualDeductionPercentage").innerText =
    percentage.toFixed(2) + "% " + deductionDetails;

  // Update the table rows with the new percentage
  updateTableRows(percentage, deductionDetails);
  saveToLocalStorage();
}

function updateTableRows(percentage, deductionDetails) {
  document.querySelectorAll("#billTable tbody tr").forEach((row) => {
    let billAmount = parseFloat(row.querySelector(".billAmount").value) || 0;
    let receivedAmount = billAmount - (billAmount * percentage) / 100;
    let deductionAmount = billAmount - receivedAmount;

    row.querySelector(".deduction").innerText = deductionAmount.toFixed(2);
    row.querySelector(".deductionPercentage").innerText =
      percentage.toFixed(2) + "% " + deductionDetails;
    row.querySelector(".receivedAmount").value = receivedAmount.toFixed(2);
  });

  // Recalculate totals
  calculateTotals();
  saveToLocalStorage();
}

function calculateTotals() {
  let totalBilled = 0;
  let totalDeducted = 0;
  let totalReceived = 0;
  let totalPercentage = 0;
  let totalDeductionDetails = "";

  document.querySelectorAll("#billTable tbody tr").forEach((row) => {
    let billAmount = parseFloat(row.querySelector(".billAmount").value) || 0;
    let receivedAmount =
      parseFloat(row.querySelector(".receivedAmount").value) || 0;
    let deductionAmount = billAmount - receivedAmount;

    totalBilled += billAmount;
    totalDeducted += deductionAmount;
    totalReceived += receivedAmount;
  });

  if (totalBilled > 0) {
    totalPercentage = (totalDeducted / totalBilled) * 100;
    totalDeductionDetails = getDeductionDetails(totalPercentage);
  } else {
    totalPercentage = 0;
    totalDeductionDetails = "2.24% TDS";
  }

  document.getElementById("totalBilled").innerText = totalBilled.toFixed(2);
  document.getElementById("totalDeducted").innerText = totalDeducted.toFixed(2);
  document.getElementById("totalReceived").innerText = totalReceived.toFixed(2);
  document.getElementById("totalDeductionPercentage").innerText =
    totalPercentage.toFixed(2) + "% " + totalDeductionDetails;

  updateDashboard();
  saveToLocalStorage();
}
function addRow() {
  let table = document
    .getElementById("billTable")
    .getElementsByTagName("tbody")[0];
  let newRow = table.insertRow();
  
  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  
  newRow.innerHTML = `
    <td data-label="Bill Number"><input type="text" class="form-control" aria-label="Bill Number"></td>
    <td data-label="Date"><input type="date" class="form-control" value="${today}" aria-label="Date"></td>
    <td data-label="Bill Amount (₹)"><input type="number" class="form-control billAmount" min="0" step="0.01" onblur="updateRow(this)" aria-label="Bill Amount"></td>
    <td data-label="Deduction (₹)" class="deduction">0.00</td>
    <td data-label="Deduction Percentage & Type" class="deductionPercentage">0.00%</td>
    <td data-label="Amount Received (₹)"><input type="number" class="form-control receivedAmount" min="0" step="0.01" onblur="updateRow(this)" aria-label="Amount Received"></td>
    <td data-label="Action">
      <div class="d-flex gap-2">
        <button class="btn btn-danger btn-sm" onclick="deleteRow(this)" aria-label="Delete row"><i class="fas fa-trash"></i></button>
        <button class="btn btn-secondary btn-sm" onclick="clearRow(this)" aria-label="Clear row"><i class="fas fa-eraser"></i></button>
        <button class="btn btn-info btn-sm" onclick="copyRow(this)" aria-label="Copy row"><i class="fas fa-copy"></i></button>
      </div>
    </td>
  `;
  calculateTotals();
  saveToLocalStorage();
  showToast("✅ New bill added", "info");
  
  // Focus on the bill number input
  newRow.querySelector("input").focus();
}

function updateRow(input) {
  let row = input.parentNode.parentNode;
  let billAmount = parseFloat(row.querySelector(".billAmount").value) || 0;
  let receivedAmount =
    parseFloat(row.querySelector(".receivedAmount").value) || 0;
  let percentage =
    parseFloat(
      document.getElementById("manualDeductionPercentage").innerText
    ) || 0;
  let deductionDetails = getDeductionDetails(percentage);

  if (billAmount) {
    receivedAmount = billAmount - (billAmount * percentage) / 100;
  } else if (receivedAmount) {
    billAmount = receivedAmount / (1 - percentage / 100);
  }

  let deductionAmount = billAmount - receivedAmount;
  row.querySelector(".deduction").innerText = deductionAmount.toFixed(2);
  row.querySelector(".deductionPercentage").innerText =
    percentage.toFixed(2) + "% " + deductionDetails;

  // Update the input fields with calculated values
  row.querySelector(".billAmount").value = billAmount.toFixed(2);
  row.querySelector(".receivedAmount").value = receivedAmount.toFixed(2);

  // Calculate totals
  calculateTotals();
  saveToLocalStorage();
}

function deleteRow(button) {
  // Confirm before deleting with SweetAlert2
  Swal.fire({
    title: 'Delete this bill?',
    text: "This action cannot be undone!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc3545',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Yes, delete it!',
    cancelButtonText: 'Cancel'
  }).then((result) => {
    if (result.isConfirmed) {
      let row = button.closest("tr");
      row.parentNode.removeChild(row);
      calculateTotals();
      saveToLocalStorage();
      showToast("🗑️ Bill deleted", "info");
    }
  });
}
function clearRow(button) {
  let row = button.closest("tr");
  row.querySelector(".billAmount").value = "";
  row.querySelector(".receivedAmount").value = "";
  row.querySelector(".deduction").innerText = "0.00";
  row.querySelector(".deductionPercentage").innerText = "0.00%";
  calculateTotals();
  saveToLocalStorage();
}
function clearFields() {
  Swal.fire({
    title: 'Clear all data?',
    text: "This will delete all bills and reset everything. This action cannot be undone!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc3545',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Yes, clear everything!',
    cancelButtonText: 'Cancel'
  }).then((result) => {
    if (result.isConfirmed) {
      document.getElementById("manualBilled").value = "";
      document.getElementById("manualReceived").value = "";
      document.getElementById("manualDeduction").innerText = "0.00";
      document.getElementById("manualDeductionPercentage").innerText = "0.00%";
      document.getElementById("deductionPercentageSelect").value = "auto";
      document.getElementById("customPercentage").value = "";
      document.getElementById("customPercentage").style.display = "none";
      document.querySelector("#billTable tbody").innerHTML = "";
      localStorage.removeItem("tableData");
      localStorage.removeItem("totals");
      calculateTotals();
      showToast("🧹 All data cleared", "info");
    }
  });
}
function saveToLocalStorage(showNotification = false) {
  const tableData = [];
  document.querySelectorAll("#billTable tbody tr").forEach((row) => {
    const rowData = {
      billNumber: row.querySelector("td:nth-child(1) input").value,
      date: row.querySelector("td:nth-child(2) input").value,
      billAmount: row.querySelector("td:nth-child(3) input").value,
      deduction: row.querySelector("td:nth-child(4)").innerText,
      deductionPercentage: row.querySelector("td:nth-child(5)").innerText,
      amountReceived: row.querySelector("td:nth-child(6) input").value,
    };
    tableData.push(rowData);
  });

  const totals = {
    totalBilled: document.getElementById("totalBilled").innerText,
    totalDeducted: document.getElementById("totalDeducted").innerText,
    totalReceived: document.getElementById("totalReceived").innerText,
    totalDeductionPercentage: document.getElementById(
      "totalDeductionPercentage"
    ).innerText,
    manualBilled: document.getElementById("manualBilled").value,
    manualReceived: document.getElementById("manualReceived").value,
    manualDeduction: document.getElementById("manualDeduction").innerText,
    manualDeductionPercentage: document.getElementById(
      "manualDeductionPercentage"
    ).innerText,
    deductionPercentageSelect: document.getElementById("deductionPercentageSelect").value,
    customPercentage: document.getElementById("customPercentage").value,
    companyName: document.getElementById("companyName").value,
    panNumber: document.getElementById("panNumber").value,
  };

  localStorage.setItem("tableData", JSON.stringify(tableData));
  localStorage.setItem("totals", JSON.stringify(totals));
  
  if (showNotification) {
    showToast("💾 Data saved locally", "success");
  }
}

function loadFromLocalStorage() {
  const tableData = JSON.parse(localStorage.getItem("tableData")) || [];
  const totals = JSON.parse(localStorage.getItem("totals")) || {
    totalBilled: "0.00",
    totalDeducted: "0.00",
    totalReceived: "0.00",
    totalDeductionPercentage: "0.00%",
    manualBilled: "",
    manualReceived: "",
    manualDeduction: "0.00",
    manualDeductionPercentage: "0.00%",
    deductionPercentageSelect: "auto",
    customPercentage: "",
    companyName: "",
    panNumber: "",
  };

  const tableBody = document.querySelector("#billTable tbody");
  tableBody.innerHTML = "";

  tableData.forEach((rowData) => {
    const newRow = tableBody.insertRow();
    newRow.innerHTML = `
                <td data-label="Bill Number"><input type="text" class="form-control" value="${rowData.billNumber}"></td>
                <td data-label="Date"><input type="date" class="form-control" value="${rowData.date}"></td>
                <td data-label="Bill Amount (₹)"><input type="number" class="form-control billAmount" value="${rowData.billAmount}" onblur="updateRow(this)"></td>
                <td data-label="Deduction (₹)" class="deduction">${rowData.deduction}</td>
                <td data-label="Deduction Percentage & Type" class="deductionPercentage">${rowData.deductionPercentage}</td>
                <td data-label="Amount Received (₹)"><input type="number" class="form-control receivedAmount" value="${rowData.amountReceived}" onblur="updateRow(this)"></td>
                <td data-label="Action">
                    <div class="d-flex gap-2">
                        <button class="btn btn-danger btn-sm" onclick="deleteRow(this)">Delete</button>
                        <button class="btn btn-secondary btn-sm" onclick="clearRow(this)">Clear</button>
                    </div>
                </td>
            `;
  });

  document.getElementById("totalBilled").innerText = totals.totalBilled;
  document.getElementById("totalDeducted").innerText = totals.totalDeducted;
  document.getElementById("totalReceived").innerText = totals.totalReceived;
  document.getElementById("totalDeductionPercentage").innerText =
    totals.totalDeductionPercentage;
  document.getElementById("manualBilled").value = totals.manualBilled;
  document.getElementById("manualReceived").value = totals.manualReceived;
  document.getElementById("manualDeduction").innerText = totals.manualDeduction;
  document.getElementById("manualDeductionPercentage").innerText =
    totals.manualDeductionPercentage;
  document.getElementById("deductionPercentageSelect").value = totals.deductionPercentageSelect || "auto";
  document.getElementById("customPercentage").value = totals.customPercentage || "";
  document.getElementById("companyName").value = totals.companyName || "";
  document.getElementById("panNumber").value = totals.panNumber || "";
  
  // Show custom input if custom was selected
  if (totals.deductionPercentageSelect === "custom") {
    document.getElementById("customPercentage").style.display = "block";
  }
  
  // Update company name for print
  if (totals.companyName) {
    document.querySelector(".container").setAttribute("data-company-name", totals.companyName);
  }
  
  updateDashboard();
}
function exportToExcel() {
  let table = document.getElementById("billTable");
  if (!table) {
    alert("Table not found!");
    return;
  }
  
  const companyName = document.getElementById("companyName").value || "TDS-GST";
  const date = new Date().toISOString().split('T')[0];
  const filename = `${companyName.replace(/\s+/g, '-')}_TDS-Deduction_${date}.xlsx`;
  
  let wb = XLSX.utils.table_to_book(table, { sheet: "Sheet1" });
  XLSX.writeFile(wb, filename);
  showToast("Exported to Excel successfully!", "success");
}

function exportToPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  const companyName = document.getElementById("companyName").value || "TDS & GST Deduction Calculator";
  const panNumber = document.getElementById("panNumber").value;
  const date = new Date().toLocaleDateString();
  
  // Add header
  doc.setFontSize(16);
  doc.text(companyName, 105, 15, { align: "center" });
  doc.setFontSize(10);
  doc.text(`Date: ${date}`, 105, 22, { align: "center" });
  if (panNumber) {
    doc.text(`PAN: ${panNumber}`, 105, 28, { align: "center" });
  }

  // Use autoTable plugin
  doc.autoTable({
    html: "#billTable",
    startY: panNumber ? 32 : 26,
    theme: "grid",
    headStyles: { fillColor: [76, 175, 80] },
  });
  
  // Add totals
  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  doc.text(`Total Billed: ₹${document.getElementById("totalBilled").innerText}`, 14, finalY);
  doc.text(`Total Deducted: ₹${document.getElementById("totalDeducted").innerText}`, 14, finalY + 7);
  doc.text(`Total Received: ₹${document.getElementById("totalReceived").innerText}`, 14, finalY + 14);

  const filename = `${companyName.replace(/\s+/g, '-')}_${date.replace(/\//g, '-')}.pdf`;
  doc.save(filename);
  showToast("Exported to PDF successfully!", "success");
}

// Dashboard update function
function updateDashboard() {
  const rows = document.querySelectorAll("#billTable tbody tr");
  const totalBills = rows.length;
  
  if (totalBills === 0) {
    document.getElementById("summaryDashboard").style.display = "none";
    return;
  }
  
  document.getElementById("summaryDashboard").style.display = "block";
  
  let billAmounts = [];
  let dates = [];
  let totalDeductionPercentage = 0;
  
  rows.forEach((row) => {
    const billAmount = parseFloat(row.querySelector(".billAmount").value) || 0;
    const date = row.querySelector("input[type='date']").value;
    
    if (billAmount > 0) billAmounts.push(billAmount);
    if (date) dates.push(new Date(date));
  });
  
  // Calculate stats
  const highestBill = billAmounts.length > 0 ? Math.max(...billAmounts) : 0;
  const avgDeduction = document.getElementById("totalDeductionPercentage").innerText.split('%')[0];
  
  // Date range
  let dateRange = "-";
  if (dates.length > 0) {
    dates.sort((a, b) => a - b);
    const firstDate = dates[0].toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    const lastDate = dates[dates.length - 1].toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    dateRange = firstDate === lastDate ? firstDate : `${firstDate} - ${lastDate}`;
  }
  
  // Update dashboard
  document.getElementById("dashTotalBills").innerText = totalBills;
  document.getElementById("dashAvgDeduction").innerText = avgDeduction + "%";
  document.getElementById("dashHighest").innerText = "₹" + highestBill.toFixed(2);
  document.getElementById("dashDateRange").innerText = dateRange;
}

// Copy to clipboard function
function copyToClipboard() {
  const totalBilled = document.getElementById("totalBilled").innerText;
  const totalDeducted = document.getElementById("totalDeducted").innerText;
  const totalReceived = document.getElementById("totalReceived").innerText;
  const deductionPercentage = document.getElementById("totalDeductionPercentage").innerText;
  
  const text = `TDS & GST Deduction Summary\n` +
    `Total Billed: ₹${totalBilled}\n` +
    `Total Deducted: ₹${totalDeducted}\n` +
    `Total Received: ₹${totalReceived}\n` +
    `Deduction: ${deductionPercentage}`;
  
  navigator.clipboard.writeText(text).then(() => {
    showToast("Totals copied to clipboard!", "success");
  }).catch(() => {
    showToast("Failed to copy. Please try again.", "error");
  });
}

// Copy individual row
function copyRow(button) {
  const row = button.closest("tr");
  const billNumber = row.querySelector("td:nth-child(1) input").value;
  const date = row.querySelector("td:nth-child(2) input").value;
  const billAmount = row.querySelector(".billAmount").value;
  const deduction = row.querySelector(".deduction").innerText;
  const received = row.querySelector(".receivedAmount").value;
  
  const text = `Bill: ${billNumber}\nDate: ${date}\nAmount: ₹${billAmount}\nDeduction: ₹${deduction}\nReceived: ₹${received}`;
  
  navigator.clipboard.writeText(text).then(() => {
    showToast("Bill details copied!", "success");
  }).catch(() => {
    showToast("Failed to copy.", "error");
  });
}

// Import from Excel
function importFromExcel() {
  document.getElementById("excelFileInput").click();
}

function handleExcelImport(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet);
      
      // Clear existing data
      document.querySelector("#billTable tbody").innerHTML = "";
      
      // Import each row
      jsonData.forEach((row) => {
        addRow();
        const newRow = document.querySelector("#billTable tbody tr:last-child");
        
        if (row['Bill Number']) newRow.querySelector("td:nth-child(1) input").value = row['Bill Number'];
        if (row['Date']) newRow.querySelector("td:nth-child(2) input").value = row['Date'];
        if (row['Bill Amount (₹)']) newRow.querySelector(".billAmount").value = row['Bill Amount (₹)'];
        if (row['Amount Received (₹)']) newRow.querySelector(".receivedAmount").value = row['Amount Received (₹)'];
        
        updateRow(newRow.querySelector(".billAmount"));
      });
      
      calculateTotals();
      showToast(`Imported ${jsonData.length} bills successfully!`, "success");
    } catch (error) {
      showToast("Failed to import Excel file. Please check the format.", "error");
      console.error(error);
    }
  };
  reader.readAsArrayBuffer(file);
  
  // Reset file input
  event.target.value = '';
}
