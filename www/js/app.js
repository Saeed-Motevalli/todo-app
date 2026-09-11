/* =========================================================
   TODO APP
   Main JavaScript
   Vanilla JavaScript
   LocalStorage
   Persian Calendar
========================================================= */

"use strict";

/* =========================================================
   01. STORAGE
========================================================= */

const STORAGE_KEYS = {
  tasks: "todo_app_tasks",
  theme: "todo_app_theme",
  settings: "todo_app_settings",
};

/* =========================================================
   02. APP STATE
========================================================= */

const state = {
  tasks: [],

  editingTaskId: null,
  deletingTaskId: null,

  searchQuery: "",
  filterCategory: "all",
  filterPriority: "all",
  filterStatus: "all",

  sortBy: "priority",

  currentCalendarDate: null,
  selectedDate: null,

  isCalendarOpen: false,
  isMonthPickerOpen: false,
  isFilterOpen: false,
  isSortOpen: false,

  toastTimeouts: new Map(),
};

/* =========================================================
   03. DOM ELEMENTS
========================================================= */

const elements = {
  body: document.body,

  themeToggle: document.getElementById("themeToggle"),

  searchInput: document.getElementById("searchInput"),
  clearSearch: document.getElementById("clearSearch"),

  filterButton: document.getElementById("filterButton"),
  filterPanel: document.getElementById("filterPanel"),

  sortButton: document.getElementById("sortButton"),
  sortPanel: document.getElementById("sortPanel"),

  resetFilters: document.getElementById("resetFilters"),

  taskCount: document.getElementById("taskCount"),
  completedCount: document.getElementById("completedCount"),

  activeTaskList: document.getElementById("activeTaskList"),
  completedTaskList: document.getElementById("completedTaskList"),

  activeSection: document.getElementById("activeTasksSection"),
  completedSection: document.getElementById("completedTasksSection"),

  emptyState: document.getElementById("emptyState"),
  noResults: document.getElementById("noResults"),

  addTaskButton: document.getElementById("addTaskButton"),

  taskModalOverlay: document.getElementById("taskModalOverlay"),
  taskModal: document.getElementById("taskModal"),
  taskModalTitle: document.getElementById("taskModalTitle"),
  taskModalSubtitle: document.querySelector(".modal-subtitle"),
  closeTaskModal: document.getElementById("taskModalClose"),

  taskForm: document.getElementById("taskForm"),

  taskTitle: document.getElementById("taskTitle"),
  taskDescription: document.getElementById("taskDescription"),

  categoryTrigger: document.getElementById("taskCategoryTrigger"),
  categoryMenu: document.getElementById("taskCategoryMenu"),
  categoryValue: document.getElementById("selectedCategory"),

  priorityTrigger: document.getElementById("taskPriorityTrigger"),
  priorityMenu: document.getElementById("taskPriorityMenu"),
  priorityValue: document.getElementById("selectedPriority"),

  dateInput: document.getElementById("taskDueDate"),
  calendar: document.getElementById("calendar"),

  calendarMonthYear: document.getElementById("calendarMonthYear"),
  calendarMonths: document.querySelector(
    '.calendar-months[data-picker="months"]',
  ),
  calendarDays: document.getElementById("calendarDays"),

  previousMonth: document.getElementById("previousMonth"),
  nextMonth: document.getElementById("nextMonth"),

  clearDate: document.getElementById("clearDate"),

  cancelTask: document.getElementById("cancelTaskButton"),
  saveTask: document.getElementById("submitTaskButton"),

  deleteModalOverlay: document.getElementById("deleteModalOverlay"),
  closeDeleteModal: document.getElementById("cancelDeleteButton"),
  cancelDelete: document.getElementById("cancelDeleteButton"),
  confirmDelete: document.getElementById("confirmDeleteButton"),
  deleteTaskName: document.getElementById("deleteTaskName"),

  toastContainer: document.getElementById("toastContainer"),
};

/* =========================================================
   04. CATEGORIES
========================================================= */

const categories = [
  {
    id: "work",
    label: "Work",
    icon: "fa-solid fa-briefcase",
  },
  {
    id: "study",
    label: "Study",
    icon: "fa-solid fa-book",
  },
  {
    id: "personal",
    label: "Personal",
    icon: "fa-solid fa-user",
  },
  {
    id: "shopping",
    label: "Shopping",
    icon: "fa-solid fa-cart-shopping",
  },
  {
    id: "health",
    label: "Health",
    icon: "fa-solid fa-heart",
  },
  {
    id: "exercise",
    label: "Exercise",
    icon: "fa-solid fa-dumbbell",
  },
  {
    id: "other",
    label: "Other",
    icon: "fa-solid fa-layer-group",
  },
];

/* =========================================================
   05. PRIORITIES
========================================================= */

const priorities = {
  high: {
    label: "High",
    className: "high",
    color: "var(--priority-high)",
  },

  medium: {
    label: "Medium",
    className: "medium",
    color: "var(--priority-medium)",
  },

  low: {
    label: "Low",
    className: "low",
    color: "var(--priority-low)",
  },
};

/* =========================================================
   06. INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", init);

function init() {
  loadTasks();

  loadTheme();

  setupEvents();

  setupMenus();

  setupCalendar();

  updateSortControls();

  render();

  updateCategoryMenu();

  updatePriorityMenu();

  updateClearSearchVisibility();
}

/* =========================================================
   07. LOAD TASKS
========================================================= */

function loadTasks() {
  try {
    const storedTasks = localStorage.getItem(STORAGE_KEYS.tasks);

    if (!storedTasks) {
      state.tasks = [];
      return;
    }

    const parsedTasks = JSON.parse(storedTasks);

    if (!Array.isArray(parsedTasks)) {
      state.tasks = [];
      return;
    }

    state.tasks = parsedTasks.map(normalizeTask);
  } catch (error) {
    console.error("Unable to load tasks:", error);

    state.tasks = [];
  }
}

/* =========================================================
   08. NORMALIZE TASK
========================================================= */

function normalizeTask(task) {
  return {
    id: task.id || generateId(),

    title:
      typeof task.title === "string" ? task.title.trim().slice(0, 100) : "",

    description:
      typeof task.description === "string"
        ? task.description.trim().slice(0, 500)
        : "",

    category: categories.some((category) => category.id === task.category)
      ? task.category
      : "other",

    priority: priorities[task.priority] ? task.priority : "medium",

    dueDate: task.dueDate || null,

    completed: Boolean(task.completed),

    createdAt: task.createdAt || new Date().toISOString(),

    updatedAt: task.updatedAt || task.createdAt || new Date().toISOString(),
  };
}

/* =========================================================
   09. SAVE TASKS
========================================================= */

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(state.tasks));
  } catch (error) {
    console.error("Unable to save tasks:", error);

    showToast("Unable to save your tasks.", "error");
  }
}

/* =========================================================
   10. THEME
========================================================= */

function loadTheme() {
  const savedTheme = localStorage.getItem(STORAGE_KEYS.theme);

  if (savedTheme === "dark") {
    setTheme("dark");
  } else {
    setTheme("light");
  }
}

function setTheme(theme) {
  const isDark = theme === "dark";

  elements.body.dataset.theme = isDark ? "dark" : "light";

  localStorage.setItem(STORAGE_KEYS.theme, isDark ? "dark" : "light");

  updateThemeIcon(isDark);
}

function toggleTheme() {
  const currentTheme = elements.body.dataset.theme;

  setTheme(currentTheme === "dark" ? "light" : "dark");
}

function updateThemeIcon(isDark) {
  if (!elements.themeToggle) return;

  const icon = elements.themeToggle.querySelector("i");

  if (!icon) return;

  icon.className = isDark ? "fa-solid fa-sun" : "fa-solid fa-moon";

  elements.themeToggle.setAttribute(
    "aria-label",
    isDark ? "Switch to light mode" : "Switch to dark mode",
  );
}

/* =========================================================
   11. EVENT SETUP
========================================================= */

function setupEvents() {
  elements.themeToggle?.addEventListener("click", toggleTheme);

  elements.searchInput?.addEventListener("input", handleSearch);

  elements.clearSearch?.addEventListener("click", clearSearch);

  elements.filterButton?.addEventListener("click", toggleFilterPanel);

  elements.sortButton?.addEventListener("click", toggleSortPanel);

  elements.resetFilters?.addEventListener("click", resetFilters);

  elements.addTaskButton?.addEventListener("click", () => openTaskModal());

  elements.closeTaskModal?.addEventListener("click", closeTaskModal);

  elements.cancelTask?.addEventListener("click", closeTaskModal);

  elements.taskForm?.addEventListener("submit", handleTaskSubmit);

  elements.closeDeleteModal?.addEventListener("click", closeDeleteModal);

  elements.cancelDelete?.addEventListener("click", closeDeleteModal);

  elements.confirmDelete?.addEventListener("click", confirmTaskDeletion);

  elements.categoryTrigger?.addEventListener("click", toggleCategoryMenu);

  elements.priorityTrigger?.addEventListener("click", togglePriorityMenu);

  elements.dateInput?.addEventListener("click", toggleCalendar);

  elements.previousMonth?.addEventListener("click", () =>
    changeCalendarMonth(-1),
  );

  elements.nextMonth?.addEventListener("click", () => changeCalendarMonth(1));

  elements.clearDate?.addEventListener("click", clearSelectedDate);

  document.addEventListener("click", handleDocumentClick);
  // Handle clicks on actions inside portaled task menus
  document.addEventListener("click", handleGlobalMenuAction);

  document.addEventListener("keydown", handleKeyboard);

  elements.activeTaskList?.addEventListener("click", handleTaskListClick);

  elements.completedTaskList?.addEventListener("click", handleTaskListClick);

  document.addEventListener("change", handleCheckboxChange);
}

function handleDocumentClick(event) {
  const target = event.target;

  if (
    !elements.filterPanel?.contains(target) &&
    !elements.filterButton?.contains(target)
  ) {
    closeFilterPanel();
  }

  if (
    !elements.sortPanel?.contains(target) &&
    !elements.sortButton?.contains(target)
  ) {
    closeSortPanel();
  }

  if (
    !elements.categoryMenu?.contains(target) &&
    !elements.categoryTrigger?.contains(target)
  ) {
    closeCategoryMenu();
  }

  if (
    !elements.priorityMenu?.contains(target) &&
    !elements.priorityTrigger?.contains(target)
  ) {
    closePriorityMenu();
  }

  if (
    !elements.calendar?.contains(target) &&
    !elements.dateInput?.contains(target)
  ) {
    closeCalendar();
  }

  // Close toolbar custom select menus when clicking outside
  if (
    !target.closest(".custom-select-wrapper") &&
    !target.closest(".custom-select-menu")
  ) {
    closeAllCustomSelectMenus();
  }

  // Do not auto-close menus if the click is inside a task menu (which may be portaled to body)
  if (!target.closest(".task-more-wrapper") && !target.closest(".task-menu")) {
    closeAllTaskMenus();
  }

  if (target === elements.taskModalOverlay) {
    closeTaskModal();
  }

  if (target === elements.deleteModalOverlay) {
    closeDeleteModal();
  }
}

/* =========================================================
   GLOBAL MENU ACTIONS
   Handle clicks on `[data-action]` buttons when menus are portaled to body
========================================================= */

function handleGlobalMenuAction(event) {
  const actionButton = event.target.closest("[data-action]");

  if (!actionButton) return;

  // If the button is inside a task-more-wrapper, let the existing handlers handle it
  if (actionButton.closest(".task-more-wrapper")) return;

  event.stopPropagation();

  const taskId = actionButton.dataset.taskId;

  const action = actionButton.dataset.action;

  closeAllTaskMenus();

  if (action === "edit") {
    openTaskModal(taskId);
  }

  if (action === "toggle") {
    toggleTaskCompletion(taskId);
  }

  if (action === "delete") {
    openDeleteModal(taskId);
  }
}

/* =========================================================
   13. KEYBOARD
========================================================= */

function handleKeyboard(event) {
  if (event.key === "Escape") {
    closeFilterPanel();
    closeSortPanel();
    closeCategoryMenu();
    closePriorityMenu();
    closeCalendar();
    closeAllTaskMenus();

    if (!elements.deleteModalOverlay?.hasAttribute("hidden")) {
      closeDeleteModal();
    }

    if (!elements.taskModalOverlay?.hasAttribute("hidden")) {
      closeTaskModal();
    }
  }

  /* Ctrl/Cmd + K = Search */

  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();

    elements.searchInput?.focus();
  }

  /* N = New task */

  if (event.key.toLowerCase() === "n" && !isTypingInField(event.target)) {
    event.preventDefault();

    openTaskModal();
  }
}

function isTypingInField(element) {
  if (!element) return false;

  const tagName = element.tagName?.toLowerCase();

  return (
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select" ||
    element.isContentEditable
  );
}

/* =========================================================
   14. SEARCH
========================================================= */

function handleSearch(event) {
  state.searchQuery = event.target.value.trim().toLowerCase();

  updateClearSearchVisibility();

  render();
}

function clearSearch() {
  if (!elements.searchInput) return;

  elements.searchInput.value = "";

  state.searchQuery = "";

  updateClearSearchVisibility();

  render();

  elements.searchInput.focus();
}

function updateClearSearchVisibility() {
  if (!elements.clearSearch) return;

  const hasText = Boolean(elements.searchInput?.value);

  elements.clearSearch.hidden = !hasText;
}

/* =========================================================
   15. FILTER PANEL
========================================================= */

function toggleFilterPanel() {
  if (state.isFilterOpen) {
    closeFilterPanel();
  } else {
    openFilterPanel();
  }
}

function openFilterPanel() {
  closeSortPanel();

  state.isFilterOpen = true;

  if (elements.filterPanel) {
    elements.filterPanel.hidden = false;
  }

  elements.filterButton?.setAttribute("aria-expanded", "true");
}

function closeFilterPanel() {
  state.isFilterOpen = false;

  if (elements.filterPanel) {
    elements.filterPanel.hidden = true;
  }

  elements.filterButton?.setAttribute("aria-expanded", "false");
}

/* =========================================================
   16. SORT PANEL
========================================================= */

function toggleSortPanel() {
  if (state.isSortOpen) {
    closeSortPanel();
  } else {
    openSortPanel();
  }
}

function openSortPanel() {
  closeFilterPanel();

  state.isSortOpen = true;

  if (elements.sortPanel) {
    elements.sortPanel.hidden = false;
  }

  elements.sortButton?.setAttribute("aria-expanded", "true");
}

function closeSortPanel() {
  state.isSortOpen = false;

  if (elements.sortPanel) {
    elements.sortPanel.hidden = true;
  }

  elements.sortButton?.setAttribute("aria-expanded", "false");
}

/* =========================================================
   17. FILTER VALUES
========================================================= */

function setCategoryFilter(category) {
  state.filterCategory = category;

  updateFilterButton();

  // update the category trigger label
  const categoryTrigger = document.getElementById("categoryFilter");
  if (categoryTrigger) {
    const label = getCategoryLabel(category);
    categoryTrigger.innerHTML = `\n            <span>${label}</span>\n\n            <i class="fa-solid fa-chevron-down" aria-hidden="true"></i>\n        `;
    categoryTrigger.setAttribute("aria-expanded", "false");
  }

  const menu = document.querySelector(
    '.custom-select-menu[data-menu="category"]',
  );
  if (menu) menu.hidden = true;

  updateFilterControls();

  render();
}

function setPriorityFilter(priority) {
  state.filterPriority = priority;

  updateFilterButton();

  // update the priority trigger label
  const priorityTrigger = document.getElementById("priorityFilter");
  if (priorityTrigger) {
    const label = getPriorityLabel(priority);
    priorityTrigger.innerHTML = `\n            <span>${label}</span>\n\n            <i class="fa-solid fa-chevron-down" aria-hidden="true"></i>\n        `;
    priorityTrigger.setAttribute("aria-expanded", "false");
  }

  const menu = document.querySelector(
    '.custom-select-menu[data-menu="priority"]',
  );
  if (menu) menu.hidden = true;

  updateFilterControls();

  render();
}

function setStatusFilter(status) {
  state.filterStatus = status;

  updateFilterButton();

  // update the status trigger label
  const statusTrigger = document.getElementById("statusFilter");
  if (statusTrigger) {
    const map = { all: "All", active: "Active", completed: "Completed" };
    const label = map[status] || "All";
    statusTrigger.innerHTML = `\n            <span>${label}</span>\n\n            <i class="fa-solid fa-chevron-down" aria-hidden="true"></i>\n        `;
    statusTrigger.setAttribute("aria-expanded", "false");
  }

  const menu = document.querySelector(
    '.custom-select-menu[data-menu="status"]',
  );
  if (menu) menu.hidden = true;

  updateFilterControls();

  render();
}

function updateFilterButton() {
  const activeFilters = [
    state.filterCategory !== "all",
    state.filterPriority !== "all",
    state.filterStatus !== "all",
  ].filter(Boolean).length;

  const indicator = elements.filterButton?.querySelector(".filter-indicator");

  if (indicator) {
    indicator.hidden = activeFilters === 0;
  }
}

/* =========================================================
   18. RESET FILTERS
========================================================= */

function resetFilters() {
  state.filterCategory = "all";
  state.filterPriority = "all";
  state.filterStatus = "all";

  const categoryTrigger = document.getElementById("categoryFilter");
  if (categoryTrigger) {
    categoryTrigger.innerHTML = `
            <span>All</span>

            <i class="fa-solid fa-chevron-down" aria-hidden="true"></i>
        `;
    categoryTrigger.setAttribute("aria-expanded", "false");
  }

  const priorityTrigger = document.getElementById("priorityFilter");
  if (priorityTrigger) {
    priorityTrigger.innerHTML = `
            <span>All</span>

            <i class="fa-solid fa-chevron-down" aria-hidden="true"></i>
        `;
    priorityTrigger.setAttribute("aria-expanded", "false");
  }

  const statusTrigger = document.getElementById("statusFilter");
  if (statusTrigger) {
    statusTrigger.innerHTML = `
            <span>All</span>

            <i class="fa-solid fa-chevron-down" aria-hidden="true"></i>
        `;
    statusTrigger.setAttribute("aria-expanded", "false");
  }

  document.querySelectorAll(".custom-select-menu").forEach((menu) => {
    menu.hidden = true;
  });

  updateFilterControls();

  updateFilterButton();

  render();

  showToast("Filters have been reset.", "success");
}

function updateFilterControls() {
  document.querySelectorAll("[data-filter-category]").forEach((button) => {
    button.classList.toggle(
      "active",
      button.dataset.filterCategory === state.filterCategory,
    );
  });

  document.querySelectorAll("[data-filter-priority]").forEach((button) => {
    button.classList.toggle(
      "active",
      button.dataset.filterPriority === state.filterPriority,
    );
  });

  document.querySelectorAll("[data-filter-status]").forEach((button) => {
    button.classList.toggle(
      "active",
      button.dataset.filterStatus === state.filterStatus,
    );
  });
}

/* =========================================================
   19. SORT
========================================================= */

function updateSortControls() {
  const currentSortLabel = {
    priority: "Priority",
    deadline: "Deadline",
    created: "Created Date",
    alphabetical: "Alphabetical",
  };

  const sortValue = currentSortLabel[state.sortBy] || "Priority";

  const currentSortEl = document.getElementById("currentSort");
  if (currentSortEl) {
    currentSortEl.textContent = sortValue;
  }

  document.querySelectorAll("[data-sort]").forEach((button) => {
    const isActive = button.dataset.sort === state.sortBy;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-checked", String(isActive));
  });
}

function setSort(sortBy) {
  const validSorts = ["deadline", "priority", "created", "alphabetical"];

  if (!validSorts.includes(sortBy)) {
    return;
  }

  state.sortBy = sortBy;

  updateSortControls();

  closeSortPanel();

  render();
}

/* =========================================================
   20. FILTER TASKS
========================================================= */

function getVisibleTasks() {
  let tasks = [...state.tasks];

  /* Search */

  if (state.searchQuery) {
    tasks = tasks.filter((task) => {
      const searchableText = [
        task.title,
        task.description,
        getCategoryLabel(task.category),
        getPriorityLabel(task.priority),
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(state.searchQuery);
    });
  }

  /* Category */

  if (state.filterCategory !== "all") {
    tasks = tasks.filter((task) => task.category === state.filterCategory);
  }

  /* Priority */

  if (state.filterPriority !== "all") {
    tasks = tasks.filter((task) => task.priority === state.filterPriority);
  }

  /* Status */

  if (state.filterStatus === "active") {
    tasks = tasks.filter((task) => !task.completed);
  }

  if (state.filterStatus === "completed") {
    tasks = tasks.filter((task) => task.completed);
  }

  return sortTasks(tasks);
}

/* =========================================================
   21. SORT TASKS
========================================================= */

function sortTasks(tasks) {
  return tasks.sort((a, b) => {
    switch (state.sortBy) {
      case "deadline":
        return compareDeadline(a, b);

      case "priority":
        return comparePriority(a, b);

      case "created":
        return new Date(b.createdAt) - new Date(a.createdAt);

      case "alphabetical":
        return a.title.localeCompare(b.title, undefined, {
          sensitivity: "base",
        });

      default:
        return 0;
    }
  });
}

/* =========================================================
   22. DEADLINE SORT
========================================================= */

function compareDeadline(a, b) {
  const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;

  const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;

  return aDate - bDate;
}

/* =========================================================
   23. PRIORITY SORT
========================================================= */

function comparePriority(a, b) {
  const order = {
    high: 1,
    medium: 2,
    low: 3,
  };

  return order[a.priority] - order[b.priority];
}

/* =========================================================
   24. RENDER
========================================================= */

function render() {
  updateSortControls();

  const tasks = getVisibleTasks();

  const activeTasks = tasks.filter((task) => !task.completed);

  const completedTasks = tasks.filter((task) => task.completed);

  renderSummary();

  renderTaskLists(activeTasks, completedTasks);

  renderEmptyStates(tasks, activeTasks, completedTasks);

  updateFilterControls();
  updateFilterButton();
}

/* =========================================================
   25. SUMMARY
========================================================= */

function renderSummary() {
  const total = state.tasks.length;

  const completed = state.tasks.filter((task) => task.completed).length;

  const active = total - completed;

  if (elements.taskCount) {
    elements.taskCount.textContent = `${total} Tasks`;
  }

  if (elements.completedCount) {
    elements.completedCount.textContent = `${completed} Completed`;
  }
}

/* =========================================================
   26. RENDER TASK LISTS
========================================================= */

function renderTaskLists(activeTasks, completedTasks) {
  if (elements.activeTaskList) {
    elements.activeTaskList.innerHTML = activeTasks.map(renderTask).join("");
  }

  if (elements.completedTaskList) {
    elements.completedTaskList.innerHTML = completedTasks
      .map(renderTask)
      .join("");
  }
}

/* =========================================================
   27. EMPTY STATES
========================================================= */

function renderEmptyStates(visibleTasks, activeTasks, completedTasks) {
  const hasAnyTasks = state.tasks.length > 0;

  const hasVisibleTasks = visibleTasks.length > 0;

  if (elements.emptyState) {
    elements.emptyState.hidden = hasAnyTasks;
  }

  if (elements.noResults) {
    elements.noResults.hidden = !hasAnyTasks || hasVisibleTasks;
  }

  if (elements.activeSection) {
    elements.activeSection.hidden = activeTasks.length === 0;
  }

  if (elements.completedSection) {
    elements.completedSection.hidden = completedTasks.length === 0;
  }

  /*
       If there are tasks but all are completed,
       the completed section remains visible.
    */

  if (hasAnyTasks && !hasVisibleTasks && elements.activeSection) {
    elements.activeSection.hidden = true;
  }
}

/* =========================================================
   28. RENDER SINGLE TASK
========================================================= */

function renderTask(task) {
  const category = getCategory(task.category);

  const priority = priorities[task.priority];

  const dueDate = task.dueDate ? formatPersianDate(task.dueDate) : "";

  const dueClass = getDueDateClass(task);

  const direction = detectDirection(task.title);

  const descriptionDirection = detectDirection(task.description);

  return `
        <article
            class="task-card ${task.completed ? "completed" : ""}"
            data-task-id="${escapeHTML(task.id)}"
        >

            <div class="task-checkbox-wrapper">

                <input
                    class="task-checkbox"
                    type="checkbox"
                    id="task-${escapeHTML(task.id)}"
                    data-task-checkbox="${escapeHTML(task.id)}"
                    ${task.completed ? "checked" : ""}
                >

                <label
                    class="custom-checkbox"
                    for="task-${escapeHTML(task.id)}"
                    aria-label="Complete task"
                >
                    <i class="fa-solid fa-check"></i>
                </label>

            </div>


            <div class="task-content">

                <div
                    class="task-title"
                    dir="${direction}"
                >
                    ${escapeHTML(task.title)}
                </div>


                ${
                  task.description
                    ? `
                            <div
                                class="task-description"
                                dir="${descriptionDirection}"
                            >
                                ${escapeHTML(task.description)}
                            </div>
                        `
                    : ""
                }


                <div class="task-meta">

                    <span class="task-category">

                        <i class="${category.icon}"></i>

                        ${category.label}

                    </span>


                    <span class="task-meta-separator">
                        •
                    </span>


                    <span
                        class="task-priority ${priority.className}"
                    >
                        ${priority.label}
                    </span>


                    ${
                      dueDate
                        ? `
                                <span class="task-meta-separator">
                                    •
                                </span>

                                <span
                                    class="task-due-date ${dueClass}"
                                >
                                    ${dueDate}
                                </span>
                            `
                        : ""
                    }

                </div>


                <div class="task-created">

                    Created
                    ${formatRelativeDate(task.createdAt)}

                </div>

            </div>


            <div class="task-more-wrapper">

                <button
                    class="task-more"
                    type="button"
                    aria-label="Task options"
                    aria-expanded="false"
                    data-task-menu-button="${escapeHTML(task.id)}"
                >
                    <i class="fa-solid fa-ellipsis-vertical"></i>
                </button>


                <div
                    class="task-menu"
                    hidden
                    data-task-menu="${escapeHTML(task.id)}"
                >

                    <button
                        type="button"
                        data-action="edit"
                        data-task-id="${escapeHTML(task.id)}"
                    >
                        <i class="fa-solid fa-pen"></i>
                        Edit
                    </button>


                    <button
                        type="button"
                        data-action="toggle"
                        data-task-id="${escapeHTML(task.id)}"
                    >
                        <i class="fa-solid ${
                          task.completed ? "fa-rotate-left" : "fa-check"
                        }"></i>

                        ${task.completed ? "Mark active" : "Mark completed"}

                    </button>


                    <button
                        type="button"
                        class="delete-action"
                        data-action="delete"
                        data-task-id="${escapeHTML(task.id)}"
                    >
                        <i class="fa-solid fa-trash"></i>
                        Delete
                    </button>

                </div>

            </div>

        </article>
    `;
}

/* =========================================================
   29. TASK LIST CLICK
========================================================= */

function handleTaskListClick(event) {
  const moreButton = event.target.closest("[data-task-menu-button]");

  if (moreButton) {
    event.stopPropagation();

    toggleTaskMenu(moreButton.dataset.taskMenuButton);

    return;
  }

  const actionButton = event.target.closest("[data-action]");

  if (!actionButton) {
    return;
  }

  const taskId = actionButton.dataset.taskId;

  const action = actionButton.dataset.action;

  closeAllTaskMenus();

  if (action === "edit") {
    openTaskModal(taskId);
  }

  if (action === "toggle") {
    toggleTaskCompletion(taskId);
  }

  if (action === "delete") {
    openDeleteModal(taskId);
  }
}

/* =========================================================
   30. CHECKBOX CHANGE
========================================================= */

function handleCheckboxChange(event) {
  const checkbox = event.target.closest("[data-task-checkbox]");

  if (!checkbox) return;

  toggleTaskCompletion(checkbox.dataset.taskCheckbox);
}

/* =========================================================
   31. TOGGLE TASK
========================================================= */

function toggleTaskCompletion(taskId) {
  const task = findTask(taskId);

  if (!task) return;

  task.completed = !task.completed;

  task.updatedAt = new Date().toISOString();

  saveTasks();

  render();

  showToast(
    task.completed ? "Task completed." : "Task marked as active.",
    "success",
  );
}

/* =========================================================
   32. OPEN TASK MODAL
========================================================= */

function openTaskModal(taskId = null) {
  state.editingTaskId = taskId;

  resetTaskForm();

  if (taskId) {
    const task = findTask(taskId);

    if (!task) return;

    elements.taskModalTitle.textContent = "Edit Task";

    elements.taskModalSubtitle.textContent = "Update the details of your task.";

    elements.saveTask.innerHTML = `
            <i class="fa-solid fa-check"></i>
            Save Changes
        `;

    fillTaskForm(task);
  } else {
    elements.taskModalTitle.textContent = "Add Task";

    elements.taskModalSubtitle.textContent =
      "Create a new task and keep things organized.";

    elements.saveTask.innerHTML = `
            <i class="fa-solid fa-plus"></i>
            Add Task
        `;
  }

  elements.taskModalOverlay.hidden = false;

  document.body.style.overflow = "hidden";

  setTimeout(() => {
    elements.taskTitle?.focus();
  }, 50);
}

/* =========================================================
   33. CLOSE TASK MODAL
========================================================= */

function closeTaskModal() {
  if (!elements.taskModalOverlay) return;

  elements.taskModalOverlay.hidden = true;

  document.body.style.overflow = "";

  closeCategoryMenu();
  closePriorityMenu();
  closeCalendar();

  state.editingTaskId = null;
}

/* =========================================================
   34. RESET TASK FORM
========================================================= */

function resetTaskForm() {
  elements.taskForm?.reset();

  clearFormErrors();

  state.selectedDate = null;

  if (elements.categoryValue) {
    elements.categoryValue.value = "other";
  }

  if (elements.priorityValue) {
    elements.priorityValue.value = "medium";
  }

  updateCategoryTrigger("other");

  updatePriorityTrigger("medium");

  updateDateInput();
}

/* =========================================================
   35. FILL FORM
========================================================= */

function fillTaskForm(task) {
  elements.taskTitle.value = task.title;

  elements.taskDescription.value = task.description;

  elements.categoryValue.value = task.category;

  elements.priorityValue.value = task.priority;

  state.selectedDate = task.dueDate ? parseDate(task.dueDate) : null;

  updateCategoryTrigger(task.category);

  updatePriorityTrigger(task.priority);

  updateDateInput();
}

/* =========================================================
   36. SUBMIT TASK
========================================================= */

function handleTaskSubmit(event) {
  event.preventDefault();

  const title = elements.taskTitle.value.trim();

  const description = elements.taskDescription.value.trim();

  const category = elements.categoryValue.value || "other";

  const priority = elements.priorityValue.value || "medium";

  if (!validateTaskForm(title)) {
    return;
  }

  if (state.editingTaskId) {
    updateTask({
      title,
      description,
      category,
      priority,
      dueDate: state.selectedDate ? formatISODate(state.selectedDate) : null,
    });
  } else {
    createTask({
      title,
      description,
      category,
      priority,
      dueDate: state.selectedDate ? formatISODate(state.selectedDate) : null,
    });
  }
}

/* =========================================================
   37. VALIDATE FORM
========================================================= */

function validateTaskForm(title) {
  clearFormErrors();

  if (!title) {
    showFieldError(elements.taskTitle, "Task title is required.");

    elements.taskTitle.focus();

    return false;
  }

  if (title.length > 100) {
    showFieldError(
      elements.taskTitle,
      "Task title cannot exceed 100 characters.",
    );

    elements.taskTitle.focus();

    return false;
  }

  const description = elements.taskDescription.value.trim();

  if (description.length > 500) {
    showFieldError(
      elements.taskDescription,
      "Description cannot exceed 500 characters.",
    );

    elements.taskDescription.focus();

    return false;
  }

  return true;
}

/* =========================================================
   38. CREATE TASK
========================================================= */

function createTask(data) {
  const now = new Date().toISOString();

  const task = {
    id: generateId(),

    title: data.title.slice(0, 100),

    description: data.description.slice(0, 500),

    category: data.category,

    priority: data.priority,

    dueDate: data.dueDate || null,

    completed: false,

    createdAt: now,

    updatedAt: now,
  };

  state.tasks.unshift(task);

  saveTasks();

  closeTaskModal();

  render();

  showToast("Task added successfully.", "success");
}

/* =========================================================
   39. UPDATE TASK
========================================================= */

function updateTask(data) {
  const task = findTask(state.editingTaskId);

  if (!task) return;

  task.title = data.title.slice(0, 100);

  task.description = data.description.slice(0, 500);

  task.category = data.category;

  task.priority = data.priority;

  task.dueDate = data.dueDate;

  task.updatedAt = new Date().toISOString();

  saveTasks();

  closeTaskModal();

  render();

  showToast("Task updated successfully.", "success");
}

/* =========================================================
   40. DELETE MODAL
========================================================= */

function openDeleteModal(taskId) {
  const task = findTask(taskId);

  if (!task) return;

  state.deletingTaskId = taskId;

  if (elements.deleteTaskName) {
    elements.deleteTaskName.textContent = task.title;
  }

  elements.deleteModalOverlay.hidden = false;

  document.body.style.overflow = "hidden";
}

function closeDeleteModal() {
  if (!elements.deleteModalOverlay) {
    return;
  }

  elements.deleteModalOverlay.hidden = true;

  document.body.style.overflow = "";

  state.deletingTaskId = null;
}

/* =========================================================
   41. CONFIRM DELETE
========================================================= */

function confirmTaskDeletion() {
  if (!state.deletingTaskId) {
    return;
  }

  const taskId = state.deletingTaskId;

  const task = findTask(taskId);

  if (!task) {
    closeDeleteModal();

    return;
  }

  const deletedTask = {
    ...task,
  };

  state.tasks = state.tasks.filter((item) => item.id !== taskId);

  saveTasks();

  closeDeleteModal();

  render();

  showToast("Task deleted.", "success", {
    actionText: "Undo",
    action: () => restoreTask(deletedTask),
  });
}

/* =========================================================
   42. RESTORE TASK
========================================================= */

function restoreTask(task) {
  if (state.tasks.some((item) => item.id === task.id)) {
    return;
  }

  state.tasks.push(task);

  saveTasks();

  render();

  showToast("Task restored.", "success");
}

/* =========================================================
   43. TASK MENUS
========================================================= */

function toggleTaskMenu(taskId) {
  const menu = document.querySelector(
    `[data-task-menu="${CSS.escape(taskId)}"]`,
  );

  const button = document.querySelector(
    `[data-task-menu-button="${CSS.escape(taskId)}"]`,
  );

  if (!menu || !button) return;

  const wasOpen = !menu.hidden;

  closeAllTaskMenus();

  if (wasOpen) return;

  // show menu
  menu.hidden = false;

  button.setAttribute("aria-expanded", "true");

  // elevate wrapper visually
  const wrapper = button.closest(".task-more-wrapper");
  if (wrapper) wrapper.classList.add("task-more-open");

  // move menu to document body so it won't be clipped by other cards
  if (!menu.dataset.portal) menu.dataset.portal = "true";

  // reset any previous inline positioning, then append to body
  menu.style.position = "fixed";
  menu.style.left = "";
  menu.style.top = "";
  document.body.appendChild(menu);

  positionTaskMenu(menu, button);
}

function closeAllTaskMenus() {
  document.querySelectorAll("[data-task-menu]").forEach((menu) => {
    // hide
    menu.hidden = true;
    menu.classList.remove("menu-up");

    // if menu was portaled to body, move it back to its wrapper
    if (menu.dataset.portal) {
      const id = menu.getAttribute("data-task-menu");
      const button = document.querySelector(
        `[data-task-menu-button="${CSS.escape(id)}"]`,
      );

      const wrapper = button ? button.closest(".task-more-wrapper") : null;

      // remove inline styles
      menu.style.position = "";
      menu.style.left = "";
      menu.style.top = "";

      if (wrapper) wrapper.appendChild(menu);
      delete menu.dataset.portal;
    }
  });

  document.querySelectorAll("[data-task-menu-button]").forEach((button) => {
    button.setAttribute("aria-expanded", "false");
  });

  // remove elevated state from any wrappers
  document
    .querySelectorAll(".task-more-wrapper.task-more-open")
    .forEach((w) => {
      w.classList.remove("task-more-open");
    });
}

function positionTaskMenu(menu, button) {
  menu.classList.remove("menu-up");

  // If caller did not pass the originating button, try to find it.
  if (!button) {
    const id = menu.getAttribute("data-task-menu");
    button = document.querySelector(
      `[data-task-menu-button="${CSS.escape(id)}"]`,
    );
  }

  if (!button) return;

  const btnRect = button.getBoundingClientRect();

  // measure menu after it's in the document
  const menuRect = menu.getBoundingClientRect();

  const spaceBelow = window.innerHeight - btnRect.bottom;

  let top;

  if (spaceBelow < menuRect.height + 10) {
    // place above
    top = btnRect.top - menuRect.height - 5;
    menu.classList.add("menu-up");
  } else {
    // place below
    top = btnRect.bottom + 5;
  }

  // align right edge of menu with right edge of button
  let left = btnRect.right - menuRect.width;

  // keep within viewport padding
  const pad = 8;
  if (left < pad) left = pad;
  if (left + menuRect.width > window.innerWidth - pad)
    left = window.innerWidth - menuRect.width - pad;

  menu.style.left = `${Math.round(left)}px`;
  menu.style.top = `${Math.round(top)}px`;
}

/* =========================================================
   44. CATEGORY MENU
========================================================= */

function setupMenus() {
  document.querySelectorAll("[data-filter-category]").forEach((button) => {
    button.addEventListener("click", () => {
      setCategoryFilter(button.dataset.filterCategory);
    });
  });

  document.querySelectorAll("[data-filter-priority]").forEach((button) => {
    button.addEventListener("click", () => {
      setPriorityFilter(button.dataset.filterPriority);
    });
  });

  document.querySelectorAll("[data-filter-status]").forEach((button) => {
    button.addEventListener("click", () => {
      setStatusFilter(button.dataset.filterStatus);
    });
  });

  document.querySelectorAll("[data-sort]").forEach((button) => {
    button.addEventListener("click", () => {
      setSort(button.dataset.sort);
    });
  });

  // Close buttons inside dropdown panels (e.g., filter/sort)
  document.querySelectorAll("[data-close-dropdown]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const panel = btn.closest(".dropdown-panel");
      if (!panel) return;

      // hide the panel
      panel.hidden = true;

      // find any toolbar button that controls this panel via aria-controls and collapse it
      const id = panel.id;
      if (id) {
        const controller = document.querySelector(`[aria-controls="${id}"]`);
        if (controller) controller.setAttribute("aria-expanded", "false");
      }
    });
  });

  // Setup toolbar filter triggers (status / priority / category)
  setupFilterSelectTriggers();
}

function setupFilterSelectTriggers() {
  document.querySelectorAll("[data-filter]").forEach((button) => {
    button.addEventListener("click", (event) => {
      const name = button.dataset.filter;

      const menu = document.querySelector(
        `.custom-select-menu[data-menu="${name}"]`,
      );

      if (!menu) return;

      const wasOpen = !menu.hidden;

      closeAllCustomSelectMenus();

      if (wasOpen) return;

      menu.hidden = false;

      button.setAttribute("aria-expanded", "true");
    });
  });
}

function closeAllCustomSelectMenus() {
  document.querySelectorAll(".custom-select-menu").forEach((menu) => {
    menu.hidden = true;
  });

  document.querySelectorAll("[data-filter]").forEach((button) => {
    button.setAttribute("aria-expanded", "false");
  });
}

function toggleCategoryMenu() {
  const isOpen = !elements.categoryMenu.hidden;

  closePriorityMenu();

  if (isOpen) {
    closeCategoryMenu();
  } else {
    openCategoryMenu();
  }
}

function openCategoryMenu() {
  elements.categoryMenu.hidden = false;

  elements.categoryTrigger?.setAttribute("aria-expanded", "true");
}

function closeCategoryMenu() {
  if (elements.categoryMenu) {
    elements.categoryMenu.hidden = true;
  }

  elements.categoryTrigger?.setAttribute("aria-expanded", "false");
}

function updateCategoryMenu() {
  if (!elements.categoryMenu) {
    return;
  }

  elements.categoryMenu.innerHTML = categories
    .map(
      (category) => `
                <button
                    type="button"
                    class="form-select-option"
                    data-category-option="${category.id}"
                >
                    <i class="${category.icon}"></i>
                    <span>${category.label}</span>
                </button>
            `,
    )
    .join("");

  elements.categoryMenu
    .querySelectorAll("[data-category-option]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        const value = button.dataset.categoryOption;

        elements.categoryValue.value = value;

        updateCategoryTrigger(value);

        closeCategoryMenu();
      });
    });
}

function updateCategoryTrigger(categoryId) {
  const category = getCategory(categoryId);

  if (!category || !elements.categoryTrigger) {
    return;
  }

  elements.categoryTrigger.innerHTML = `
        <span>
            <i class="${category.icon}"></i>
            ${category.label}
        </span>

        <i class="fa-solid fa-chevron-down"></i>
    `;
}

/* =========================================================
   45. PRIORITY MENU
========================================================= */

function togglePriorityMenu() {
  const isOpen = !elements.priorityMenu.hidden;

  closeCategoryMenu();

  if (isOpen) {
    closePriorityMenu();
  } else {
    openPriorityMenu();
  }
}

function openPriorityMenu() {
  elements.priorityMenu.hidden = false;

  elements.priorityTrigger?.setAttribute("aria-expanded", "true");
}

function closePriorityMenu() {
  if (elements.priorityMenu) {
    elements.priorityMenu.hidden = true;
  }

  elements.priorityTrigger?.setAttribute("aria-expanded", "false");
}

function updatePriorityMenu() {
  if (!elements.priorityMenu) {
    return;
  }

  elements.priorityMenu.innerHTML = Object.entries(priorities)
    .map(
      ([id, priority]) => `
                <button
                    type="button"
                    class="form-select-option"
                    data-priority-option="${id}"
                >

                    <span
                        class="priority-dot ${priority.className}"
                    ></span>

                    <span>
                        ${priority.label}
                    </span>

                </button>
            `,
    )
    .join("");

  elements.priorityMenu
    .querySelectorAll("[data-priority-option]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        const value = button.dataset.priorityOption;

        elements.priorityValue.value = value;

        updatePriorityTrigger(value);

        closePriorityMenu();
      });
    });
}

function updatePriorityTrigger(priorityId) {
  const priority = priorities[priorityId];

  if (!priority || !elements.priorityTrigger) {
    return;
  }

  elements.priorityTrigger.innerHTML = `
        <span>

            <span
                class="priority-dot ${priority.className}"
            ></span>

            ${priority.label}

        </span>

        <i class="fa-solid fa-chevron-down"></i>
    `;
}

/* =========================================================
   46. CALENDAR SETUP
========================================================= */

function setupCalendar() {
  state.currentCalendarDate = new Date();

  renderCalendar();
}

/* =========================================================
   47. TOGGLE CALENDAR
========================================================= */

function toggleCalendar() {
  if (state.isCalendarOpen) {
    closeCalendar();
  } else {
    openCalendar();
  }
}

function openCalendar() {
  closeCategoryMenu();
  closePriorityMenu();

  state.isCalendarOpen = true;

  if (state.selectedDate) {
    state.currentCalendarDate = new Date(state.selectedDate);
  }

  renderCalendar();

  if (elements.calendar) {
    elements.calendar.hidden = false;
    elements.calendar.classList.add("calendar--above");
  }

  elements.dateInput?.setAttribute("aria-expanded", "true");
}

function closeCalendar() {
  state.isCalendarOpen = false;

  if (elements.calendar) {
    elements.calendar.hidden = true;
    elements.calendar.classList.remove("calendar--above");
  }

  elements.dateInput?.setAttribute("aria-expanded", "false");
}

/* =========================================================
   48. CHANGE MONTH
========================================================= */

function changeCalendarMonth(offset) {
  const current = state.currentCalendarDate;
  const currentJalali = gregorianToJalali(
    current.getFullYear(),
    current.getMonth() + 1,
    current.getDate(),
  );

  let jalaliMonth = currentJalali.month + offset;
  let jalaliYear = currentJalali.year;

  while (jalaliMonth < 1) {
    jalaliMonth += 12;
    jalaliYear -= 1;
  }

  while (jalaliMonth > 12) {
    jalaliMonth -= 12;
    jalaliYear += 1;
  }

  state.currentCalendarDate = findGregorianDateForJalaliMonthDay(
    jalaliYear,
    jalaliMonth,
    1,
  );

  renderCalendar();
}

/* =========================================================
   49. RENDER CALENDAR
========================================================= */

function renderCalendar() {
  if (!elements.calendarMonthYear || !elements.calendarDays) {
    return;
  }

  const current = state.currentCalendarDate;
  const currentJalali = gregorianToJalali(
    current.getFullYear(),
    current.getMonth() + 1,
    current.getDate(),
  );

  const jalaliYear = currentJalali.year;
  const jalaliMonth = currentJalali.month;
  const monthName = PERSIAN_MONTHS[jalaliMonth - 1];

  if (elements.calendarMonthYear) {
    elements.calendarMonthYear.innerHTML = `
      <span class="calendar-month">${monthName}</span>
      <span class="calendar-year">${jalaliYear}</span>
    `;
  }

  const yearsContainer = document.querySelector(
    '.calendar-years[data-picker="years"]',
  );
  if (yearsContainer) yearsContainer.hidden = true;

  const weekdays = document.querySelector(".calendar-weekdays");
  if (weekdays) weekdays.hidden = false;

  if (elements.calendarDays) elements.calendarDays.hidden = false;

  const firstGregorianDate = findGregorianDateForJalaliMonthDay(
    jalaliYear,
    jalaliMonth,
    1,
  );

  const firstWeekDay = (firstGregorianDate.getDay() + 1) % 7;
  const calendarStart = new Date(firstGregorianDate);
  calendarStart.setDate(firstGregorianDate.getDate() - firstWeekDay);

  let html = "";

  for (let index = 0; index < 42; index++) {
    const date = new Date(calendarStart);
    date.setDate(calendarStart.getDate() + index);

    const jalaliDate = gregorianToJalali(
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate(),
    );

    const isOtherMonth =
      jalaliDate.year !== jalaliYear || jalaliDate.month !== jalaliMonth;

    html += renderCalendarDay(date, isOtherMonth);
  }

  elements.calendarDays.innerHTML = html;

  elements.calendarDays
    .querySelectorAll("[data-calendar-date]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        selectCalendarDate(button.dataset.calendarDate);
      });
    });
}

/* =========================================================
   50. CALENDAR DAY
========================================================= */

function renderCalendarDay(date, otherMonth) {
  const dateString = formatISODate(date);

  const isToday = isSameDate(date, new Date());

  const isSelected = state.selectedDate && isSameDate(date, state.selectedDate);

  const classes = ["calendar-day"];

  if (otherMonth) {
    classes.push("other-month");
  }

  if (isToday) {
    classes.push("today");
  }

  if (isSelected) {
    classes.push("selected");
  }

  return `
        <button
            type="button"
            class="${classes.join(" ")}"
            data-calendar-date="${dateString}"
                  aria-label="${formatPersianDate(dateString)}"
            ${isSelected ? 'aria-selected="true"' : ""}
        >
            ${getPersianDay(date)}
        </button>
    `;
}

/* =========================================================
   51. SELECT DATE
========================================================= */

function selectCalendarDate(dateString) {
  const date = parseDate(dateString);

  if (!date) return;

  state.selectedDate = date;

  updateDateInput();

  closeCalendar();
}

/* =========================================================
   52. UPDATE DATE INPUT
========================================================= */

function updateDateInput() {
  if (!elements.dateInput) {
    return;
  }

  if (state.selectedDate) {
    elements.dateInput.innerHTML = `
            <span>
                ${formatPersianDate(state.selectedDate)}
            </span>

            <i class="fa-regular fa-calendar"></i>
        `;
  } else {
    elements.dateInput.innerHTML = `
            <span class="placeholder">
                Select a date
            </span>

            <i class="fa-regular fa-calendar"></i>
        `;
  }
}

/* =========================================================
   53. CLEAR DATE
========================================================= */

function clearSelectedDate() {
  state.selectedDate = null;

  updateDateInput();

  closeCalendar();
}

/* =========================================================
   54. PERSIAN CALENDAR
========================================================= */

const PERSIAN_MONTHS = [
  "Farvardin",
  "Ordibehesht",
  "Khordad",
  "Tir",
  "Mordad",
  "Shahrivar",
  "Mehr",
  "Aban",
  "Azar",
  "Dey",
  "Bahman",
  "Esfand",
];

const PERSIAN_WEEKDAYS = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];

/*
    Convert Gregorian date to Jalali date.
*/

function gregorianToJalali(gy, gm, gd) {
  const gDaysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  const jDaysInMonth = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];

  let gy2 = gy - 1600;

  let gm2 = gm - 1;

  let gd2 = gd - 1;

  let gDayNo = 365 * gy2;

  gDayNo += Math.floor((gy2 + 3) / 4);

  gDayNo -= Math.floor((gy2 + 99) / 100);

  gDayNo += Math.floor((gy2 + 399) / 400);

  for (let i = 0; i < gm2; i++) {
    gDayNo += gDaysInMonth[i];
  }

  if ((gm2 > 1 && gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0) {
    gDayNo++;
  }

  gDayNo += gd2;

  let jDayNo = gDayNo - 79;

  const jNp = Math.floor(jDayNo / 12053);

  jDayNo %= 12053;

  let jy = 979 + 33 * jNp + 4 * Math.floor(jDayNo / 1461);

  jDayNo %= 1461;

  if (jDayNo >= 366) {
    jy += Math.floor((jDayNo - 1) / 365);

    jDayNo = (jDayNo - 1) % 365;
  }

  let jm = 0;

  for (let i = 0; i < 11 && jDayNo >= jDaysInMonth[i]; i++) {
    jDayNo -= jDaysInMonth[i];

    jm++;
  }

  const jd = jDayNo + 1;

  return {
    year: jy,
    month: jm + 1,
    day: jd,
  };
}

/* =========================================================
   55. PERSIAN DATE HELPERS
========================================================= */

function getPersianDay(date) {
  const jalali = gregorianToJalali(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
  );

  return jalali.day;
}

function getPersianYear(year, month, day) {
  return gregorianToJalali(year, month + 1, day).year;
}

function getPersianMonthName(month) {
  const jalali = gregorianToJalali(
    state.currentCalendarDate.getFullYear(),
    state.currentCalendarDate.getMonth() + 1,
    1,
  );

  return PERSIAN_MONTHS[jalali.month - 1];
}

function formatPersianDate(dateValue) {
  const date = dateValue instanceof Date ? dateValue : parseDate(dateValue);

  if (!date) {
    return "";
  }

  const jalali = gregorianToJalali(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
  );

  return `${jalali.year}/${String(jalali.month).padStart(2, "0")}/${String(
    jalali.day,
  ).padStart(2, "0")}`;
}

function findGregorianDateForJalaliMonthDay(
  jalaliYear,
  jalaliMonth,
  jalaliDay,
) {
  const start = new Date(2000, 0, 1);
  const cursor = new Date(start);

  const maxDays = 50000;

  for (let index = 0; index < maxDays; index++) {
    const jalali = gregorianToJalali(
      cursor.getFullYear(),
      cursor.getMonth() + 1,
      cursor.getDate(),
    );

    if (
      jalali.year === jalaliYear &&
      jalali.month === jalaliMonth &&
      jalali.day === jalaliDay
    ) {
      return new Date(cursor);
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return new Date(start);
}

function getJalaliMonthLength(jalaliYear, jalaliMonth) {
  const nextMonth =
    jalaliMonth === 12
      ? { year: jalaliYear + 1, month: 1 }
      : { year: jalaliYear, month: jalaliMonth + 1 };
  const firstDay = findGregorianDateForJalaliMonthDay(
    jalaliYear,
    jalaliMonth,
    1,
  );
  const nextMonthFirstDay = findGregorianDateForJalaliMonthDay(
    nextMonth.year,
    nextMonth.month,
    1,
  );

  const diffMs = nextMonthFirstDay.getTime() - firstDay.getTime();

  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/* =========================================================
   56. DATE HELPERS
========================================================= */

function formatISODate(date) {
  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDate(dateString) {
  if (dateString instanceof Date) {
    return new Date(dateString);
  }

  if (!dateString) {
    return null;
  }

  const parts = dateString.split("-").map(Number);

  if (parts.length !== 3) {
    return null;
  }

  const [year, month, day] = parts;

  return new Date(year, month - 1, day);
}

function isSameDate(first, second) {
  return (
    first &&
    second &&
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

/* =========================================================
   57. RELATIVE DATE
========================================================= */

function formatRelativeDate(dateValue) {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const now = new Date();

  const diff = now.getTime() - date.getTime();

  const seconds = Math.floor(diff / 1000);

  if (seconds < 60) {
    return "just now";
  }

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);

  if (days < 7) {
    return `${days}d ago`;
  }

  return formatPersianDate(date);
}

/* =========================================================
   58. DUE DATE STATUS
========================================================= */

function getDueDateClass(task) {
  if (!task.dueDate) {
    return "";
  }

  const due = parseDate(task.dueDate);

  const today = new Date();

  if (due < startOfDay(today)) {
    return "overdue";
  }

  if (isSameDate(due, today)) {
    return "today";
  }

  return "upcoming";
}

/* =========================================================
   59. START OF DAY
========================================================= */

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/* =========================================================
   60. CATEGORY HELPERS
========================================================= */

function getCategory(categoryId) {
  return (
    categories.find((category) => category.id === categoryId) ||
    categories[categories.length - 1]
  );
}

function getCategoryLabel(categoryId) {
  return getCategory(categoryId).label;
}

/* =========================================================
   61. PRIORITY HELPERS
========================================================= */

function getPriorityLabel(priorityId) {
  return priorities[priorityId]?.label || "Medium";
}

/* =========================================================
   62. FIND TASK
========================================================= */

function findTask(taskId) {
  return state.tasks.find((task) => task.id === taskId);
}

/* =========================================================
   63. ID GENERATOR
========================================================= */

function generateId() {
  if (window.crypto && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/* =========================================================
   64. TEXT DIRECTION
========================================================= */

function detectDirection(text) {
  if (!text) {
    return "ltr";
  }

  const firstStrongCharacter = text.match(
    /[\u0590-\u08FF\uFB1D-\uFDFD\uFE70-\uFEFCA-Za-z]/,
  );

  if (!firstStrongCharacter) {
    return "ltr";
  }

  const character = firstStrongCharacter[0];

  const isRTL = /[\u0590-\u08FF\uFB1D-\uFDFD\uFE70-\uFEFC]/.test(character);

  return isRTL ? "rtl" : "ltr";
}

/* =========================================================
   65. PERSIAN DIGITS
========================================================= */

function toPersianDigits(value) {
  return String(value).replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)]);
}

/* =========================================================
   66. FORM ERRORS
========================================================= */

function showFieldError(input, message) {
  if (!input) return;

  input.classList.add("error");

  const group = input.closest(".form-group");

  if (!group) return;

  let error = group.querySelector(".field-error");

  if (!error) {
    error = document.createElement("div");

    error.className = "field-error";

    group.appendChild(error);
  }

  error.textContent = message;
}

function clearFormErrors() {
  document
    .querySelectorAll(".form-input.error, .form-textarea.error")
    .forEach((input) => {
      input.classList.remove("error");
    });

  document.querySelectorAll(".field-error").forEach((error) => {
    error.remove();
  });
}

/* =========================================================
   67. TOAST
========================================================= */

function showToast(message, type = "success", options = {}) {
  if (!elements.toastContainer) {
    return;
  }

  const toastId = generateId();

  const toast = document.createElement("div");

  toast.className = `toast toast-${type}`;

  const icon =
    type === "error"
      ? "fa-circle-exclamation"
      : type === "warning"
        ? "fa-triangle-exclamation"
        : "fa-check";

  toast.innerHTML = `

        <div class="toast-icon">
            <i class="fa-solid ${icon}"></i>
        </div>

        <div class="toast-content">
            <div class="toast-message">
                ${escapeHTML(message)}
            </div>
        </div>

        ${
          options.action
            ? `
                    <button
                        type="button"
                        class="toast-action"
                    >
                        ${escapeHTML(options.actionText || "Undo")}
                    </button>
                `
            : ""
        }

    `;

  if (options.action) {
    toast.querySelector(".toast-action").addEventListener("click", () => {
      options.action();

      removeToast(toast);
    });
  }

  elements.toastContainer.appendChild(toast);

  const timeout = setTimeout(() => {
    removeToast(toast);
  }, 4000);

  state.toastTimeouts.set(toastId, timeout);
}

/* =========================================================
   68. REMOVE TOAST
========================================================= */

function removeToast(toast) {
  if (!toast) return;

  toast.classList.add("removing");

  setTimeout(() => {
    toast.remove();
  }, 180);
}

/* =========================================================
   69. ESCAPE HTML
========================================================= */

function escapeHTML(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* =========================================================
   70. EXPORT DEBUG OBJECT
========================================================= */

window.todoApp = {
  getTasks() {
    return [...state.tasks];
  },

  addTask(data) {
    createTask({
      title: data.title || "New Task",

      description: data.description || "",

      category: data.category || "other",

      priority: data.priority || "medium",

      dueDate: data.dueDate || null,
    });
  },

  clearAll() {
    state.tasks = [];

    saveTasks();

    render();
  },

  resetApp() {
    localStorage.removeItem(STORAGE_KEYS.tasks);

    localStorage.removeItem(STORAGE_KEYS.theme);

    location.reload();
  },
};
window.addEventListener("load", () => {
  setTimeout(() => {
    const splash = document.getElementById("splash-screen");

    if (splash) {
      splash.remove();
    }
  }, 1200);
});
