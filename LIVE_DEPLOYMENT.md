# Live Deployment Guide

Follow these steps to take SideQuest from your local machine to the public web.

## 1. Backend Deployment (Render.com)
We use Render because it handles Python backends perfectly and provides persistent storage for your documents.

1.  **Create a Account:** Sign up at [Render.com](https://render.com).
2.  **Blueprint Deploy:** 
    - Click **New +** -> **Blueprint**.
    - Connect your GitHub repository.
    - Render will automatically detect the `render.yaml` file and create the "sidequest-backend" service.
3.  **Configure Environment Variables:**
    - Go to your new service -> **Environment**.
    - Add `GEMINI_API_KEY` (Your Google AI key).
    - Add `FRONTEND_URL` (Set this to `https://sidequestbot.vercel.app`).
4.  **Wait for Build:** Render will build the app and mount the persistent disk. Once live, you will get a URL like `https://sidequest-backend.onrender.com`.

## 2. Frontend Deployment (Vercel)
Now we need to tell your Vercel app to talk to the new Render backend.

1.  **Open Vercel Dashboard:** Go to your `sidequestbot` project.
2.  **Settings -> Environment Variables:**
    - Update `NEXT_PUBLIC_BACKEND_URL` to your new Render URL (e.g., `https://sidequest-backend.onrender.com`).
    - Add `AUTH_URL` set to `https://sidequestbot.vercel.app`.
    - Add `AUTH_SECRET` (A long random string).
3.  **Redeploy:** Go to the **Deployments** tab -> **Redeploy** the latest commit.

## 3. Final Verification
1.  Visit `https://sidequestbot.vercel.app`.
2.  Log in using your test credentials (`test@example.com` / `password123`).
3.  Upload a document and verify the chat works.
4.  **Persistent Test:** Delete the deployment on Vercel/Render and redeploy. Your documents should still be there because of the Render Disk!

---

### Important Notes
- **Cold Starts:** Render's free tier spins down after inactivity. The first request might take 30 seconds to wake up.
- **Persistence:** The `render.yaml` mounts a disk at `/data`. Do not remove this, or your database will be wiped on every restart.
