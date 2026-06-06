# VendorBridge ERP

**VendorBridge** is a full-stack Procurement & Vendor Management ERP system built with **React.js**, **Node.js/Express**, and **MongoDB**. It covers the complete procurement cycle: RFQ creation, vendor quotation submission, side-by-side comparison, manager approvals, purchase order generation, and invoice dispatch (with PDF download and email).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS v3, React Router v7 |
| Backend | Node.js, Express.js, ES Modules |
| Database | MongoDB with Mongoose ODM |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| PDF | PDFKit |
| Email | Nodemailer (auto falls back to Ethereal SMTP for testing) |
| Charts | Recharts |
| Notifications | react-toastify |

---

## Project Structure

```
vendorbridge/
├── client/                   # React + Vite frontend
│   ├── src/
│   │   ├── api/              # Axios instance + interceptors
│   │   ├── components/       # Sidebar, Navbar, ProtectedRoute
│   │   ├── context/          # AuthContext, NotificationContext
│   │   └── pages/            # One file per screen
│   └── vite.config.js        # Dev proxy → Express on :5000
├── server/                   # Express backend (ESM)
│   ├── controllers/          # Business logic per module
│   ├── middleware/           # JWT auth + role guard
│   ├── models/               # Mongoose schemas
│   ├── routes/               # Express routers
│   ├── utils/                # pdfGenerator, emailSender, logger, notifier
│   ├── seed.js               # Database seeder
│   └── server.js             # Entry point (connects DB, mounts routes)
├── .env                      # Environment variables
└── package.json              # Root orchestrator (concurrently)
```

---

## Prerequisites

- **Node.js** v18+ and **npm** v9+
- **MongoDB** running locally on `mongodb://127.0.0.1:27017` (or configure `MONGO_URI` in `.env`)

---

## Setup & Installation

### 1. Clone the Repository

```bash
git clone <repo-url>
cd vendorbridge
```

### 2. Install All Dependencies

```bash
# Install root (concurrently), server, and client packages in one go
npm run install-all
```

Or manually:

```bash
npm install                        # root
npm install --prefix server        # Express backend
npm install --prefix client        # React frontend
```

### 3. Configure Environment Variables

Edit `.env` in the project root:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/vendorbridge
JWT_SECRET=vendorbridge_jwt_secret_987654321_abcdef

# Optional: SMTP for real email. Leave blank to use Ethereal test accounts.
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=VendorBridge <no-reply@vendorbridge.com>
```

### 4. Seed the Database

Start MongoDB, then run:

```bash
npm run seed
```

This creates **5 test user accounts** and **3 vendor profiles**:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@vendorbridge.com` | `AdminPassword123` |
| Procurement Officer | `officer@vendorbridge.com` | `OfficerPassword123` |
| Manager / Approver | `manager@vendorbridge.com` | `ManagerPassword123` |
| Vendor (Apex Tech) | `apex@vendorbridge.com` | `ApexPassword123` |
| Vendor (Global Office) | `global@vendorbridge.com` | `GlobalPassword123` |

### 5. Start the Application

```bash
npm run dev
```

This runs both the backend (`:5000`) and frontend (`:3000`) concurrently.

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000/api

---

## Features & Screens

### Roles

| Role | Access |
|---|---|
| **Admin** | Vendor management, activity logs, reports & analytics |
| **Procurement Officer** | Create RFQs, compare quotations, generate POs, invoices |
| **Vendor** | Submit quotations, track RFQ status, view POs |
| **Manager** | Approve/reject requests, monitor workflows, reports |

### Screens

1. **Login / Signup / Forgot Password** — JWT auth with form validation
2. **Dashboard** — Role-filtered KPI cards, charts, activity feed
3. **Vendor Management** — CRUD with search/filter, detail page
4. **RFQ Management** — Create, publish, track status
5. **Quotation Submission** — Vendor pricing input with deadline enforcement
6. **Quotation Comparison** — Side-by-side matrix with lowest-price highlights
7. **Approval Workflow** — Manager approve/reject with remarks & timeline
8. **Purchase Orders** — Auto-generated PO numbers, state transitions, GST 18%
9. **Invoice Generation** — PDF download, print, email via Nodemailer
10. **Activity Logs** — Full audit trail (Admin/Manager)
11. **Reports & Analytics** — Recharts graphs, CSV export

---

## Complete Procurement Workflow

```
1. Officer creates RFQ draft → publishes to vendors
2. Vendor submits quotation with unit prices
3. Officer opens Comparison Matrix → selects best vendor
4. Approval request sent to Manager
5. Manager approves → PO auto-generated (PO-YYYY-XXXX)
6. Officer marks PO as Sent → Vendor acknowledges → Completed
7. Officer generates Invoice (INV-YYYY-XXXX) from completed PO
8. Officer downloads PDF / sends via email
9. Invoice marked Paid → workflow complete
```

---

## API Endpoints

| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/signup` | Register user |
| POST | `/api/auth/login` | Login & get JWT |
| GET/POST/PUT/DELETE | `/api/vendors` | Vendor CRUD |
| GET/POST/PUT | `/api/rfqs` | RFQ management |
| GET/POST/PUT | `/api/quotations` | Quotation submission |
| GET/POST/PUT | `/api/approvals` | Approval workflow |
| GET/PUT | `/api/purchase-orders` | PO state transitions |
| GET/POST/PUT | `/api/invoices` | Invoice management |
| GET | `/api/invoices/:id/pdf` | Download PDF |
| POST | `/api/invoices/:id/send-email` | Email invoice |
| GET | `/api/activity-logs` | Audit trail |
| GET/PUT | `/api/notifications` | In-app alerts |
| GET | `/api/reports/spending` | Monthly spend data |
| GET | `/api/reports/vendors` | Vendor analytics |

---

## Email Testing (Ethereal)

If no SMTP credentials are set in `.env`, VendorBridge auto-creates a temporary **Ethereal Email** test account. After sending an invoice email, a **preview URL** is returned in the API response and displayed in the UI — click it to view the full email in Ethereal's inbox.

---

## License

MIT — Free for use and modification.
