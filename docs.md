#Pomodoro API contract

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
Body:
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

- Dashboard
GET /api/dashboard
Purpose: Get current user's dashboard info
Auth: Session cookie required (connect.sid)
Success: 200
Body:
{
  "status": "success",
  "data": {
    "user": {
      "id": "longstring",
      "name": "Steve jobs",
      "avatar_url": "https://example.com/avatar.png",
      "timezone": "Australia/Melbourne",
      "settings": {}
    },
    "week_progress": {
      "scheduled_count": 6,
      "completed_count": 4
    },
    "weekly_activities": [
      {
        "date": "2025-11-17",
        "focus_minutes": 90
      }
    ],
    "today": {
      "date": "2025-11-21T00:00:00.000Z",
      "sessions": [
        {
          "id": "randomstring",
          "name": "Morning Deep Work",
          "start_at": "2025-11-21T09:00:00.000Z",
          "end_at": null,
          "status": "SCHEDULED",
          "break_time": 0,
          "tag": {
            "id": "randomstring",
            "name": "Deep Work",
            "color": "#FF5A5A"
          }
        }
      ]
    }
  }
}


```
