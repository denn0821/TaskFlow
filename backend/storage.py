import json
from pathlib import Path
from datetime import datetime, timezone

DATA_PATH = Path(__file__).resolve().parent / "tickets.json"

#_load_raw() reads tickets.json and return the list of tickets
def _load_raw():
    if not DATA_PATH.exists():
        return []
    try:
        with open(DATA_PATH, "r", encoding="utf_8") as f:
            return json.load(f)
    except json.JSONDecodeError:
        return []
    
#_save_raw() saves the entire ticket lists into tickets.json
def _save_raw(tickets):
    with open (DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(tickets, f, ensure_ascii= False, indent = 2)

#now_iso() returns current time in a nice format
def now_iso():
    return datetime.now(timezone.utc).isoformate(timespec = "seconds")

def get_all_tickets():
    tickets = _load_raw()
    return sorted(tickets, key=lambda t: t["created_at"], reverse=True)

#create_tickets() creates new ticket and adds it to the ticket list
def create_ticket(title, description = "", priority = "medium", assignee = ""):
    tickets = _load_raw()
    next_id = max((t["id"] for t in tickets), default=0) + 1
    ts = now_iso()

    ticket = {
        "id": next_id,
        "title": title,
        "description": description,
        "status": "Open",
        "priority": priority,
        "assignee": assignee,
        "created_at": ts,
        "updated_at": ts,
    }

    tickets.append(ticket)
    _save_raw(tickets)
    return ticket

#update_ticket() finds the correct ticket and updates it
def update_ticket(ticket_id, updates):
    tickets = _load_raw()
    updated = False

    for t in tickets:
        if t["id"] == ticket_id:
            for key, value in updates.items():
                if key in {"title", "description", "status", "priority", "assignee"}:
                    t[key] = value
                    updated = True
            if updated:
                t["updated_at"] = now_iso()
            break
    
    if updated:
        _save_raw(tickets)
    return updated
