// TaskMaster Application JavaScript
class TaskManager {
    constructor() {
        this.tasks = this.loadTasks();
        this.activities = this.loadActivities();
        this.currentFilter = 'all';
        this.searchTerm = '';
        this.editingTaskId = null;
        
        this.initializeApp();
        this.bindEvents();
    }

    // Initialize the application
    initializeApp() {
        // Initialize with sample data if no tasks exist
        if (this.tasks.length === 0) {
            this.initializeSampleData();
        }
        
        this.renderTasks();
        this.updateTaskSummary();
        this.renderRecentActivity();
    }

    // Initialize sample data
    initializeSampleData() {
        const sampleTasks = [
            {
                id: 1,
                title: "Complete project documentation",
                completed: false,
                priority: "high",
                createdAt: "2025-08-20T10:00:00Z"
            },
            {
                id: 2,
                title: "Review code changes",
                completed: true,
                priority: "medium",
                createdAt: "2025-08-19T14:30:00Z"
            },
            {
                id: 3,
                title: "Update team on progress",
                completed: false,
                priority: "low",
                createdAt: "2025-08-18T09:15:00Z"
            }
        ];
        
        this.tasks = sampleTasks;
        this.saveTasks();
        
        // Add sample activities
        this.activities = [
            {
                id: 1,
                type: 'completed',
                taskTitle: 'Review code changes',
                timestamp: new Date().toISOString()
            }
        ];
        this.saveActivities();
    }

    // Bind all event listeners
    bindEvents() {
        // Task form submission
        document.getElementById('taskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTask();
        });

        // Search input
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.searchTerm = e.target.value.toLowerCase();
            this.renderTasks();
        });

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });

        // Profile dropdown
        const profileBtn = document.getElementById('profileBtn');
        const profileDropdown = document.getElementById('profileDropdown');
        
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            profileDropdown.classList.toggle('show');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            profileDropdown.classList.remove('show');
        });

        // Hamburger menu for mobile
        const hamburgerBtn = document.getElementById('hamburgerBtn');
        const sidebar = document.getElementById('sidebar');
        const sidebarOverlay = document.getElementById('sidebarOverlay');

        hamburgerBtn.addEventListener('click', () => {
            sidebar.classList.toggle('show');
            sidebarOverlay.classList.toggle('show');
        });

        sidebarOverlay.addEventListener('click', () => {
            sidebar.classList.remove('show');
            sidebarOverlay.classList.remove('show');
        });

        // Modal events
        this.bindModalEvents();

        // Task list event delegation
        document.getElementById('taskList').addEventListener('click', (e) => {
            const taskItem = e.target.closest('.task-item');
            if (!taskItem) return;

            const taskId = parseInt(taskItem.dataset.taskId);

            if (e.target.matches('.task-checkbox') || e.target.closest('.task-checkbox')) {
                this.toggleTask(taskId);
            } else if (e.target.matches('.action-btn.edit') || e.target.closest('.action-btn.edit')) {
                this.openEditModal(taskId);
            } else if (e.target.matches('.action-btn.delete') || e.target.closest('.action-btn.delete')) {
                this.deleteTask(taskId);
            }
        });
    }

    // Bind modal events
    bindModalEvents() {
        const editModal = document.getElementById('editModal');
        const modalClose = document.getElementById('modalClose');
        const cancelEdit = document.getElementById('cancelEdit');
        const editForm = document.getElementById('editForm');

        // Close modal events
        [modalClose, cancelEdit].forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeEditModal();
            });
        });

        // Close modal on overlay click
        editModal.addEventListener('click', (e) => {
            if (e.target === editModal) {
                this.closeEditModal();
            }
        });

        // Edit form submission
        editForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveEditedTask();
        });

        // Close modal on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !editModal.classList.contains('hidden')) {
                this.closeEditModal();
            }
        });
    }

    // Add new task
    addTask() {
        const taskInput = document.getElementById('taskInput');
        const prioritySelect = document.getElementById('prioritySelect');
        
        const title = taskInput.value.trim();
        const priority = prioritySelect.value;

        if (!title) {
            this.showNotification('Please enter a task title', 'error');
            return;
        }

        const newTask = {
            id: Date.now(),
            title,
            completed: false,
            priority,
            createdAt: new Date().toISOString()
        };

        this.tasks.unshift(newTask);
        this.saveTasks();
        
        // Add to recent activity
        this.addActivity('created', title);
        
        // Reset form
        taskInput.value = '';
        prioritySelect.value = 'medium';
        
        // Update UI
        this.renderTasks();
        this.updateTaskSummary();
        this.renderRecentActivity();
        
        this.showNotification('Task added successfully', 'success');
    }

    // Toggle task completion
    toggleTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        task.completed = !task.completed;
        this.saveTasks();
        
        // Add to recent activity
        this.addActivity(task.completed ? 'completed' : 'uncompleted', task.title);
        
        // Update UI
        this.renderTasks();
        this.updateTaskSummary();
        this.renderRecentActivity();
        
        this.showNotification(
            `Task ${task.completed ? 'completed' : 'uncompleted'}`, 
            'success'
        );
    }

    // Delete task
    deleteTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        if (confirm('Are you sure you want to delete this task?')) {
            this.tasks = this.tasks.filter(t => t.id !== taskId);
            this.saveTasks();
            
            // Add to recent activity
            this.addActivity('deleted', task.title);
            
            // Update UI
            this.renderTasks();
            this.updateTaskSummary();
            this.renderRecentActivity();
            
            this.showNotification('Task deleted successfully', 'success');
        }
    }

    // Open edit modal
    openEditModal(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        this.editingTaskId = taskId;
        
        document.getElementById('editTaskInput').value = task.title;
        document.getElementById('editPrioritySelect').value = task.priority;
        
        document.getElementById('editModal').classList.remove('hidden');
    }

    // Close edit modal
    closeEditModal() {
        this.editingTaskId = null;
        document.getElementById('editModal').classList.add('hidden');
    }

    // Save edited task
    saveEditedTask() {
        const task = this.tasks.find(t => t.id === this.editingTaskId);
        if (!task) return;

        const newTitle = document.getElementById('editTaskInput').value.trim();
        const newPriority = document.getElementById('editPrioritySelect').value;

        if (!newTitle) {
            this.showNotification('Please enter a task title', 'error');
            return;
        }

        task.title = newTitle;
        task.priority = newPriority;
        
        this.saveTasks();
        this.closeEditModal();
        
        // Add to recent activity
        this.addActivity('edited', task.title);
        
        // Update UI
        this.renderTasks();
        this.renderRecentActivity();
        
        this.showNotification('Task updated successfully', 'success');
    }

    // Set filter
    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update active filter button
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
        
        this.renderTasks();
    }

    // Get filtered tasks
    getFilteredTasks() {
        let filtered = this.tasks;

        // Apply completion filter
        switch (this.currentFilter) {
            case 'active':
                filtered = filtered.filter(task => !task.completed);
                break;
            case 'completed':
                filtered = filtered.filter(task => task.completed);
                break;
        }

        // Apply search filter
        if (this.searchTerm) {
            filtered = filtered.filter(task =>
                task.title.toLowerCase().includes(this.searchTerm)
            );
        }

        return filtered;
    }

    // Render tasks
    renderTasks() {
        const taskList = document.getElementById('taskList');
        const emptyState = document.getElementById('emptyState');
        const filteredTasks = this.getFilteredTasks();

        if (filteredTasks.length === 0) {
            taskList.style.display = 'none';
            emptyState.style.display = 'block';
            
            if (this.searchTerm) {
                emptyState.innerHTML = `
                    <i class="fas fa-search"></i>
                    <h4>No tasks found</h4>
                    <p>Try adjusting your search or filter criteria.</p>
                `;
            } else {
                emptyState.innerHTML = `
                    <i class="fas fa-tasks"></i>
                    <h4>No tasks yet</h4>
                    <p>Add your first task above to get started!</p>
                `;
            }
            return;
        }

        taskList.style.display = 'block';
        emptyState.style.display = 'none';

        taskList.innerHTML = filteredTasks.map(task => `
            <div class="task-item ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
                <div class="task-checkbox ${task.completed ? 'checked' : ''}">
                    ${task.completed ? '<i class="fas fa-check"></i>' : ''}
                </div>
                <div class="task-content">
                    <h4 class="task-title">${this.escapeHtml(task.title)}</h4>
                    <div class="task-meta">
                        <span class="priority-badge priority-${task.priority}">${task.priority}</span>
                        <span class="task-date">${this.formatDate(task.createdAt)}</span>
                    </div>
                </div>
                <div class="task-actions">
                    <button class="action-btn edit" title="Edit task">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" title="Delete task">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Update task summary
    updateTaskSummary() {
        const totalTasks = this.tasks.length;
        const completedTasks = this.tasks.filter(task => task.completed).length;
        const pendingTasks = totalTasks - completedTasks;

        document.getElementById('totalTasks').textContent = totalTasks;
        document.getElementById('completedTasks').textContent = completedTasks;
        document.getElementById('pendingTasks').textContent = pendingTasks;
    }

    // Add activity
    addActivity(type, taskTitle) {
        const activity = {
            id: Date.now(),
            type,
            taskTitle,
            timestamp: new Date().toISOString()
        };

        this.activities.unshift(activity);
        
        // Keep only last 10 activities
        this.activities = this.activities.slice(0, 10);
        this.saveActivities();
    }

    // Render recent activity
    renderRecentActivity() {
        const activityList = document.getElementById('activityList');
        const emptyActivity = document.getElementById('emptyActivity');

        if (this.activities.length === 0) {
            activityList.style.display = 'none';
            emptyActivity.style.display = 'block';
            return;
        }

        activityList.style.display = 'block';
        emptyActivity.style.display = 'none';

        activityList.innerHTML = this.activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas ${this.getActivityIcon(activity.type)}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-text">
                        ${this.getActivityText(activity.type, activity.taskTitle)}
                    </div>
                    <div class="activity-time">
                        ${this.getRelativeTime(activity.timestamp)}
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Get activity icon
    getActivityIcon(type) {
        const icons = {
            created: 'fa-plus',
            completed: 'fa-check',
            uncompleted: 'fa-undo',
            edited: 'fa-edit',
            deleted: 'fa-trash'
        };
        return icons[type] || 'fa-info';
    }

    // Get activity text
    getActivityText(type, taskTitle) {
        const actions = {
            created: 'Created',
            completed: 'Completed',
            uncompleted: 'Uncompleted',
            edited: 'Edited',
            deleted: 'Deleted'
        };
        return `${actions[type] || 'Updated'} "${this.escapeHtml(taskTitle)}"`;
    }

    // Show notification
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;

        // Add styles for notification
        if (!document.getElementById('notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'notification-styles';
            styles.textContent = `
                .notification {
                    position: fixed;
                    top: 80px;
                    right: 20px;
                    background: var(--color-surface);
                    border: 1px solid var(--color-border);
                    border-radius: var(--radius-base);
                    box-shadow: var(--shadow-lg);
                    padding: var(--space-12) var(--space-16);
                    z-index: 1001;
                    transform: translateX(100%);
                    transition: transform var(--duration-normal) var(--ease-standard);
                }
                .notification.show {
                    transform: translateX(0);
                }
                .notification-content {
                    display: flex;
                    align-items: center;
                    gap: var(--space-8);
                }
                .notification-success {
                    border-left: 4px solid var(--color-success);
                }
                .notification-error {
                    border-left: 4px solid var(--color-error);
                }
                .notification-info {
                    border-left: 4px solid var(--color-info);
                }
            `;
            document.head.appendChild(styles);
        }

        // Add to DOM and show
        document.body.appendChild(notification);
        
        // Trigger animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    // Local storage methods
    loadTasks() {
        try {
            const tasks = localStorage.getItem('taskmaster-tasks');
            return tasks ? JSON.parse(tasks) : [];
        } catch (error) {
            console.error('Error loading tasks:', error);
            return [];
        }
    }

    saveTasks() {
        try {
            localStorage.setItem('taskmaster-tasks', JSON.stringify(this.tasks));
        } catch (error) {
            console.error('Error saving tasks:', error);
        }
    }

    loadActivities() {
        try {
            const activities = localStorage.getItem('taskmaster-activities');
            return activities ? JSON.parse(activities) : [];
        } catch (error) {
            console.error('Error loading activities:', error);
            return [];
        }
    }

    saveActivities() {
        try {
            localStorage.setItem('taskmaster-activities', JSON.stringify(this.activities));
        } catch (error) {
            console.error('Error saving activities:', error);
        }
    }

    // Utility methods
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            return 'Today';
        } else if (diffDays === 2) {
            return 'Yesterday';
        } else if (diffDays <= 7) {
            return `${diffDays - 1} days ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    getRelativeTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffMinutes < 1) {
            return 'Just now';
        } else if (diffMinutes < 60) {
            return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
        } else if (diffHours < 24) {
            return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        } else {
            return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TaskManager();
});

// Service Worker registration for offline functionality (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}