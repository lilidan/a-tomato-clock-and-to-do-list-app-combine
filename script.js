class PomodoroApp {
    constructor() {
        this.workTime = 25;
        this.breakTime = 5;
        this.currentTime = this.workTime * 60;
        this.isWorking = true;
        this.isRunning = false;
        this.sessionCount = 0;
        this.timer = null;
        this.todos = JSON.parse(localStorage.getItem('pomodoro-todos')) || [];
        this.currentFilter = 'all';
        
        this.initializeElements();
        this.bindEvents();
        this.updateDisplay();
        this.renderTodos();
        this.updateStats();
    }
    
    initializeElements() {
        this.timeDisplay = document.getElementById('timeDisplay');
        this.sessionType = document.getElementById('sessionType');
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.workTimeSlider = document.getElementById('workTime');
        this.breakTimeSlider = document.getElementById('breakTime');
        this.workTimeLabel = document.getElementById('workTimeLabel');
        this.breakTimeLabel = document.getElementById('breakTimeLabel');
        this.sessionCountDisplay = document.getElementById('sessionCount');
        this.todoInput = document.getElementById('todoInput');
        this.addTodoBtn = document.getElementById('addTodoBtn');
        this.todoList = document.getElementById('todoList');
        this.todoStats = document.getElementById('todoStats');
        this.clearCompleted = document.getElementById('clearCompleted');
        this.filterBtns = document.querySelectorAll('.filter-btn');
    }
    
    bindEvents() {
        this.startBtn.addEventListener('click', () => this.start());
        this.pauseBtn.addEventListener('click', () => this.pause());
        this.resetBtn.addEventListener('click', () => this.reset());
        
        this.workTimeSlider.addEventListener('input', (e) => {
            this.workTime = parseInt(e.target.value);
            this.workTimeLabel.textContent = this.workTime;
            if (this.isWorking && !this.isRunning) {
                this.currentTime = this.workTime * 60;
                this.updateDisplay();
            }
        });
        
        this.breakTimeSlider.addEventListener('input', (e) => {
            this.breakTime = parseInt(e.target.value);
            this.breakTimeLabel.textContent = this.breakTime;
            if (!this.isWorking && !this.isRunning) {
                this.currentTime = this.breakTime * 60;
                this.updateDisplay();
            }
        });
        
        this.addTodoBtn.addEventListener('click', () => this.addTodo());
        this.todoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTodo();
        });
        
        this.clearCompleted.addEventListener('click', () => this.clearCompletedTodos());
        
        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.setFilter(e.target.dataset.filter));
        });
    }
    
    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.timer = setInterval(() => this.tick(), 1000);
            this.startBtn.disabled = true;
            this.pauseBtn.disabled = false;
        }
    }
    
    pause() {
        if (this.isRunning) {
            this.isRunning = false;
            clearInterval(this.timer);
            this.startBtn.disabled = false;
            this.pauseBtn.disabled = true;
        }
    }
    
    reset() {
        this.pause();
        this.currentTime = this.isWorking ? this.workTime * 60 : this.breakTime * 60;
        this.updateDisplay();
    }
    
    tick() {
        this.currentTime--;
        this.updateDisplay();
        
        if (this.currentTime <= 0) {
            this.pause();
            this.switchSession();
            this.playNotification();
        }
    }
    
    switchSession() {
        if (this.isWorking) {
            this.sessionCount++;
            this.sessionCountDisplay.textContent = this.sessionCount;
            this.isWorking = false;
            this.currentTime = this.breakTime * 60;
            this.sessionType.textContent = 'Break Time';
        } else {
            this.isWorking = true;
            this.currentTime = this.workTime * 60;
            this.sessionType.textContent = 'Work Session';
        }
        this.updateDisplay();
    }
    
    updateDisplay() {
        const minutes = Math.floor(this.currentTime / 60);
        const seconds = this.currentTime % 60;
        this.timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        if (!this.isRunning) {
            this.startBtn.disabled = false;
            this.pauseBtn.disabled = true;
        }
    }
    
    playNotification() {
        if ('Notification' in window) {
            if (Notification.permission === 'granted') {
                new Notification(this.isWorking ? 'Break time is over!' : 'Work session completed!', {
                    body: this.isWorking ? 'Time to get back to work!' : 'Take a well-deserved break!',
                    icon: '🍅'
                });
            } else if (Notification.permission !== 'denied') {
                Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                        this.playNotification();
                    }
                });
            }
        }
    }
    
    addTodo() {
        const text = this.todoInput.value.trim();
        if (text) {
            const todo = {
                id: Date.now(),
                text: text,
                completed: false,
                createdAt: new Date()
            };
            this.todos.push(todo);
            this.todoInput.value = '';
            this.saveTodos();
            this.renderTodos();
            this.updateStats();
        }
    }
    
    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.saveTodos();
            this.renderTodos();
            this.updateStats();
        }
    }
    
    deleteTodo(id) {
        this.todos = this.todos.filter(t => t.id !== id);
        this.saveTodos();
        this.renderTodos();
        this.updateStats();
    }
    
    clearCompletedTodos() {
        this.todos = this.todos.filter(t => !t.completed);
        this.saveTodos();
        this.renderTodos();
        this.updateStats();
    }
    
    setFilter(filter) {
        this.currentFilter = filter;
        this.filterBtns.forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
        this.renderTodos();
    }
    
    getFilteredTodos() {
        switch (this.currentFilter) {
            case 'active':
                return this.todos.filter(t => !t.completed);
            case 'completed':
                return this.todos.filter(t => t.completed);
            default:
                return this.todos;
        }
    }
    
    renderTodos() {
        const filteredTodos = this.getFilteredTodos();
        this.todoList.innerHTML = '';
        
        filteredTodos.forEach(todo => {
            const li = document.createElement('li');
            li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
            li.innerHTML = `
                <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''}>
                <span class="todo-text">${todo.text}</span>
                <button class="todo-delete">Delete</button>
            `;
            
            const checkbox = li.querySelector('.todo-checkbox');
            const deleteBtn = li.querySelector('.todo-delete');
            
            checkbox.addEventListener('change', () => this.toggleTodo(todo.id));
            deleteBtn.addEventListener('click', () => this.deleteTodo(todo.id));
            
            this.todoList.appendChild(li);
        });
    }
    
    updateStats() {
        const activeTodos = this.todos.filter(t => !t.completed).length;
        const completedTodos = this.todos.filter(t => t.completed).length;
        
        this.todoStats.textContent = `${activeTodos} task${activeTodos !== 1 ? 's' : ''} remaining`;
        this.clearCompleted.style.display = completedTodos > 0 ? 'block' : 'none';
    }
    
    saveTodos() {
        localStorage.setItem('pomodoro-todos', JSON.stringify(this.todos));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new PomodoroApp();
});