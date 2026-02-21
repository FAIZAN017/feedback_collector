<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Experience Evaluator

An intelligent feedback collection platform that uses Google Gemini AI to instantly generate forms and summarize user responses. Built with React and powered by a Supabase cloud database.

## 🚀 Tech Stack

* **Frontend:** React, TypeScript, Vite, Tailwind CSS
* **Database & API:** Supabase (PostgreSQL)
* **Generative AI:** Google Gemini API

## ✨ Key Features

* **AI Form Generation:** Type a simple prompt, and the AI will automatically create a fully structured form with multiple-choice, rating, and text questions.
* **Cloud Storage:** All forms, questions, and user responses are safely stored in a live PostgreSQL database.
* **Automated Insights:** The AI reads through all respondent answers to generate a cached summary of strengths, weaknesses, and overall sentiment.

---

## 💻 Full Execution Procedure

Follow these steps to run the Experience Evaluator on your local machine.

### Step 1: Prerequisites
Before you begin, ensure you have the following installed and set up:
1. **Node.js** (v18 or higher) installed on your PC.
2. A free [Supabase](https://supabase.com/) account for hosting the database.
3. A free [Google AI Studio](https://aistudio.google.com/) account to get your Gemini API Key.

### Step 2: Clone and Install
Open your terminal and run the following commands to download the project and install its dependencies:
```bash
git clone https://github.com/FAIZAN017/feedback_collector.git
cd feedback_collector
npm install
```

### Step 3: Configure Environment Variables
In the root folder of the project (the same folder as package.json), create a new file named exactly `.env.local`.

Open the file and paste in your secure API keys:

```
GEMINI_API_KEY=your_gemini_api_key_here
VITE_SUPABASE_URL=https://your_supabase_project_url.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### Step 4: Setup the Supabase Database
Log into your Supabase dashboard and create a new project.

Navigate to the SQL Editor on the left sidebar.

Click New Query, paste the table creation script (for users, forms, questions, form_responses, answers, and form_summaries), and click Run.

(Optional but recommended for local testing): Go to Authentication -> Policies and temporarily disable Row Level Security (RLS) on your tables so your local app can read and write data freely.

### Step 5: Start the Application
To launch the app and bypass any Windows port-blocking issues, run this command in your terminal:

```bash
npm run dev -- --port 3001
```

The application is now live! Open your browser and navigate to http://localhost:3001 to start generating forms.
