const data = load()

const searchBar = document.querySelector("#search-bar")
const taskList = document.querySelector('#task-list')
const trash = document.querySelector("#trash")
const addTaskButton = document.querySelector('.float-action-button')
const colorPickers = document.querySelector("#c-pick-container")

searchBar.addEventListener("input", applySearchFilter)

Sortable.create(taskList, {
  group: "task",
  delay: 20,
  ghostClass: "ghost",
  chosenClass: "choose",
  handle: ".task-done + label",
  onStart: () => {
    trash.classList.add("visible")
  },
  onEnd: ({ oldIndex, newIndex, to }) => {
    const length = data.tasks.length - 1
    oldIndex = length - oldIndex;
    newIndex = length - newIndex;

    const [task] = data.tasks.splice(oldIndex, 1)

    if (to != trash)
      data.tasks.splice(newIndex, 0, task)

    save()

    trash.classList.remove("visible")
  }
})

Sortable.create(trash, {
  group: "task",
  onAdd: () => {
    trash.innerHTML = ""
  }
})

addTaskButton.addEventListener("click", addTask)

addEventListener("keydown", (evt) => {
  if (evt.ctrlKey) {
    switch (evt.key) {
      case "r":
        if (app) app?.forceUpdate()
        break
      case "Tab": addTask()
        break;
      default:
        return
    }
  }
})

addEventListener("focusin", evt => {
  const label = evt.target

  if (label.matches(".task-label")) {
    colorPickers.classList.remove("hidden")
  }
})

addEventListener("focusout", evt => {
  if (evt.target.matches(".task-label"))
    colorPickers.classList.add("hidden")
})

renderTasks()

function applySearchFilter() {
  taskList.querySelectorAll(".task-item").forEach(item => {
    const content = item.innerText.toLowerCase()
    const query = searchBar.value.toLowerCase()

    if (content.indexOf(query) >= 0)
      item.classList.remove("hidden")
    else
      item.classList.add("hidden")
  })
}

function renderTasks() {
  taskList.innerHTML = ""
  data.tasks.forEach(task => {
    const { taskItem } = createTask(task)
    taskList.insertBefore(taskItem, taskList.firstChild)
  })
}

function createTask(state) {
  state.id = state.id || data.globalId++
  state.label = state.label || ""
  state.color = state.color || "gray"

  const taskItem = document.createElement('li')
  taskItem.dataset.color = state.color
  taskItem.className = `task-item ${state.color}`
  taskItem.id = state.id

  const taskDone = document.createElement("input")
  taskDone.id = `task_done_${state.id}`
  taskDone.className = "task-done"
  taskDone.type = "checkbox"
  taskDone.checked = state.checked
  taskItem.appendChild(taskDone)

  const doneLabel = document.createElement("label")
  doneLabel.htmlFor = taskDone.id
  taskItem.appendChild(doneLabel)

  const taskLabel = document.createElement("span")
  taskLabel.className = "task-label"
  taskLabel.contentEditable = true
  taskLabel.innerText = state.label
  taskItem.appendChild(taskLabel)

  const saveState = () => {
    state.color = taskItem.dataset.color
    state.checked = taskDone.checked
    state.label = taskLabel.textContent
    save()
  }

  taskDone.addEventListener("change", saveState)
  taskLabel.addEventListener("input", saveState)

  taskItem.addEventListener("focusin", () => {
    document.querySelectorAll(".color-pick")
      .forEach(pick => {
        pick.onmousedown = (e) => {
          e.preventDefault();
          taskItem.dataset.color = pick.dataset.color
          saveState()
        }
      })
  })

  taskLabel.addEventListener('focusout', () => {
    if (!taskLabel.innerText.trim()) { // Remove if empty
      taskItem.remove()

      const index = data.tasks.indexOf(state)
      data.tasks.splice(index, 1)

      save()
      return
    }

    saveState()
  })

  return { state, taskItem, taskDone, taskLabel }
}

function addTask() {
  const { state, taskItem, taskLabel } = createTask({})

  data.tasks.push(state)

  taskList.insertBefore(taskItem, taskList.firstChild)
  taskLabel.focus()
}

function load() {
  const jsonData = localStorage.getItem("data")

  if (jsonData) {
    return JSON.parse(jsonData)
  }

  return {
    globalId: 1,
    tasks: []
  }
}

function save() {
  const jsonData = JSON.stringify(data)
  localStorage.setItem("data", jsonData)
}
