document.addEventListener("DOMContentLoaded", function () {
  loadFromLocalStorage();
});

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

  saveToLocalStorage();
}
function addRow() {
  let table = document
    .getElementById("billTable")
    .getElementsByTagName("tbody")[0];
  let newRow = table.insertRow();
  newRow.innerHTML = `
    <td data-label="Bill Number"><input type="text" class="form-control"></td>
    <td data-label="Date"><input type="date" class="form-control"></td>
    <td data-label="Bill Amount (₹)"><input type="number" class="form-control billAmount" onblur="updateRow(this)"></td>
    <td data-label="Deduction (₹)" class="deduction">0.00</td>
    <td data-label="Deduction Percentage & Type" class="deductionPercentage">0.00%</td>
    <td data-label="Amount Received (₹)"><input type="number" class="form-control receivedAmount" onblur="updateRow(this)"></td>
    <td data-label="Action">
      <div class="d-flex gap-2">
        <button class="btn btn-danger btn-sm" onclick="deleteRow(this)">Delete</button>
        <button class="btn btn-secondary btn-sm" onclick="clearRow(this)">Clear</button>
      </div>
    </td>
  `;
  calculateTotals();
  saveToLocalStorage();
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
  let row = button.closest("tr");
  row.parentNode.removeChild(row);
  calculateTotals();
  saveToLocalStorage();
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
}
function saveToLocalStorage() {
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
  };

  localStorage.setItem("tableData", JSON.stringify(tableData));
  localStorage.setItem("totals", JSON.stringify(totals));
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
  
  // Show custom input if custom was selected
  if (totals.deductionPercentageSelect === "custom") {
    document.getElementById("customPercentage").style.display = "block";
  }
}
function exportToExcel() {
  let table = document.getElementById("billTable");
  if (!table) {
    alert("Table not found!");
    return;
  }
  let wb = XLSX.utils.table_to_book(table, { sheet: "Sheet1" });
  XLSX.writeFile(wb, "TDS & GST Deduction.xlsx");
}

function exportToPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.text("Bill Management Data", 10, 10);

  // Use autoTable plugin
  doc.autoTable({
    html: "#billTable",
    startY: 20,
    theme: "grid",
  });

  doc.save("TDS & GST Deduction.pdf");
}
