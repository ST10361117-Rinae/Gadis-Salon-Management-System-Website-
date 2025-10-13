# Gadis Salon Management Website

This is the official web-based counterpart to the Gadis Salon native Android application, developed as a final-year project for Rosebank College. This platform provides a powerful, browser-based interface for stylists and administrators to manage the salon's operations in real-time, fully synchronized with the mobile app through Google Firebase.

## 👥 Project Team: RST Innovations

**Team Members:**

* **Tokollo Nonyane (ST10296818)**
* **Sagwadi Mashimbye (ST10168528)**
* **Rinae Magadagela (ST10361117)**

## 🌟 Project Overview

This web application serves two key user roles—Stylist and Admin—each with a dedicated, secure dashboard. It empowers the salon's staff to manage everything from client bookings and product inventory to user accounts and support tickets, all from the convenience of a web browser. Built with a robust front-end using modern web standards, it connects to the same powerful Google Firebase backend as the Android app, ensuring a seamless and unified digital ecosystem for Gadis Salon.

## ✨ Key Features

### ✂️ Worker / Stylist Portal

* **Secure Role-Based Login:** Stylists log in to a dashboard tailored to their needs.
* **Real-Time Booking Management:** View and manage a live list of confirmed appointments and new booking requests.
* **Interactive Chat:** Click any booking to open a modal and chat directly with the customer in real-time, complete with read receipts.
* **Booking Status Control:** Mark appointments as "Completed" or "Cancel" them directly from the dashboard.
* **Order Fulfillment:** View a visual list of pending product orders and update their status from "Ready for Pickup" to "Completed".
* **Live Support System:** Create support tickets and have real-time conversations with an admin to resolve issues.

### 🔐 Admin Portal

* **Secure Admin Login:** Admins log in with a privileged account with full access rights.
* **Live Dashboard:** A summary screen showing key metrics like customer counts, stylist counts, and total bookings, all updated in real-time.
* **Full User Management (CRUD):** A powerful interface to create, view, sort, update, and delete all user accounts (Customers, Stylists, and Admins).
* **Full Product & Hairstyle Management (CRUD):** A complete system to add, edit, and delete products and hairstyles, including managing variants and assigning available stylists.
* **Booking & Order Oversight:** A comprehensive, read-only view of all bookings and product orders across the entire system.
* **Centralized Support Hub:** A full-featured interface to view all user support tickets, engage in real-time chat, and resolve issues by closing tickets.

## 🛠️ Technology Stack

* **Frontend:**
    * HTML5
    * CSS3 (with Custom Properties for theming)
    * Modern JavaScript (ES6 Modules)
* **UI/UX:**
    * Responsive Design for desktop and mobile browsers.
    * Single-Page Application (SPA) feel for dashboards using dynamic content loading.
* **Backend:** Google Firebase
    * **Authentication:** For secure, role-based user login.
    * **Cloud Firestore:** As the real-time NoSQL database for all data.
    * **Firebase Storage:** For hosting all image assets.
    * **Cloud Functions:** For secure backend logic like creating users and setting roles.

## 🚀 Getting Started

### Prerequisites

* A modern web browser (e.g., Chrome, Firefox, Edge).
* A code editor (e.g., Visual Studio Code).
* A local server for development (like the **Live Server** extension for VS Code is recommended).

### Local Development Setup

1.  **Clone the repository:**

    ```bash
    git clone [YOUR_WEBSITE_REPOSITORY_URL_HERE]
    ```

2.  **Firebase Configuration:**
    * Navigate to the `js/` folder.
    * **Rename** the file `firebase-config.example.js` to `firebase-config.js`.
    * Open the new `firebase-config.js` file.
    * **Replace the placeholder values** (like `"YOUR_API_KEY_HERE"`) with the actual Firebase credentials from your project console. This file is listed in `.gitignore` and will not be committed.

3.  **Run the Website:**
    * Open the project folder in your code editor.
    * If using the "Live Server" extension in VS Code, right-click on `index.html` and choose "Open with Live Server".
    * Otherwise, open the `index.html` file directly in your web browser.

## 🧪 Installation & Testing

1.  **Enable Firebase Services:** In your Firebase console, ensure **Authentication**, **Cloud Firestore**, and **Firebase Storage** are enabled.
2.  **Deploy Cloud Functions:** Deploy the functions located in the `/functions` directory of your project using the Firebase CLI. This is required for creating and managing users.
3.  **Create First Admin User:**
    * Create a user account through your app or website.
    * Use the provided Node.js script (`setAdmin.js`) to promote that user to an admin. You will need a service account key from your Firebase project settings to run this script.
    * **Log out and log back in** for the admin privileges to take effect.

## 📺 Project Showcase

**Live Site:** [LINK_TO_HOSTED_WEBSITE_HERE]

## 🙏 Acknowledgements

This project was developed as a final-year submission for **Rosebank College**. We would like to extend our sincere gratitude to the **JB Marks Education Trust Fund** for their invaluable support through the bursary program, which made our studies and this project possible.