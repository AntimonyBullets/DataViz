# DataViz 📊

A robust backend API for data visualization and metric management with user authentication, payment processing, and admin capabilities.

## 🌐 Live Demo

Check out the live application:  **[https://datavisualisation-alpha-inky.vercel.app/](https://datavisualisation-alpha-inky.vercel.app/)**

## 📋 Overview

DataViz is a comprehensive backend system designed for managing and visualizing metrics across different industries. It provides a complete suite of APIs for user management, payment processing via Stripe, and administrative controls for managing metrics, industries, and data. 

## ✨ Features

- **User Management**
  - User registration and authentication
  - Secure session management with JWT
  - Cookie-based authentication
  - Password encryption with bcrypt

- **Payment Integration**
  - Stripe payment processing
  - Webhook handling for payment events
  - Payment management dashboard

- **Metrics & Industry Management**
  - Create and manage metrics
  - Industry-specific data organization
  - Metric data upload and processing (CSV support)
  - Dynamic metric data management

- **Admin Dashboard**
  - User management (UM)
  - Metric management (MM)
  - Industry management (IM)
  - Payment management (PM)
  - Metric data management (MDM)
  - Comprehensive dashboard analytics

- **File Management**
  - Cloudinary integration for file uploads
  - Multer middleware for handling multipart/form-data
  - CSV parsing capabilities

- **Email Notifications**
  - Nodemailer integration for email services

## 🛠️ Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT (JSON Web Tokens) + bcrypt
- **Payment:** Stripe
- **File Storage:** Cloudinary
- **File Uploads:** Multer
- **Email:** Nodemailer
- **Data Processing:** CSV Parser
- **Development:** Nodemon

## 📁 Project Structure

```
DataViz/
├── src/
│   ├── app. js              # Express app configuration
│   ├── server.js           # Server entry point
│   ├── constants.js        # Application constants
│   ├── controllers/        # Route controllers
│   ├── db/                 # Database configuration
│   ├── middlewares/        # Custom middleware
│   ├── models/             # Mongoose models
│   ├── routes/             # API routes
│   │   ├── user.route.js
│   │   ├── payment.route.js
│   │   ├── metric. route.js
│   │   ├── industry.route.js
│   │   ├── metricData.route.js
│   │   └── admin/          # Admin-specific routes
│   │       ├── admin. route.js
│   │       ├── mm.route.js (Metric Management)
│   │       ├── im.route.js (Industry Management)
│   │       ├── um. route.js (User Management)
│   │       ├── pm.route.js (Payment Management)
│   │       ├── mdm.route.js (Metric Data Management)
│   │       └── dashboard.route.js
│   └── utils/              # Utility functions
├── public/                 # Static files
│   └── admin/              # Admin panel static files
├── .gitignore
├── package.json
├── vercel.json
└── README.md
```

## 🚀 API Endpoints

### Public Routes
- `POST /api/v1/users` - User registration/authentication
- `POST /api/v1/payments/stripe-webhook` - Stripe webhook handler

### Protected Routes
- `/api/v1/payments` - Payment operations
- `/api/v1/metrics` - Metric CRUD operations
- `/api/v1/industries` - Industry management
- `/api/v1/metric-data` - Metric data operations

### Admin Routes
- `/api/v1/admins` - Admin authentication
- `/api/v1/metric-management` - Metric administration
- `/api/v1/industry-management` - Industry administration
- `/api/v1/user-management` - User administration
- `/api/v1/payment-management` - Payment administration
- `/api/v1/metric-data-management` - Metric data administration
- `/api/v1/dashboard` - Dashboard analytics

## 📦 Dependencies

### Core Dependencies
- `express` - Web framework
- `mongoose` - MongoDB ODM
- `jsonwebtoken` - JWT authentication
- `bcrypt` - Password hashing
- `cookie-parser` - Cookie parsing middleware
- `body-parser` - Request body parsing

### Additional Services
- `stripe` - Payment processing
- `cloudinary` - Cloud storage
- `multer` - File upload handling
- `nodemailer` - Email service
- `csv-parser` - CSV file processing
- `dotenv` - Environment variable management

### Development
- `nodemon` - Auto-restart on file changes

## 🔐 Security Features

- JWT-based authentication
- Password encryption with bcrypt
- Cookie-based session management
- Environment variable configuration
- Request body size limits (16kb)
- Stripe webhook signature verification

## 🌍 Deployment

This application is deployed on [Vercel](https://vercel.com).

## 👨‍💻 Author

**AntimonyBullets**
- GitHub: [@AntimonyBullets](https://github.com/AntimonyBullets)

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!  Feel free to check the [issues page](https://github.com/AntimonyBullets/DataViz/issues).

## ⭐ Show Your Support

Give a ⭐️ if this project helped you!

---
