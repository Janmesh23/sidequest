# Setup Guide

## Prerequisites
- Python 3.10 or higher
- Node.js 18 or higher
- npm or yarn
- Google Gemini API Key

## Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python3 -m venv venv
   ```

3. Activate the virtual environment:
   - macOS/Linux:
     ```bash
     source venv/bin/activate
     ```
   - Windows:
     ```bash
     venv\Scripts\activate
     ```

4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

5. Configure environment variables:
   Create a `.env` file in the `backend` directory:
   ```env
   GEMINI_API_KEY=your_api_key_here
   DATABASE_URL=sqlite:///./sidequest.db
   FRONTEND_URL=http://localhost:3000
   ```

6. Start the backend server:
   ```bash
   python3 main.py
   ```
   The API will be available at http://localhost:8000.

## Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env.local` file in the `frontend` directory:
   ```env
   NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
   AUTH_SECRET=your_random_secret_here
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```
   The application will be available at http://localhost:3000.
