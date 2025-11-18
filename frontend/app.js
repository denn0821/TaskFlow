const API_BASE = "http://127.0.0.1:5000/api";

const ticketForm = document.getElementById("ticket-form");
const ticketsBody = document.getElementById("tickets-body");
const statusFilter = document.getElementById("status-filter");
const priorityFilter = document.getElementById("priority-filter");
const refreshBtn = document.getElementById("refresh-btn");
const formMessage = document.getElementById("form-message");
const tableMessage = document.getElementById("table-message");

const countTotal = document.getElementById("count-total");
const countOpen = document.getElementById("count-open");
const countInProgress = document.getElementById("count-inprogress");
const countDone = document.getElementById("count-done");

let cachedTickets = [];

//API helper

//apiGetTickets(payload)sends the ticket form data to the Flask backend and waits for the backend
// to create the ticket, then returns the response.
async function apiGetTickets() {
  const res = await fetch(`${API_BASE}/tickets`);

  if (!res.ok) {
    // optional: try to parse any error JSON
    let err = {};
    try {
      err = await res.json();
    } catch {}
    throw new Error(err.error || "Failed to load tickets.");
  }

  return await res.json();
}

//apiCreateTickets(payload) sends POST request to /api/tickets, sends JSON body with the new ticket data
//If backend returns error → throw exception
//If success → return the newly created ticket
async function apiCreateTickets(payload){
    const res = await fetch(`${API_BASE}/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create ticket");
    }
    return await res.json();
} 

//apiUpdateTicket(id, payload)
async function apiUpdateTicket(id, payload){
    const res = await fetch(`${API_BASE}/tickets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update ticket");
    }
    return await res.json();
}

//Rendering

function updateSummary(tickets){
    const total = tickets.length;
    const open = tickets.filter(t => t.status === "Open").length;
    const inProgress = tickets.filter(t => t.status === "In Progress").length;
    const done = tickets.filter(t => t.status === "Done").length;

    countTotal.textContent = `Total: ${total}`;
    countOpen.textContent = `Open: ${open}`;
    countInProgress.textContent = `In Progress: ${inProgress}`;
    countDone.textContent = `Done: ${done}`;
}

function renderTickets(){
    const statusVal = statusFilter.value;
    const priorityVal = priorityFilter.value;
    const filtered = cachedTickets.filter(t => {
        const statusOK = !statusVal || t.status === statusVal;
        const priorityOK = !priorityVal || t.priority === priorityVal;
        return statusOK && priorityOK;
    });

    ticketsBody.innerHTML = "";

    if (filtered.length === 0) {
        tableMessage.textContent = "No tickets to display.";
    } else {
        tableMessage.textContent = "";
    }

    updateSummary(filtered);

    filtered.forEach(t => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
        <td>${t.id}</td>
        <td>${escapeHtml(t.title)}</td>
        <td>
            <select data-id="${t.id}" class="status-select">
                ${["Open", "In Progress", "Blocked", "Done"]
                .map(
                    s =>
                        `<option value="${s}" ${
                            s === t.status ? "selected" : ""
                        }>${s}</option>`
                    )
                .join("")}
            </select>
        </td>
        <td>${escapeHtml(t.priority)}</td>
        <td>${escapeHtml(t.assignee || "")}</td>
        <td>${formatDate(t.created_at)}</td>
        <td>${formatDate(t.updated_at)}</td>
        <td><button data-id="${t.id}" class="save-btn">Save</button></td>`
      ;
      ticketsBody.appendChild(tr);
    });

}

// small helper to avoid injecting raw HTML from user input
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatDate(iso) {
  if (!iso) return "";
  // quick pretty formatting, still readable
  try {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return date.toLocaleString();
  } catch {
    return iso;
  }
}

async function loadAndRender() {
  try {
    tableMessage.textContent = "Loading tickets...";
    cachedTickets = await apiGetTickets();
    renderTickets();
  } catch (err) {
    console.error(err);
    tableMessage.textContent = "Failed to load tickets.";
    tableMessage.classList.add("error");
  }
}

//Event Handler

//create tickets
ticketForm.addEventListener("submit", async e => {
    e.preventDefault();
    formMessage.textContent = "";
    formMessage.className = "message";

    const payload = {
        title: document.getElementById("title").value.trim(),
        description: document.getElementById("description").value.trim(),
        priority: document.getElementById("priority").value,
        assignee: document.getElementById("assignee").value.trim(),
    };

    if (! payload.title) {
        formMessage.textContent = "Title is required.";
        formMessage.classList.add("error");
        return;
    }

    try{
        await apiCreateTickets(payload);
        formMessage.textContent = "Ticket created.";
        formMessage.classList.add("success");
        ticketForm.reset();
        document.getElementById("priority").value = "Medium";
        await loadAndRender();
    } catch (err) {
        console.error(err);
        formMessage.textContent = err.message || "Failed to create ticket.";
        formMessage.classList.add("error");
    }
});

//save button for status update
ticketsBody.addEventListener("click", async e =>{
    if (! e.target.classList.contains("save-btn")) return;

    const id = e.target.dataset.id;
    const select = ticketsBody.querySelector(
        `select.status-select[data-id="${id}"]`
    );
    if (!select) return;

    const newStatus = select.value;

    e.target.disabled = true;
    e.target.textContent = "Saving...";

    try {
        await apiUpdateTicket(id, { status: newStatus });
        await loadAndRender();
    } catch (err) {
        console.error(err);
        tableMessage.textContent = err.message || "Failed to update ticket.";
        tableMessage.classList.add("error");
    } finally {
        e.target.disabled = false;
        e.target.textContent = "Save";
    }
});

//filters
statusFilter.addEventListener("change", renderTickets);
priorityFilter.addEventListener("change", renderTickets);

//refresh
refreshBtn.addEventListener("click", loadAndRender);

//initial load
loadAndRender();
