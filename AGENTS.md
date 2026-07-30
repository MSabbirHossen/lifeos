# AGENTS.md

## Project overview
- This repository is a full-stack personal life OS with a Node.js/Express backend and a React/Vite frontend.
- The app is organized around user-scoped tracker modules such as journal, time tracking, study, Islamic habits, calories, fitness, habits, and finance.
- Main entry points: [server/server.js](server/server.js), [database/db.js](database/db.js), [client/src/App.jsx](client/src/App.jsx), and [client/src/utils/api.js](client/src/utils/api.js).

## Working conventions
- Prefer small, focused changes that match the existing structure instead of introducing new patterns.
- Backend changes usually involve a route, controller, and optionally a model under [server](server). Keep user-scoped resources filtered by req.userId where appropriate.
- Frontend changes usually belong in [client/src/pages](client/src/pages) or [client/src/components](client/src/components). Reuse the existing API client and auth context rather than creating ad-hoc requests.
- Keep styling consistent with the current Tailwind-based UI and the shared Card/Modal components.

## Development workflow
- From the repository root, use:
  - npm run dev — start both the backend and the frontend
  - npm run server:dev — start the backend only
  - npm run client:dev — start the frontend only
  - npm run client:build — build the frontend
  - npm run seed — seed demo data
- The local frontend expects the API at http://localhost:5000, and Vite proxies /api to that backend.

## Project-specific guidance
- Authentication uses JWTs stored in localStorage under the token key; follow the existing auth flow in [client/src/context/AuthContext.jsx](client/src/context/AuthContext.jsx) and [server/middleware/auth.js](server/middleware/auth.js).
- Environment variables are expected in the root .env file, including PORT, MONGODB_URI, JWT_SECRET, and NODE_ENV. See [README.md](README.md) for the expected values.
- If a feature touches both client and server behavior, update both sides together. For example, adding a new tracker or page usually needs a new or updated route/controller/model plus a matching client page and API call.

## Common pitfalls
- Do not assume the app can run without a MongoDB connection or a configured JWT secret.
- Avoid introducing new dependencies unless needed for a clear feature or bug fix.
- Keep route names and API paths consistent with the existing conventions such as /api/journal, /api/time-tracker, /api/study, /api/calories, and /api/finance.
