# Gen-Ai — AI Interview Report Generator

Upload a resume + a job description and get back a personalized interview preparation report: a match score, likely technical/behavioral questions with how to answer them, skill gaps, and a day-wise preparation plan.

Powered by **Google Gemini** structured output, with **JWT cookie authentication** and per-user report storage in **MongoDB**.

---

## Features

- Email/password auth with hashed passwords, JWT in an HTTP-only cookie, and logout via token blacklist
- Resume upload (PDF, max 3 MB) parsed server-side
- AI-generated report validated against a strict schema before it is saved
- Reports stored per user in MongoDB
- React frontend with protected routes and session restore on refresh

## Tech stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express 5, Mongoose 9 |
| Database | MongoDB (Atlas or local) |
| AI | `@google/genai` (Gemini) + `zod` for schema validation |
| Auth | `jsonwebtoken`, `bcryptjs`, `cookie-parser` |
| Uploads / parsing | `multer` (memory storage), `pdf-parse` v2 |
| Frontend | React 19, Vite, React Router 7, axios, SCSS |

## Architecture

```
Browser (React 19 + Vite, :5173)
      │  axios (withCredentials: true)  → JWT in HTTP-only cookie
      ▼
Express API (:3000)
      │
      ├── /api/auth      → register / login / logout / get-me
      └── /api/interview → POST: multipart upload
                 │
                 ├── multer            → req.file.buffer (≤ 3 MB PDF)
                 ├── pdf-parse         → extracted resume text
                 ├── Gemini + zod      → structured interview report JSON
                 └── Mongoose          → InterviewReport document (per user)
```

## Repository structure

```
Gen-Ai/
├── Backend/
│   ├── server.js                     # entry point, loads env, starts server (:3000)
│   ├── .env.example                  # required environment variables
│   └── src/
│       ├── app.js                    # express app, CORS, body/cookie parsers, routes
│       ├── config/database.js        # mongoose connection
│       ├── controllers/              # auth.controller.js, interview.controller.js
│       ├── middleware/               # auth.middleware.js, file.middleware.js
│       ├── model/                    # user, blacklist, interviewReport schemas
│       ├── routes/                   # auth.route.js, interview.routes.js
│       └── services/ai.service.js    # Gemini prompt + zod schema + validation
└── Fronted/
    └── src/
        ├── app.route.jsx             # router config
        ├── components/ProtectedRoute.jsx
        ├── pages/                    # Home, NotFound
        └── features/auth/            # pages, hooks, api service, context
```

## Prerequisites

- Node.js 18+ (developed on Node 24)
- A MongoDB database (free Atlas cluster works)
- A Google Gemini API key — https://aistudio.google.com/apikey

## Getting started

### 1. Backend

```bash
cd Backend
npm install
```

Create `Backend/.env` (copy `Backend/.env.example`):

```env
MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>/<db>
JWT_SECRET=some_long_random_string
NODE_ENV=development
GOOGLE_GENAI_API_KEY=your_google_genai_api_key
```

Run it:

```bash
npm run dev     # nodemon, auto-reload
# or
npm start
```

API is served at `http://localhost:3000`.

### 2. Frontend

```bash
cd Fronted
npm install
```

Create `Fronted/.env`:

```env
VITE_API_URL=http://localhost:3000
```

Run it:

```bash
npm run dev     # http://localhost:5173
```

> The backend only accepts CORS requests from `http://localhost:5173` (`src/app.js`). Change the port there if you run the frontend elsewhere.

## API reference

Base URL: `http://localhost:3000`

| Method | Endpoint | Access | Body |
|---|---|---|---|
| POST | `/api/auth/register` | public | `{ username, email, password }` |
| POST | `/api/auth/login` | public | `{ email, password }` |
| POST | `/api/auth/logout` | public | – (blacklists + clears cookie) |
| GET | `/api/auth/get-me` | private | – |
| POST | `/api/interview` | private | `multipart/form-data` |

Auth uses an **HTTP-only cookie named `token`** — the JWT is never returned in the JSON body, so clients must send cookies (`withCredentials` in axios, or the cookie jar in Postman).

### `POST /api/interview` — generate a report

`multipart/form-data` fields:

| Field | Type | Notes |
|---|---|---|
| `resume` | File | PDF, max 3 MB |
| `selfDescription` | Text | short candidate summary |
| `jobDescription` | Text | target job description |

```bash
curl -X POST http://localhost:3000/api/interview \
  -b cookies.txt \
  -F "resume=@resume.pdf;type=application/pdf" \
  -F "selfDescription=2 years Node.js backend developer" \
  -F "jobDescription=Backend Engineer: Node.js, Express, MongoDB"
```

`201 Created` response (trimmed):

```json
{
  "message": "Interview report generated successfully.",
  "interviewReport": {
    "_id": "6ad3520a345c2c44720cfe59",
    "title": "Backend Engineer",
    "matchScore": 95,
    "technicalQuestions": [
      { "question": "Explain the Node.js event loop...", "intention": "...", "answer": "..." }
    ],
    "behavioralQuestions": [ { "question": "...", "intention": "...", "answer": "..." } ],
    "skillGaps": [ { "skill": "System design", "severity": "medium" } ],
    "preparationPlan": [ { "day": 1, "focus": "Node.js internals", "tasks": ["..."] } ],
    "resume": "...", "selfDescription": "...", "jobDescription": "...", "user": "..."
  }
}
```

Typical status codes: `201` created · `401` missing/invalid/expired token or bad credentials · `500` validation failure or upstream AI error.

### Postman quick start

1. `POST /api/auth/register` — Postman stores the `token` cookie automatically.
2. `POST /api/interview` — body **form-data**: `selfDescription` and `jobDescription` as *Text*, `resume` as *File*.
3. Allow a long request timeout: the Gemini call takes ~10–40 s.

If you get `401 Token not provided`, copy the token from the register response's `Set-Cookie` header and add a `Cookie` header: `token=<jwt>`.

## How the AI report is generated

`Backend/src/services/ai.service.js`:

1. Resume text, self description, and job description are injected into a prompt.
2. The zod schema `interviewReportSchema` is converted to JSON Schema with zod v4's native `z.toJSONSchema()` (the older `zod-to-json-schema` package only supports zod v3 and silently emits an empty schema).
3. Gemini is called with `responseMimeType: "application/json"` + `responseSchema`, which forces schema-conformant output.
4. The response is parsed **and re-validated** with `interviewReportSchema.parse()` before being saved, so bad AI output cannot reach the database.

## Data models

- **User** — `username` (unique), `email` (unique), `password` (bcrypt hash)
- **InterviewReport** — `user` (ref → User), `jobDescription`, `resume`, `selfDescription`, `matchScore` (0–100), `technicalQuestions[]`, `behavioralQuestions[]`, `skillGaps[]` (`low|medium|high`), `preparationPlan[]`, `title`, timestamps
- **Blacklist** — logged-out JWTs, checked on every authenticated request

## Known limitations / roadmap

- No endpoint to list or fetch saved reports yet (write-only from the client's perspective)
- No centralized error middleware — upstream failures return HTML error pages instead of JSON
- Gemini occasionally responds `503 UNAVAILABLE` under load; there is no retry logic
- No request-body validation on auth routes, no rate limiting or CSRF protection
- `src/app.js` hardcodes the CORS origin and `server.js` hardcodes port 3000
- No automated tests yet

## Notes

- `Backend/.env` and `Fronted/.env` are gitignored — never commit real keys.
- JWTs expire after 1 hour; log in again when they do.
- The commented-out block in `ai.service.js` is a resume-PDF generator (would need `puppeteer` + a `generateResumePdf` route).

## License

Not specified.
