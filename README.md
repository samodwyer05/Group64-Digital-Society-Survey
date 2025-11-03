```markdown
# Group64-Digital-Society-Survey

This is a small single-page React app (Vite) that provides an interactive survey where visitors place a point on two ternary plots ("Today (2025)" and "Future (2075)") to express the balance they believe society prioritizes among Innovation, Equality, and Stability.

Features
- Interactive ternary input (click inside triangle) for 2025 and 2075.
- Stores results in Supabase with fields: id, timestamp, year, innovation, equality, stability.
- Each user can submit once per plot (enforced via browser localStorage).
- View aggregated results overlayed on ternary plots (Plotly).
- Download all results as CSV (admin only — protected by a simple prompt).
- Mobile-friendly and responsive design.

Setup

1. Create a Supabase project (https://supabase.com/) and create a table using the provided SQL (supabase.sql).

2. Create the table in your Supabase database:

Run the SQL in supabase.sql:

```sql
-- supabase.sql
create table if not exists responses (
  id uuid default uuid_generate_v4() primary key,
  timestamp timestamptz default now(),
  year text not null,
  innovation numeric not null,
  equality numeric not null,
  stability numeric not null
);
```

Note: Ensure the pgcrypto or uuid extensions are available (Supabase typically provides uuid_generate_v4). If not, use serial primary key or adjust accordingly.

3. Configure API keys

Create a .env file in the project root with Vite environment variables:

Vite expects env vars with VITE_ prefix:

VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-public-key"
VITE_ADMIN_PASSWORD="choose-a-strong-password"

Important:
- The ANON_KEY is used by the client to insert and read data. This allows the app to run without user accounts.
- The admin password is only used client-side to gate the CSV download button. For production, restrict access to downloads using server-side functions for security.

4. Install dependencies and run:

npm install
npm run dev

5. Build for production:

npm run build
npm run preview

Security note
- This app is designed to work without authentication. The Supabase anon key should be set with row-level security (RLS) policies if you want to restrict access. For a simple public survey, the anon key can allow inserts and selects.
- For secure CSV exports, you should implement a server-side endpoint (Netlify function / Vercel serverless) that uses the Supabase service_role key to export data after proper authentication. The client-side admin password is only a convenience.

Project structure
- src/
  - main.jsx
  - App.jsx
  - components/
    - TernaryInput.jsx
    - TernaryResults.jsx
  - lib/
    - supabase.js
  - styles.css

If you want help deploying this to Vercel/Netlify and wiring a server-side export endpoint with the service_role key for secure CSV downloads, tell me where you plan to host and I will add the serverless code.

```
