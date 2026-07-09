# FoodManage – Frontend 🍽️

A modern React frontend for **FoodManage** – a full-stack restaurant management system that helps restaurants manage inventory, suppliers, purchase orders, and weekly menus in one place.

> 🔗 **Backend repository:** [FoodManage-Backend](https://github.com/NissimMekonen/FoodManage-Backend)

## ✨ Features

- 🔐 **Authentication** – Login, registration, and password reset via email (JWT-based)
- 📦 **Inventory Management** – Track raw materials with quantities, categories, and expiry dates
- ⚠️ **Low-Stock Alerts** – Automatic visual alerts when items fall below minimum stock
- 🤝 **Supplier Management** – Full CRUD for suppliers with contact details
- 📋 **Smart Purchase Orders** – Auto-generate WhatsApp-ready order messages per supplier based on missing stock
- 📅 **Weekly Menu** – Plan dishes linked to live inventory, with availability status
- 👥 **Team Management** – Manage employees and permissions
- 🎨 **Modern RTL UI** – Clean Hebrew interface with responsive design

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| React 19 | UI framework |
| JavaScript (ES6+) | Language |
| CSS3 | Styling (custom, component-scoped) |
| Fetch API | HTTP communication with backend |
| JWT | Token-based authentication |

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- The [FoodManage Backend](https://github.com/NissimMekonen/FoodManage-Backend) running on `http://localhost:5148`

### Installation

```bash
# Clone the repository
git clone https://github.com/NissimMekonen/FoodManage-Frontend.git
cd FoodManage-Frontend

# Install dependencies
npm install

# Start the development server
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000).

## 📁 Project Structure

src/
├── components/
│   ├── Login.jsx            # Authentication screens
│   ├── Register.jsx
│   ├── ForgotPassword.jsx
│   ├── ResetPassword.jsx
│   ├── Dashboard.jsx        # Main dashboard with statistics
│   ├── Inventory.jsx        # Inventory management
│   ├── Suppliers.jsx        # Suppliers & purchase orders
│   ├── WeeklyMenu.jsx       # Weekly menu planning
│   ├── TeamManagement.jsx   # Employee management
│   ├── Sidebar.jsx          # Navigation
│   └── styles/              # Component CSS files
├── api.js                   # Centralized API layer
├── App.js                   # Main app & routing logic
└── index.js                 # Entry point

## 👨‍💻 Developers

Developed as a final project at ORT Hermelin College by a two-developer team:

- **Nissim Mekonen** – Backend development, API integration, frontend features
- **Guy** ([Guyemini](https://github.com/Guyemini)) – Frontend architecture & UI

## 📄 License & Vision

This project was initially developed as a final project at ORT Hermelin College, with plans to evolve into a commercial product for real-world restaurant management.
