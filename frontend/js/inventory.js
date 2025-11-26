// js/inventory.js

// API_BASE_URL is defined in auth.js

let inventoryItems = [];
const inventoryTableBody = document.getElementById('inventoryTableBody');
const inventoryForm = document.getElementById('inventoryForm');
let inventoryModal; 
if (document.getElementById('inventoryModal')) {
    inventoryModal = new bootstrap.Modal(document.getElementById('inventoryModal'));
}

document.addEventListener('DOMContentLoaded', () => {
    fetchInventory();

    if (inventoryForm) inventoryForm.addEventListener('submit', handleInventorySubmit);
    if (inventoryTableBody) inventoryTableBody.addEventListener('click', handleTableAction);
    if (document.getElementById('inventorySearch')) document.getElementById('inventorySearch').addEventListener('input', renderInventory);
    if (document.getElementById('typeFilter')) document.getElementById('typeFilter').addEventListener('change', renderInventory);
    
    const addItemBtn = document.getElementById('addItemBtn');
    if (addItemBtn) {
        addItemBtn.addEventListener('click', () => {
            inventoryForm.reset();
            document.getElementById('itemId').value = '';
            document.getElementById('inventoryModalLabel').textContent = 'Add New Granite Item';
            
            // Reset dynamic unit fields to default M³
            document.getElementById('itemUnit').value = 'M³'; 
            document.getElementById('rateUnitText').textContent = 'per M³'; 
            document.getElementById('rateUnit').value = 'M³'; 
        });
    }
});

// READ: Fetch all inventory items
async function fetchInventory() {
    try {
        const response = await fetch(`${API_BASE_URL}/inventory`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (response.ok) {
            inventoryItems = await response.json();
            renderInventory();
        } else {
            const error = await response.json();
            if (inventoryTableBody) inventoryTableBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger py-4">Failed to load inventory: ${error.msg || error.message}</td></tr>`;
        }
    } catch (error) {
        if (inventoryTableBody) inventoryTableBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger py-4">Error loading data. Check server status.</td></tr>`;
    }
}

// CREATE/UPDATE: Handle form submission (Captures ALL new fields)
async function handleInventorySubmit(e) {
    e.preventDefault();
    const isUpdate = !!document.getElementById('itemId').value;
    const itemId = document.getElementById('itemId').value;

    const itemData = {
        itemName: document.getElementById('itemName').value,
        // --- NEW FIELDS CAPTURE ---
        itemColor: document.getElementById('itemColor').value,
        itemThickness: document.getElementById('itemThickness').value,
        itemShape: document.getElementById('itemShape').value,
        itemPolish: document.getElementById('itemPolish').value,
        // -------------------------
        
        unit: document.getElementById('itemUnit').value,  
        quantity: parseFloat(document.getElementById('itemQuantity').value),
        rate: parseFloat(document.getElementById('itemRate').value)
    };

    try {
        const response = await fetch(`${API_BASE_URL}/inventory/${isUpdate ? itemId : ''}`, {
            method: isUpdate ? 'PUT' : 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(itemData)
        });

        if (response.ok) {
            alert(`Item ${isUpdate ? 'updated' : 'added'} successfully!`);
            inventoryModal?.hide();
            fetchInventory();
        } else {
            const error = await response.json();
            alert(`Failed to save item: ${error.msg || error.message}`);
        }
    } catch (error) {
        alert('Failed to connect to server.');
    }
}

// RENDER: Display items (Uses new fields for display)
function renderInventory() {
    const searchText = document.getElementById('inventorySearch')?.value.toLowerCase() || '';
    const typeFilter = document.getElementById('typeFilter')?.value || '';

    const filteredItems = inventoryItems.filter(item => {
        // Search by item name or itemColor (using itemColor instead of itemType)
        const matchesSearch = item.itemName.toLowerCase().includes(searchText) || 
                              (item.itemColor || '').toLowerCase().includes(searchText);
        const matchesFilter = !typeFilter || item.itemType === typeFilter; 
        return matchesSearch && matchesFilter;
    });

    if (filteredItems.length === 0) {
        if (inventoryTableBody) inventoryTableBody.innerHTML = `<tr><td colspan="7" class="text-center text-secondary py-4">No matching inventory items found.</td></tr>`;
        return;
    }

    if (inventoryTableBody) {
        inventoryTableBody.innerHTML = filteredItems.map((item, index) => {
            const quantityClass = item.quantity < 50 ? 'text-danger fw-bold' : '';
            const unit = item.unit || 'M³'; 
            
            // Map table columns to new data: Type -> Color, Size -> Thickness (mm)
            return `
                <tr data-id="${item._id}">
                    <td>${index + 1}</td>
                    <td>${item.itemName}</td>
                    <td><span class="badge text-bg-secondary">${item.itemColor || 'N/A'}</span></td>
                    <td>${item.itemThickness || 'N/A'} mm</td>
                    <td class="${quantityClass}">${item.quantity.toFixed(0)} ${unit}</td>
                    <td>₹ ${item.rate.toFixed(0)} per ${unit}</td>
                    <td>
                        <button class="btn btn-sm btn-info me-2 edit-btn"><i class="bi bi-pencil"></i></button>
                        <button class="btn btn-sm btn-danger delete-btn"><i class="bi bi-trash"></i></button>
                    </td>
                </tr>
            `;
        }).join('');
    }
}

// Handle Edit and Delete Clicks
function handleTableAction(e) {
    const row = e.target.closest('tr');
    if (!row) return;
    const itemId = row.getAttribute('data-id');

    if (e.target.closest('.edit-btn')) {
        editItem(itemId);
    } else if (e.target.closest('.delete-btn')) {
        deleteItem(itemId);
    }
}

// EDIT: Pre-fill modal for editing (UPDATED for ALL new fields)
function editItem(itemId) {
    const item = inventoryItems.find(i => i._id === itemId);
    if (item) {
        const unit = item.unit || 'M³'; 
        
        document.getElementById('inventoryModalLabel').textContent = 'Edit Granite Item';
        document.getElementById('itemId').value = item._id;
        document.getElementById('itemName').value = item.itemName;
        
        // --- Populate New Fields ---
        document.getElementById('itemColor').value = item.itemColor || '';
        document.getElementById('itemThickness').value = item.itemThickness || '';
        document.getElementById('itemShape').value = item.itemShape || '';
        document.getElementById('itemPolish').value = item.itemPolish || '';
        // -------------------------

        // Populate Unit and Quantity
        document.getElementById('itemQuantity').value = item.quantity;
        document.getElementById('itemUnit').value = unit;
        
        // Populate Rate and update visual display
        document.getElementById('itemRate').value = item.rate;
        
        // Update dynamic unit displays in the modal
        document.getElementById('rateUnitText').textContent = 'per ' + unit; 
        document.getElementById('rateUnit').value = unit; 
        
        inventoryModal?.show();
    }
}

async function deleteItem(itemId) {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/inventory/${itemId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (response.ok) {
            alert('Item deleted successfully.');
            fetchInventory();
        } else {
            const error = await response.json();
            alert(`Failed to delete item: ${error.msg || error.message}`);
        }
    } catch (error) {
        alert('Failed to connect to server.');
    }
}