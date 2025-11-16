#Pomodoro API contact

Base URL: `http://localhost:3000`

All JSON error responses follow this shape:

```json
{
  "status": "error",
  "message": "custom error msg..."
}

Health:

GET /health
Purpose: Check if backend is alive
Auth:  Not required
Response 200
{
  "status": "ok"
}

Auth:

- Google OAuth:

GET /api/auth/google
Behaviour: Start Google login
Purpose: Redirects user to Google login
Auth: Not required
Response: 200 redirect to Google

- Google callback:

GET /api/auth/google/callback
Purpose: Google redirects back here after login
Auth: Not required (Google handles auth)
Behavior:

On success:
Creates/loads user in DB
Creates session
Sets a session cookie (connect.sid)
Redirects to frontend: process.env.FRONTEND_URL

On failure:
Redirects to /login

- Get current user:

GET /api/auth/me
Purpose: Get the currently logged-in user
Auth: Session cookie required (connect.sid)
Success 200

{
  "id": "string-uuid",
  "auth_user_id": "google-profile-id",
  "name": "Steve Jobs",
  "avartar_url": "https://... or null",
  "timezone": "UTC",
  "settings": {}
}

Fail 401
{
  "error": "Not authenticated"
}

- Logout:

POST /api/auth/logout
Purpose: Log out the current user
Auth: Session cookie required
Success 200
Behaviour: Redirects to /

```
