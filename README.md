# 💸 Finora — Smart Wealth Management Dashboard

**Finora** is a full-stack personal finance platform designed to help users **track expenses, analyze investments, and gain actionable financial insights** through a modern, interactive dashboard.

Built with a powerful combination of **React, Node.js, and MongoDB**, Finora delivers a seamless and secure experience for managing personal wealth.

---

## ✨ Key Features

* 📊 **Portfolio Allocation (Donut Chart)**
  Visualize how your investments are distributed.

* 📈 **Profit & Loss Analysis**
  Switch between **Top / Worst / All performers**.

* 💰 **Purchase vs Current Price Comparison**
  Track how your investments are performing in real-time.

* 🎯 **Interactive Charts**
  Smooth SVG-based charts with hover and selection states.

* 🔐 **Secure Authentication**
  JWT-based login system with encrypted passwords.

---

## 🛠 Tech Stack

### Frontend

* React + Vite + TypeScript
* Tailwind CSS + Custom Styling

### Backend

* Node.js + Express
* MongoDB + Mongoose

### Authentication

* JWT (JSON Web Tokens)
* bcrypt (password hashing)

---

## 📁 Project Structure

```text
Finora/
|-- backend/          # Express API, models, services
|-- frontend/         # React dashboard app
|-- docs/             # Documentation & assets
|-- .env.example      # Environment template
`-- README.md
```

---

## 📸 Screenshots

> Add these before publishing for maximum impact

* Dashboard Overview → `docs/screenshots/dashboard.png`
* Portfolio Graphs → `docs/screenshots/portfolio-graphs.png`
* Expense Flow → `docs/screenshots/expenses.png`

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/ayushii89/Finora.git
cd Finora
```

---

### 2️⃣ Install Dependencies

```bash
npm install
npm --prefix backend install
npm --prefix frontend install
```

---

### 3️⃣ Configure Environment Variables

```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Update values according to your setup.

---

## 🚀 Run in Development

### Backend

```bash
npm --prefix backend run dev
```

### Frontend

```bash
npm --prefix frontend run dev
```

### Optional (root scripts)

```bash
npm run dev:backend
npm run dev:frontend
```

---

## 🏗 Build for Production

### Frontend

```bash
npm --prefix frontend run build
```

### Backend

```bash
npm --prefix backend run start
```

---

## 🔮 Future Enhancements

* 🤖 AI-based expense prediction
* 📊 Net worth tracking over time
* 🔔 Smart spending alerts
* 🌐 Real-time stock price integration
* 🐳 Dockerized development setup
* ✅ CI/CD pipelines (lint, test, build)

---

## 🙌 Acknowledgement

This project is based on an open-source project and has been **enhanced, customized, and extended by Ayushi**.

---

## 📄 License

ISC License (can be updated as needed)

---

## 🌟 Show Your Support

If you like this project:

* ⭐ Star the repository
* 🍴 Fork it
* 🛠 Contribute

---

> Built with 💙 to simplify personal finance and empower smarter financial decisions.
