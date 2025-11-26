// js/view-invoices.js

// API_BASE_URL is defined in auth.js

let allInvoices = [];
const invoiceTableBody = document.getElementById('invoiceTableBody');

document.addEventListener('DOMContentLoaded', () => {
    fetchInvoices();
    if (document.getElementById('invoiceSearch')) document.getElementById('invoiceSearch').addEventListener('input', renderInvoices);
    if (document.getElementById('dateFilter')) document.getElementById('dateFilter').addEventListener('change', renderInvoices);
    
    const resetFilterBtn = document.getElementById('resetFilterBtn');
    if (resetFilterBtn) {
        resetFilterBtn.addEventListener('click', () => {
            document.getElementById('invoiceSearch').value = '';
            document.getElementById('dateFilter').value = '';
            renderInvoices();
        });
    }
    if (invoiceTableBody) invoiceTableBody.addEventListener('click', handleInvoiceAction);
});

async function fetchInvoices() {
    if (!invoiceTableBody) return;
    invoiceTableBody.innerHTML = `<tr><td colspan="6" class="text-center text-secondary py-4">Loading invoices...</td></tr>`;

    try {
        const response = await fetch(`${API_BASE_URL}/invoices`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (response.ok) {
            allInvoices = await response.json();
            renderInvoices();
        } else {
            const error = await response.json();
            invoiceTableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger py-4">Failed to load invoices: ${error.msg || error.message}</td></tr>`;
        }
    } catch (error) {
        invoiceTableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger py-4">Error loading data. Check server connection.</td></tr>`;
    }
}

function renderInvoices() {
    if (!invoiceTableBody) return;
    const searchText = document.getElementById('invoiceSearch')?.value.toLowerCase() || '';
    const dateFilter = document.getElementById('dateFilter')?.value;

    const filteredInvoices = allInvoices.filter(invoice => {
        const dateMatch = !dateFilter || new Date(invoice.invoiceDate).toISOString().split('T')[0] === dateFilter;
        const searchMatch = invoice.invoiceNo.toLowerCase().includes(searchText) ||
                            invoice.buyerName.toLowerCase().includes(searchText);
        return dateMatch && searchMatch;
    });

    if (filteredInvoices.length === 0) {
        invoiceTableBody.innerHTML = `<tr><td colspan="6" class="text-center text-secondary py-4">No matching invoices found.</td></tr>`;
        return;
    }

    invoiceTableBody.innerHTML = filteredInvoices.map((invoice, index) => {
        const date = new Date(invoice.invoiceDate).toLocaleDateString('en-IN');
        return `
            <tr data-id="${invoice._id}">
                <td>${index + 1}</td>
                <td>${invoice.invoiceNo}</td>
                <td>${date}</td>
                <td>${invoice.buyerName}</td>
                <td><span class="fw-bold">₹ ${invoice.grandTotal.toFixed(2)}</span></td>
                <td>
                    <button class="btn btn-sm btn-info me-2 view-btn"><i class="bi bi-eye"></i> View</button>
                    <button class="btn btn-sm btn-danger delete-btn"><i class="bi bi-trash"></i></button>
                </td>
            </tr>
        `;
    }).join('');
}

function handleInvoiceAction(e) {
    const row = e.target.closest('tr');
    if (!row) return;
    const invoiceId = row.getAttribute('data-id');

    if (e.target.closest('.view-btn')) {
        viewInvoice(invoiceId); // *** NOW CALLS REDIRECTION ***
    } else if (e.target.closest('.delete-btn')) {
        deleteInvoice(invoiceId);
    }
}

// *** NEW FUNCTION: REDIRECT TO INVOICES.HTML WITH ID ***
function viewInvoice(invoiceId) {
    window.location.href = `invoices.html?id=${invoiceId}`;
}

async function deleteInvoice(invoiceId) {
    if (!confirm(`Are you sure you want to delete Invoice ID ${invoiceId}? This action cannot be undone and stock WILL NOT be automatically reversed.`)) return;

    try {
        const response = await fetch(`${API_BASE_URL}/invoices/${invoiceId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (response.ok) {
            alert('Invoice deleted successfully.');
            fetchInvoices();
        } else {
            const error = await response.json();
            alert(`Failed to delete invoice: ${error.msg || error.message}`);
        }
    } catch (error) {
        alert('Failed to connect to server.');
    }
}