# 🚀 Deployment Guide: Worker Connect

Since this project uses **Socket.io** for real-time chat, we will split the deployment:
- **Frontend**: Vercel
- **Backend**: Render (or Railway)
- **Database**: MongoDB Atlas

---

## 1. Move to MongoDB Atlas (Database)
Vercel/Render cannot connect to your local computer's database.
1. Create a free account at [mongodb.com](https://www.mongodb.com/cloud/atlas).
2. Create a Cluster and a Database User.
3. Whitelist all IP addresses (0.0.0.0/0) in Network Access.
4. Get your connection string: `mongodb+srv://<username>:<password>@cluster0.xxx.mongodb.net/labour_connect`.

---

## 2. Deploy Backend (Render.com)
1. Sign up at [Render.com](https://render.com) and connect your GitHub.
2. Create a **New Web Service**.
3. Select your repository.
4. **Root Directory**: `backend`
5. **Build Command**: `npm install`
6. **Start Command**: `node server.js`
7. **Environment Variables**: Copy everything from your `backend/.env`, but change `MONGO_URI` to your Atlas string.

---

## 3. Deploy Frontend (Vercel)
1. Sign up at [Vercel.com](https://vercel.com) and connect your GitHub.
2. Import your repository.
3. **Framework Preset**: Vite
4. **Root Directory**: `frontend`
5. **Environment Variables**:
   - `VITE_API_URL`: Your Render backend URL (e.g., `https://labour-backend.onrender.com`)

---

## 4. Final Connection
After your Backend is live:
1. Go to your `frontend/vercel.json`.
2. Update the `destination` URL in the proxy settings to your Render URL.
3. Push changes to GitHub.

---

**Need Help?** Just paste your MongoDB Atlas link here and I will update your backend configuration for you!
