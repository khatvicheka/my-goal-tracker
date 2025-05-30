let goals = JSON.parse(localStorage.getItem("goals")) || [];
let currentGoalId = null;
let editingGoalId = null;
let editingTaskId = null;
// Task pagination variables
let currentTaskPage = 1;
const tasksPerPage = 3;
let currentGoalPage = 1;
const goalsPerPage = 6; // or whatever number you prefer

// Initialize
$(document).ready(function () {
  renderGoals();

  // Event listeners
  $("#searchInput").on("input", filterAndRenderGoals);
  $("#statusFilter, #sortBy").on("change", filterAndRenderGoals);
  $("#goalForm").on("submit", saveGoal);
  $("#taskFormElement").on("submit", saveTask);
  $("#taskSearchInput").on("input", filterAndRenderTasks);
  $("#taskStatusFilter").on("change", filterAndRenderTasks);
});

function generateId() {
  return "id_" + Math.random().toString(36).substr(2, 9) + Date.now();
}

function openGoalModal(goalId = null) {
  editingGoalId = goalId;
  const modal = $("#goalModal");
  const title = $("#goalModalTitle");

  if (goalId) {
    const goal = goals.find((g) => g.id === goalId);
    title.text("Edit Goal");
    $("#goalTitle").val(goal.title);
    $("#goalDescription").val(goal.description);
    $("#goalStartDate").val(goal.startDate);
    $("#goalEndDate").val(goal.endDate);
    $("#goalStatus").val(goal.status);
    $("#goalPriority").val(goal.priority);

    // Handle resources if they exist
    if (goal.resources && Array.isArray(goal.resources)) {
      const resourcesText = goal.resources
        .map((r) => `${r.url} - ${r.title}`)
        .join("\n");
      $("#goalResources").val(resourcesText);
    } else {
      $("#goalResources").val("");
    }
  } else {
    title.text("Create New Goal");
    $("#goalForm")[0].reset();
    $("#goalStartDate").val(new Date().toISOString().split("T")[0]);
  }

  modal.show();
}

function closeGoalModal() {
  $("#goalModal").hide();
  editingGoalId = null;
}

function saveGoal(e) {
  e.preventDefault();

  // Process resources from the form
  const resources = $("#goalResources")
    .val()
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => {
      const parts = line.split(" - ");
      return {
        url: parts[0].trim(),
        title: parts[1] ? parts[1].trim() : parts[0].trim(),
      };
    });

  const goalData = {
    id: editingGoalId || generateId(),
    title: $("#goalTitle").val(),
    description: $("#goalDescription").val(),
    startDate: $("#goalStartDate").val(),
    endDate: $("#goalEndDate").val(),
    status: $("#goalStatus").val(),
    priority: $("#goalPriority").val(),
    resources: resources,
    tasks: editingGoalId ? goals.find((g) => g.id === editingGoalId).tasks : [],
    createdAt: editingGoalId
      ? goals.find((g) => g.id === editingGoalId).createdAt
      : new Date().toISOString(),
  };

  if (editingGoalId) {
    const index = goals.findIndex((g) => g.id === editingGoalId);
    goals[index] = goalData;
  } else {
    goals.push(goalData);
  }

  localStorage.setItem("goals", JSON.stringify(goals));
  closeGoalModal();
  renderGoals();
}

function deleteGoal(goalId) {
  showConfirmModal(
    "Delete Goal",
    "Are you sure you want to delete this goal and all its tasks? This action cannot be undone.",
    () => {
      try {
        goals = goals.filter((g) => g.id !== goalId);
        localStorage.setItem("goals", JSON.stringify(goals));

        // Adjust current page if we deleted the last item on the page
        const filteredGoals = getFilteredGoals();
        const totalPages = Math.ceil(filteredGoals.length / goalsPerPage);
        if (currentGoalPage > totalPages && totalPages > 0) {
          currentGoalPage = totalPages;
        }

        renderGoals();

        // Show success toast
        showToast(
          "success",
          "Goal Deleted",
          "Goal and all its tasks have been deleted successfully."
        );
      } catch (error) {
        showToast(
          "error",
          "Delete Failed",
          "Failed to delete goal. Please try again."
        );
      }
    }
  );
}

function openTaskModal(goalId) {
  currentGoalId = goalId;
  const goal = goals.find((g) => g.id === goalId);
  $("#taskModalTitle").text(`Tasks for: ${goal.title}`);
  renderTasks();
  $("#taskModal").show();
}

function closeTaskModal() {
  $("#taskModal").hide();
  currentGoalId = null;
  renderGoals();
}

function openTaskFormModal(taskId = null) {
  editingTaskId = taskId;
  const modal = $("#taskFormModal");
  const title = $("#taskFormModalTitle");

  if (taskId) {
    const goal = goals.find((g) => g.id === currentGoalId);
    const task = goal.tasks.find((t) => t.id === taskId);

    title.text("Edit Task");
    $("#taskTitle").val(task.title);
    $("#taskDescription").val(task.description);
    $("#taskStartDate").val(task.startDate);
    $("#taskEndDate").val(task.endDate);

    const resourcesText = task.resources
      .map((r) => `${r.url} - ${r.title}`)
      .join("\n");
    $("#taskResources").val(resourcesText);
  } else {
    title.text("Create New Task");
    $("#taskFormElement")[0].reset();
  }

  modal.show();
}

function closeTaskFormModal() {
  $("#taskFormModal").hide();
  editingTaskId = null;
}

function toggleTaskForm() {
  // This function is no longer needed but kept for compatibility
  openTaskFormModal();
}

function cancelTaskForm() {
  // This function is no longer needed but kept for compatibility
  closeTaskFormModal();
}

function saveTask(e) {
  e.preventDefault();

  const goal = goals.find((g) => g.id === currentGoalId);
  const resources = $("#taskResources")
    .val()
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => {
      const parts = line.split(" - ");
      return {
        url: parts[0].trim(),
        title: parts[1] ? parts[1].trim() : parts[0].trim(),
      };
    });

  const taskData = {
    id: editingTaskId || generateId(),
    title: $("#taskTitle").val(),
    description: $("#taskDescription").val(),
    startDate: $("#taskStartDate").val(),
    endDate: $("#taskEndDate").val(),
    completed: editingTaskId
      ? goal.tasks.find((t) => t.id === editingTaskId).completed
      : false,
    resources: resources,
    createdAt: editingTaskId
      ? goal.tasks.find((t) => t.id === editingTaskId).createdAt
      : new Date().toISOString(),
  };

  if (editingTaskId) {
    const taskIndex = goal.tasks.findIndex((t) => t.id === editingTaskId);
    goal.tasks[taskIndex] = taskData;
  } else {
    goal.tasks.push(taskData);
  }

  localStorage.setItem("goals", JSON.stringify(goals));
  closeTaskFormModal();
  renderTasks();
}

function editTask(taskId) {
  openTaskFormModal(taskId);
}

function deleteTask(taskId) {
  if (confirm("Are you sure you want to delete this task?")) {
    const goal = goals.find((g) => g.id === currentGoalId);
    goal.tasks = goal.tasks.filter((t) => t.id !== taskId);
    localStorage.setItem("goals", JSON.stringify(goals));
    renderTasks();
  }
}

function toggleTaskComplete(taskId) {
  const goal = goals.find((g) => g.id === currentGoalId);
  const task = goal.tasks.find((t) => t.id === taskId);
  task.completed = !task.completed;
  localStorage.setItem("goals", JSON.stringify(goals));
  renderTasks();
}

function calculateProgress(goal) {
  if (goal.tasks.length === 0) return 0;
  const completedTasks = goal.tasks.filter((task) => task.completed).length;
  return Math.round((completedTasks / goal.tasks.length) * 100);
}

function formatDate(dateString) {
  if (!dateString) return "Not set";
  const date = new Date(dateString);
  return date.toLocaleDateString();
}

function getStatusBadge(status) {
  const statusClasses = {
    active: "status-active",
    completed: "status-completed",
    paused: "status-paused",
  };
  return `<span class="status-badge ${statusClasses[status]}">${status}</span>`;
}

function renderGoals() {
  const container = $("#goalsContainer");
  const filteredGoals = getFilteredGoals();

  // Calculate pagination
  const totalGoals = filteredGoals.length;
  const totalPages = Math.ceil(totalGoals / goalsPerPage);
  const startIndex = (currentGoalPage - 1) * goalsPerPage;
  const endIndex = Math.min(startIndex + goalsPerPage, totalGoals);
  const goalsToShow = filteredGoals.slice(startIndex, endIndex);

  if (filteredGoals.length === 0) {
    container.html(`
    <div style="grid-column: 1/-1; text-align: center; padding: 60px; color: #64748b; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 400px;">
      <i class="fas fa-bullseye" style="font-size: 48px; margin-bottom: 20px; opacity: 0.5;"></i>
      <h3>No goals found</h3>
      <p>${
        $("#searchInput").val() || $("#statusFilter").val()
          ? "Try adjusting your search or filter."
          : "Create your first goal to get started!"
      }</p>
    </div>
  `);
    updateGoalPagination(0, 0, 0, 0);
    return;
  }

  const goalsHtml = goalsToShow
    .map((goal) => {
      const progress = calculateProgress(goal);
      const completedTasks = goal.tasks.filter((t) => t.completed).length;

      // Generate resource links HTML if resources exist
      let resourcesHtml = "";
      if (
        goal.resources &&
        Array.isArray(goal.resources) &&
        goal.resources.length > 0
      ) {
        const links = goal.resources
          .map(
            (resource) =>
              `<a href="${resource.url}" target="_blank" class="resource-link">
                <i class="fas fa-external-link-alt"></i> ${resource.title}
              </a>`
          )
          .join("");
        resourcesHtml = `<div class="task-resources">${links}</div>`;
      }

      return `
        <div class="goal-card">
          <div class="goal-header">
            <div class="goal-header-content">
              <div class="goal-title">${goal.title}</div>
              <div class="goal-meta">
                <span><i class="fas fa-calendar-alt"></i> ${formatDate(
                  goal.startDate
                )} - ${formatDate(goal.endDate)}</span>
                <span class="priority-${
                  goal.priority
                }"><i class="fas fa-flag"></i> ${goal.priority}</span>
              </div>
            </div>
            ${getStatusBadge(goal.status)}
          </div>
          
          ${
            goal.description
              ? `<div class="goal-description">${goal.description}</div>`
              : ""
          }
          
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${progress}%"></div>
          </div>
          <div class="progress-text">${progress}% Complete</div>
          
          ${resourcesHtml}
          
          <div class="tasks-summary">
            <span><i class="fas fa-tasks"></i> ${completedTasks}/${
        goal.tasks.length
      } tasks completed</span>
            <button class="btn btn-secondary" onclick="openTaskModal('${
              goal.id
            }')">
              <i class="fas fa-eye"></i> View Tasks
            </button>
          </div>
          
          <div class="goal-actions">
            <button class="btn btn-secondary" onclick="openGoalModal('${
              goal.id
            }')">
              <i class="fas fa-edit"></i> Edit
            </button>
            <button class="btn btn-secondary" onclick="deleteGoal('${
              goal.id
            }')">
              <i class="fas fa-trash"></i> Delete
            </button>
          </div>
        </div>
      `;
    })
    .join("");

  container.html(goalsHtml);
  updateGoalPagination(totalGoals, startIndex + 1, endIndex, totalPages);
}

// Goal pagination functions
function updateGoalPagination(total, start, end, totalPages) {
  const paginationContainer = $("#goalPagination");
  const paginationInfo = $("#goalPaginationInfo");
  const prevBtn = $("#prevGoalsBtn");
  const nextBtn = $("#nextGoalsBtn");

  if (total <= goalsPerPage) {
    paginationContainer.addClass("hidden");
    return;
  }

  paginationContainer.removeClass("hidden");
  paginationInfo.text(`Showing ${start}-${end} of ${total} goals`);

  // Update button states
  prevBtn.prop("disabled", currentGoalPage === 1);
  nextBtn.prop("disabled", currentGoalPage === totalPages);
}

function prevGoalsPage() {
  if (currentGoalPage > 1) {
    currentGoalPage--;
    renderGoals();
  }
}

function nextGoalsPage() {
  const filteredGoals = getFilteredGoals();
  const totalPages = Math.ceil(filteredGoals.length / goalsPerPage);

  if (currentGoalPage < totalPages) {
    currentGoalPage++;
    renderGoals();
  }
}

function renderTasks() {
  const goal = goals.find((g) => g.id === currentGoalId);
  const container = $("#tasksList");

  if (goal.tasks.length === 0) {
    container.html(`
                    <div style="text-align: center; padding: 40px; color: #64748b;">
                        <i class="fas fa-tasks" style="font-size: 32px; margin-bottom: 15px; opacity: 0.5;"></i>
                        <p>No tasks yet. Add your first task to get started!</p>
                    </div>
                `);
    return;
  }

  const tasksHtml = goal.tasks
    .map((task) => {
      const resourcesHtml = task.resources
        .map(
          (resource) =>
            `<a href="${resource.url}" target="_blank" class="resource-link">
                        <i class="fas fa-external-link-alt"></i> ${resource.title}
                    </a>`
        )
        .join("");

      return `
                    <div class="task-item ${task.completed ? "completed" : ""}">
                        <div class="task-header">
                            <div style="display: flex; align-items: center;">
                                <input type="checkbox" class="checkbox" ${
                                  task.completed ? "checked" : ""
                                } 
                                       onchange="toggleTaskComplete('${
                                         task.id
                                       }')">
                                <span class="task-title ${
                                  task.completed
                                    ? "text-decoration: line-through;"
                                    : ""
                                }">${task.title}</span>
                            </div>
                            <div class="task-actions">
                                <button class="btn-secondary" onclick="editTask('${
                                  task.id
                                }')">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn-secondary" onclick="deleteTask('${
                                  task.id
                                }')">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                        
                        ${
                          task.description
                            ? `<div style="margin-bottom: 10px; color: #475569;">${task.description}</div>`
                            : ""
                        }
                        
                        <div class="task-meta">
                            ${
                              task.startDate
                                ? `<span><i class="fas fa-play"></i> Start: ${formatDate(
                                    task.startDate
                                  )}</span>`
                                : ""
                            }
                            ${
                              task.endDate
                                ? `<span><i class="fas fa-stop"></i> End: ${formatDate(
                                    task.endDate
                                  )}</span>`
                                : ""
                            }
                        </div>
                        
                        ${
                          task.resources.length > 0
                            ? `<div class="task-resources">${resourcesHtml}</div>`
                            : ""
                        }
                    </div>
                `;
    })
    .join("");

  container.html(tasksHtml);
}

function getFilteredGoals() {
  let filtered = [...goals];

  // Search filter
  const searchTerm = $("#searchInput").val().toLowerCase();
  if (searchTerm) {
    filtered = filtered.filter(
      (goal) =>
        goal.title.toLowerCase().includes(searchTerm) ||
        goal.description.toLowerCase().includes(searchTerm) ||
        goal.tasks.some(
          (task) =>
            task.title.toLowerCase().includes(searchTerm) ||
            task.description.toLowerCase().includes(searchTerm)
        )
    );
  }

  // Status filter
  const statusFilter = $("#statusFilter").val();
  if (statusFilter) {
    filtered = filtered.filter((goal) => goal.status === statusFilter);
  }

  // Sorting
  const sortBy = $("#sortBy").val();
  filtered.sort((a, b) => {
    switch (sortBy) {
      case "title":
        return a.title.localeCompare(b.title);
      case "progress":
        return calculateProgress(b) - calculateProgress(a);
      case "endDate":
        return new Date(a.endDate) - new Date(b.endDate);
      case "created":
      default:
        return new Date(b.createdAt) - new Date(a.createdAt);
    }
  });

  return filtered;
}

function openTaskModal(goalId) {
  currentGoalId = goalId;
  currentTaskPage = 1; // Reset pagination
  const goal = goals.find((g) => g.id === goalId);
  $("#taskModalTitle").text(`Tasks for: ${goal.title}`);
  $("#taskSearchInput").val(""); // Clear search
  $("#taskStatusFilter").val(""); // Clear filter
  renderTasks();
  $("#taskModal").show();
}

function renderTasks() {
  const goal = goals.find((g) => g.id === currentGoalId);
  const container = $("#tasksList");
  const filteredTasks = getFilteredTasks();

  // Calculate pagination
  const totalTasks = filteredTasks.length;
  const totalPages = Math.ceil(totalTasks / tasksPerPage);
  const startIndex = (currentTaskPage - 1) * tasksPerPage;
  const endIndex = Math.min(startIndex + tasksPerPage, totalTasks);
  const tasksToShow = filteredTasks.slice(startIndex, endIndex);

  //   if (filteredTasks.length === 0) {
  //     container.html(`
  //       <div style="text-align: center; padding: 40px; color: #64748b;">
  //         <i class="fas fa-tasks" style="font-size: 32px; margin-bottom: 15px; opacity: 0.5;"></i>
  //         <p>No tasks found. ${
  //           $("#taskSearchInput").val() || $("#taskStatusFilter").val()
  //             ? "Try adjusting your search or filter."
  //             : "Add your first task to get started!"
  //         }</p>
  //       </div>
  //     `);
  //     updateTaskPagination(0, 0, 0, 0);
  //     return;
  //   }

  if (filteredTasks.length === 0) {
    container.html(`
    <div style="text-align: center; padding: 40px; color: #64748b; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">
      <i class="fas fa-tasks" style="font-size: 32px; margin-bottom: 15px; opacity: 0.5;"></i>
      <p>No tasks found. ${
        $("#taskSearchInput").val() || $("#taskStatusFilter").val()
          ? "Try adjusting your search or filter."
          : "Add your first task to get started!"
      }</p>
    </div>
  `);
    updateTaskPagination(0, 0, 0, 0);
    return;
  }

  const tasksHtml = tasksToShow
    .map((task) => {
      const resourcesHtml = task.resources
        .map(
          (resource) =>
            `<a href="${resource.url}" target="_blank" class="resource-link">
              <i class="fas fa-external-link-alt"></i> ${resource.title}
            </a>`
        )
        .join("");

      return `
        <div class="task-item ${task.completed ? "completed" : ""}">
          <div class="task-header">
            <div style="display: flex; align-items: center;">
              <input type="checkbox" class="checkbox" ${
                task.completed ? "checked" : ""
              } 
                     onchange="toggleTaskComplete('${task.id}')">
              <span class="task-title ${
                task.completed ? "text-decoration: line-through;" : ""
              }">${task.title}</span>
            </div>
            <div class="task-actions">
              <button class="btn-secondary" onclick="editTask('${task.id}')">
                <i class="fas fa-edit"></i>
              </button>
              <button class="btn-secondary" onclick="deleteTask('${task.id}')">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
          
          ${
            task.description
              ? `<div style="margin-bottom: 10px; color: #475569;">${task.description}</div>`
              : ""
          }
          
          <div class="task-meta">
            ${
              task.startDate
                ? `<span><i class="fas fa-play"></i> Start: ${formatDate(
                    task.startDate
                  )}</span>`
                : ""
            }
            ${
              task.endDate
                ? `<span><i class="fas fa-stop"></i> End: ${formatDate(
                    task.endDate
                  )}</span>`
                : ""
            }
          </div>
          
          ${
            task.resources.length > 0
              ? `<div class="task-resources">${resourcesHtml}</div>`
              : ""
          }
        </div>
      `;
    })
    .join("");

  container.html(tasksHtml);
  updateTaskPagination(totalTasks, startIndex + 1, endIndex, totalPages);
}

function getFilteredTasks() {
  const goal = goals.find((g) => g.id === currentGoalId);
  let filtered = [...goal.tasks];

  // Search filter
  const searchTerm = $("#taskSearchInput").val().toLowerCase();
  if (searchTerm) {
    filtered = filtered.filter(
      (task) =>
        task.title.toLowerCase().includes(searchTerm) ||
        task.description.toLowerCase().includes(searchTerm)
    );
  }

  // Status filter
  const statusFilter = $("#taskStatusFilter").val();
  if (statusFilter === "completed") {
    filtered = filtered.filter((task) => task.completed);
  } else if (statusFilter === "pending") {
    filtered = filtered.filter((task) => !task.completed);
  }

  return filtered;
}

function updateTaskPagination(total, start, end, totalPages) {
  const paginationContainer = $("#taskPagination");
  const paginationInfo = $("#taskPaginationInfo");
  const prevBtn = $("#prevTasksBtn");
  const nextBtn = $("#nextTasksBtn");

  if (total <= tasksPerPage) {
    paginationContainer.addClass("hidden");
    return;
  }

  paginationContainer.removeClass("hidden");
  paginationInfo.text(`Showing ${start}-${end} of ${total} tasks`);

  // Update button states
  prevBtn.prop("disabled", currentTaskPage === 1);
  nextBtn.prop("disabled", currentTaskPage === totalPages);
}

function prevTasksPage() {
  if (currentTaskPage > 1) {
    currentTaskPage--;
    renderTasks();
  }
}

function nextTasksPage() {
  const filteredTasks = getFilteredTasks();
  const totalPages = Math.ceil(filteredTasks.length / tasksPerPage);

  if (currentTaskPage < totalPages) {
    currentTaskPage++;
    renderTasks();
  }
}

function filterAndRenderTasks() {
  currentTaskPage = 1; // Reset to first page when filtering
  renderTasks();
}

// Update existing functions to reset pagination
function deleteGoal(goalId) {
  showConfirmModal(
    "Delete Goal",
    "Are you sure you want to delete this goal and all its tasks? This action cannot be undone.",
    () => {
      try {
        goals = goals.filter((g) => g.id !== goalId);
        localStorage.setItem("goals", JSON.stringify(goals));

        // Adjust current page if we deleted the last item on the page
        const filteredGoals = getFilteredGoals();
        const totalPages = Math.ceil(filteredGoals.length / goalsPerPage);
        if (currentGoalPage > totalPages && totalPages > 0) {
          currentGoalPage = totalPages;
        }

        renderGoals();

        // Show success toast
        showToast(
          "success",
          "Goal Deleted",
          "Goal and all its tasks have been deleted successfully."
        );
      } catch (error) {
        showToast(
          "error",
          "Delete Failed",
          "Failed to delete goal. Please try again."
        );
      }
    }
  );
}

function deleteTask(taskId) {
  if (confirm("Are you sure you want to delete this task?")) {
    const goal = goals.find((g) => g.id === currentGoalId);
    goal.tasks = goal.tasks.filter((t) => t.id !== taskId);
    localStorage.setItem("goals", JSON.stringify(goals));

    // Adjust current page if we deleted the last item on the page
    const filteredTasks = getFilteredTasks();
    const totalPages = Math.ceil(filteredTasks.length / tasksPerPage);
    if (currentTaskPage > totalPages && totalPages > 0) {
      currentTaskPage = totalPages;
    }

    renderTasks();
  }
}

function filterAndRenderGoals() {
  currentGoalPage = 1; // Reset to first page when filtering
  renderGoals();
}

function exportData() {
  const dataStr = JSON.stringify(goals, null, 2);
  const dataBlob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download =
    "goals-backup-" + new Date().toISOString().split("T")[0] + ".json";
  link.click();
  URL.revokeObjectURL(url);
}

function importData() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";
  input.onchange = function (e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        try {
          const importedGoals = JSON.parse(e.target.result);
          if (Array.isArray(importedGoals)) {
            // Use modern confirmation modal instead of browser confirm
            showConfirmModal(
              "Import Goals",
              "This will replace all existing goals with the imported data. Are you sure you want to continue?",
              () => {
                try {
                  goals = importedGoals;
                  localStorage.setItem("goals", JSON.stringify(goals));
                  renderGoals();

                  // Show success toast instead of alert
                  showToast(
                    "success",
                    "Import Successful",
                    "Goals have been imported successfully!"
                  );
                } catch (error) {
                  showToast(
                    "error",
                    "Import Failed",
                    "Failed to save imported goals. Please try again."
                  );
                }
              }
            );
          } else {
            // Show error toast instead of alert
            showToast(
              "error",
              "Invalid File Format",
              "Please select a valid goals backup file."
            );
          }
        } catch (error) {
          // Show error toast instead of alert
          showToast(
            "error",
            "File Read Error",
            "Error reading file. Please select a valid JSON file."
          );
        }
      };
      reader.readAsText(file);
    }
  };
  input.click();
}

// Modern Confirmation Modal
function showConfirmModal(title, message, onConfirm) {
  document.getElementById("confirmTitle").textContent = title;
  document.getElementById("confirmMessage").textContent = message;
  document.getElementById("confirmModal").style.display = "block";

  const confirmBtn = document.getElementById("confirmBtn");
  confirmBtn.onclick = () => {
    closeConfirmModal();
    onConfirm();
  };
}

function closeConfirmModal() {
  document.getElementById("confirmModal").style.display = "none";
}

// Toast Notification System
function showToast(type, title, message, duration = 4000) {
  const toastContainer = document.getElementById("toastContainer");

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;

  const icons = {
    success: "fas fa-check-circle",
    error: "fas fa-exclamation-circle",
    warning: "fas fa-exclamation-triangle",
    info: "fas fa-info-circle",
  };

  toast.innerHTML = `
    <div class="toast-icon">
      <i class="${icons[type]}"></i>
    </div>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close" onclick="closeToast(this)">
      <i class="fas fa-times"></i>
    </button>
  `;

  toastContainer.appendChild(toast);

  // Auto remove after duration
  setTimeout(() => {
    if (toast.parentNode) {
      closeToast(toast.querySelector(".toast-close"));
    }
  }, duration);
}

function closeToast(closeBtn) {
  const toast = closeBtn.closest(".toast");
  toast.classList.add("toast-exit");
  setTimeout(() => {
    if (toast.parentNode) {
      toast.remove();
    }
  }, 300);
}

// Updated Clear Data Function
function clearAllData() {
  showConfirmModal(
    "Clear All Data",
    "Are you sure you want to permanently delete all goals and tasks? This action cannot be undone.",
    () => {
      // Second confirmation for critical action
      showConfirmModal(
        "Final Confirmation",
        "This will permanently delete ALL your data. There is no way to recover it. Are you absolutely sure?",
        () => {
          try {
            // Clear localStorage
            localStorage.removeItem("goals");
            localStorage.removeItem("tasks");

            // Reset in-memory data
            goals = [];
            tasks = [];

            // Refresh the display
            renderGoals();

            // Show success toast
            showToast(
              "success",
              "Data Cleared",
              "All goals and tasks have been permanently deleted."
            );
          } catch (error) {
            showToast(
              "error",
              "Error",
              "Failed to clear data. Please try again."
            );
          }
        }
      );
    }
  );
}

// Modal click outside to close
$(document).on("click", ".modal", function (e) {
  if (e.target === this) {
    $(this).hide();
    if (this.id === "goalModal") {
      editingGoalId = null;
    } else if (this.id === "taskModal") {
      currentGoalId = null;
      renderGoals();
    } else if (this.id === "taskFormModal") {
      editingTaskId = null;
    }
  }
});

// Keyboard shortcuts
$(document).keydown(function (e) {
  if (e.key === "Escape") {
    $(".modal:visible").hide();
    editingGoalId = null;
    if (!$("#taskModal").is(":visible")) {
      currentGoalId = null;
      renderGoals();
    }
    editingTaskId = null;
  }
});

// Sample data for demo (uncomment to add sample goals)
