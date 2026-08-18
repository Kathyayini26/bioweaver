# BioWeaver Production Deployment Guide

This guide provides step-by-step instructions for deploying the **BioWeaver** application into production:
- **Backend Service (FastAPI)** deployed on **Render** (or Railway/Fly.io)
- **Frontend Static Site (React + Vite)** deployed on **Vercel** (or Render Static Site)

---

## 🏗️ Pre-Deployment Checklist

Before deploying, ensure all runtime assets are tracked and pushed to your Git repository (GitHub / GitLab):

- [x] Backend uses robust `Path(__file__).resolve()` resolution for all data assets.
- [x] `backend/requirements.txt` contains all required dependencies (`fastapi`, `uvicorn`, `pandas`, `numpy`, `scikit-learn`, `joblib`, `pydantic`, `networkx`).
- [x] `.gitignore` allows tracking of essential runtime artifacts:
  - `data/processed/random_forest_model.pkl` (~5.8 MB)
  - `data/processed/node_embeddings.csv` (~45.9 MB)
  - `data/processed/bioweaver_graph.pkl` (~5.1 MB)
- [x] Frontend builds cleanly via `npm run build` into `dist/`.

---

## 🐍 Part A: Backend Deployment on Render

### Step 1: Create a New Web Service on Render
1. Log in to [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository containing the `bioweaver` project.

### Step 2: Configure Render Service Settings
- **Name**: `bioweaver-backend`
- **Region**: Choose the region closest to your users (e.g. Oregon/Frankfurt).
- **Branch**: `main`
- **Root Directory**: Leave blank (or specify `.` if prompt requires root).
- **Runtime**: `Python 3`
- **Build Command**:
  ```bash
  pip install -r backend/requirements.txt
  ```
  *(or `pip install -r requirements.txt`)*
- **Start Command**:
  ```bash
  uvicorn backend.app:app --host 0.0.0.0 --port $PORT
  ```

### Step 3: Configure Backend Environment Variables
In the Render Service **Environment** tab, add:

| Key | Value / Example | Notes |
| :--- | :--- | :--- |
| `FRONTEND_URL` | `https://bioweaver.vercel.app` | Allowed CORS origin for your deployed frontend |
| `PYTHON_VERSION` | `3.11.9` | Recommended Python version |

*(Optional path overrides if using custom storage: `MODEL_PATH`, `EMBEDDINGS_PATH`, `GRAPH_PATH`)*

### Step 4: Deploy & Verify Backend
1. Click **Create Web Service**.
2. Wait for deployment to complete (~2-3 minutes).
3. Test your backend live endpoints:
   - **Root**: `https://bioweaver-backend.onrender.com/` -> `{"message": "BioWeaver Prediction API Running", "status": "active"}`
   - **Health Check**: `https://bioweaver-backend.onrender.com/health` -> `{"status": "healthy", ...}`
   - **Interactive Docs**: `https://bioweaver-backend.onrender.com/docs`

---

## ⚛️ Part B: Frontend Deployment on Vercel

### Step 1: Import Project into Vercel
1. Log in to [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New...** -> **Project**.
3. Import your `bioweaver` GitHub repository.

### Step 2: Configure Vercel Project Settings
- **Framework Preset**: `Vite`
- **Root Directory**: Click **Edit** and set to `frontend`
- **Build Command**: `npm run build` (or `npx tsc -b && vite build`)
- **Output Directory**: `dist`

### Step 3: Configure Frontend Environment Variables
In Vercel **Environment Variables**, add:

| Key | Value Example | Notes |
| :--- | :--- | :--- |
| `VITE_API_URL` | `https://bioweaver-backend.onrender.com` | Your live backend URL from Render |

### Step 4: Deploy & Verify Frontend
1. Click **Deploy**.
2. Vercel will build and publish your static app.
3. Open your deployed frontend URL (e.g. `https://bioweaver.vercel.app`).
4. Test gene exploration (e.g., search `BRCA1`) and prediction queries to verify real-time backend communication!

---

## ⚡ Alternative Part C: Frontend Deployment on Render (Static Site)

If you prefer keeping both services on Render:

1. Click **New +** -> **Static Site** on Render.
2. Connect your GitHub repository.
3. Set **Root Directory** to `frontend`.
4. Set **Build Command** to `npm install && npm run build`.
5. Set **Publish Directory** to `dist`.
6. Add Environment Variable:
   - `VITE_API_URL`: `https://bioweaver-backend.onrender.com`
7. Click **Create Static Site**.

---

## 🔍 Verification & Health Check Checklist

After completing deployment:

1. **Verify Backend Health**:
   ```bash
   curl -X GET https://YOUR_BACKEND_URL.onrender.com/health
   ```
   *Expected Response:*
   ```json
   {
     "status": "healthy",
     "api_version": "1.0.0",
     "services": {
       "model_loaded": true,
       "embeddings_loaded": true,
       "graph_loaded": true,
       "embeddings_count": 18597,
       "graph_nodes": 18597,
       "graph_edges": 107187
     }
   }
   ```

2. **Verify Prediction Endpoint**:
   ```bash
   curl -X POST https://YOUR_BACKEND_URL.onrender.com/predict \
     -H "Content-Type: application/json" \
     -d '{"gene": "BRCA1", "disease": "Breast Cancer"}'
   ```
