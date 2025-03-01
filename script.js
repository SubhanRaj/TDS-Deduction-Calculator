document.addEventListener("DOMContentLoaded", function () {
  loadFromLocalStorage();
});
function manualCalculation() {
  let billed = parseFloat(document.getElementById("manualBilled").value) || 0;
  let received =
    parseFloat(document.getElementById("manualReceived").value) || 0;
  let percentage = 0;
  let deductionDetails = "";

  if (billed) {
    percentage = billed > 25000 ? 4.24 : 2.24;
    deductionDetails = billed > 25000 ? "2% GST + 2.24% TDS" : "2.24% TDS";
    received = billed - (billed * percentage) / 100;
  } else if (received) {
    billed = received / (1 - 2.24 / 100);
    if (billed > 25000) {
      billed = received / (1 - 4.24 / 100);
      percentage = 4.24;
      deductionDetails = "2% GST + 2.24% TDS";
    } else {
      percentage = 2.24;
      deductionDetails = "2.24% TDS";
    }
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
    totalDeductionDetails =
      totalPercentage > 2.24 ? "2% GST + 2.24% TDS" : "2.24% TDS";
  } else {
    totalPercentage = 0;
    totalDeductionDetails = "2.24% TDS";
  }

  document.getElementById("totalBilled").innerText = totalBilled;
  document.getElementById("totalDeducted").innerText = totalDeducted.toFixed(2);
  document.getElementById("totalReceived").innerText = totalReceived;
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
  let deductionDetails =
    document
      .getElementById("manualDeductionPercentage")
      .innerText.split(" ")[1] || "";

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
}
function exportToExcel() {
  let table = document.getElementById("billTable");
  let wb = XLSX.utils.table_to_book(table, { sheet: "Sheet1" });
  XLSX.writeFile(wb, "Bill_Management.xlsx");
}

function exportToPDF() {
  const { jsPDF } = window.jspdf;
  let doc = new jsPDF();
  doc.text("Bill Management Data", 10, 10);

  // Use autoTable plugin
  doc.autoTable({
    html: "#billTable",
    startY: 20,
    theme: "grid",
  });

  doc.save("Bill_Management.pdf");
}
