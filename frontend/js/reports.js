// Initialize the reports page
function initReports() {
  initSidebar();
  initReportFilters();
  initRecentReports();
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

// Initialize report filters
function initReportFilters() {
  const generateBtn = document.querySelector('.generate-btn');
  if (generateBtn) {
    generateBtn.addEventListener('click', generateReport);
  }
}

// Initialize recent reports
function initRecentReports() {
  const reportCards = document.querySelectorAll('.report-card');
  reportCards.forEach(card => {
    const viewBtn = card.querySelector('.action-btn.small');
    const downloadBtn = card.querySelector('.action-btn.small.secondary');
    
    if (viewBtn) {
      viewBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const reportTitle = card.querySelector('h4').textContent;
        viewReport(reportTitle.toLowerCase().replace(/\s+/g, '-'));
      });
    }
    
    if (downloadBtn) {
      downloadBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const reportTitle = card.querySelector('h4').textContent;
        downloadReport(reportTitle.toLowerCase().replace(/\s+/g, '-'));
      });
    }
  });
}

// Generate report
function generateReport() {
  const reportType = document.getElementById('reportType').value;
  const dateRange = document.getElementById('dateRange').value;
  const reportFormat = document.getElementById('reportFormat').value;
  const reportPreview = document.getElementById('reportPreview');
  
  if (reportPreview) {
    reportPreview.innerHTML = `
      <div class="loading-state">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Generating report...</p>
      </div>
    `;
    
    // Simulate report generation
    setTimeout(() => {
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
            <div class="stat-item">
              <span class="stat-label">Rejected:</span>
              <span class="stat-value">0</span>
            </div>
          </div>
          <div class="report-actions">
            <button class="action-btn primary" onclick="downloadReport('generated-report')">
              <i class="fas fa-download"></i>
              Download ${reportFormat.toUpperCase()}
            </button>
            <button class="action-btn secondary" onclick="shareReport()">
              <i class="fas fa-share"></i>
              Share Report
            </button>
          </div>
        </div>
      `;
    }, 2000);
  }
}

// View report
function viewReport(reportId) {
  console.log(`View report: ${reportId}`);
  // Add report view functionality
  showNotification(`Opening report: ${reportId}`, 'info');
}

// Download report
function downloadReport(reportId) {
  console.log(`Download report: ${reportId}`);
  // Add report download functionality
  showNotification(`Downloading report: ${reportId}`, 'success');
}

// Share report
function shareReport() {
  console.log('Share report');
  // Add report sharing functionality
  showNotification('Report sharing options opened', 'info');
}

// Schedule report
function scheduleReport() {
  console.log('Schedule report');
  // Add report scheduling functionality
  showNotification('Report scheduling dialog opened', 'info');
}

// Show notification
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
    <span>${message}</span>
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Initialize reports page when DOM is loaded
window.addEventListener('DOMContentLoaded', initReports);

