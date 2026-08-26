# App stability and page-jump fixes

## Confirmed findings, ranked

### P0 — Page scrolls downward during repeated chat updates
- `Chat.tsx` calls `scrollIntoView({ behavior: 'smooth' })` whenever the message array changes.
- Streaming AI responses update that array many times, so the browser repeatedly scrolls nested containers and can also move the whole document downward.
- Replace this with scrolling only the chat viewport, and only auto-follow when the user is already near the latest message.

### P0 — Navigation preserves the previous page’s scroll position
- The app uses `BrowserRouter` without route-level scroll restoration.
- Moving from a long page to another section can leave the new page at the old vertical offset, making it appear that repeated clicks push the page down.
- Add one centralized route scroll-reset component and avoid re-scrolling when the active bottom-navigation item is tapped.

### P1 — AI stream parsing can stall after malformed data
- `streamChat.ts` places an unparseable event back into the buffer, which can block later valid stream events behind it.
- Make the parser tolerate malformed/incomplete events without trapping subsequent responses, and ensure loading always terminates on stream close or abort.

### P1 — Focus timer state is lost on navigation or refresh
- The active timer lives only in page-local React state, so leaving Focus unmounts it while the database session can remain open.
- Persist active session timing/state and restore it from timestamps when the user returns, preventing abandoned sessions and inaccurate analytics.

### P1 — Focus analytics queries are not explicitly scoped to the signed-in user
- The Focus page and completion logic query daily analytics/profile rows with `.single()` but without an explicit user filter.
- Add user scoping to all reads and updates so each user receives reliable stats and updates only their own record.

### P2 — Chat history can grow without limit
- Every streamed update serializes the full conversation to browser storage.
- Cap retained messages and debounce persistence to avoid storage exhaustion and UI slowdown in long conversations.

### P2 — Incomplete and weak UI states
- Quiz “Review Answers” is present but has no implementation.
- Analytics records an error internally but the page does not display a retry/error state.
- Dashboard silently converts failed requests into zero values.
- Add actionable error/retry states and either implement quiz review or remove the nonfunctional action.

### P2 — Mobile layout stability
- Use dynamic viewport sizing and safe-area-aware bottom padding for the fixed mobile navigation so browser address-bar changes do not shift or cover content.
- Confirm the six navigation items remain usable at narrow widths.

## Validation
- Reproduce rapid navigation and AI streaming on mobile and desktop; verify the document does not jump while the chat itself follows new content.
- Test navigation from the bottom of long pages and confirm every new route opens at the top.
- Start a focus session, navigate away/back, and refresh; verify the timer and final analytics remain accurate.
- Exercise chat, quiz, analytics, news, map, and notification flows while checking console and failed network requests.
- Run focused tests/type validation and verify the final UI at desktop and mobile viewports.

## Current system status
- The hosted backend and database are responding normally.
- Recent function calls completed successfully, though AI-backed requests take roughly 8–10 seconds and should retain clear loading/timeout feedback.
- The database security linter currently reports no findings.
