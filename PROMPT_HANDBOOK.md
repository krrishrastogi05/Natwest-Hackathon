# DataTalk — Prompt Handbook
### A Reference of Human Prompts Used to Build the Platform

This document captures the categories and syntax of prompts used throughout the development of DataTalk — covering architecture decisions, backend engineering, compliance logic, frontend design, and debugging. It is written from the perspective of a developer working with an AI coding assistant.

---

## 1. System Architecture & Design

These prompts established the foundational structure of the platform before a single line of code was written.

---

**Defining the overall system:**
```
I am building a multi-agent AI platform for financial data analysis for the NatWest Code for Purpose Hackathon.
The user should be able to upload a CSV or Excel file and ask questions about it in plain English.
The system should never send raw data to the LLM — only schema (column names and types).
Give me a high-level architecture using FastAPI for the backend and React for the frontend.
```

---

**Agent routing design:**
```
I want an orchestrator agent that reads the user's question and decides which specialist agent to route it to.
Agents available: SQL Agent, Code Agent, Search Agent, Explain Agent.
The orchestrator should use intent classification — not keywords — to decide routing.
Return the agent type as a JSON field so the backend can switch on it.
```

---

**Two-LLM architecture decision:**
```
I want to separate my compliance logic from my intelligence logic into two distinct LLM roles.
LLM 1 should run locally — it sees the raw user query and enforces PII rules and compliance checks.
LLM 2 is an external API — it only ever sees column names and types, never data values.
How do I structure the codebase so these two roles are completely separate code paths
and can be pointed at different model endpoints using environment variables?
```

---

**Session isolation design:**
```
Every user who uploads a file should get a completely isolated environment.
No session should be able to read another session's data.
I want each session to have its own DuckDB database file, its own in-memory cache,
and its own connection object, all keyed by a UUID generated at upload time.
How do I implement this in FastAPI?
```

---

**Why DuckDB:**
```
I need an embedded analytical database that:
- Requires zero server infrastructure
- Supports columnar storage for fast aggregations
- Works natively with Pandas DataFrames
- Can write isolated files per session
Compare DuckDB vs SQLite for this use case and recommend one.
```

---

## 2. Backend — FastAPI & API Design

---

**Upload endpoint:**
```
Write a FastAPI POST /api/upload endpoint that:
- Accepts CSV, Excel, JSON, and TSV files up to 50MB
- Rejects anything else with a 400 error
- Parses the file into a Pandas DataFrame
- Runs a detect_issues() pipeline on it
- Caches the DataFrame in memory against a session_id UUID
- Returns the session_id, detected issues, and auto-fixes already applied
Do not load data into DuckDB yet — that happens after user confirmation.
```

---

**Chat endpoint:**
```
Write a POST /api/chat endpoint that:
- Takes a session_id and a user question
- Runs the question through a compliance pre-screen first
- If blocked, returns a compliance violation response with the regulation cited
- If cleared, passes to the orchestrator agent
- Returns the answer, chart data, confidence score, source reference,
  and any compliance findings from post-validation
All as a single structured JSON response.
```

---

**Lifespan startup hook:**
```
I want to load the compliance knowledge base once at application startup, not on every request.
Use FastAPI's lifespan context manager to initialise the TF-IDF vectoriser
over all markdown files in backend/app/compliance_docs/ when the server starts.
Log how many chunks were indexed so I can see it in the terminal.
```

---

**Rate limiting:**
```
Add rate limiting to my FastAPI app.
Max 10 requests per minute per IP.
Return a 429 with a clear error message if exceeded.
I don't want to add Redis — keep it in-memory and per-process.
```

---

## 3. Agents

---

**SQL Agent:**
```
Write a SQL Agent class that:
- Takes the user question and the DuckDB schema (column names + types only, no data)
- Sends both to the LLM with a system prompt instructing it to return only valid DuckDB SQL
- Extracts the SQL from the response
- Executes it against the session's DuckDB connection using parameterised queries
- Returns the result as a list of dicts plus the SQL string for citation
Never send data values to the LLM. If the LLM asks for data, the prompt should prevent it.
```

---

**Code Agent with sandbox:**
```
Write a Code Agent that:
- Generates Python code using the LLM (schema only, no data)
- Executes that code in a restricted interpreter
- The sandbox must: whitelist only pandas, numpy, matplotlib, seaborn, scipy, sklearn
- Remove the open() builtin entirely
- Block os, socket, subprocess at the interpreter level
- Hard kill the thread after 30 seconds
Return the chart as a base64 encoded PNG if matplotlib was used.
```

---

**Orchestrator intent classification:**
```
Write an orchestrator that sends the user question and schema to the LLM
and asks it to classify intent into one of: sql_query, python_analysis, web_search, compliance_question, explanation.
Return the classification as JSON with a confidence field.
Route to the appropriate agent based on the result.
If confidence is below 0.6, default to the SQL agent.
```

---

**Explain Agent:**
```
Write an Explain Agent that takes a raw query result (list of dicts)
and asks the LLM to summarise it in 2-3 plain English sentences
that a non-technical business user can act on immediately.
The agent must be bypassed entirely if any sensitive column is present in the result.
In that case return the raw data only with a flag indicating the explain step was skipped.
```

---

## 4. Compliance Engine

---

**Compliance agent — pre-screen:**
```
Write a pre_screen() method for my ComplianceAgent class.
It takes the raw user question as a string.
It sends it to LLM 1 (the local compliance model) with a zero-trust system prompt.
The prompt must instruct the model to check if the question is attempting to retrieve PII:
Aadhaar, PAN, SSN, CVV, passport numbers, biometric data.
If yes, return blocked: true with the specific DPDP Act 2023 clause that applies.
If no, return blocked: false.
Return as JSON. Do not let the model explain or chat — structured output only.
```

---

**Compliance rules — deterministic engine:**
```
Write a compliance_rules.py module with four hardcoded, LLM-free rule functions:

1. check_pii_exposure(query_text) — regex match for PII field names
2. check_npa_classification(dataframe) — flag loans with DPD 61-90 marked as Standard instead of SMA-2 per RBI IRAC norms
3. check_psl_ratio(dataframe) — calculate PSL ratio, flag if below 40% RBI mandate, return shortfall in Crore
4. check_pmla_ctr(dataframe) — flag cash transactions >= 10 lakh not marked for CTR filing under PMLA 2002

Each function returns a dict with: rule_name, triggered (bool), finding (str), regulation (str), recommendation (str).
No LLM calls anywhere in this file.
```

---

**Compliance knowledge base:**
```
Build a compliance knowledge base using TF-IDF — no external vector database.
Load all .md files from backend/app/compliance_docs/ at startup.
Chunk each document into paragraphs.
Use sklearn's TfidfVectorizer to build the index.
Write a retrieve(query, top_k=3) method that returns the most relevant chunks for a query.
Use a singleton pattern so the KB is only built once per process.
```

---

**PDF compliance document ingestion:**
```
Write a POST /api/compliance/upload endpoint that:
- Accepts a PDF file
- Uses pypdf to extract the text
- Sends the extracted text to the LLM and asks it to reformat it as clean markdown
- Saves the markdown to backend/app/compliance_docs/ with a UUID filename
- Reloads the TF-IDF knowledge base in place (no server restart)
- Returns the number of new chunks added
```

---

**Compliance Q&A with RAG:**
```
Write an answer_compliance_question() method that:
- Takes a plain English compliance question
- Retrieves the top 3 relevant chunks from the TF-IDF KB
- Sends those chunks + the question to the LLM
- Instructs it to answer in plain English, cite the specific rule or threshold,
  and end with a clear Recommendation line
- Returns as structured JSON with fields: answer, sources, recommendation
```

---

## 5. Data Preprocessing

---

**Detect issues pipeline:**
```
Write a detect_issues(df) function that scans a Pandas DataFrame and returns two lists:
1. auto_fixes — zero-risk issues that should be applied silently:
   strip whitespace from string columns, drop fully blank rows, drop exact duplicate rows
2. medium_risk — issues to show the user for approval:
   columns that look like currency (£, $, ₹ symbols), mixed date formats,
   columns with >10% nulls that could be imputed with median
For each medium_risk issue include: issue_type, column_name, example_value, proposed_fix.
```

---

**Apply decisions endpoint:**
```
Write a POST /api/preprocess/apply endpoint that:
- Takes a session_id and a list of user decisions (each with issue_type, column, approved: bool)
- Retrieves the cached DataFrame for that session
- Applies only the approved transformations
- Loads the cleaned DataFrame into the session's DuckDB connection
- Computes schema, data_quality score (0-100), and anomaly flags using 3-sigma detection
- Returns all three as JSON
The raw DataFrame should remain unchanged for sessions where the user clicks Skip.
```

---

**Modular preprocessor architecture:**
```
Refactor the preprocessing logic into a class-based pipeline.
Create a base class PreprocessStep with abstract methods detect(df) -> bool and apply(df) -> DataFrame.
Each cleaning rule is a subclass.
The pipeline runs detect() on all steps, collects those that return True,
then apply() is called only on user-approved steps.
Adding a new rule should require no changes to the pipeline itself.
```

---

## 6. Frontend — React & UI

---

**Overall app structure:**
```
Set up a React 19 app with Vite.
Main layout: fixed sidebar on the left showing uploaded tables and their schemas,
main chat area in the centre, collapsible compliance panel on the right.
Use Tailwind CSS for styling. Light theme by default.
The app should render nothing until the AuthGate is passed.
```

---

**AuthGate component:**
```
Build an AuthGate React component that:
- Renders a centred card with a password input and an unlock button
- On wrong password, plays a CSS shake animation and clears the input
- On correct password, calls an onAuth() prop callback
- Uses NatWest brand colours: deep purple #42145f background, magenta #da1e79 button
- Shows a ShieldCheck icon above the input to signal security
- Does not reveal any app state until authenticated
```

---

**NatWest design system:**
```
I want to update my entire React app to use NatWest brand colours.
Primary: deep purple #42145f / #5f2180
CTA / accent: magenta #da1e79
Backgrounds: white cards, light grey page background
Buttons: pill-shaped, magenta fill for primary actions, purple outline for secondary
Typography: bold sans-serif headings
Set light theme as the default. Dark mode should still be available via toggle.
Update index.css to define these as CSS custom properties so all components inherit them.
```

---

**Preprocessing Wizard UI:**
```
Build a DataPreprocessingWizard React component that appears as a modal after file upload.
It should show:
1. A summary of auto-fixes already applied (read-only, green checkmarks)
2. A list of medium-risk detections, each with:
   - The issue description
   - A concrete example from the data
   - A YES/NO toggle
3. Two buttons: "Apply & Continue" and "Skip preprocessing"
On Apply, POST to /api/preprocess/apply with the session_id and the user's toggle decisions.
Show a loading spinner while the request is in flight.
```

---

**Chat message with compliance annotations:**
```
Update my ChatMessage component to display compliance findings inline below the answer.
If the response includes compliance findings, show each as a coloured badge:
- Red badge for violations (NPA, PSL, PMLA breaches)
- Amber badge for warnings
Each badge should expand on click to show: rule name, regulation, finding, recommendation.
Don't show the compliance section at all if findings is an empty array.
```

---

**Confidence score display:**
```
Build a ConfidenceScore component that takes a score from 0 to 100 and displays:
- A small circular progress ring
- The number in the centre
- A colour: green above 75, amber 50-75, red below 50
- A tooltip on hover explaining what the score means
Keep it compact — it sits inline next to the answer text.
```

---

**CompliancePanel:**
```
Build a CompliancePanel sidebar component that shows:
- A list of all compliance findings from the current session
- Each finding shows: rule triggered, regulation, specific finding, recommendation
- A search/filter bar to filter by rule type
- A button to ask a follow-up compliance question (routes to /api/compliance/query)
- A drag-and-drop zone to upload a new compliance PDF document
The panel should be collapsible and default to open if any findings exist in the session.
```

---

## 7. Multi-Table Analysis

---

**Multi-table schema registration:**
```
Update my DuckDB session manager so that when multiple files are uploaded to the same session,
each file is registered as a named table using the filename without extension.
Example: customers.csv becomes table customers, orders.xlsx becomes table orders.
The combined schema sent to the SQL agent should include all tables and their columns,
clearly labelled by table name, so the LLM can generate JOIN queries across them.
```

---

**Sidebar with multiple tables:**
```
Update the sidebar to show one collapsible card per uploaded table.
Each card shows: table name, row count, data quality score, list of columns with their types.
Columns flagged as sensitive should show a lock icon.
Add an upload button at the top of the sidebar that triggers the preprocessing wizard
as a popup modal without navigating away from the current chat session.
```

---

## 8. PDF Export

---

**PDF report generation:**
```
Write a pdf_generator.py module using ReportLab that generates a session report containing:
1. Cover page: session date, number of tables, overall quality score
2. For each table: schema table, preprocessing audit table (what was changed and why)
3. For each Q&A exchange: the question, the SQL or code used, the plain English answer, the chart (as embedded image), confidence score
4. A compliance summary page listing all rule violations found during the session
Format it cleanly — NatWest purple for headings, alternating row colours in tables.
```

---

## 9. Semantic Layer

---

**Business metric definitions:**
```
Build a semantic layer that lets users define business metrics once.
Example: "active user" = customer with a transaction in the last 30 days.
Store definitions as key-value pairs in a JSON file per session.
When the SQL agent receives a question containing a defined metric name,
inject its definition into the LLM prompt before generating SQL
so the query always uses the correct business logic.
```

---

## 10. Debugging & Fixes

---

**Debugging a rate limit issue:**
```
My Gemini API calls are hitting 429 Resource Exhausted errors under load.
I have a GeminiClient class that wraps the SDK.
Add exponential backoff retry logic: 3 retries, wait 8s / 16s / 24s on rate limit errors,
2s / 4s / 8s on other errors.
Use asyncio.sleep so the event loop is not blocked.
Log a warning to stdout on each retry with the attempt number and wait time.
```

---

**Fixing CORS for deployed frontend:**
```
My FastAPI backend is running on Render and my React frontend is on Vercel.
The frontend is getting CORS errors on POST /api/chat.
Show me the correct FastAPI CORS middleware configuration.
I want to allow my Vercel domain in production and localhost:5173 and localhost:3000 in dev.
Read the allowed origins from an environment variable CORS_ORIGINS as a comma-separated list.
```

---

**Fixing the sandbox timeout:**
```
My Python sandbox uses threading.Thread with a 30 second timeout.
When the timeout fires, the thread is abandoned but continues running in the background,
wasting memory and CPU.
How do I forcefully terminate the thread when the timeout expires?
Show me the implementation using ctypes to raise a SystemExit in the thread.
```

---

**Fixing JSON parse failures from LLM:**
```
My LLM sometimes returns JSON wrapped in markdown code fences like ```json ... ```
which breaks json.loads().
Write a robust parse_llm_json(response: str) -> dict helper that:
1. Strips markdown code fences if present
2. Tries direct json.loads()
3. Falls back to regex extraction of the outermost { } block
4. Raises a ValueError with the first 300 chars of the response if all attempts fail
```

---

**DuckDB identifier quoting:**
```
My SQL agent generates queries with column names that sometimes contain spaces or special characters,
causing DuckDB syntax errors.
Show me how to normalise column names on ingest (replace spaces with underscores, strip special chars)
and how to use DuckDB's identifier quoting in generated queries to prevent injection.
```

---

## 11. Design Decisions Explained to the Model

These are prompts where the developer explained a design constraint or rationale before asking for implementation.

---

```
I specifically do not want to use a vector database like Pinecone or Chroma
because I want zero external dependencies for the compliance knowledge base.
Use sklearn's TF-IDF instead. It is fast enough for 8 documents and requires no API key or server.
```

---

```
The preprocessing wizard must intercept the upload flow, not be a separate page.
The user should feel like cleaning their data is part of uploading, not an extra step.
Implement it as a modal that appears automatically after upload completes,
before the chat interface becomes active.
```

---

```
The compliance post-validate step must use no LLM at all.
It needs to be deterministic — the same data must always produce the same compliance output.
This is non-negotiable for a regulated financial environment.
Implement it as pure Python with hardcoded thresholds and regex patterns only.
```

---

```
The explain agent must be bypassed — not just warned — when a sensitive column appears in results.
I don't want the LLM to summarise data from flagged columns even if the summary seems safe.
The bypass must happen at the agent level before any LLM call is made,
not as a post-processing filter.
```

---

```
I want the two LLM roles to be completely separate code paths with no shared state.
ComplianceAgent must import its own client configuration.
Intelligence agents must import theirs separately.
In production these will point at different endpoints.
Do not use a shared singleton that both paths depend on.
```

---

*This handbook reflects the iterative, decision-driven prompt style used throughout the DataTalk build — from blank canvas to a production-ready compliance-grade data intelligence platform.*
