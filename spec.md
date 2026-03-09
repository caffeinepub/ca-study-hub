# CA Study Hub

## Current State
- Community page exists with full post/edit/delete/like/comment functionality (localStorage-based)
- Settings page exists with Profile, Theme, Quotes, and About sections
- Backend has user profiles, study sessions, timer sessions, chapter progress, PDF metadata
- No user stats tracking exists in backend or frontend
- Community features are fully built and working

## Requested Changes (Diff)

### Add
- **Backend**: `getUserStats()` query (no auth needed) returning `{ totalRegistered, activeToday, activeThisWeek, activeThisMonth }`
- **Backend**: `recordActivity()` shared function for signed-in users to record their last-active timestamp
- **Backend**: `UserStats` type
- **Frontend**: User Stats section in Settings page, visible to ALL users (including guests), showing total registered users + active counts with Day/Week/Month toggle tabs
- **Frontend**: Call `recordActivity()` on sign-in so activity is tracked
- **Frontend**: `useUserStats` hook using `getUserStats` backend query
- **Community**: Confirm all features (post, edit, delete, like, comment) work correctly for signed-in users; guests can view but must sign in to interact

### Modify
- **Settings**: Add a new "Community & Users" stats card section after the About section
- **useQueries.ts**: Add `useUserStats` hook that calls `backend.getUserStats()`
- **useInternetIdentity.ts / AppLayout**: Call `recordActivity` after successful sign-in

### Remove
- Nothing to remove

## Implementation Plan
1. Update `backend.d.ts` to include `getUserStats(): Promise<UserStats>` and `recordActivity(): Promise<void>` and `UserStats` interface
2. Update `backend.ts` to expose `getUserStats` and `recordActivity`
3. Add `useUserStats` hook in `useQueries.ts` using React Query
4. Update `AppLayout.tsx` to call `recordActivity` when identity is available
5. Add User Stats section in `SettingsPage.tsx`:
   - Stat card with total registered users (always visible, including guests)
   - Day / Week / Month tab toggle showing active user counts
   - Uses the `useUserStats` hook
   - Shows loading skeleton while fetching
6. Verify `CommunityPage.tsx` has all required features visible and working
