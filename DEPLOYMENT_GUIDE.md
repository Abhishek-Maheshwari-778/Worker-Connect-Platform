# 🚀 Unified Deployment Guide: Worker Connect (MERN)

This guide explains how to deploy both the **Frontend** and **Backend** as a single, unified project on **Vercel**. This setup uses Vercel Serverless Functions to handle the API and Vite for the frontend.

---

## 1. 🗄️ Database Setup (MongoDB Atlas)
1.  Sign up at [mongodb.com](https://www.mongodb.com/cloud/atlas).
2.  Create a **Free Cluster**.
3.  In **Network Access**, click "Add IP Address" and select **Allow Access from Anywhere (0.0.0.0/0)**. (This is required because Vercel IPs change).
4.  In **Database Access**, create a user with a username and password.
5.  Click **Connect** -> **Drivers** -> Copy your Connection String.
    - Example: `mongodb+srv://<username>:<password>@cluster0.xxx.mongodb.net/labour_connect`

---

## 2. 🌐 Deploying to Vercel (All-in-One)
1.  **Push your code to GitHub**: Ensure your project has the `vercel.json` and `api/index.js` I created in the root.
2.  **Import to Vercel**:
    - Go to [Vercel.com](https://vercel.com) and click **"Add New" -> "Project"**.
    - Import your GitHub repository.
3.  **Configure Project Settings**:
    - **Framework Preset**: Other (Vercel will detect configuration from `vercel.json`).
    - **Root Directory**: `.` (Keep as root).
4.  **Environment Variables**:
    - Add the following variables in the Vercel Dashboard:
        - `MONGO_URI`: (Your Atlas connection string)
        - `JWT_SECRET`: (A random strong string)
        - `NODE_ENV`: `production`
        - `CLIENT_URL`: `https://your-project-name.vercel.app`
        - `CLOUDINARY_CLOUD_NAME`: (Your Cloudinary name)
        - `CLOUDINARY_API_KEY`: (Your Cloudinary key)
        - `CLOUDINARY_API_SECRET`: (Your Cloudinary secret)
5.  **Deploy**: Click **Deploy**. Vercel will build your React frontend and set up your Node.js API automatically!

---

## 3. 💬 Note on Real-time Chat (Socket.io)
Vercel's serverless architecture is not designed for permanent WebSockets.
- **The Chat will still work**, but it will use "Polling" mode automatically. 
- You may notice a 1-2 second delay in message delivery compared to local development.
- For 100% real-time performance, we recommend deploying the **Backend** to **Render.com** or **Railway.app** in the future.

---

## 🏗️ Seeding Your Database
To fill your new online database with dummy data (Users, Jobs, Schemes):
1.  Clone your project locally.
2.  Update your local `backend/.env` with the new Atlas `MONGO_URI`.
3.  Run these commands in your terminal:
    ```bash
    node backend/data/seedUsers.js
    node backend/data/seedSchemes.js
    ```

---

**Need help?** Just ask, and I can help you debug your Vercel logs or Atlas connection!

