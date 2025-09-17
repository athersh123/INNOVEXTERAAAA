import { fetchRecords, dssEligibility } from './api.js';

let map, markersLayer, records = [];
let donutChart, trendChart;

// Initialize the application
function initApp() {
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
  
  // Add some styling for the details
  const style = document.createElement('style');
  style.textContent = `
    .claim-header h4 {
      margin: 0 0 4px 0;
      color: var(--text-primary);
      font-size: var(--font-size-lg);
    }
    .claim-location {
      color: var(--text-muted);
      font-size: var(--font-size-sm);
    }
    .claim-details {
      margin: var(--space-lg) 0;
    }
    .detail-row {
      display: flex;
      align-items: center;
      margin-bottom: var(--space-sm);
      gap: var(--space-sm);
    }
    .detail-label {
      font-weight: 600;
      color: var(--text-secondary);
      min-width: 80px;
      font-size: var(--font-size-sm);
    }
    .pill-group {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-xs);
    }
    .status-approved { background: var(--accent); color: white; }
    .status-pending { background: var(--warning); color: white; }
    .status-rejected { background: var(--danger); color: white; }
    .schemes-section {
      margin-top: var(--space-lg);
      padding-top: var(--space-lg);
      border-top: 1px solid var(--border-light);
    }
    .schemes-section h5 {
      margin: 0 0 var(--space-sm) 0;
      color: var(--text-primary);
      font-size: var(--font-size-sm);
      font-weight: 600;
    }
    .no-schemes {
      color: var(--text-muted);
      font-style: italic;
      font-size: var(--font-size-sm);
    }
    .scheme-notes {
      margin-top: var(--space-sm);
      padding: var(--space-sm);
      background: var(--bg-tertiary);
      border-radius: var(--radius-md);
      font-size: var(--font-size-xs);
      color: var(--text-secondary);
    }
  `;
  document.head.appendChild(style);
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
  
  // Handle navigation clicks
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const href = link.getAttribute('href');
      const navItem = link.closest('.nav-item');
      
      // Remove active class from all nav items
      document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
      });
      
      // Add active class to clicked item
      navItem.classList.add('active');
      
      // Handle different navigation sections
      handleNavigation(href);
      
      // Close sidebar on mobile after navigation
      if (window.innerWidth <= 768) {
        sidebar.classList.remove('open');
      }
    });
  });
}

// Handle navigation between different sections
function handleNavigation(href) {
  const pageTitle = document.querySelector('.page-title');
  const breadcrumb = document.querySelector('.breadcrumb');
  
  switch(href) {
    case '#dashboard':
      showDashboard();
      if (pageTitle) pageTitle.textContent = 'Dashboard Overview';
      if (breadcrumb) breadcrumb.innerHTML = '<span>Home</span><i class="fas fa-chevron-right"></i><span>Dashboard</span>';
      break;
    case '#atlas':
      showAtlas();
      if (pageTitle) pageTitle.textContent = 'FRA Atlas';
      if (breadcrumb) breadcrumb.innerHTML = '<span>Home</span><i class="fas fa-chevron-right"></i><span>FRA Atlas</span>';
      break;
    case '#decisions':
      showDecisionSupport();
      if (pageTitle) pageTitle.textContent = 'Decision Support System';
      if (breadcrumb) breadcrumb.innerHTML = '<span>Home</span><i class="fas fa-chevron-right"></i><span>Decision Support</span>';
      break;
    case '#documents':
      showDocuments();
      if (pageTitle) pageTitle.textContent = 'Documents';
      if (breadcrumb) breadcrumb.innerHTML = '<span>Home</span><i class="fas fa-chevron-right"></i><span>Documents</span>';
      break;
    case '#reports':
      showReports();
      if (pageTitle) pageTitle.textContent = 'Reports';
      if (breadcrumb) breadcrumb.innerHTML = '<span>Home</span><i class="fas fa-chevron-right"></i><span>Reports</span>';
      break;
    case '#admin':
      showAdmin();
      if (pageTitle) pageTitle.textContent = 'Administration';
      if (breadcrumb) breadcrumb.innerHTML = '<span>Home</span><i class="fas fa-chevron-right"></i><span>Admin</span>';
      break;
  }
}

// Show different sections
function showDashboard() {
  const dashboardContent = document.querySelector('.dashboard-content');
  if (dashboardContent) {
    dashboardContent.style.display = 'flex';
    // Reload data for dashboard
    loadData();
  }
}

function showAtlas() {
  const dashboardContent = document.querySelector('.dashboard-content');
  if (dashboardContent) {
    dashboardContent.innerHTML = `
      <div class="atlas-container">
        <div class="atlas-header">
          <h2>FRA Atlas - Interactive Map</h2>
          <p>Explore forest rights claims and their geographical distribution</p>
        </div>
        <div class="map-section">
          <div class="map-container">
            <div class="map-header">
              <h3>Geographic Distribution</h3>
              <div class="map-controls">
                <button class="map-btn">
                  <i class="fas fa-layer-group"></i>
                  Layers
                </button>
                <button class="map-btn">
                  <i class="fas fa-download"></i>
                  Export
                </button>
                <button class="map-btn">
                  <i class="fas fa-expand"></i>
                  Fullscreen
                </button>
              </div>
            </div>
            <div id="map" class="map"></div>
          </div>
          <div class="details-panel" id="details">
            <div class="details-header">
              <h3>Claim Details</h3>
              <button class="close-details">
                <i class="fas fa-times"></i>
              </button>
            </div>
            <div class="details-content" id="detailsBody">
              <div class="empty-state">
                <i class="fas fa-map-marker-alt"></i>
                <p>Click a parcel or search a holder to view details</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    // Reinitialize map
  initMap();
    loadData();
  }
}

function showDecisionSupport() {
  const dashboardContent = document.querySelector('.dashboard-content');
  if (dashboardContent) {
    dashboardContent.innerHTML = `
      <div class="dss-container">
        <div class="dss-header">
          <h2>Decision Support System</h2>
          <p>Get recommendations for forest rights claims and eligible schemes</p>
        </div>
        <div class="dss-content">
          <div class="search-section">
            <div class="search-container">
              <i class="fas fa-search search-icon"></i>
              <input type="text" id="dssSearch" class="search-input" placeholder="Search by holder name or ID..." />
              <button class="search-btn" onclick="searchDSS()">
                <i class="fas fa-search"></i>
              </button>
            </div>
          </div>
          <div class="results-section" id="dssResults">
            <div class="empty-state">
              <i class="fas fa-lightbulb"></i>
              <p>Search for a holder to get decision support recommendations</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

function showDocuments() {
  const dashboardContent = document.querySelector('.dashboard-content');
  if (dashboardContent) {
    dashboardContent.innerHTML = `
      <div class="documents-container">
        <div class="documents-header">
          <h2>Documents</h2>
          <p>Manage and view forest rights related documents</p>
        </div>
        <div class="documents-content">
          <div class="upload-section">
            <div class="upload-area">
              <i class="fas fa-cloud-upload-alt"></i>
              <h3>Upload Documents</h3>
              <p>Drag and drop files here or click to browse</p>
              <input type="file" id="fileUpload" multiple accept=".pdf,.jpg,.jpeg,.png" style="display: none;">
              <button class="upload-btn" onclick="document.getElementById('fileUpload').click()">
                Choose Files
              </button>
            </div>
          </div>
          <div class="documents-list">
            <h3>Recent Documents</h3>
            <div class="document-grid" id="documentGrid">
              <div class="empty-state">
                <i class="fas fa-file-alt"></i>
                <p>No documents uploaded yet</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

function showReports() {
  const dashboardContent = document.querySelector('.dashboard-content');
  if (dashboardContent) {
    dashboardContent.innerHTML = `
      <div class="reports-container">
        <div class="reports-header">
          <h2>Reports</h2>
          <p>Generate and view comprehensive reports</p>
        </div>
        <div class="reports-content">
          <div class="report-filters">
            <div class="filter-group">
              <label>Report Type</label>
              <select id="reportType">
                <option value="summary">Summary Report</option>
                <option value="detailed">Detailed Report</option>
                <option value="geographic">Geographic Report</option>
                <option value="status">Status Report</option>
              </select>
            </div>
            <div class="filter-group">
              <label>Date Range</label>
              <select id="dateRange">
                <option value="last30">Last 30 Days</option>
                <option value="last90">Last 90 Days</option>
                <option value="lastyear">Last Year</option>
                <option value="all">All Time</option>
              </select>
            </div>
            <button class="generate-btn" onclick="generateReport()">
              <i class="fas fa-chart-bar"></i>
              Generate Report
            </button>
          </div>
          <div class="report-preview" id="reportPreview">
            <div class="empty-state">
              <i class="fas fa-chart-line"></i>
              <p>Select filters and generate a report to view it here</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

function showAdmin() {
  const dashboardContent = document.querySelector('.dashboard-content');
  if (dashboardContent) {
    dashboardContent.innerHTML = `
      <div class="admin-container">
        <div class="admin-header">
          <h2>Administration</h2>
          <p>Manage system settings and user accounts</p>
        </div>
        <div class="admin-content">
          <div class="admin-tabs">
            <button class="tab-btn active" onclick="showAdminTab('users')">Users</button>
            <button class="tab-btn" onclick="showAdminTab('settings')">Settings</button>
            <button class="tab-btn" onclick="showAdminTab('logs')">Logs</button>
          </div>
          <div class="admin-tab-content" id="adminTabContent">
            <div class="users-tab">
              <h3>User Management</h3>
              <div class="user-list" id="userList">
                <div class="empty-state">
                  <i class="fas fa-users"></i>
                  <p>No users found</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

// DSS Search function
function searchDSS() {
  const searchInput = document.getElementById('dssSearch');
  const resultsDiv = document.getElementById('dssResults');
  
  if (searchInput && resultsDiv) {
    const query = searchInput.value.trim();
    if (query) {
      resultsDiv.innerHTML = `
        <div class="loading-state">
          <i class="fas fa-spinner fa-spin"></i>
          <p>Searching for recommendations...</p>
        </div>
      `;
      
      // Simulate search (replace with actual API call)
      setTimeout(() => {
        resultsDiv.innerHTML = `
          <div class="dss-result">
            <h4>Recommendations for: ${query}</h4>
            <div class="recommendation-card">
              <h5>Eligible Schemes</h5>
              <ul>
                <li>PM-Kisan Scheme</li>
                <li>Jal Shakti - Water Resource Development</li>
                <li>CFR Livelihood Support</li>
              </ul>
            </div>
            <div class="recommendation-card">
              <h5>Next Steps</h5>
              <ol>
                <li>Submit required documents</li>
                <li>Complete verification process</li>
                <li>Follow up with local authorities</li>
              </ol>
            </div>
          </div>
        `;
      }, 1000);
    }
  }
}

// Generate Report function
function generateReport() {
  const reportPreview = document.getElementById('reportPreview');
  if (reportPreview) {
    reportPreview.innerHTML = `
      <div class="report-content">
        <h3>Report Generated Successfully</h3>
        <div class="report-stats">
          <div class="stat-item">
            <span class="stat-label">Total Claims:</span>
            <span class="stat-value">1,234</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Approved:</span>
            <span class="stat-value">856</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Pending:</span>
            <span class="stat-value">378</span>
          </div>
        </div>
        <div class="report-actions">
          <button class="action-btn primary">
            <i class="fas fa-download"></i>
            Download PDF
          </button>
          <button class="action-btn secondary">
            <i class="fas fa-share"></i>
            Share Report
          </button>
        </div>
      </div>
    `;
  }
}

// Admin tab functions
function showAdminTab(tabName) {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContent = document.getElementById('adminTabContent');
  
  tabButtons.forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  
  if (tabContent) {
    switch(tabName) {
      case 'users':
        tabContent.innerHTML = `
          <div class="users-tab">
            <h3>User Management</h3>
            <div class="user-list" id="userList">
              <div class="empty-state">
                <i class="fas fa-users"></i>
                <p>No users found</p>
              </div>
            </div>
          </div>
        `;
        break;
      case 'settings':
        tabContent.innerHTML = `
          <div class="settings-tab">
            <h3>System Settings</h3>
            <div class="settings-form">
              <div class="setting-item">
                <label>System Name</label>
                <input type="text" value="FRA Atlas" />
              </div>
              <div class="setting-item">
                <label>Default Language</label>
                <select>
                  <option>English</option>
                  <option>Hindi</option>
                </select>
              </div>
            </div>
          </div>
        `;
        break;
      case 'logs':
        tabContent.innerHTML = `
          <div class="logs-tab">
            <h3>System Logs</h3>
            <div class="log-viewer">
              <div class="log-entry">
                <span class="log-time">2024-01-15 10:30:45</span>
                <span class="log-level info">INFO</span>
                <span class="log-message">System started successfully</span>
              </div>
            </div>
          </div>
        `;
        break;
    }
  }
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

// Initialize app when DOM is loaded

window.addEventListener('DOMContentLoaded', () => {
  initApp();

  // Dummy login logic for login.html
  if (window.location.pathname.endsWith('login.html')) {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('loginError');
        if (username === 'testuser' && password === 'testpass') {
          window.location.href = 'dashboard.html';
        } else {
          errorDiv.textContent = 'Invalid login credentials.';
          errorDiv.style.display = 'block';
        }
      });
    }
  }

  // Dummy signup logic for signup.html (does not actually create user)
  if (window.location.pathname.endsWith('signup.html')) {
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
      signupForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const errorDiv = document.getElementById('signupError');
        errorDiv.textContent = 'Signup is disabled. Please use testuser/testpass to login.';
        errorDiv.style.display = 'block';
      });
    }
  }
});



