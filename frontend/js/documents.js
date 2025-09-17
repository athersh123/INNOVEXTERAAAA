// Initialize the documents page
function initDocuments() {
  initSidebar();
  initFileUpload();
  initViewOptions();
  initCategories();
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

// Initialize file upload
function initFileUpload() {
  const fileUpload = document.getElementById('fileUpload');
  const uploadArea = document.querySelector('.upload-area');
  
  if (fileUpload) {
    fileUpload.addEventListener('change', handleFileUpload);
  }
  
  if (uploadArea) {
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('drop', handleDrop);
    uploadArea.addEventListener('dragleave', handleDragLeave);
  }
}

// Initialize view options
function initViewOptions() {
  const viewButtons = document.querySelectorAll('.view-btn');
  viewButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      viewButtons.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
    });
  });
}

// Initialize categories
function initCategories() {
  const categoryCards = document.querySelectorAll('.category-card');
  categoryCards.forEach(card => {
    card.addEventListener('click', (e) => {
      const category = e.currentTarget.querySelector('h4').textContent;
      filterByCategory(category);
    });
  });
}

// Handle file upload
function handleFileUpload(event) {
  const files = event.target.files;
  if (files.length > 0) {
    uploadFiles(files);
  }
}

// Handle drag over
function handleDragOver(event) {
  event.preventDefault();
  event.currentTarget.classList.add('drag-over');
}

// Handle drop
function handleDrop(event) {
  event.preventDefault();
  event.currentTarget.classList.remove('drag-over');
  const files = event.dataTransfer.files;
  if (files.length > 0) {
    uploadFiles(files);
  }
}

// Handle drag leave
function handleDragLeave(event) {
  event.currentTarget.classList.remove('drag-over');
}

// Upload files
function uploadFiles(files) {
  const documentGrid = document.getElementById('documentGrid');
  
  // Clear empty state
  const emptyState = documentGrid.querySelector('.empty-state');
  if (emptyState) {
    emptyState.remove();
  }
  
  Array.from(files).forEach(file => {
    const documentCard = createDocumentCard(file);
    documentGrid.appendChild(documentCard);
  });
  
  // Show success message
  showNotification(`${files.length} file(s) uploaded successfully`, 'success');
}

// Create document card
function createDocumentCard(file) {
  const card = document.createElement('div');
  card.className = 'document-card';
  
  const fileIcon = getFileIcon(file.type);
  const fileSize = formatFileSize(file.size);
  
  card.innerHTML = `
    <div class="document-icon">
      <i class="${fileIcon}"></i>
    </div>
    <div class="document-info">
      <h4>${file.name}</h4>
      <p>${fileSize}</p>
      <div class="document-actions">
        <button class="action-btn small" onclick="viewDocument('${file.name}')">
          <i class="fas fa-eye"></i>
        </button>
        <button class="action-btn small" onclick="downloadDocument('${file.name}')">
          <i class="fas fa-download"></i>
        </button>
        <button class="action-btn small danger" onclick="deleteDocument('${file.name}')">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>
  `;
  
  return card;
}

// Get file icon based on type
function getFileIcon(type) {
  if (type.includes('pdf')) return 'fas fa-file-pdf';
  if (type.includes('image')) return 'fas fa-file-image';
  if (type.includes('word')) return 'fas fa-file-word';
  if (type.includes('excel') || type.includes('spreadsheet')) return 'fas fa-file-excel';
  return 'fas fa-file';
}

// Format file size
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Set view mode
function setView(mode) {
  const documentGrid = document.getElementById('documentGrid');
  if (mode === 'list') {
    documentGrid.classList.add('list-view');
  } else {
    documentGrid.classList.remove('list-view');
  }
}

// Filter by category
function filterByCategory(category) {
  console.log(`Filter by category: ${category}`);
  // Add category filtering functionality
}

// Document actions
function viewDocument(filename) {
  console.log(`View document: ${filename}`);
  // Add document view functionality
}

function downloadDocument(filename) {
  console.log(`Download document: ${filename}`);
  // Add document download functionality
}

function deleteDocument(filename) {
  console.log(`Delete document: ${filename}`);
  // Add document delete functionality
}

function uploadDocument() {
  document.getElementById('fileUpload').click();
}

function createFolder() {
  console.log('Create folder');
  // Add folder creation functionality
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

// Initialize documents page when DOM is loaded
window.addEventListener('DOMContentLoaded', initDocuments);

