# CA Study Hub

## Current State
The app has a PDF Library page where students upload their own PDFs organised by CA level and subject, using blob storage. The page includes an upload dropzone, drag-and-drop, delete confirmation dialogs, and an inline iframe PDF viewer.

## Requested Changes (Diff)

### Add
- New **ICAI Papers** page that replaces the PDF Library page
- A curated, hardcoded catalogue of official ICAI study materials, question papers, and reference links for all three CA levels (Foundation, Intermediate, Final)
- Each paper card links directly to the ICAI website URL (icai.org) or opens an embedded viewer inside the app
- Filter by CA level (Foundation / Inter / Final) and by paper category (Question Papers, Study Material, Mock Test Papers, RTP, MTP)
- Inline iframe viewer to read papers without leaving the app
- "Open on ICAI website" fallback button for papers that cannot be embedded

### Modify
- Rename the nav label "PDF Library" → "ICAI Papers" in AppLayout.tsx
- Replace the `PDFLibraryPage` import in App.tsx with the new `ICAIPapersPage`
- Update the nav icon from BookOpen to GraduationCap or LibraryBig

### Remove
- `PDFLibraryPage.tsx` — entire upload/blob-storage-based PDF library
- All references to `useAddOrUpdatePDFMetadata`, `useRemovePDFMetadata`, `usePDFMetadata`, `ExternalBlob` from this page

## Implementation Plan
1. Create `/src/frontend/src/data/icaiPapers.ts` — hardcoded catalogue of ICAI papers with title, subject, level, category, and direct URL to ICAI website
2. Create `/src/frontend/src/pages/ICAIPapersPage.tsx` — new page with:
   - Level tabs (Foundation / Inter / Final)
   - Category filter chips
   - Paper cards grid with title, subject badge, category badge, and View/Open buttons
   - Inline iframe modal viewer with close button and "Open on ICAI" fallback
3. Update `App.tsx` to import and render `ICAIPapersPage` for the `"pdf"` route
4. Update `AppLayout.tsx` nav item label and icon for the `"pdf"` route
5. Remove `PDFLibraryPage.tsx`
6. Validate and deploy
