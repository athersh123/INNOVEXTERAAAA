import { fetchRecords, dssEligibility } from './api.js';

let map, markersLayer, records = [];

// Initialize the atlas
function initAtlas() {
  initMap();
  initSearch();
  initSidebar();
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
        radius: 10, 
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

// Map control functions
function toggleLayers() {
  console.log('Toggle layers');
  // Add layer toggle functionality
}

function exportMap() {
  console.log('Export map');
  // Add map export functionality
}

function toggleFullscreen() {
  const mapContainer = document.querySelector('.map-container');
  if (!document.fullscreenElement) {
    mapContainer.requestFullscreen().catch(err => {
      console.log(`Error attempting to enable fullscreen: ${err.message}`);
    });
  } else {
    document.exitFullscreen();
  }
}

function closeDetails() {
  const detailsPanel = document.getElementById('details');
  detailsPanel.style.display = 'none';
}

// Initialize atlas when DOM is loaded
window.addEventListener('DOMContentLoaded', initAtlas);

