# EduSync
## Under One Nation One Data

EduSync is an AI-assisted institutional reporting platform that helps colleges and institutes auto-fill repeated form fields across accreditation and compliance formats (NAAC, UGC, NBA) from a single master dataset.

It supports:
- CSV-based master data ingestion
- Question-answer mapping using exact and similarity matching
- Optional AI fallback for low-confidence matches
- Learning new mappings from user corrections
- PDF generation for template-based forms
- Same-layout PDF output in PDF mode for fillable input forms

## Why This Project

Institutions repeatedly type the same details (faculty count, establishment year, programs, etc.) in multiple forms. This project follows a "One-Time Entry, Reuse Everywhere" approach:
- Seed once using CSV
- Auto-fill many forms
- Learn from missing values over time

## Tech Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MySQL
- PDF Processing: pdf-parse, pdf-lib, Puppeteer, EJS
- Similarity Matching: string-similarity
- Optional AI: Google Gemini

## Project Structure

```
Backend/
	server.js
	src/
		app.js
		controllers/
		db/
		routes/
		templates/
		utils/

Frontend/
	src/
	public/
```

## Features

### 1) Master Data Upload
Upload a CSV with `question,answer` columns to populate the knowledge base.

### 2) Template Mode
Choose NAAC, UGC, or NBA template fields and auto-fill from learned mappings.

### 3) PDF Mode
Upload a target PDF, extract question-like lines, map answers, review missing values, and generate output.

### 4) Learning Loop
Any missing values manually entered by the user are saved as new mappings for future forms.

### 5) PDF Generation
- Template mode: Generates output using EJS + Puppeteer templates.
- PDF mode: Generates output from the same uploaded input PDF layout (for fillable PDFs).

## Important PDF Mode Note

Same-layout output in PDF mode works when the uploaded input PDF has fillable form fields (AcroForm).

If a PDF is scanned or non-fillable, same-layout field injection is not possible with the current implementation.

## Prerequisites

- Node.js (18+ recommended)
- MySQL (running locally or remotely)
- npm

## Setup

### 1) Clone and install dependencies

```bash
git clone <your-repo-url>
cd One-Nation-One-Data

cd Backend
npm install

cd ../Frontend
npm install
```

### 2) Configure backend environment

Create `Backend/.env` (or copy from `Backend/.env.example`) and update values:

```env
PORT=3000
NODE_ENV=development

MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=one_nation_one_data
MYSQL_CONNECTION_LIMIT=10

SIMILARITY_THRESHOLD=0.7
USE_AI=false

GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-1.5-flash

MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
```

### 3) Start backend

```bash
cd Backend
npm start
```

Backend runs on `http://localhost:3000`.

### 4) Start frontend

```bash
cd Frontend
npm run dev
```

Frontend runs on Vite dev server and proxies API calls to backend.

## Usage Flow

1. Upload a CSV to seed mappings.
2. Choose mode:
	 - Template Mode (NAAC/UGC/NBA)
	 - PDF Mode (upload PDF and extract fields)
3. Review mapped results.
4. Fill missing answers manually.
5. Generate PDF.
6. Download output.
7. Newly filled answers are learned for future runs.

## API Endpoints

Base: `/api/forms`

- `GET /health`
- `POST /upload-csv` (multipart, field: `file`)
- `POST /process-pdf` (multipart, field: `file`)
- `POST /learn` (JSON body: `{ mappings: [{ question, answer }] }`)
- `POST /deactivate` (JSON body: `{ id }`)
- `GET /template/:type` where type is `naac | ugc | nba`
- `POST /generate` (JSON body: `{ formType, data }`)
- `POST /generate-from-pdf` (multipart, fields: `file`, `data`)

## CSV Format

Use headers exactly as below (case-insensitive supported):

```csv
question,answer
Institution Name,XYZ College of Engineering
Year of Establishment,1998
Total Faculty,130
```

## License

See `LICENSE`.
