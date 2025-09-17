import { fetchRecords, dssEligibility } from './api.js';

// Initialize the decisions page
function initDecisions() {
  initSidebar();
  initSearch();
  initQuickActions();
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

// Initialize search
function initSearch() {
  const input = document.getElementById('dssSearch');
  if (input) {
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        searchDSS();
      }
    });
  }
}

// Initialize quick actions
function initQuickActions() {
  // Add event listeners for quick action buttons
  document.querySelectorAll('.action-card').forEach(card => {
    card.addEventListener('click', (e) => {
      const action = e.currentTarget.querySelector('h4').textContent;
      console.log(`Quick action: ${action}`);
    });
  });
}

// Search DSS function
async function searchDSS() {
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
      
      try {
        // Search for records
        const records = await fetchRecords(query);
        
        if (records.length > 0) {
          // Get recommendations for the first matching record
          const record = records[0];
          const dss = await dssEligibility(record.holder_id);
          
          resultsDiv.innerHTML = `
            <div class="dss-result">
              <h4>Recommendations for: ${record.holder_name}</h4>
              <div class="recommendation-card">
                <h5>Eligible Schemes</h5>
                ${dss.eligible_schemes.length ? 
                  `<ul>${dss.eligible_schemes.map(scheme => `<li>${scheme}</li>`).join('')}</ul>` : 
                  '<p class="no-schemes">No eligible schemes found</p>'
                }
                ${dss.notes ? `<div class="scheme-notes">${dss.notes}</div>` : ''}
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
        } else {
          resultsDiv.innerHTML = `
            <div class="no-results">
              <i class="fas fa-search"></i>
              <h4>No results found</h4>
              <p>No claims found matching "${query}". Try a different search term.</p>
            </div>
          `;
        }
      } catch (error) {
        console.error('Error searching:', error);
        resultsDiv.innerHTML = `
          <div class="error-state">
            <i class="fas fa-exclamation-triangle"></i>
            <h4>Search Error</h4>
            <p>There was an error searching for recommendations. Please try again.</p>
          </div>
        `;
      }
    } else {
      resultsDiv.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-lightbulb"></i>
          <p>Search for a holder to get decision support recommendations</p>
        </div>
      `;
    }
  }
}

// Quick action functions
function checkEligibility() {
  console.log('Check eligibility');
  // Add eligibility check functionality
}

function generateReport() {
  console.log('Generate report');
  // Add report generation functionality
}

function viewRecommendations() {
  console.log('View recommendations');
  // Add view recommendations functionality
}

function exportData() {
  console.log('Export data');
  // Add data export functionality
}

function generateRecommendations() {
  console.log('Generate recommendations');
  // Add recommendation generation functionality
}

function viewHistory() {
  console.log('View history');
  // Add history view functionality
}

// Initialize decisions page when DOM is loaded
window.addEventListener('DOMContentLoaded', initDecisions);

