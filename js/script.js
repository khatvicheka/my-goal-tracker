      let goals = JSON.parse(localStorage.getItem("goals")) || [];
      let currentGoalId = null;
      let editingGoalId = null;
      let editingTaskId = null;

      // Initialize
      $(document).ready(function () {
        renderGoals();

        // Event listeners
        $("#searchInput").on("input", filterAndRenderGoals);
        $("#statusFilter, #sortBy").on("change", filterAndRenderGoals);
        $("#goalForm").on("submit", saveGoal);
        $("#taskFormElement").on("submit", saveTask);
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
          tasks: editingGoalId
            ? goals.find((g) => g.id === editingGoalId).tasks
            : [],
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
        if (
          confirm(
            "Are you sure you want to delete this goal and all its tasks?"
          )
        ) {
          goals = goals.filter((g) => g.id !== goalId);
          localStorage.setItem("goals", JSON.stringify(goals));
          renderGoals();
        }
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
        const completedTasks = goal.tasks.filter(
          (task) => task.completed
        ).length;
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

        if (filteredGoals.length === 0) {
          container.html(`
                    <div style="grid-column: 1/-1; text-align: center; padding: 60px; color: #64748b;">
                        <i class="fas fa-bullseye" style="font-size: 48px; margin-bottom: 20px; opacity: 0.5;"></i>
                        <h3>No goals found</h3>
                        <p>Create your first goal to get started!</p>
                    </div>
                `);
          return;
        }

        const goalsHtml = filteredGoals
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
                            <div style="flex: 1;">
                                <div class="goal-title">${goal.title}</div>
                                <div class="goal-meta">
                                    <span><i class="fas fa-calendar"></i> ${formatDate(
                                      goal.startDate
                                    )} - ${formatDate(goal.endDate)}</span>
                                    <span><i class="fas fa-flag"></i> ${
                                      goal.priority
                                    }</span>
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
                            <button class="btn btn-danger" onclick="deleteGoal('${
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
                                <button class="btn-danger" onclick="deleteTask('${
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

      function filterAndRenderGoals() {
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
                  if (
                    confirm(
                      "This will replace all existing goals. Are you sure?"
                    )
                  ) {
                    goals = importedGoals;
                    localStorage.setItem("goals", JSON.stringify(goals));
                    renderGoals();
                    alert("Goals imported successfully!");
                  }
                } else {
                  alert(
                    "Invalid file format. Please select a valid goals backup file."
                  );
                }
              } catch (error) {
                alert("Error reading file. Please select a valid JSON file.");
              }
            };
            reader.readAsText(file);
          }
        };
        input.click();
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
      if (goals.length === 0) {
        goals = [
          {
            id: generateId(),
            title: "Learn Web Development",
            description: "Master HTML, CSS, JavaScript and modern frameworks",
            startDate: "2025-05-01",
            endDate: "2025-12-31",
            status: "active",
            priority: "high",
            resources: [
              {
                url: "https://roadmap.sh/frontend",
                title: "Frontend Developer Roadmap",
              },
              {
                url: "https://github.com/kamranahmedse/developer-roadmap",
                title: "Web Developer Roadmap",
              },
            ],
            createdAt: new Date().toISOString(),
            tasks: [
              {
                id: generateId(),
                title: "Complete HTML & CSS Course",
                description: "Learn the fundamentals of web markup and styling",
                startDate: "2025-05-01",
                endDate: "2025-07-01",
                completed: true,
                resources: [
                  {
                    url: "https://developer.mozilla.org/en-US/docs/Web/HTML",
                    title: "MDN HTML Guide",
                  },
                  {
                    url: "https://www.w3schools.com/css/",
                    title: "W3Schools CSS Tutorial",
                  },
                ],
                createdAt: new Date().toISOString(),
              },
              {
                id: generateId(),
                title: "JavaScript Fundamentals",
                description:
                  "Master core JavaScript concepts and ES6+ features",
                startDate: "2025-07-01",
                endDate: "2025-09-01",
                completed: false,
                resources: [
                  { url: "https://javascript.info/", title: "JavaScript.info" },
                  {
                    url: "https://eloquentjavascript.net/",
                    title: "Eloquent JavaScript Book",
                  },
                ],
                createdAt: new Date().toISOString(),
              },
              {
                id: generateId(),
                title: "Build Portfolio Website",
                description:
                  "Create a professional portfolio showcasing projects",
                startDate: "2025-09-01",
                endDate: "2025-10-01",
                completed: false,
                resources: [
                  { url: "https://github.com/", title: "GitHub Pages" },
                  { url: "https://netlify.com/", title: "Netlify Hosting" },
                ],
                createdAt: new Date().toISOString(),
              },
            ],
          },
          {
            id: generateId(),
            title: "Fitness Goals 2025",
            description: "Get in shape and maintain a healthy lifestyle",
            startDate: "2025-01-01",
            endDate: "2025-12-31",
            status: "active",
            priority: "medium",
            createdAt: new Date().toISOString(),
            tasks: [
              {
                id: generateId(),
                title: "Morning Workout Routine",
                description: "30 minutes exercise every morning",
                startDate: "2025-01-01",
                endDate: "2025-12-31",
                completed: false,
                resources: [
                  {
                    url: "https://www.youtube.com/fitness",
                    title: "Fitness YouTube Channel",
                  },
                  {
                    url: "https://myfitnesspal.com/",
                    title: "MyFitnessPal App",
                  },
                ],
                createdAt: new Date().toISOString(),
              },
            ],
          },
        ];
        localStorage.setItem("goals", JSON.stringify(goals));
      }