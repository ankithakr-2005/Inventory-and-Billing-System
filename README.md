Axeyo Enterprises: Granite Inventory & Billing System

Project Overview

This is a full-stack web application designed for Axeyo Enterprises to digitize their entire granite inventory management and customer invoicing workflow. The system provides real-time stock monitoring, automated sales tax calculation, and professional PDF invoice generation, eliminating previous reliance on paper records and spreadsheets.

| Component | Technology | Role |
| :--- | :--- | :--- |
| Frontend | HTML, CSS, JavaScript, Bootstrap 5 | User Interface (UI), dynamic input, and API consumption. |
| Backend (API) | Node.js, Express.js | Handles business logic, security (CORS), and routing. Runs on Port 5000. |
| Database| MongoDB Atlas (via Mongoose) | Persistent cloud storage for all inventory and invoice documents. |


Features

1. Inventory Management
CRUD Operations: Fully manage granite stock items (Add, Edit, Delete).
Stock Tracking:Tracks stock quantity (M³), item type, size, and rate per unit.
API Endpoint:`/inventory`

2. Dynamic Billing & Invoicing
Automated Calculation:Instantly calculates CGST (9%) and SGST (9%) as items are added.
Unique Tracking:Automatically generates unique, sequential Invoice Numbers (e.g., `INV-AX-00101`).
Data Entry:Supports detailed entry for Buyer, Consignee, and Transport details.
API Endpoint:`/invoices`

3. Reporting & Output
PDF Generation:The "Download PDF" button uses client-side libraries (`html2canvas`, `jspdf`) to capture the structured invoice replica and generate a downloadable PDF file.
View Invoices:Displays a searchable table of all saved invoices fetched from the database.

Local Setup and Launch (Port 5000)

Follow these steps to clone the project and run the backend API and the static frontend files locally.

 1. Prerequisites

You must have the following installed:

Node.js (v18+)
MongoDB Atlas Cluster

2. Backend Installation & Configuration

1. Clone the Repository:
    ```bash
    git clone [YOUR_BACKEND_REPO_URL]
    cd backend
    ```

2.  Install Dependencies:
    ```bash
    npm install
    ```

3.  Configure Environment: Create a file named **`.env`** in the `backend` directory and add your MongoDB connection string and the Port:
    ```env
    MONGO_URI=mongodb+srv://axeyo_admin:YOUR_PASSWORD@cluster0...
    PORT=5000
    ```

4.  Launch the API Server (Stable Environment):
    ```bash
    # Use the 'dev' script for hot-reloading during development
    npm run dev 
    
    # OR the standard start command:
    # npm start
    ```
    The console should confirm: `MongoDB connection successful. Server is running on port 5000`.

3. Frontend Launch

Since the backend serves the static files and fixes all cross-origin errors, the frontend is simple to launch.

1.  Clone Frontend Repository (or move/link the folder).
2. Access Application:Open your web browser and navigate directly to:
    ```
    http://localhost:5000/index.html
    ```

    (The Login Page will load. Use admin / 123456).

---

Key Endpoints & Synchronization

The entire application relies on the stability of the backend API on Port 5000.

| Function | Method | API Endpoint | Notes |
| :--- | :--- | :--- | :--- |
|Login | Client-Side | `js/auth.js` | Dummy credentials (`admin`/`123456`) for testing. |
|Fetch Inventory| `GET` | `/inventory` | Used by `inventory.js` to populate the main table. |
|Save New Item | `POST` | `/inventory` | Inventory modal submission. |
|Save New Invoice | `POST` | `/invoices` | Invoice form submission (Triggers auto-numbering). |
|View Single Invoice | `GET` | `/invoices/:id` | Used by `view-invoices.js` to fetch full details for printing. |


Note: Ensure all frontend JS files are updated to use the live public URL after deployment.)
