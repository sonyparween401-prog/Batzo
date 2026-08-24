BATZO REAL CRICKET INTEGRATION

Available service functions:
- getMatches()
- getLiveMatches()
- getScorecard(matchId)
- getSquad(matchId)

Important:
The Android APK cannot normally reach a backend running on
127.0.0.1:3000 on the developer's Termux device unless that
backend is running on the same Android environment and the app
is configured accordingly.

For production APK:
Set VITE_CRICKET_API_BASE to the HTTPS URL of the deployed
Batzo backend before npm run build.

Existing Home/Contest UI is intentionally not overwritten.
