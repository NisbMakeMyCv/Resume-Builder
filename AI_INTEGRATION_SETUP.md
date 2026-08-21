# MakeMyCV AI Integration — Complete Setup

This source tree contains the integrated AI resume assistant based on the
uploaded frontend and backend.

## What is integrated

- Natural-language resume editing
- Add/update/delete/clear resume information
- Skills, projects, certifications and achievements
- Personal, education and experience editing
- Resume wording improvement using existing facts only
- Job-description / JD analysis without modifying the resume automatically
- GitHub repository analysis
- GitHub project approval before adding it to the resume
- Persistent conversation history
- Fresh conversation when opening the AI page
- Rename/delete old conversations
- Live resume preview updates
- PDF generation remains connected to the existing backend generator

## Important files changed

### Backend
- `backend/app/ai/resume/chat.py`
- `backend/app/api/v1/ai/resume.py` (existing route is kept compatible)
- `backend/app/schemas/resume_ai.py` (existing response contract is used)

### Frontend
- `frontend/app/resumes/create/ai/page.tsx`
- `frontend/app/resumes/create/components/ResumeChatbot.tsx`
- `frontend/app/resumes/create/components/AIJakePreview.tsx`
- `frontend/app/resumes/create/page.tsx`
- `frontend/app/components/MaterialIcon.tsx` is reused; no extra icon package is required.

## Environment

Backend `.env.local` is intentionally NOT included in this package.

Set at least:

```env
GROQ_API_KEY=your_groq_api_key
DATABASE_URL=your_database_url
SECRET_KEY=your_secret_key
```

Use the variable names already present in your existing backend environment
for the database and JWT configuration. Do not commit real secrets.

Frontend `.env.local` is also intentionally NOT included. Set:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

For a deployed backend, replace that URL with the deployed API URL.

## Install and run

### Backend

From `backend`:

```powershell
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

If the virtual environment does not exist:

```powershell
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

### Frontend

From `frontend`:

```powershell
npm install
npm run dev
```

Open the application and log in before using the AI assistant.

## AI page

The dedicated AI page is:

```text
/resumes/create/ai
```

The regular resume creator continues to be:

```text
/resumes/create
```

## Test in this order

1. `Add Python to my skills`
2. `Change my email to test@example.com`
3. `Remove Python from my skills`
4. `Add a project called Resume Builder using React and FastAPI`
5. `Improve the description of my Resume Builder project`
6. `Add my AWS certification`
7. `Add my hackathon achievement`
8. `Improve my resume`
9. Paste a real job description and ask:
   `Match my resume with this job description`
10. Ask:
   `Analyze my GitHub project`
    then provide username, repository, and finally:
   `yes, add it`

## Expected behavior

AI changes are returned as structured operations. The frontend applies those
operations to the current resume, saves the updated resume to
`localStorage`, dispatches the resume-update event, and refreshes the live
preview.

The AI must not invent missing resume facts.

GitHub analysis does not automatically add a project. The user must explicitly
approve the project first.

JD analysis does not automatically change the resume. Ask the assistant to
apply a specific change after reviewing the recommendations.

## Validation

The backend Python source was syntax-checked with `compileall`.

The frontend was statically inspected and the AI-page issues found during
integration were corrected, including:
- missing PDF generator import
- incorrect AI preview component path
- incorrect Material/Lucide icon dependency
- duplicate project object properties
- incorrect ResumeChatbot authentication
- incorrect backend/frontend resume-shape conversion for AI chat
- operation value normalization
