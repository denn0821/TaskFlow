from flask import Flask, request, jsonify
from flask_cors import CORS
from storage import get_all_tickets, create_ticket, update_ticket

app = Flask(__name__)
CORS(app)  # allow requests from your frontend (http://127.0.0.1:5500 etc.)

@app.route("/api/tickets", methods = ["GET"])
def list_tickets():
    tickets = get_all_tickets()
    return jsonify(tickets)

#create_ticket_route() receives data from the front end and creates a valid ticket
# in JSON.
@app.route("/api/tickets", methods = ["POST"])
def create_ticket_route():
    data = request.get_json() or {}
    title = data.get("title", "").strip()
    description = data.get("description", "").strip()
    priority = data.get("priority", "medium")
    assignee = data.get("assignee", "").strip()

    if not title:
        return jsonify({"error: title is required"}), 400
    
    ticket = create_ticket(title, description, priority, assignee)
    return jsonify(ticket), 201

#update_ticket_route() gets the ticket id from the URL, changs only the destinated fields,
# and ask storage.update_ticket to apply changes.
@app.route("/api/tickets/<int:ticket_id>", methods = ["PATCH"])
def update_ticket_route(ticket_id):
    data = request.get_json() or {}

    allowed = {k: v for k, v in data.items()
               if k in {"title", "description", "status", "priority", "assignee"}}
    
    if not allowed:
        return jsonify({"error: No valid field provided"}), 400
    
    ok = update_ticket(ticket_id, allowed)

    if not ok:
        return jsonify({"error": "Ticket not found"}), 404

    return jsonify({"message": "Ticket updated"})

if __name__ == "__main__":
    # start the development server
    app.run(debug=True)

