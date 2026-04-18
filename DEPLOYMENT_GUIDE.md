# 🚀 Unified Deployment Guide: Worker Connect (MERN)

This guide explains how to deploy both the **Frontend** and **Backend** as a single, unified project on **Netlify** or **Vercel**.

---

## 1. 🗄️ Database Setup (MongoDB Atlas)
1.  Sign up at [mongodb.com](https://www.mongodb.com/cloud/atlas).
2.  Create a **Free Cluster**.
3.  In **Network Access**, click "Add IP Address" and select **Allow Access from Anywhere (0.0.0.0/0)**.
4.  In **Database Access**, create a user with a username and password.
5.  Click **Connect** -> **Drivers** -> Copy your Connection String.

---

## 2. 🌌 Deploying to Netlify (Recommended)
1.  **Push your code to GitHub**: Ensure your project has the `netlify.toml` and `functions/api.js` in the root.
2.  **Import to Netlify**:
    - Go to [Netlify.com](https://netlify.com), click **"Add new site" -> "Import an existing project"**.
    - Connect to your GitHub and select the repository.
3.  **Site Settings**:
    - **Build command**: `npm run build-frontend`
    - **Publish directory**: `frontend/dist`
    - **Functions directory**: `functions`
4.  **Environment Variables**:
    - Add variables in **Site settings -> Environment variables**:
        - `MONGO_URI`, `JWT_SECRET`, `NODE_ENV` (production), `CLOUDINARY_*`
5.  **Deploy**: Netlify will automatically build your frontend and serve the backend via Edge Functions!

---

## 3. 🌐 Deploying to Vercel
1.  **Push your code to GitHub**: Ensure your project has the `vercel.json` and `api/index.js` in the root.
2.  **Import to Vercel**:
    - Go to [Vercel.com](https://vercel.com) and click **"Add New" -> "Project"**.
3.  **Configure Project Settings**:
    - **Framework Preset**: Other.
4.  **Environment Variables**:
    - Add the same variables as above in the Vercel Dashboard.
5.  **Deploy**: Vercel will set up your unified app automatically!

---

## 3. 💬 Note on Real-time Chat (Socket.io)
Vercel's serverless architecture is not designed for permanent WebSockets.
- **The Chat will still work**, but it will use "Polling" mode automatically. 
- You may notice a 1-2 second delay in message delivery compared to local development.
- For 100% real-time performance, we recommend deploying the **Backend** to **Render.com** or **Railway.app** in the future.

---

## 🏗️ Seeding Your Database
To fill your new online database with extensive dummy data (Users, Jobs, Disputes, Chats, etc):
1.  Clone your project locally.
2.  Update your local `backend/.env` with the new Atlas `MONGO_URI`.
3.  Run the extensive seed script in your terminal:
    ```bash
    node backend/data/seedExtensive.js
    ```

---

## 4. 🔀 Committing and Pushing to GitHub
1. Stage your changes:
   ```bash
   git add .
   ```
2. Commit your changes:
   ```bash
   git commit -m "chore: remove unused files and prepare for Vercel deployment"
   ```
3. Push to your repository:
   ```bash
   git push origin main
   ```

---

**Need help?** Just ask, and I can help you debug your Vercel logs or Atlas connection!
