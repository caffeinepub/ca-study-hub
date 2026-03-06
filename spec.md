# CA Study Hub

## Current State
The app has a Schedule Maker page (`ScheduleMakerPage.tsx`) with two tabs:
- **AI Generator**: Rule-based weekly study schedule using CA level, exam date, daily hours, weak subjects, preferred study time
- **Manual Planner**: Form entry + drag-and-drop weekly grid for CA study blocks

The app has Dashboard, Timer, Progress, ICAI Papers, Library, and Settings pages. No timetable. Guest access is allowed; PDF upload/library requires login.

## Requested Changes (Diff)

### Add
- **Daily Schedule Maker** tab inside the existing `ScheduleMakerPage` as a third top-level tab alongside "AI Generator" and "Manual Planner"
- Within Daily Schedule Maker, two sub-modes selectable by the user:
  1. **AI Daily Planner**: Rule-based generator that takes inputs (wake/sleep time, study hours, lecture timings, hobbies list, daily tasks, meals/breaks, exercise time, preferred study time, CA level) and produces a full day-by-day 7-day schedule with color-coded blocks by category
  2. **Manual Daily Planner**: Hour-by-hour day builder where the user can add blocks by category (Study, Lecture, Hobby, Personal Task, Meal/Break, Exercise) with time + duration, displayed as a vertical timeline per day

### Modify
- `ScheduleMakerPage.tsx`: Add a third tab "Daily Planner" to the existing tabs (AI Generator, Manual Planner, Daily Planner)
- Existing tabs remain unchanged

### Remove
- Nothing removed

## Implementation Plan
1. Create `DailyScheduleMakerTab` component inside `ScheduleMakerPage.tsx` (or a new file imported into it)
2. AI Daily Planner sub-tab:
   - Inputs: wake time, sleep time, CA level, daily study hours, lecture slots (add multiple), hobbies (freetext list), personal tasks (freetext list), exercise duration, meal break durations, preferred study window
   - Rule-based engine: distributes study blocks in preferred window, slots in lectures at user-specified times, inserts meals/breaks at standard times, spreads hobbies and personal tasks in remaining gaps, generates 7-day plan (Mon–Sun) with slight daily variation
   - Output: 7-day weekly view, each day as a vertical timeline with color-coded blocks by category:
     - Study: primary color (burgundy/gold)
     - Lecture: purple/indigo
     - Hobby: green
     - Personal Task: amber/yellow
     - Meal/Break: orange
     - Exercise: teal/cyan
     - Sleep: dark blue/indigo
   - Copy-to-clipboard action
3. Manual Daily Planner sub-tab:
   - Pick a day (Mon–Sun tabs)
   - Add a block: category (dropdown), label (text input), start time, duration
   - Display as vertical timeline for the selected day
   - Delete blocks
   - Navigate between days to build the full week
4. Add "Daily Planner" as third tab in the main ScheduleMakerPage tabs
5. Validate and deploy
