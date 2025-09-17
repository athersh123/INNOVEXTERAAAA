import { fetchRecords, dssEligibility } from './api.js';

let map, markersLayer, records = [];
let donutChart, trendChart;

// Initialize the dashboard
function initDashboard() {
  initMap();
  initSearch();
  initSidebar();
  initChartButtons();
  loadData();
}

// Initialize map
function initMap() {
  map = L.map('map').setView([21.5, 78.9], 5);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
  }).addTo(map);
  markersLayer = L.layerGroup().addTo(map);
}

// Render markers on map
function renderMarkers() {
  markersLayer.clearLayers();
  records.forEach(r => {
    if (r.geometry && r.geometry.type === 'Point') {
      const [lng, lat] = r.geometry.coordinates;
      const status = r.claim_status.toLowerCase();
      let color = '#2563eb'; // Default blue
      
      if (status === 'approved') color = '#10b981';
      else if (status === 'pending') color = '#f59e0b';
      else if (status === 'rejected') color = '#ef4444';
      
      const marker = L.circleMarker([lat, lng], { 
        radius: 8, 
        color: color, 
        fillOpacity: 0.8,
        weight: 2
      });
      
      marker.on('click', () => showDetails(r));
      marker.bindTooltip(`
        <div style="font-weight: 600; margin-bottom: 4px;">${r.holder_name}</div>
        <div style="font-size: 12px; color: #64748b;">${r.parcel_id} • ${r.village}</div>
        <div style="font-size: 11px; color: ${color}; font-weight: 600;">${r.claim_status}</div>
      `, { direction: 'top', offset: [0, -10] });
      marker.addTo(markersLayer);
    }
  });
}

// Update metrics cards
function updateMetrics() {
  const total = records.length;
  const approved = records.filter(r => r.claim_status.toLowerCase() === 'approved').length;
  const pending = records.filter(r => r.claim_status.toLowerCase() === 'pending').length;
  const rejected = records.filter(r => r.claim_status.toLowerCase() === 'rejected').length;
  const villages = new Set(records.map(r => r.village)).size;
  
  setText('totalClaims', total.toLocaleString());
  setText('approvalRate', total ? `${Math.round((approved/total)*1000)/10}%` : '0%');
  setText('pendingClaims', pending.toLocaleString());
  setText('villagesCovered', villages.toLocaleString());
  
  renderDonut(approved, pending, rejected);
  renderTrend();
}

// Render donut chart
function renderDonut(approved, pending, rejected) {
  const el = document.getElementById('donut');
  el.innerHTML = '';
  const canvas = document.createElement('canvas');
  canvas.height = 200;
  el.appendChild(canvas);
  
  if (donutChart) donutChart.destroy();
  
  donutChart = new Chart(canvas, {
    type: 'doughnut',
    data: { 
      labels: ['Approved', 'Pending', 'Rejected'], 
      datasets: [{ 
        data: [approved, pending, rejected], 
        backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
        borderWidth: 0,
        hoverOffset: 8
      }]
    },
    options: { 
      responsive: true, 
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 20,
            usePointStyle: true,
            font: {
              size: 12,
              weight: '600'
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          borderColor: '#e2e8f0',
          borderWidth: 1,
          cornerRadius: 8
        }
      },
      cutout: '60%'
    }
  });
}

// Render trend chart
function renderTrend() {
  const ctx = document.getElementById('trend');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Generate more realistic data
  const approved = months.map((_, i) => 45 + Math.round(15 * Math.sin(i / 2)) + Math.random() * 10);
  const pending = months.map((_, i) => 35 + Math.round(12 * Math.cos(i / 3)) + Math.random() * 8);
  
  if (trendChart) trendChart.destroy();
  
  trendChart = new Chart(ctx, {
    type: 'line',
    data: { 
      labels: months, 
      datasets: [
        { 
          label: 'Approved', 
          data: approved, 
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#10b981',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7
        },
        { 
          label: 'Pending', 
          data: pending, 
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#f59e0b',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7
        }
      ]
    },
    options: { 
      responsive: true, 
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 20,
            usePointStyle: true,
            font: {
              size: 12,
              weight: '600'
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          borderColor: '#e2e8f0',
          borderWidth: 1,
          cornerRadius: 8
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: '#f1f5f9',
            drawBorder: false
          },
          ticks: {
            color: '#64748b',
            font: {
              size: 11
            }
          }
        },
        x: {
          grid: {
            display: false
          },
          ticks: {
            color: '#64748b',
            font: {
              size: 11
            }
          }
        }
      }
    }
  });
}

// Show details panel
async function showDetails(record) {
  const dss = await dssEligibility(record.holder_id);
  const el = document.getElementById('detailsBody');
  
  el.innerHTML = `
    <div class="claim-header">
      <h4>${record.holder_name}</h4>
      <span class="claim-location">${record.village}, ${record.state}</span>
    </div>
    
    <div class="claim-details">
      <div class="detail-row">
        <span class="detail-label">Parcel ID:</span>
        <span class="pill">${record.parcel_id}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Area:</span>
        <span class="pill">${record.area_ha} ha</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Land Use:</span>
        <div class="pill-group">
          ${record.land_use.map(x => `<span class="pill">${x}</span>`).join('')}
        </div>
      </div>
      <div class="detail-row">
        <span class="detail-label">Status:</span>
        <span class="pill status-${record.claim_status.toLowerCase()}">${record.claim_status}</span>
      </div>
    </div>
    
    <div class="schemes-section">
      <h5>Eligible Schemes</h5>
      ${dss.eligible_schemes.length ? 
        `<div class="pill-group">${dss.eligible_schemes.map(s => `<span class="pill success">${s}</span>`).join('')}</div>` : 
        '<div class="no-schemes">No eligible schemes found</div>'
      }
      ${dss.notes ? `<div class="scheme-notes">${dss.notes}</div>` : ''}
    </div>
  `;
}

// Load data
async function loadData(query = '') {
  try {
    records = await fetchRecords(query);
    renderMarkers();
    updateMetrics();
  } catch (error) {
    console.error('Error loading data:', error);
  }
}

// Initialize search
function initSearch() {
  const input = document.getElementById('search');
  let timeout;
  
  input.addEventListener('input', () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      loadData(input.value.trim());
    }, 300);
  });
}

// Initialize sidebar
function initSidebar() {
  const toggle = document.getElementById('sidebarToggle');
  const sidebar = document.querySelector('.sidebar');
  
  if (toggle) {
    toggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }
  
  // Close sidebar when clicking outside on mobile
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768 && 
        !sidebar.contains(e.target) && 
        !toggle.contains(e.target)) {
      sidebar.classList.remove('open');
    }
  });
}

// Initialize chart buttons
function initChartButtons() {
  // Chart period buttons
  document.querySelectorAll('.chart-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      // Remove active class from siblings
      e.target.parentNode.querySelectorAll('.chart-btn').forEach(b => b.classList.remove('active'));
      // Add active class to clicked button
      e.target.classList.add('active');
    });
  });
  
  // Map control buttons
  document.querySelectorAll('.map-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const action = e.target.textContent.trim();
      console.log(`Map action: ${action}`);
      // Add map control functionality here
    });
  });
}

// Utility function
function setText(id, text) { 
  const element = document.getElementById(id);
  if (element) element.textContent = text; 
}

// Initialize dashboard when DOM is loaded
window.addEventListener('DOMContentLoaded', initDashboard);

