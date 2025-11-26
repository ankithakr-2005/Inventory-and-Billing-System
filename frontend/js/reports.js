// js/reports.js

// API_BASE_URL is defined in auth.js

let salesChartInstance, inventoryChartInstance;
let currentReportData = []; 

document.addEventListener('DOMContentLoaded', () => {
    const generateReportBtn = document.getElementById('generateReportBtn');
    if (generateReportBtn) generateReportBtn.addEventListener('click', generateReport);
    
    generateReport(); 
    
    // --- UPDATED EXPORT BUTTON LOGIC ---
    const exportReportBtn = document.getElementById('exportReportBtn');
    if (exportReportBtn) exportReportBtn.addEventListener('click', exportReport); 
    // --- END UPDATED EXPORT BUTTON LOGIC ---
});

// --- UPDATED EXPORT FUNCTION: Generates PDF of the current report view ---
function exportReport() {
    if (typeof html2canvas === 'undefined' || typeof window.jspdf === 'undefined') {
        alert("PDF generation libraries (html2canvas, jspdf) are not loaded.");
        return;
    }
    if (currentReportData.length === 0) {
        alert("No report data available. Please generate a report first.");
        return;
    }
    
    // 1. Identify layout elements to HIDE (Sidebar and Navbar)
    const sidebar = document.getElementById('sidebar-wrapper');
    const navbar = document.querySelector('nav.navbar');
    const exportButton = document.getElementById('exportReportBtn');
    const wrapper = document.getElementById('wrapper');
    const pageContentWrapper = document.getElementById('page-content-wrapper');

    // 2. Target the main content area for the screenshot
    const input = document.querySelector('.container-fluid.p-4'); 
    if (!input) return;

    // --- Temporary Hide/Adjust Layout ---
    if (sidebar) sidebar.style.display = 'none';
    if (navbar) navbar.style.display = 'none';
    if (exportButton) exportButton.style.display = 'none';
    
    if (pageContentWrapper) {
        pageContentWrapper.style.width = '100vw'; 
        pageContentWrapper.style.padding = '0';
    }
    if (wrapper) wrapper.style.padding = '0'; 

    // 3. Capture the Report View (including KPIs and Charts)
    html2canvas(input, { scale: 2 }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new window.jspdf.jsPDF('p', 'mm', 'a4');
        const imgWidth = 210;
        const imgHeight = canvas.height * imgWidth / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= 295;

        while (heightLeft >= -50) { 
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= 295;
        }

        const reportType = document.getElementById('reportType').value;
        const date = new Date().toISOString().split('T')[0];
        pdf.save(`${reportType}-report-${date}.pdf`);
        
        // 4. --- Restore ALL Hidden Elements and Original Styles ---
        if (sidebar) sidebar.style.display = 'block';
        if (navbar) navbar.style.display = 'flex';
        if (exportButton) exportButton.style.display = 'block';
        
        if (pageContentWrapper) {
            pageContentWrapper.style.padding = '4px'; 
            pageContentWrapper.style.width = ''; 
        }
        if (wrapper) wrapper.style.padding = '';
        
        alert(`Report successfully exported as PDF.`);
    });
}
// --- END UPDATED EXPORT FUNCTION ---


async function generateReport() {
    const reportType = document.getElementById('reportType')?.value || 'sales-month';
    const startDate = document.getElementById('startDate')?.value || '';
    const endDate = document.getElementById('endDate')?.value || '';
    
    try {
        const response = await fetch(`${API_BASE_URL}/reports/${reportType}?start=${startDate}&end=${endDate}`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const data = await response.json();
            
            // CRITICAL: Store data globally for export
            currentReportData = data.reportData; 

            clearCharts();
            updateReportKPIs(data.kpis);

            if (reportType === 'sales-month') {
                renderSalesTrendChart(data.reportData);
                const invCompEl = document.getElementById('inventoryCompositionChart');
                if (invCompEl) invCompEl.parentElement.innerHTML = '<canvas id="inventoryCompositionChart" style="max-height: 400px;"></canvas>';
            } else if (reportType === 'inventory-value') {
                renderInventoryCompositionChart(data.reportData);
                const salesTrendEl = document.getElementById('salesTrendChart');
                if (salesTrendEl) salesTrendEl.parentElement.innerHTML = '<canvas id="salesTrendChart" style="max-height: 400px;"></canvas>';
            }
            
        } else {
            currentReportData = []; 
            alert('Failed to generate report. Check filters and server status.');
        }
    } catch (error) {
        currentReportData = [];
        alert('Could not connect to the reporting service.');
    }
}

function clearCharts() {
    if (salesChartInstance) salesChartInstance.destroy();
    if (inventoryChartInstance) inventoryChartInstance.destroy();
}

function updateReportKPIs(kpis) {
    document.getElementById('totalRevenue').textContent = `₹ ${kpis.totalRevenue?.toLocaleString('en-IN') || '0.00'}`;
    document.getElementById('itemsSold').textContent = `${kpis.itemsSold?.toLocaleString('en-IN') || '0'} M³`;
    document.getElementById('stockValue').textContent = `₹ ${kpis.stockValue?.toLocaleString('en-IN') || '0.00'}`;
    document.getElementById('topItem').textContent = kpis.topItem || 'N/A';
}


function renderSalesTrendChart(salesTrendData) {
    const ctx = document.getElementById('salesTrendChart')?.getContext('2d');
    if (!ctx) return;

    salesChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: salesTrendData.map(d => d.label),
            datasets: [{
                label: 'Revenue (₹)',
                data: salesTrendData.map(d => d.revenue),
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function renderInventoryCompositionChart(compositionData) {
    const ctx = document.getElementById('inventoryCompositionChart')?.getContext('2d');
    if (!ctx) return;
    
    inventoryChartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: compositionData.map(d => d.type), 
            datasets: [{
                label: 'Stock Quantity (M³)',
                data: compositionData.map(d => d.quantity),
                backgroundColor: [
                    'rgba(63, 191, 191, 0.7)',
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                ],
                hoverOffset: 4
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}