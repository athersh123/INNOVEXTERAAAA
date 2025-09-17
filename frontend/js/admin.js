// Initialize the admin page
function initAdmin() {
  initSidebar();
  initAdminTabs();
  initUserActions();
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

// Initialize admin tabs
function initAdminTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tabName = e.currentTarget.getAttribute('onclick').match(/'([^']+)'/)[1];
      showAdminTab(tabName);
    });
  });
}

// Initialize user actions
function initUserActions() {
  const editButtons = document.querySelectorAll('[onclick*="editUser"]');
  const deleteButtons = document.querySelectorAll('[onclick*="deleteUser"]');
  
  editButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const userId = e.currentTarget.getAttribute('onclick').match(/editUser\((\d+)\)/)[1];
      editUser(userId);
    });
  });
  
  deleteButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const userId = e.currentTarget.getAttribute('onclick').match(/deleteUser\((\d+)\)/)[1];
      deleteUser(userId);
    });
  });
}

// Show admin tab
function showAdminTab(tabName) {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContent = document.getElementById('adminTabContent');
  
  // Remove active class from all tabs
  tabButtons.forEach(btn => btn.classList.remove('active'));
  
  // Add active class to clicked tab
  event.target.classList.add('active');
  
  if (tabContent) {
    switch(tabName) {
      case 'users':
        tabContent.innerHTML = `
          <div class="users-tab">
            <div class="tab-header">
              <h3>User Management</h3>
              <button class="action-btn primary" onclick="addUser()">
                <i class="fas fa-plus"></i>
                Add User
              </button>
            </div>
            
            <div class="users-table">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Last Login</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <div class="user-info">
                        <div class="user-avatar small">
                          <i class="fas fa-user"></i>
                        </div>
                        <span>Admin User</span>
                      </div>
                    </td>
                    <td>admin@fratlas.com</td>
                    <td><span class="role-badge admin">Administrator</span></td>
                    <td><span class="status-badge active">Active</span></td>
                    <td>2 hours ago</td>
                    <td>
                      <button class="action-btn small" onclick="editUser(1)">
                        <i class="fas fa-edit"></i>
                      </button>
                      <button class="action-btn small danger" onclick="deleteUser(1)">
                        <i class="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <div class="user-info">
                        <div class="user-avatar small">
                          <i class="fas fa-user"></i>
                        </div>
                        <span>John Doe</span>
                      </div>
                    </td>
                    <td>john@fratlas.com</td>
                    <td><span class="role-badge user">User</span></td>
                    <td><span class="status-badge active">Active</span></td>
                    <td>1 day ago</td>
                    <td>
                      <button class="action-btn small" onclick="editUser(2)">
                        <i class="fas fa-edit"></i>
                      </button>
                      <button class="action-btn small danger" onclick="deleteUser(2)">
                        <i class="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
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
              <div class="setting-item">
                <label>Email Notifications</label>
                <input type="checkbox" checked />
              </div>
              <div class="setting-item">
                <label>Auto Backup</label>
                <input type="checkbox" checked />
              </div>
              <div class="setting-actions">
                <button class="action-btn primary" onclick="saveSettings()">
                  <i class="fas fa-save"></i>
                  Save Settings
                </button>
                <button class="action-btn secondary" onclick="resetSettings()">
                  <i class="fas fa-undo"></i>
                  Reset
                </button>
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
              <div class="log-entry">
                <span class="log-time">2024-01-15 10:25:12</span>
                <span class="log-level warning">WARN</span>
                <span class="log-message">High memory usage detected</span>
              </div>
              <div class="log-entry">
                <span class="log-time">2024-01-15 10:20:33</span>
                <span class="log-level info">INFO</span>
                <span class="log-message">User login: admin@fratlas.com</span>
              </div>
              <div class="log-entry">
                <span class="log-time">2024-01-15 10:15:21</span>
                <span class="log-level error">ERROR</span>
                <span class="log-message">Database connection timeout</span>
              </div>
            </div>
          </div>
        `;
        break;
        
      case 'security':
        tabContent.innerHTML = `
          <div class="security-tab">
            <h3>Security Settings</h3>
            <div class="security-sections">
              <div class="security-section">
                <h4>Password Policy</h4>
                <div class="setting-item">
                  <label>Minimum Length</label>
                  <input type="number" value="8" min="6" max="20" />
                </div>
                <div class="setting-item">
                  <label>Require Special Characters</label>
                  <input type="checkbox" checked />
                </div>
              </div>
              <div class="security-section">
                <h4>Session Management</h4>
                <div class="setting-item">
                  <label>Session Timeout (minutes)</label>
                  <input type="number" value="30" min="5" max="120" />
                </div>
                <div class="setting-item">
                  <label>Require Re-authentication</label>
                  <input type="checkbox" checked />
                </div>
              </div>
            </div>
          </div>
        `;
        break;
    }
  }
}

// User management functions
function addUser() {
  console.log('Add user');
  showNotification('Add user dialog opened', 'info');
}

function editUser(userId) {
  console.log(`Edit user: ${userId}`);
  showNotification(`Edit user dialog opened for user ${userId}`, 'info');
}

function deleteUser(userId) {
  if (confirm('Are you sure you want to delete this user?')) {
    console.log(`Delete user: ${userId}`);
    showNotification(`User ${userId} deleted successfully`, 'success');
  }
}

// Settings functions
function saveSettings() {
  console.log('Save settings');
  showNotification('Settings saved successfully', 'success');
}

function resetSettings() {
  if (confirm('Are you sure you want to reset all settings to default?')) {
    console.log('Reset settings');
    showNotification('Settings reset to default', 'info');
  }
}

// System functions
function backupSystem() {
  console.log('Backup system');
  showNotification('System backup started', 'info');
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

// Initialize admin page when DOM is loaded
window.addEventListener('DOMContentLoaded', initAdmin);

