// TaskMaster Goals Page JavaScript
class GoalManager {
    constructor() {
        this.goals = this.loadGoals();
        this.currentCategory = 'daily';
        this.editingGoalId = null;
        
        this.initializeApp();
        this.bindEvents();
    }

    // Initialize the application
    initializeApp() {
        // Initialize with sample data if no goals exist
        if (this.goals.length === 0) {
            this.initializeSampleData();
        }
        
        this.renderAllGoals();
        this.updateGoalsSummary();
        this.setDefaultDueDate();
    }

    // Initialize sample data
    initializeSampleData() {
        const sampleGoals = [
            {
                id: 1,
                title: "Drink 8 glasses of water",
                description: "Stay hydrated throughout the day",
                category: "daily",
                priority: "medium",
                progress: 62,
                completed: false,
                dueDate: "2025-08-20",
                createdAt: "2025-08-20T06:00:00Z",
                status: "in_progress"
            },
            {
                id: 2,
                title: "Learn React.js",
                description: "Complete React course and build 2 projects",
                category: "short_term",
                priority: "high",
                progress: 45,
                completed: false,
                dueDate: "2025-10-15",
                createdAt: "2025-08-01T10:00:00Z",
                status: "in_progress"
            },
            {
                id: 3,
                title: "Exercise for 30 minutes",
                description: "Complete daily workout routine",
                category: "daily",
                priority: "high",
                progress: 100,
                completed: true,
                dueDate: "2025-08-20",
                createdAt: "2025-08-20T07:00:00Z",
                status: "completed"
            },
            {
                id: 4,
                title: "Master Full Stack Development",
                description: "Become proficient in frontend and backend technologies",
                category: "long_term",
                priority: "high",
                progress: 25,
                completed: false,
                dueDate: "2026-08-20",
                createdAt: "2025-01-01T00:00:00Z",
                status: "in_progress"
            },
            {
                id: 5,
                title: "Read 12 books this year",
                description: "Read one book per month to expand knowledge",
                category: "long_term",
                priority: "medium",
                progress: 66,
                completed: false,
                dueDate: "2025-12-31",
                createdAt: "2025-01-01T00:00:00Z",
                status: "in_progress"
            }
        ];
        
        this.goals = sampleGoals;
        this.saveGoals();
    }

    // Bind all event listeners
    bindEvents() {
        // Tab switching - need to handle both button element and any child elements
        document.addEventListener('click', (e) => {
            const tabBtn = e.target.closest('.tab-btn');
            if (tabBtn && tabBtn.dataset.category) {
                e.preventDefault();
                this.switchCategory(tabBtn.dataset.category);
            }
        });

        // Add goal buttons - handle event delegation properly
        document.addEventListener('click', (e) => {
            const addBtn = e.target.closest('.add-goal-btn');
            if (addBtn && addBtn.dataset.category) {
                e.preventDefault();
                this.openGoalModal(addBtn.dataset.category);
            }
        });

        // Profile dropdown
        const profileBtn = document.getElementById('profileBtn');
        const profileDropdown = document.getElementById('profileDropdown');
        
        if (profileBtn && profileDropdown) {
            profileBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                profileDropdown.classList.toggle('show');
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!profileBtn.contains(e.target)) {
                    profileDropdown.classList.remove('show');
                }
            });
        }

        // Hamburger menu for mobile
        const hamburgerBtn = document.getElementById('hamburgerBtn');
        const sidebar = document.getElementById('sidebar');
        const sidebarOverlay = document.getElementById('sidebarOverlay');

        if (hamburgerBtn && sidebar && sidebarOverlay) {
            hamburgerBtn.addEventListener('click', () => {
                sidebar.classList.toggle('show');
                sidebarOverlay.classList.toggle('show');
            });

            sidebarOverlay.addEventListener('click', () => {
                sidebar.classList.remove('show');
                sidebarOverlay.classList.remove('show');
            });
        }

        // Modal events
        this.bindModalEvents();

        // Goal cards event delegation
        document.addEventListener('click', (e) => {
            const goalCard = e.target.closest('.goal-card');
            if (!goalCard) return;

            const goalId = parseInt(goalCard.dataset.goalId);

            if (e.target.closest('.goal-action-btn.edit')) {
                e.preventDefault();
                this.editGoal(goalId);
            } else if (e.target.closest('.goal-action-btn.delete')) {
                e.preventDefault();
                this.deleteGoal(goalId);
            }
        });

        // Progress slider
        const progressSlider = document.getElementById('goalProgress');
        if (progressSlider) {
            progressSlider.addEventListener('input', (e) => {
                const progressValue = document.getElementById('progressValue');
                if (progressValue) {
                    progressValue.textContent = e.target.value;
                }
            });
        }
    }

    // Bind modal events
    bindModalEvents() {
        const goalModal = document.getElementById('goalModal');
        const modalClose = document.getElementById('modalClose');
        const cancelGoal = document.getElementById('cancelGoal');
        const goalForm = document.getElementById('goalForm');

        if (!goalModal || !modalClose || !cancelGoal || !goalForm) return;

        // Close modal events
        [modalClose, cancelGoal].forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.closeGoalModal();
            });
        });

        // Close modal on overlay click
        goalModal.addEventListener('click', (e) => {
            if (e.target === goalModal) {
                this.closeGoalModal();
            }
        });

        // Goal form submission
        goalForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveGoal();
        });

        // Close modal on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !goalModal.classList.contains('hidden')) {
                this.closeGoalModal();
            }
        });
    }

    // Switch between goal categories
    switchCategory(category) {
        this.currentCategory = category;
        
        // Update active tab
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        const activeTab = document.querySelector(`[data-category="${category}"]`);
        if (activeTab) {
            activeTab.classList.add('active');
        }
        
        // Update active category section
        document.querySelectorAll('.goal-category').forEach(section => {
            section.classList.remove('active');
        });
        
        const categoryMap = {
            'daily': 'daily-goals',
            'short_term': 'short-term-goals',
            'long_term': 'long-term-goals'
        };
        
        const activeSection = document.getElementById(categoryMap[category]);
        if (activeSection) {
            activeSection.classList.add('active');
        }
    }

    // Open goal modal
    openGoalModal(category, goalId = null) {
        this.editingGoalId = goalId;
        
        const modal = document.getElementById('goalModal');
        const modalTitle = document.getElementById('modalTitle');
        const progressGroup = document.getElementById('progressGroup');
        const saveBtn = document.getElementById('saveGoal');
        
        if (!modal || !modalTitle || !progressGroup || !saveBtn) return;
        
        if (goalId) {
            // Editing existing goal
            const goal = this.goals.find(g => g.id === goalId);
            if (!goal) return;
            
            modalTitle.textContent = 'Edit Goal';
            saveBtn.textContent = 'Update Goal';
            progressGroup.style.display = 'block';
            
            document.getElementById('goalTitle').value = goal.title;
            document.getElementById('goalDescription').value = goal.description;
            document.getElementById('goalPriority').value = goal.priority;
            document.getElementById('goalDueDate').value = goal.dueDate;
            document.getElementById('goalProgress').value = goal.progress;
            document.getElementById('progressValue').textContent = goal.progress;
            document.getElementById('goalCategory').value = goal.category;
            document.getElementById('goalId').value = goal.id;
        } else {
            // Adding new goal
            modalTitle.textContent = 'Add New Goal';
            saveBtn.textContent = 'Save Goal';
            progressGroup.style.display = 'none';
            
            document.getElementById('goalForm').reset();
            document.getElementById('goalCategory').value = category;
            document.getElementById('goalId').value = '';
            document.getElementById('progressValue').textContent = '0';
            this.setDefaultDueDate(category);
        }
        
        modal.classList.remove('hidden');
        const goalTitleInput = document.getElementById('goalTitle');
        if (goalTitleInput) {
            goalTitleInput.focus();
        }
    }

    // Close goal modal
    closeGoalModal() {
        this.editingGoalId = null;
        const modal = document.getElementById('goalModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    // Save goal (create or update)
    saveGoal() {
        const title = document.getElementById('goalTitle').value.trim();
        const description = document.getElementById('goalDescription').value.trim();
        const priority = document.getElementById('goalPriority').value;
        const dueDate = document.getElementById('goalDueDate').value;
        const progress = parseInt(document.getElementById('goalProgress').value) || 0;
        const category = document.getElementById('goalCategory').value;
        const goalId = document.getElementById('goalId').value;

        if (!title) {
            this.showNotification('Please enter a goal title', 'error');
            return;
        }

        if (!dueDate) {
            this.showNotification('Please select a due date', 'error');
            return;
        }

        if (goalId) {
            // Update existing goal
            const goal = this.goals.find(g => g.id === parseInt(goalId));
            if (goal) {
                goal.title = title;
                goal.description = description;
                goal.priority = priority;
                goal.dueDate = dueDate;
                goal.progress = progress;
                goal.completed = progress === 100;
                goal.status = this.getGoalStatus(progress, goal.completed);
            }
        } else {
            // Create new goal
            const newGoal = {
                id: Date.now(),
                title,
                description,
                category,
                priority,
                progress: 0,
                completed: false,
                dueDate,
                createdAt: new Date().toISOString(),
                status: 'not_started'
            };
            this.goals.push(newGoal);
        }

        this.saveGoals();
        this.closeGoalModal();
        this.renderAllGoals();
        this.updateGoalsSummary();
        
        this.showNotification(
            goalId ? 'Goal updated successfully' : 'Goal added successfully', 
            'success'
        );
    }

    // Edit goal
    editGoal(goalId) {
        const goal = this.goals.find(g => g.id === goalId);
        if (!goal) return;
        
        this.openGoalModal(goal.category, goalId);
    }

    // Delete goal
    deleteGoal(goalId) {
        const goal = this.goals.find(g => g.id === goalId);
        if (!goal) return;

        if (confirm(`Are you sure you want to delete "${goal.title}"?`)) {
            this.goals = this.goals.filter(g => g.id !== goalId);
            this.saveGoals();
            this.renderAllGoals();
            this.updateGoalsSummary();
            this.showNotification('Goal deleted successfully', 'success');
        }
    }

    // Get goal status based on progress and completion
    getGoalStatus(progress, completed) {
        if (completed) return 'completed';
        if (progress > 0) return 'in_progress';
        return 'not_started';
    }

    // Render all goals
    renderAllGoals() {
        this.renderGoalsByCategory('daily');
        this.renderGoalsByCategory('short_term');
        this.renderGoalsByCategory('long_term');
    }

    // Render goals by category
    renderGoalsByCategory(category) {
        const categoryGoals = this.goals.filter(goal => goal.category === category);
        const containerId = category === 'short_term' ? 'shortTermGoalsList' : 
                           category === 'long_term' ? 'longTermGoalsList' : 'dailyGoalsList';
        const emptyStateId = category === 'short_term' ? 'shortTermEmptyState' : 
                            category === 'long_term' ? 'longTermEmptyState' : 'dailyEmptyState';
        
        const container = document.getElementById(containerId);
        const emptyState = document.getElementById(emptyStateId);

        if (!container || !emptyState) return;

        if (categoryGoals.length === 0) {
            container.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        container.style.display = 'grid';
        emptyState.style.display = 'none';

        container.innerHTML = categoryGoals.map(goal => this.createGoalCard(goal)).join('');
    }

    // Create goal card HTML
    createGoalCard(goal) {
        const dueDate = new Date(goal.dueDate);
        const today = new Date();
        const isOverdue = dueDate < today && !goal.completed;
        const isDueSoon = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24)) <= 3 && !goal.completed;
        
        return `
            <div class="goal-card ${goal.completed ? 'completed' : ''}" 
                 data-goal-id="${goal.id}" 
                 data-category="${goal.category}">
                <div class="goal-status ${goal.status}">
                    ${goal.status.replace('_', ' ')}
                </div>
                <div class="goal-card-header">
                    <h4 class="goal-title">${this.escapeHtml(goal.title)}</h4>
                    <div class="goal-actions">
                        <button class="goal-action-btn edit" title="Edit goal">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="goal-action-btn delete" title="Delete goal">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                ${goal.description ? `<p class="goal-description">${this.escapeHtml(goal.description)}</p>` : ''}
                <div class="goal-progress">
                    <div class="progress-header">
                        <span class="progress-label">Progress</span>
                        <span class="progress-percentage">${goal.progress}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${goal.progress}%"></div>
                    </div>
                </div>
                <div class="goal-meta">
                    <div class="goal-priority">
                        <span class="priority-badge priority-${goal.priority}">${goal.priority}</span>
                    </div>
                    <div class="goal-due-date ${isOverdue ? 'overdue' : isDueSoon ? 'due-soon' : ''}">
                        <i class="fas fa-calendar"></i>
                        ${this.formatDueDate(goal.dueDate)}
                    </div>
                </div>
            </div>
        `;
    }

    // Update goals summary
    updateGoalsSummary() {
        const dailyGoals = this.goals.filter(g => g.category === 'daily').length;
        const shortTermGoals = this.goals.filter(g => g.category === 'short_term').length;
        const longTermGoals = this.goals.filter(g => g.category === 'long_term').length;

        const dailyCount = document.getElementById('dailyGoalsCount');
        const shortTermCount = document.getElementById('shortTermGoalsCount');
        const longTermCount = document.getElementById('longTermGoalsCount');

        if (dailyCount) dailyCount.textContent = dailyGoals;
        if (shortTermCount) shortTermCount.textContent = shortTermGoals;
        if (longTermCount) longTermCount.textContent = longTermGoals;
    }

    // Set default due date based on category
    setDefaultDueDate(category) {
        const today = new Date();
        const categoryToUse = category || this.currentCategory;
        let dueDate = new Date(today);

        switch (categoryToUse) {
            case 'daily':
                // Due today
                break;
            case 'short_term':
                // Due in 30 days
                dueDate.setDate(today.getDate() + 30);
                break;
            case 'long_term':
                // Due in 1 year
                dueDate.setFullYear(today.getFullYear() + 1);
                break;
        }

        const dueDateInput = document.getElementById('goalDueDate');
        if (dueDateInput) {
            dueDateInput.value = dueDate.toISOString().split('T')[0];
        }
    }

    // Format due date for display
    formatDueDate(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        const diffTime = date - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return 'Due today';
        } else if (diffDays === 1) {
            return 'Due tomorrow';
        } else if (diffDays === -1) {
            return 'Due yesterday';
        } else if (diffDays < 0) {
            return `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? 's' : ''}`;
        } else if (diffDays <= 7) {
            return `Due in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
        } else {
            return date.toLocaleDateString();
        }
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
                    max-width: 300px;
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
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Local storage methods
    loadGoals() {
        try {
            const goals = localStorage.getItem('taskmaster-goals');
            return goals ? JSON.parse(goals) : [];
        } catch (error) {
            console.error('Error loading goals:', error);
            return [];
        }
    }

    saveGoals() {
        try {
            localStorage.setItem('taskmaster-goals', JSON.stringify(this.goals));
        } catch (error) {
            console.error('Error saving goals:', error);
        }
    }

    // Utility methods
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new GoalManager();
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