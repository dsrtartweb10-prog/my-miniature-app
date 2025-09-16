# My Video Editor (Next.js + Tailwind)

Install:
1. `npm install`
2. `npm run dev`
3. Buka http://localhost:3000

File penting:
- pages/index.js → landing / home
- pages/editor.js → editor

Notes:
- Project data disimpan di localStorage (key: "projects").
- Upload video di landing akan membuat project baru + thumbnail (first frame).
- Editor mendukung auto-save + manual save, undo/redo, import/export JSON, toast notifications.
