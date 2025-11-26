// js/dashboard.js

// API_BASE_URL is defined in auth.js

let monthlySalesChartInstance;

document.addEventListener('DOMContentLoaded', () => {
    fetchDashboardData();
});

async function fetchDashboardData() {
    try {
        const response = await fetch(`${API_BASE_URL}/reports/dashboard-summary`, { 
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const data = await response.json();
            updateDashboardCards(data.summary);
            renderMonthlySalesChart(data.monthlySales);
        } else {
            console.error('Failed to fetch dashboard data:', await response.json());
            // Fallback for UI elements
            document.getElementById('totalStock').textContent = 'Error';
        }
    } catch (error) {
        console.error('Dashboard Fetch Error:', error);
    }
}

function updateDashboardCards(summary) {
    document.getElementById('totalStock').textContent = `${summary.totalStock?.toFixed(0) || 0} M³`;
    document.getElementById('todaysSales').textContent = `₹ ${(summary.todaysSales?.toFixed(2) || 0.00)}`;
    document.getElementById('totalInvoices').textContent = summary.totalInvoices?.toFixed(0) || 0;
    document.getElementById('lowStockItems').textContent = summary.lowStockItems?.toFixed(0) || 0;
}

function renderMonthlySalesChart(monthlySalesData) {
    const ctx = document.getElementById('monthlySalesChart')?.getContext('2d');
    if (!ctx) return;
    
    if (monthlySalesChartInstance) {
        monthlySalesChartInstance.destroy();
    }
    
    monthlySalesChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: monthlySalesData.map(d => d.month),
            datasets: [{
                label: 'Monthly Sales Revenue (₹)',
                data: monthlySalesData.map(d => d.revenue),
                backgroundColor: 'rgba(54, 162, 235, 0.7)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}