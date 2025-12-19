
# Online Assessment Platform — Backend

Simple, minimal backend for an online assessment platform providing user authentication and basic utilities.

## Features

- User registration & login (JWT-based)
- Email utilities for verification and notifications
- Organized MVC-like layout for controllers, models, routes, middleware

## Repository Structure

- `index.js` — application entry point
- `package.json` — project metadata and scripts
- `Controllers/` — request handlers (e.g., `authController.js`)
- `Routes/` — Express route definitions (e.g., `authRoute.js`)
- `Models/` — data models (e.g., `userModel.js`)
- `Database/` — DB configuration (e.g., `dbConfig.js`)
- `Middleware/` — middleware functions (e.g., `Middleware.js`)
- `Utils/` — utilities such as `mailer.js`

## Prerequisites

- Node.js (14+ recommended)
- npm (or yarn)
- A running database (Postgres, MongoDB, or your choice) and connection string
- SMTP credentials for sending emails (if using `Utils/mailer.js`)

## Environment

Create a `.env` file in the project root with at least the following variables:

- `PORT` — server port (e.g., `3000`)
- `DB_URI` or other DB connection config used in `Database/dbConfig.js`
- `JWT_SECRET` — secret for signing JWTs
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` — for email sending (optional)

Example `.env` (do not commit):

```
PORT=3000
DB_URI=mongodb://localhost:27017/online_assess
JWT_SECRET=your_jwt_secret_here
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=you@example.com
SMTP_PASS=supersecret
```

## Install

Install dependencies:

```bash
npm install
```

## Run

- Start production:

```bash
npm start
```

- Start development (with nodemon, if configured):

```bash
npm run dev
```

## API (examples)

- `POST /api/auth/register` — register a new user
- `POST /api/auth/login` — authenticate and receive JWT

Refer to `Routes/authRoute.js` and `Controllers/authController.js` for request/response details.

## Notes for Developers

- Database connection configuration lives in `Database/dbConfig.js`.
- Authentication middleware lives in `Middleware/Middleware.js`.
- Mail helper is `Utils/mailer.js` — update SMTP settings in `.env`.

## Contributing

Feel free to open issues or submit pull requests. Keep changes focused and add tests where appropriate.

## License

Specify a license in the repository root if needed (e.g., `LICENSE` file).
