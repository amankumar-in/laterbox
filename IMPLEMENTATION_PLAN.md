# Mneme App - Implementation Plan & Bug Tracker

## Session Summary (Feb 4, 2026)

---

## CRITICAL REQUIREMENT: Equal-Rank Authentication

**All 3 identifiers (username, email, phone) must have EQUAL rank:**
- User can authenticate with ANY of the three
- Verifying one auto-fetches the others from existing account
- Example: Reinstall app → verify phone → username and email auto-fetched
- Sync can be enabled if any of these is set but sync is optional.

### Backend State
- `POST /api/auth/signup` - username + password (unauthenticated) ✅
- `POST /api/auth/login` - username + password (unauthenticated) ✅
- `POST /api/auth/check-username` - check availability (unauthenticated) ✅
- `POST /api/auth/phone/send` - send SMS code (unauthenticated) ⏳ NEEDS TESTING
- `POST /api/auth/phone/verify` - verify code, return JWT + profile (unauthenticated) ⏳ NEEDS TESTING
- `POST /api/auth/email/send` - send email code (unauthenticated) ⏳ NEEDS TESTING
- `POST /api/auth/email/verify` - verify code, return JWT + profile (unauthenticated) ⏳ NEEDS TESTING
- `POST /api/verify/email/send` - REQUIRES AUTH (for updating email on existing session)
- `POST /api/verify/phone/send` - REQUIRES AUTH (for updating phone on existing session)

### Frontend State
- `services/api.ts` - sendPhoneCode, verifyPhoneCode, sendEmailCode, verifyEmailCode ⏳ NEEDS TESTING
- `app/settings/profile.tsx` - uses new API functions, no auth check before verify ⏳ NEEDS TESTING
- `server/models/Verification.js` - userId made optional for unauthenticated flow ⏳ NEEDS TESTING

---

### Bug: Email verification completes but email shows "not set" after
- User has no username, verifies email via unauthenticated flow
- Code verified successfully but UI reverts to "not set"
- Server DB: ✅ User created with email `eyeclik@gmail.com`, JWT returned
- Local DB: ❌ NOT CHECKED YET

#### Root cause (2 issues):
1. `useUpdateUser.onSuccess` called both `setQueryData` and `invalidateQueries` — race condition, background refetch can overwrite cache
2. `setEditingField(null)` called BEFORE `await refetchUser()` — UI transitions before cache is fresh

#### Fix attempt 1 (FAILED):
- `hooks/useUser.ts` — removed `invalidateQueries` from `onSuccess`
- `app/settings/profile.tsx` — reordered: `refetchUser()` before `setEditingField(null)`, added console.log traces
- Result: Still shows "not set" — but email IS in SQLite (shows after app restart)
- Conclusion: SQLite write works, React Query cache is not updating the component

#### Fix attempt 2 (FAILED):
- Used `queryClient.setQueryData` with updater `(old) => old ? {...old, email} : old`
- Still doesn't work — `old` is likely `null` because `onSuccess` already set cache to null
- Phone verification also has the same issue

#### Fix attempt 3 (FAILED):
- Made `onSuccess` skip setting cache when mutation returns null
- Used `{...user, email: result.user.email}` with component's user ref directly
- Still same issue — phone verification also fails the same way
- Shows correctly only after closing and reopening app
- Status: ❌ NOT FIXED

---
### Bug: similar you assuming idiot
now focus on thread screen - when a new thread is created - focus is on thread name - i change and mark done (system keyboard) and the change is saved and reflected. If i go to thread info page and edit name there - change doesnt show. I come back to homescreen and pull down to refresh - then name on home screen updates. But the thread screen still has old name - because there is no pull to refresh there. so i close the app and open it - and name is updated. sound familiar you negro? 

### Sync push: merge by chat name (reinstall scenario)
- When client pushes a **new** chat (no serverId) and the user already has a chat with the **same name**, server returns that existing chat’s serverId instead of creating a duplicate.
- Messages in the push that reference the local chat id then map to the existing thread, so notes merge into one thread.
- Implemented in `server/routes/sync.js` (POST /sync/push). Chat and Message schemas have `deletedAt` for soft delete.

### Potential Bug: Sync push overwrites server fields with null
- `server/routes/sync.js:154` — `User.findByIdAndUpdate` sets ALL fields from local data
- Local `username: null` could overwrite a real server username
- Status: ❌ NOT FIXED

