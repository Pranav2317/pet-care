# 🐾 Gray Pet Shop - E-Commerce Platform

![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

A modern, full-featured e-commerce platform built specifically for a pet shop. The system uses a **Monolithic** architecture with Node.js (Express), MongoDB, and a server-side rendered UI combined with Vanilla JS + Tailwind CSS for an optimized experience.

---

## ✨ Features

### 🛍️ For Customers
- **Authentication & Security:** Sign up and log in with JWT (JSON Web Tokens).
- **Shopping Experience:** Browse, search, and filter products by category and brand.
- **Cart & Checkout:** Smart cart management with online payment via **VNPay** and cash on delivery (COD).
- **Reviews & Feedback:** Write product reviews, star ratings, edit/delete your own reviews. Customers can interact directly with store replies.
- **Account Management:** View order history, track order status, and cancel orders flexibly.

### 🛡️ For Admins
- **Dashboard Overview:** Real-time revenue tracking (charts), total orders, new users, and low-stock products.
- **Order Management:** Approve orders and update status (Pending, Shipping, Delivered, Cancelled).
- **Product & Inventory Management:** Add, edit, delete products, upload images to cloud/local storage.
- **Customer & Role Management:** View customer list and grant admin privileges.
- **Review Interaction:** Reply to customer reviews (Admin Reply) and delete responses when needed.

---

## 🛠️ Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** MongoDB, Mongoose
- **Frontend:** HTML5, Tailwind CSS, Vanilla JavaScript
- **Security:** bcryptjs (password hashing), jsonwebtoken (JWT Auth)
- **Payments:** VNPay payment gateway integration
- **Other:** multer (file upload handling)

---

## 🚀 Installation & Setup

### 1. Prerequisites
- [Node.js](https://nodejs.org) (v18 or higher)
- [MongoDB](https://www.mongodb.com/) (local or MongoDB Atlas)

### 2. Install Dependencies
Clone the project and run the following in the root directory:
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory with the following settings:
```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/petshop

# Security
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# VNPay Configuration (optional)
VNP_TMNCODE=your_tmn_code
VNP_HASHSECRET=your_hash_secret
VNP_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNP_RETURNURL=http://localhost:5000/api/vnpay/vnpay_return
```

### 4. Seed Sample Data
The project includes a seed script to create an admin account and sample products:
```bash
npm run seed
```
*Note: This command clears all existing data in the database and creates fresh data.*
- Sample admin account: `admin@example.com` / `admin123`
- Sample customer account: `customer1@example.com` / `123456`

### 5. Start the Server
Run in development mode (auto-reload on code changes):
```bash
npm run dev
```
Run in production mode:
```bash
npm start
```
The server runs by default at: `http://localhost:5000`

---

## 📁 Folder Structure

```text
E-commerce-pet-shop/
├── src/
│   ├── app.js                 # Application entry point
│   ├── config/                # DB, VNPay configuration
│   ├── controllers/           # Business logic (Auth, Product, Review...)
│   ├── middlewares/           # Auth guard, Admin role, File upload
│   ├── models/                # Mongoose Schemas (User, Product, Order, Review...)
│   ├── routes/                # API routing and page navigation
│   └── views/                 # Frontend UI (HTML, JS, CSS)
├── .env                       # Environment variables
├── seed.js                    # Sample data seed script
└── package.json
```

---

## 📄 License
This project is built for educational and personal development purposes.

*© 2026 Gray Pet Shop. All rights reserved.*
