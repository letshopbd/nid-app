# 🚀 Free Deployment Guide: Vercel + Neon (Postgres)

This guide will help you deploy your Next.js application for **FREE** using **Vercel** (for the website) and **Neon** (for the database).

## ⚠️ Why change the database?
Currently, your app uses **SQLite** (`dev.db`). This is a file on your computer.
- **Vercel** is "Serverless". It **deletes local files** (like your database) every time it sleeps or updates.
- If you deploy `dev.db` to Vercel, **YOU WILL LOSE DATA** constantly.
- **Solution:** We connect to a "Cloud Database" (Neon). It lives online, so Vercel just connects to it, and your data is safe forever.

---

## ✅ Step 1: Get a Free Database (Neon)
1.  Go to [Neon.tech](https://neon.tech) and Sign Up (Free).
2.  Create a **New Project** (e.g., named "nid-app").
3.  It will show you a **Connection String** that looks like this:
    ```
    postgres://neondb_owner:AbCd123@ep-cool-frog.aws.neon.tech/neondb?sslmode=require
    ```
4.  **Copy this string**. Save it somewhere safe.

---

## ✅ Step 2: Prepare Your Code
We need to tell your app to use Postgres instead of SQLite.

1.  **Open** `prisma/schema.prisma`.
2.  **Change** the `datasource` block from `sqlite` to `postgresql`:
    ```prisma
    // Old (Delete this)
    // datasource db {
    //   provider = "sqlite"
    //   url      = env("DATABASE_URL")
    // }

    // NEW (Add this)
    datasource db {
      provider = "postgresql"
      url      = env("DATABASE_URL")
    }
    ```
3.  **Delete** the folder `prisma/migrations` from your project files (we are starting a fresh DB).

---

## ✅ Step 3: Push to GitHub
1.  Create a repository on **GitHub.com**.
2.  Push your code to that repository.
    *(If you need help with this, let me know!)*

---

## ✅ Step 4: Deploy to Vercel
1.  Go to [Vercel.com](https://vercel.com) and Sign Up.
2.  Click **"Add New..."** -> **"Project"**.
3.  Select your **GitHub Repository**.
4.  **IMPORTANT:** Scroll down to **"Environment Variables"** and add these:
    *   `DATABASE_URL`: (Paste your Neon Connection String here)
    *   `AUTH_SECRET`: (Generate a random secret text, e.g., `my-super-secret-code-123`)
5.  Click **Deploy**.

---

## ✅ Step 5: Sync the Database
After the deployment finishes, the database is still empty. We need to create the tables.

1.  Go to your Vercel Project Dashboard.
2.  Click on the **"Settings"** tab -> **"Build & Development"**.
3.  Look for **"Build Command"**.
4.  Change it to:
    ```bash
    prisma generate && prisma db push && next build
    ```
    *(This ensures the database is updated every time you deploy)*
5.  Go to **"Deployments"** tab, click the **three dots** on your latest deployment, and click **"Redeploy"**.

**🎉 SUCESS! Your site is now live with a persistent database.**
