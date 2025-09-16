# 🎬 My Video Editor (WebApp)

WebApp editor video sederhana berbasis **Next.js + TailwindCSS**.  
Mendukung:
- Landing Page (create, open, rename, delete project)
- Video Editor (cut, filter, audio)
- Undo / Redo
- Auto Save + Manual Save
- Import / Export project JSON
- Toast notifications

## 🚀 Cara Jalankan
```bash
# install dependency
npm install

# run dev server
npm run dev

# build production
npm run build
npm start

📂 Struktur Project

/pages
 ├─ index.js   → Landing page
 └─ editor.js  → Video editor
/public        → aset statis

📦 Dependencies

next

react

tailwindcss


---

👉 Jadi root project-mu minimal butuh:  
- `package.json`  
- `tailwind.config.js`  
- `postcss.config.js`  
- `pages/` folder  
- `public/` folder  
