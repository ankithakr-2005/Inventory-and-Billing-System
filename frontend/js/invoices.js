// js/invoices.js

// API_BASE_URL is now defined globally by js/auth.js and should NOT be declared here. 
// The line "const API_BASE_URL = '...';" must be DELETED from this file.

// --- DOMContentLoaded Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Setup All Event Listeners
    const itemTableBody = document.getElementById('itemTableBody');
    if (document.getElementById('addItemRowBtn')) document.getElementById('addItemRowBtn').addEventListener('click', addItemRow);
    if (itemTableBody) itemTableBody.addEventListener('click', handleItemAction);
    if (itemTableBody) itemTableBody.addEventListener('input', updateTotals);
    if (document.getElementById('cgstPercent')) document.getElementById('cgstPercent').addEventListener('input', updateTotals);
    if (document.getElementById('sgstPercent')) document.getElementById('sgstPercent').addEventListener('input', updateTotals);

    if (document.getElementById('saveInvoiceBtn')) document.getElementById('saveInvoiceBtn').addEventListener('click', saveInvoice);
    if (document.getElementById('downloadPdfBtn')) document.getElementById('downloadPdfBtn').addEventListener('click', downloadPdf);
    
    
    // 2. Conditional Load/New Invoice Setup
    const urlParams = new URLSearchParams(window.location.search);
    const invoiceId = urlParams.get('id');

    if (invoiceId) {
        loadExistingInvoice(invoiceId);
    } else {
        // New Invoice Setup (Default)
        const invoiceDateEl = document.getElementById('invoiceDate');
        if (invoiceDateEl) invoiceDateEl.valueAsDate = new Date();
        const invoiceNoEl = document.getElementById('invoiceNo');
        if (invoiceNoEl) invoiceNoEl.value = `INV-${Date.now().toString().slice(-6)}`; 

        // Ensure a single empty row exists
        document.querySelectorAll('.item-row').forEach(row => row.remove());
        addItemRow(); 
        
        updateTotals(); 
    }
});


// -----------------------------------------------------
// Core Functionality: Line Items and Totals
// -----------------------------------------------------

function addItemRow() {
    const tableBody = document.getElementById('itemTableBody');
    if (!tableBody) return;
    
    const newRow = document.createElement('tr');
    newRow.className = 'item-row';
    const count = document.querySelectorAll('.item-row').length; 

    // *** FINAL CORRECTION: Set Quantity and Rate inputs to step="1", value="0", min="0" ***
    newRow.innerHTML = `
        <td class="p-0 text-center">${count + 1}</td>
        <td class="p-0"><input type="text" class="form-control-plaintext small item-particulars" placeholder="Item Name (must match Inventory)" required></td>
        <td class="p-0"><input type="text" class="form-control-plaintext small item-hsn" value="6802"></td>
        <td class="p-0"><input type="number" step="1" class="form-control-plaintext small item-quantity text-end" value="0" min="0" required></td>
        <td class="p-0"><input type="number" step="1" class="form-control-plaintext small item-rate text-end" value="0" min="0" required></td>
        <td class="p-0 item-amount text-end fw-bold" colspan="2">0.00</td>
        <td class="p-0 text-center"><button type="button" class="btn btn-sm btn-danger remove-item-btn"><i class="bi bi-x-lg"></i></button></td>
    `;
    tableBody.appendChild(newRow);
    renumberRows();
}

function renumberRows() {
    document.querySelectorAll('.item-row').forEach((row, index) => {
        const slNoCell = row.querySelector('td:first-child');
        if (slNoCell) slNoCell.textContent = index + 1;
    });
}

function handleItemAction(e) {
    if (e.target.closest('.remove-item-btn')) {
        if (document.querySelectorAll('.item-row').length > 1) {
            e.target.closest('.item-row').remove();
            renumberRows();
            updateTotals();
        } else {
            alert("Cannot remove the last line item.");
        }
    }
}

function updateTotals() {
    let totalBeforeTax = 0;

    document.querySelectorAll('.item-row').forEach(row => {
        const quantity = parseFloat(row.querySelector('.item-quantity')?.value) || 0;
        const rate = parseFloat(row.querySelector('.item-rate')?.value) || 0;
        const amount = quantity * rate;
        
        const amountEl = row.querySelector('.item-amount');
        if (amountEl) amountEl.textContent = amount.toFixed(2);
        totalBeforeTax += amount;
    });
    
    const cgstRate = parseFloat(document.getElementById('cgstPercent')?.value) / 100 || 0;
    const sgstRate = parseFloat(document.getElementById('sgstPercent')?.value) / 100 || 0;

    const cgstAmount = totalBeforeTax * cgstRate;
    const sgstAmount = totalBeforeTax * sgstRate;
    const grandTotal = totalBeforeTax + cgstAmount + sgstAmount;

    // Update display fields
    document.getElementById('totalAmountBeforeTax').textContent = `₹ ${totalBeforeTax.toFixed(2)}`;
    document.getElementById('cgstAmount').textContent = `₹ ${cgstAmount.toFixed(2)}`;
    document.getElementById('sgstAmount').textContent = `₹ ${sgstAmount.toFixed(2)}`;
    document.getElementById('grandTotal').textContent = `₹ ${grandTotal.toFixed(2)}`;
    
    const grandTotalFixed = grandTotal.toFixed(2);
    document.getElementById('amountInWords').textContent = `Amount in Words: ${numberToWords(grandTotalFixed)} Rupees Only`;
}

function numberToWords(n) {
    if (parseFloat(n) === 0) return 'Zero';
    return parseFloat(n).toLocaleString('en-IN', { style: 'currency', currency: 'INR' }).replace('₹', '') + ' (Simulated)'; 
}

// -----------------------------------------------------
// API Interaction: Load/Save
// -----------------------------------------------------

async function loadExistingInvoice(invoiceId) {
    console.log(`Attempting to load Invoice ID: ${invoiceId}`);

    try {
        const response = await fetch(`${API_BASE_URL}/invoices/${invoiceId}`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ msg: 'Unknown API Error' }));
            alert(`Error loading invoice data (${response.status}): ${errorData.msg || 'Invoice not found or API failed.'}`);
            return;
        }

        const invoice = await response.json();
        console.log("Invoice data fetched successfully:", invoice);
        
        // Helper to safely set value of an element if it exists
        const safeSet = (id, value) => {
            const el = document.getElementById(id);
            if (el) {
                if (el.tagName === 'TEXTAREA') { el.value = value || ''; } 
                else if (el.type === 'date' && value) { el.value = String(value).split('T')[0]; }
                else { el.value = value || ''; }
            } else {
                console.warn(`Element with ID '${id}' not found.`);
            }
        };

        // --- Populate Main Fields ---
        safeSet('invoiceNo', invoice.invoiceNo);
        safeSet('invoiceDate', invoice.invoiceDate);
        safeSet('reserveChange', invoice.reserveChange);
        safeSet('buyerName', invoice.buyerName);
        safeSet('buyerAddress', invoice.buyerAddress);
        safeSet('buyerState', invoice.buyerState);
        safeSet('buyerStateCode', invoice.buyerStateCode);
        safeSet('buyerGST', invoice.buyerGST);
        safeSet('ewayBill', invoice.ewayBill);
        safeSet('transportMode', invoice.transportMode);
        safeSet('vehicleNo', invoice.vehicleNo);
        safeSet('dateOfSupply', invoice.dateOfSupply);
        safeSet('placeOfSupply', invoice.placeOfSupply);
        safeSet('consigneeName', invoice.consigneeName);
        safeSet('consigneeAddress', invoice.consigneeAddress);
        safeSet('consigneeGSTIN', invoice.consigneeGSTIN);
        safeSet('consigneeState', invoice.consigneeState);
        safeSet('consigneeStateCode', invoice.consigneeStateCode);
        safeSet('cgstPercent', invoice.cgstPercent);
        safeSet('sgstPercent', invoice.sgstPercent);


        // --- Populate Line Items ---
        const tableBody = document.getElementById('itemTableBody');
        if (tableBody) tableBody.innerHTML = ''; // Clear ALL rows

        invoice.items.forEach((item) => {
            addItemRow(); 
            const rows = document.querySelectorAll('.item-row');
            const row = rows[rows.length - 1]; 

            if (row) {
                row.querySelector('.item-particulars').value = item.particulars;
                row.querySelector('.item-hsn').value = item.hsn;
                row.querySelector('.item-quantity').value = item.quantity;
                row.querySelector('.item-rate').value = item.rate;
            }
        });
        
        // Final calculation and button update
        updateTotals(); 
        const saveBtn = document.getElementById('saveInvoiceBtn');
        if(saveBtn) saveBtn.textContent = 'Update & Re-Generate';

    } catch (error) {
        console.error("Critical Error during invoice loading:", error);
        alert("Failed to load invoice details. Please check your browser's developer console for network errors.");
    }
}


async function saveInvoice() {
    updateTotals(); 
    
    // Determine if we are updating an existing invoice (check URL for ID)
    const urlParams = new URLSearchParams(window.location.search);
    const invoiceId = urlParams.get('id');
    const method = invoiceId ? 'PUT' : 'POST';
    const endpoint = invoiceId ? `${API_BASE_URL}/invoices/${invoiceId}` : `${API_BASE_URL}/invoices`;

    const invoiceItems = [];
    document.querySelectorAll('.item-row').forEach(row => {
        const quantity = parseFloat(row.querySelector('.item-quantity')?.value);
        const rate = parseFloat(row.querySelector('.item-rate')?.value);
        
        invoiceItems.push({
            particulars: row.querySelector('.item-particulars')?.value,
            hsn: row.querySelector('.item-hsn')?.value,
            quantity: quantity,
            rate: rate,
            amount: (quantity * rate).toFixed(2)
        });
    });

    const parseCurrency = (id) => parseFloat(document.getElementById(id)?.textContent.replace(/[^0-9.-]+/g, "") || 0);

    const invoiceData = {
        ...(invoiceId && { _id: invoiceId }), 
        
        invoiceNo: document.getElementById('invoiceNo')?.value, 
        invoiceDate: document.getElementById('invoiceDate')?.value,
        reserveChange: document.getElementById('reserveChange')?.value,
        
        // Buyer Details
        buyerName: document.getElementById('buyerName')?.value,
        buyerAddress: document.getElementById('buyerAddress')?.value,
        buyerState: document.getElementById('buyerState')?.value,
        buyerStateCode: document.getElementById('buyerStateCode')?.value,
        buyerGST: document.getElementById('buyerGST')?.value,
        ewayBill: document.getElementById('ewayBill')?.value,

        // Shipping/Consignee Details
        transportMode: document.getElementById('transportMode')?.value,
        vehicleNo: document.getElementById('vehicleNo')?.value,
        dateOfSupply: document.getElementById('dateOfSupply')?.value,
        placeOfSupply: document.getElementById('placeOfSupply')?.value,
        consigneeName: document.getElementById('consigneeName')?.value,
        consigneeAddress: document.getElementById('consigneeAddress')?.value,
        consigneeState: document.getElementById('consigneeState')?.value,
        consigneeStateCode: document.getElementById('consigneeStateCode')?.value,
        consigneeGSTIN: document.getElementById('consigneeGSTIN')?.value,

        items: invoiceItems.filter(item => item.quantity > 0),
        
        // Totals
        totalBeforeTax: parseCurrency('totalAmountBeforeTax'),
        cgstPercent: parseFloat(document.getElementById('cgstPercent')?.value) || 0,
        sgstPercent: parseFloat(document.getElementById('sgstPercent')?.value) || 0,
        cgstAmount: parseCurrency('cgstAmount'),
        sgstAmount: parseCurrency('sgstAmount'),
        grandTotal: parseCurrency('grandTotal'),
        amountInWords: document.getElementById('amountInWords')?.textContent.replace('Amount in Words: ', ''),
    };
    
    if (!invoiceData.buyerName || invoiceData.items.length === 0 || invoiceData.grandTotal <= 0) {
        alert("Please ensure Customer Name is filled and at least one item with a valid quantity/rate is added.");
        return;
    }

    try {
        const response = await fetch(endpoint, {
            method: method,
            headers: getAuthHeaders(),
            body: JSON.stringify(invoiceData)
        });

        const data = await response.json();

        if (response.ok) {
            alert(`Invoice ${data.invoiceNo} ${invoiceId ? 'updated' : 'saved'} successfully! Stock changes applied.`);
            window.location.href = `view-invoices.html`;
        } else {
            alert(`Error saving invoice: ${data.msg || data.message || 'Check Server Logs'}`);
        }

    } catch (error) {
        console.error("Save Invoice Error:", error);
        alert('Failed to connect to the server or save the invoice.');
    }
}

// --- PDF Generation Logic (Optimized for Clean Print View) ---

function downloadPdf() {
    if (typeof html2canvas === 'undefined' || typeof window.jspdf === 'undefined') {
        alert("PDF generation libraries are not loaded. Check your HTML imports.");
        return;
    }

    // 1. Identify ALL layout elements to HIDE and the main target
    const sidebar = document.getElementById('sidebar-wrapper');
    const navbar = document.querySelector('nav.navbar');
    const buttons = document.querySelector('.text-center.mt-3.p-3.bg-light');
    const wrapper = document.getElementById('wrapper');
    const pageContentWrapper = document.getElementById('page-content-wrapper');

    const input = document.querySelector('.card.border.border-dark.shadow-sm');
    if (!input) return;

    // 2. --- Temporary Hide/Adjust Layout for Clean Capture (Isolation) ---
    
    // Hide peripheral UI elements
    if (sidebar) sidebar.style.display = 'none';
    if (navbar) navbar.style.display = 'none';
    if (buttons) buttons.style.display = 'none';
    
    // Force main content area to full width and remove padding/margins
    if (pageContentWrapper) {
        pageContentWrapper.style.padding = '0';
        pageContentWrapper.style.margin = '0';
        pageContentWrapper.style.width = '100vw'; 
        pageContentWrapper.style.minHeight = '100vh'; 
    }
    if (wrapper) wrapper.style.padding = '0'; 


    // 3. Capture the Invoice Card
    html2canvas(input, { scale: 2 }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new window.jspdf.jsPDF('p', 'mm', 'a4');
        const imgWidth = 210;
        const imgHeight = canvas.height * imgWidth / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        // Add image to PDF, handling page breaks
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= 295;

        while (heightLeft >= -50) { 
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= 295;
        }

        const invoiceNo = document.getElementById('invoiceNo')?.value || 'New';
        pdf.save(`Invoice-${invoiceNo}.pdf`);
        
        // 4. --- Restore ALL Hidden Elements and Original Styles ---
        // Restore peripheral UI elements
        if (sidebar) sidebar.style.display = 'block';
        if (navbar) navbar.style.display = 'flex';
        if (buttons) buttons.style.display = 'flex';
        
        // Restore layout properties
        if (pageContentWrapper) {
            pageContentWrapper.style.padding = '4px'; 
            pageContentWrapper.style.margin = '';
            pageContentWrapper.style.width = ''; 
            pageContentWrapper.style.minHeight = '';
        }
        if (wrapper) wrapper.style.padding = '';
    });
}