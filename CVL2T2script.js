// Task Manager Application
class TaskManager {
    constructor() {
        this.tasks = this.loadTasks();
        this.currentFilter = 'all';
        this.currentSearch = '';
        this.initializeTheme();
        this.initializeElements();
        this.attachEventListeners();
        this.render();
    }

    initializeTheme() {
        const savedTheme = localStorage.getItem('taskflow_theme') || 'light';
        this.currentTheme = savedTheme;
        this.applyTheme(savedTheme);
    }

    applyTheme(theme) {
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            const icon = document.querySelector('.theme-icon');
            if (icon) icon.textContent = '☀️';
        } else {
            document.documentElement.removeAttribute('data-theme');
            const icon = document.querySelector('.theme-icon');
            if (icon) icon.textContent = '🌙';
        }
        this.currentTheme = theme;
        localStorage.setItem('taskflow_theme', theme);
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
    }

    initializeElements() {
        this.taskForm = document.getElementById('taskForm');
        this.taskInput = document.getElementById('taskInput');
        this.prioritySelect = document.getElementById('prioritySelect');
        this.deadlineInput = document.getElementById('deadlineInput');
        this.taskList = document.getElementById('taskList');
        this.emptyState = document.getElementById('emptyState');
        this.totalTasksEl = document.getElementById('totalTasks');
        this.completedTasksEl = document.getElementById('completedTasks');
        this.clearCompletedBtn = document.getElementById('clearCompleted');
        this.filterButtons = document.querySelectorAll('.filter-btn');
        this.progressFill = document.getElementById('progressFill');
        this.progressPercentage = document.getElementById('progressPercentage');
        this.searchInput = document.getElementById('searchInput');
        this.clearSearchBtn = document.getElementById('clearSearchBtn');
        this.themeSwitcher = document.getElementById('themeSwitcher');
    }

    attachEventListeners() {
        this.taskForm.addEventListener('submit', (e) => this.handleAddTask(e));
        this.clearCompletedBtn.addEventListener('click', () => this.clearCompleted());
        
        this.filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleFilterChange(e));
        });

        // Theme switcher listener
        this.themeSwitcher?.addEventListener('click', () => this.toggleTheme());

        // Search listeners
        this.searchInput?.addEventListener('input', (e) => this.handleSearch(e));
        this.clearSearchBtn?.addEventListener('click', () => this.clearSearch());

        // Download, Share, and Import listeners
        document.getElementById('downloadBtn')?.addEventListener('click', () => this.downloadTasks());
        document.getElementById('shareBtn')?.addEventListener('click', () => this.shareTasks());
        document.getElementById('uploadBtn')?.addEventListener('click', () => this.openImportDialog());
        document.getElementById('importInput')?.addEventListener('change', (e) => this.importTasks(e));
    }

    handleAddTask(e) {
        e.preventDefault();
        const taskText = this.taskInput.value.trim();
        const priority = this.prioritySelect.value;
        const deadline = this.deadlineInput.value;
        
        if (taskText === '') return;

        const newTask = {
            id: Date.now(),
            text: taskText,
            completed: false,
            priority: priority,
            deadline: deadline || null,
            createdAt: new Date().toISOString(),
            notes: ''
        };

        this.tasks.unshift(newTask);
        this.saveTasks();
        this.taskInput.value = '';
        this.deadlineInput.value = '';
        this.render();
    }

    handleFilterChange(e) {
        this.filterButtons.forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        this.currentFilter = e.target.dataset.filter;
        this.render();
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            
            // Trigger celebration when completing a task
            if (task.completed) {
                this.celebrateCompletion();
            }
            
            this.saveTasks();
            this.render();
        }
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.saveTasks();
        this.render();
    }

    updatePriority(id, priority) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.priority = priority;
            this.saveTasks();
            this.render();
        }
    }

    updateDeadline(id, deadline) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.deadline = deadline || null;
            this.saveTasks();
            this.render();
        }
    }

    toggleNotes(id) {
        const notesSection = document.getElementById(`notes-${id}`);
        if (notesSection) {
            notesSection.classList.toggle('show');
            
            // Focus textarea when opening
            if (notesSection.classList.contains('show')) {
                const textarea = notesSection.querySelector('.notes-textarea');
                if (textarea) {
                    setTimeout(() => textarea.focus(), 100);
                }
            }
        }
    }

    updateNotes(id, noteText) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.notes = noteText;
            this.saveTasks();
            
            // Update notes button indicator
            const notesBtn = document.querySelector(`[data-id="${id}"] .notes-btn`);
            if (notesBtn) {
                if (noteText.trim()) {
                    notesBtn.classList.add('has-notes');
                } else {
                    notesBtn.classList.remove('has-notes');
                }
            }
        }
    }

    clearCompleted() {
        this.tasks = this.tasks.filter(t => !t.completed);
        this.saveTasks();
        this.render();
    }

    getFilteredTasks() {
        switch(this.currentFilter) {
            case 'active':
                return this.tasks.filter(t => !t.completed);
            case 'completed':
                return this.tasks.filter(t => t.completed);
            default:
                return this.tasks;
        }
    }

    getSearchedTasks() {
        const filtered = this.getFilteredTasks();
        if (!this.currentSearch.trim()) return filtered;
        
        const searchTerm = this.currentSearch.toLowerCase().trim();
        return filtered.filter(task => 
            task.text.toLowerCase().includes(searchTerm) || 
            task.notes.toLowerCase().includes(searchTerm)
        );
    }

    handleSearch(e) {
        this.currentSearch = e.target.value;
        this.updateClearSearchButton();
        this.render();
    }

    clearSearch() {
        this.currentSearch = '';
        this.searchInput.value = '';
        this.updateClearSearchButton();
        this.render();
    }

    updateClearSearchButton() {
        if (this.searchInput.value.trim()) {
            this.clearSearchBtn?.classList.add('active');
        } else {
            this.clearSearchBtn?.classList.remove('active');
        }
    }

    formatTime(isoString) {
        const date = new Date(isoString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    getDeadlineStatus(deadline) {
        if (!deadline) return { status: 'none', label: '', class: '' };
        
        const deadlineDate = new Date(deadline);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        deadlineDate.setHours(0, 0, 0, 0);
        
        const diffTime = deadlineDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) {
            return { status: 'overdue', label: `${Math.abs(diffDays)}d overdue`, class: 'deadline-overdue' };
        } else if (diffDays === 0) {
            return { status: 'today', label: 'Due today', class: 'deadline-today' };
        } else if (diffDays === 1) {
            return { status: 'tomorrow', label: 'Due tomorrow', class: 'deadline-tomorrow' };
        } else if (diffDays <= 7) {
            return { status: 'upcoming', label: `Due in ${diffDays}d`, class: 'deadline-upcoming' };
        } else {
            return { status: 'future', label: deadlineDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), class: 'deadline-future' };
        }
    }

    render() {
        const filteredTasks = this.getSearchedTasks();
        
        // Update statistics
        const totalTasks = this.tasks.length;
        const completedTasks = this.tasks.filter(t => t.completed).length;
        this.totalTasksEl.textContent = totalTasks;
        this.completedTasksEl.textContent = completedTasks;

        // Update progress bar
        this.updateProgressBar(totalTasks, completedTasks);

        // Show/hide empty state
        if (filteredTasks.length === 0) {
            this.emptyState.classList.remove('hidden');
            this.taskList.innerHTML = '';
            return;
        }

        this.emptyState.classList.add('hidden');

        // Render tasks
        this.taskList.innerHTML = filteredTasks.map(task => {
            const deadlineStatus = this.getDeadlineStatus(task.deadline);
            return `
            <li class="task-item ${task.completed ? 'completed' : ''} priority-${task.priority || 'medium'} ${deadlineStatus.class}" data-id="${task.id}" draggable="true">
                <div class="drag-handle" title="Drag to reorder">⋮⋮</div>
                <div class="priority-indicator" title="Priority: ${task.priority || 'medium'}"></div>
                <div class="task-header">
                    <input 
                        type="checkbox" 
                        class="task-checkbox" 
                        ${task.completed ? 'checked' : ''}
                        onchange="taskManager.toggleTask(${task.id})"
                    >
                    <span class="task-text">${this.escapeHtml(task.text)}</span>
                    <span class="task-time">${this.formatTime(task.createdAt)}</span>
                    ${task.deadline ? `<span class="deadline-badge ${deadlineStatus.class}" title="${deadlineStatus.label}">📅 ${deadlineStatus.label}</span>` : ''}
                    <select 
                        class="priority-dropdown" 
                        onchange="taskManager.updatePriority(${task.id}, this.value)"
                        title="Change priority"
                    >
                        <option value="low" ${task.priority === 'low' ? 'selected' : ''}>Low</option>
                        <option value="medium" ${task.priority === 'medium' ? 'selected' : ''}>Medium</option>
                        <option value="high" ${task.priority === 'high' ? 'selected' : ''}>High</option>
                    </select>
                    <input 
                        type="date" 
                        class="deadline-edit-input" 
                        value="${task.deadline || ''}"
                        onchange="taskManager.updateDeadline(${task.id}, this.value)"
                        title="Edit deadline"
                    >
                    <button 
                        class="notes-btn ${task.notes ? 'has-notes' : ''}" 
                        onclick="taskManager.toggleNotes(${task.id})"
                        aria-label="Toggle notes"
                        title="Add/view notes"
                    >📝</button>
                    <button 
                        class="delete-btn" 
                        onclick="taskManager.deleteTask(${task.id})"
                        aria-label="Delete task"
                    >×</button>
                </div>
                <div class="notes-section" id="notes-${task.id}">
                    <textarea 
                        class="notes-textarea" 
                        placeholder="Add detailed notes for this task..."
                        onchange="taskManager.updateNotes(${task.id}, this.value)"
                    >${this.escapeHtml(task.notes || '')}</textarea>
                </div>
            </li>
        `;
        }).join('');

        // Attach drag event listeners
        this.attachDragListeners();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    attachDragListeners() {
        const taskItems = this.taskList.querySelectorAll('.task-item');
        
        taskItems.forEach(item => {
            item.addEventListener('dragstart', (e) => this.handleDragStart(e));
            item.addEventListener('dragend', (e) => this.handleDragEnd(e));
            item.addEventListener('dragover', (e) => this.handleDragOver(e));
            item.addEventListener('drop', (e) => this.handleDrop(e));
            item.addEventListener('dragenter', (e) => this.handleDragEnter(e));
            item.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        });
    }

    handleDragStart(e) {
        const item = e.currentTarget;
        this.draggedItem = item;
        item.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', item.innerHTML);
    }

    handleDragEnd(e) {
        const item = e.currentTarget;
        item.classList.remove('dragging');
        
        // Remove all drag-over indicators
        this.taskList.querySelectorAll('.task-item').forEach(task => {
            task.classList.remove('drag-over', 'drag-over-bottom');
        });
    }

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        return false;
    }

    handleDragEnter(e) {
        const item = e.currentTarget;
        if (item !== this.draggedItem) {
            item.classList.add('drag-over');
        }
    }

    handleDragLeave(e) {
        const item = e.currentTarget;
        if (e.target === item) {
            item.classList.remove('drag-over');
        }
    }

    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const targetItem = e.currentTarget;
        if (targetItem !== this.draggedItem) {
            // Get task IDs
            const draggedId = parseInt(this.draggedItem.dataset.id);
            const targetId = parseInt(targetItem.dataset.id);
            
            // Swap positions in tasks array
            const draggedIdx = this.tasks.findIndex(t => t.id === draggedId);
            const targetIdx = this.tasks.findIndex(t => t.id === targetId);
            
            if (draggedIdx !== -1 && targetIdx !== -1) {
                [this.tasks[draggedIdx], this.tasks[targetIdx]] = [this.tasks[targetIdx], this.tasks[draggedIdx]];
                this.saveTasks();
                this.render();
            }
        }
        
        targetItem.classList.remove('drag-over');
        return false;
    }

    saveTasks() {
        localStorage.setItem('taskflow_tasks', JSON.stringify(this.tasks));
    }

    loadTasks() {
        const stored = localStorage.getItem('taskflow_tasks');
        return stored ? JSON.parse(stored) : [];
    }

    celebrateCompletion() {
        // Play celebration animation and sound effects
        this.showConfetti();
        this.playCompletionSound();
        this.showCelebrationMessage();
    }

    showConfetti() {
        const canvas = document.getElementById('celebrationCanvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const particles = [];
        const particleCount = 50;
        const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe'];

        // Create particles
        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: -10,
                vx: (Math.random() - 0.5) * 8,
                vy: Math.random() * 3 + 2,
                size: Math.random() * 8 + 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                life: 1,
                decay: Math.random() * 0.01 + 0.008
            });
        }

        function animate() {
            // Clear canvas with semi-transparent background for trail effect
            ctx.fillStyle = 'rgba(255, 255, 255, 0)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            let activeParticles = false;

            particles.forEach((p, idx) => {
                if (p.life <= 0) return;

                activeParticles = true;

                // Update position
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.2; // gravity
                p.life -= p.decay;

                // Draw particle
                ctx.fillStyle = `rgba(102, 126, 234, ${p.life})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();

                // Draw colorful version
                ctx.fillStyle = `${p.color}${Math.round(p.life * 255).toString(16).padStart(2, '0')}`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * 0.7, 0, Math.PI * 2);
                ctx.fill();
            });

            if (activeParticles) {
                requestAnimationFrame(animate);
            } else {
                // Clear canvas when done
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }

        animate();
    }

    playCompletionSound() {
        // Create a simple beep sound using Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800; // Frequency in Hz
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
        } catch (e) {
            // Audio context not supported
        }
    }

    showCelebrationMessage() {
        // Create temporary celebration message
        const message = document.createElement('div');
        message.className = 'celebration-message';
        message.textContent = '🎉 Great job!';
        document.body.appendChild(message);

        // Trigger animation
        setTimeout(() => {
            message.classList.add('show');
        }, 10);

        // Remove after animation
        setTimeout(() => {
            message.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(message);
            }, 300);
        }, 2000);
    }

    updateProgressBar(totalTasks, completedTasks) {
        let percentage = 0;
        if (totalTasks > 0) {
            percentage = Math.round((completedTasks / totalTasks) * 100);
        }

        // Animate progress bar fill
        if (this.progressFill) {
            this.progressFill.style.width = percentage + '%';
            
            // Add color gradient based on completion
            if (percentage === 0) {
                this.progressFill.style.background = 'linear-gradient(90deg, #e5e7eb 0%, #d1d5db 100%)';
            } else if (percentage < 50) {
                this.progressFill.style.background = 'linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)';
            } else if (percentage < 100) {
                this.progressFill.style.background = 'linear-gradient(90deg, #60a5fa 0%, #3b82f6 100%)';
            } else {
                this.progressFill.style.background = 'linear-gradient(90deg, #34d399 0%, #10b981 100%)';
            }
        }

        // Update percentage text
        if (this.progressPercentage) {
            this.progressPercentage.textContent = percentage + '%';
        }
    }

    downloadTasks() {
        if (this.tasks.length === 0) {
            alert('No tasks to download!');
            return;
        }

        const dataToDownload = {
            exportDate: new Date().toISOString(),
            version: '1.0',
            totalTasks: this.tasks.length,
            completedTasks: this.tasks.filter(t => t.completed).length,
            tasks: this.tasks
        };

        const jsonString = JSON.stringify(dataToDownload, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `taskflow_export_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        // Show confirmation
        this.showNotification('Tasks downloaded successfully!');
    }

    shareTasks() {
        if (this.tasks.length === 0) {
            alert('No tasks to share!');
            return;
        }

        // Create a shareable text format
        let shareText = '📋 TaskFlow - My Tasks\n';
        shareText += '='.repeat(40) + '\n\n';

        shareText += '📝 Active Tasks:\n';
        const activeTasks = this.tasks.filter(t => !t.completed);
        if (activeTasks.length > 0) {
            activeTasks.forEach((task, idx) => {
                shareText += `${idx + 1}. ${task.text}\n`;
            });
        } else {
            shareText += 'No active tasks\n';
        }

        shareText += '\n✅ Completed Tasks:\n';
        const completedTasks = this.tasks.filter(t => t.completed);
        if (completedTasks.length > 0) {
            completedTasks.forEach((task, idx) => {
                shareText += `${idx + 1}. ${task.text}\n`;
            });
        } else {
            shareText += 'No completed tasks\n';
        }

        shareText += '\n' + '='.repeat(40) + '\n';
        shareText += `📊 Progress: ${completedTasks.length}/${this.tasks.length} tasks completed\n`;
        shareText += `📅 Exported: ${new Date().toLocaleString()}\n`;

        // Show share modal
        const modal = document.getElementById('shareModal');
        const shareTextarea = document.getElementById('shareText');
        if (modal && shareTextarea) {
            shareTextarea.value = shareText;
            modal.classList.add('show');
        }
    }

    openImportDialog() {
        document.getElementById('importInput')?.click();
    }

    importTasks(event) {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result;
                const data = JSON.parse(content);

                // Validate imported data
                if (!data.tasks || !Array.isArray(data.tasks)) {
                    alert('Invalid file format. Please export from TaskFlow.');
                    return;
                }

                // Ask for confirmation
                const confirmImport = confirm(
                    `Import ${data.tasks.length} tasks?\n\nThis will add to your existing tasks.`
                );

                if (confirmImport) {
                    // Merge with existing tasks
                    this.tasks = [...this.tasks, ...data.tasks];
                    this.saveTasks();
                    this.render();
                    this.showNotification(`✅ Imported ${data.tasks.length} tasks successfully!`);
                }
            } catch (error) {
                alert('Error reading file. Please make sure it\'s a valid JSON file from TaskFlow.');
                console.error('Import error:', error);
            }
        };

        reader.readAsText(file);
        event.target.value = ''; // Reset input
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification show';
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

// Initialize the app when DOM is ready
let taskManager;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        taskManager = new TaskManager();
    });
} else {
    taskManager = new TaskManager();
}

// Utility functions for modals and sharing
function closeShareModal() {
    const modal = document.getElementById('shareModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

function copyShareText() {
    const shareTextarea = document.getElementById('shareText');
    if (shareTextarea) {
        shareTextarea.select();
        document.execCommand('copy');
        
        // Show feedback
        const btn = event.target;
        const originalText = btn.textContent;
        btn.textContent = '✅ Copied!';
        setTimeout(() => {
            btn.textContent = originalText;
        }, 2000);
    }
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    const modal = document.getElementById('shareModal');
    if (modal && e.target === modal) {
        closeShareModal();
    }
});