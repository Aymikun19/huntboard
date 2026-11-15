# HuntBoard: Job Application Tracker

A drag-and-drop kanban board for your job search. Move applications from **Wishlist → Applied → Interviewing → Offer**, get nudged when a follow-up is due, and see your real response rate.

![Next.js](https://img.shields.io/badge/Next.js-16-black) ![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ecf8e) ![dnd-kit](https://img.shields.io/badge/drag%20%26%20drop-dnd--kit-blue) ![Tests](https://img.shields.io/badge/tests-vitest-yellow)

## Features

- Kanban board with mouse and touch drag-and-drop (dnd-kit)
- **Optimistic updates**: cards move instantly with `useOptimistic`, and the server action persists in the background
- Follow-up reminders that surface overdue applications at the top of the board
- Pipeline metrics: applications sent, response rate, interview rate and offers
- A Postgres trigger stamps `applied_on` automatically the first time a card leaves the wishlist

## Run it

```bash
# run supabase/schema.sql
cp .env.example .env.local
npm install && npm run dev
npm test
```
