# Task: Prevent worker from closing session with clients in queue

## Plan:
1. ✅ Analyze the code in `src/pages/Accueil.tsx` and `src/hooks/useQueue.ts`
2. ✅ Create plan and get user approval
3. ✅ Modify `handleCloseSession` in `src/pages/Accueil.tsx` to check for clients
4. ✅ Enhance AlertDialog UX (disable button, show client count)

## Implementation:
- Check if `entries.length > 0` (waiting list) or `inCabinetEntries.length > 0` (in-cabinet list)
- If clients exist, show error toast and prevent closing
- Disable the "Fermer" button when there are clients
- Show descriptive message in the AlertDialog with client counts
- If no clients, allow closing the session as before

