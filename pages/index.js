import { useEffect, useState } from "react";
import { useRouter } from "next/router";

/**
 * Landing page: hero + project grid.
 * - Upload video -> take first-frame thumbnail -> create project -> open editor
 * - Create empty project by name
 * - Rename / Delete / Open existing
 */

export default function Home() {
  const [projects, setProjects] = useState([]);
  const [nameInput, setNameInput] = useState("");
  const router = useRouter();

  useEffect(() => {
    // load projects from localStorage (client-only)
    const stored = JSON.parse(localStorage.getItem("projects") || "[]");
    setProjects(stored);
  }, []);

  const saveProjects = (list) => {
    setProjects(list);
    localStorage.setItem("projects", JSON.stringify(list));
  };

  // Create empty project with name
  const createEmptyProject = () => {
    if (!nameInput.trim()) {
      alert("Masukkan nama project dulu");
      return;
    }
    const name = nameInput.trim();
    const exists = projects.find((p) => p.name === name);
    if (exists) {
      alert("Nama project sudah ada");
      return;
    }
    const newProj = {
      name,
      thumbnail: "",
      edits: { cuts: [], filters: [], audio: null }
    };
    const updated = [newProj, ...projects].slice(0, 50);
    saveProjects(updated);
    setNameInput("");
    router.push(`/editor?project=${encodeURIComponent(name)}`);
  };

  // Upload video and capture thumbnail (first frame)
  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const videoURL = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.src = videoURL;
    video.crossOrigin = "anonymous";
    video.muted = true;
    video.playsInline = true;

    video.addEventListener("loadeddata", () => {
      // draw first frame
      const canvas = document.createElement("canvas");
      const w = 320;
      const h = Math.round((video.videoHeight / video.videoWidth) * w) || 180;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      try {
        ctx.drawImage(video, 0, 0, w, h);
      } catch (err) {
        // fallback: just blank thumbnail
      }
      const thumbnail = canvas.toDataURL("image/png");

      const projName = file.name || `project-${Date.now()}.mp4`;
      const newProj = {
        name: projName,
        thumbnail,
        edits: { cuts: [], filters: [], audio: null }
      };
      const updated = [newProj, ...projects].slice(0, 50);
      saveProjects(updated);

      // navigate to editor for this project
      router.push(`/editor?project=${encodeURIComponent(projName)}`);

      URL.revokeObjectURL(videoURL);
    });

    // in case loadeddata never fires (old browsers), set a timeout fallback
    setTimeout(() => {
      if (!video.readyState) {
        const projName = file.name || `project-${Date.now()}.mp4`;
        const newProj = {
          name: projName,
          thumbnail: "",
          edits: { cuts: [], filters: [], audio: null }
        };
        const updated = [newProj, ...projects].slice(0, 50);
        saveProjects(updated);
        router.push(`/editor?project=${encodeURIComponent(projName)}`);
      }
    }, 2500);
  };

  const openEditor = (name) => {
    router.push(`/editor?project=${encodeURIComponent(name)}`);
  };

  const renameProject = (oldName) => {
    const newName = prompt("Nama baru:", oldName);
    if (!newName) return;
    if (projects.find((p) => p.name === newName)) {
      alert("Nama sudah dipakai");
      return;
    }
    const updated = projects.map((p) =>
      p.name === oldName ? { ...p, name: newName } : p
    );
    saveProjects(updated);
  };

  const deleteProject = (name) => {
    if (!confirm(`Hapus project "${name}"?`)) return;
    const updated = projects.filter((p) => p.name !== name);
    saveProjects(updated);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-black text-white flex flex-col">
      {/* NAVBAR */}
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="text-2xl font-bold">🎬 My Video Editor</div>
          <div className="text-sm text-slate-400">Online & simple</div>
        </div>
        <nav className="flex items-center gap-3">
          <button
            onClick={() => router.push("/editor")}
            className="bg-emerald-500 px-3 py-2 rounded-md text-sm font-semibold hover:brightness-95"
          >
            Start Editing
          </button>
        </nav>
      </header>

      {/* HERO */}
      <main className="flex-1 px-6 py-8 flex flex-col items-center">
        <section className="max-w-3xl w-full text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Create & Edit Videos in Browser</h1>
          <p className="text-slate-300 mb-6">
            Upload a clip or create an empty project — edit quickly on mobile or desktop.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <label className="bg-blue-600 px-4 py-3 rounded text-white cursor-pointer inline-flex items-center gap-2">
              📤 Upload Video (New Project)
              <input onChange={handleUpload} type="file" accept="video/*" className="hidden" />
            </label>

            <div className="flex gap-2">
              <input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Project name (optional)"
                className="px-3 py-2 rounded text-black"
              />
              <button
                onClick={createEmptyProject}
                className="bg-indigo-500 px-4 py-2 rounded text-white"
              >
                ➕ Create
              </button>
            </div>
          </div>
        </section>

        {/* Project Grid */}
        <section className="w-full max-w-4xl">
          <h2 className="text-xl font-semibold mb-4">Recent Projects</h2>

          {projects.length === 0 ? (
            <div className="text-slate-400 italic">No projects yet — upload or create one.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {projects.map((p, i) => (
                <div key={i} className="bg-white/5 rounded-lg p-3 flex flex-col">
                  <div className="aspect-video bg-slate-700 rounded overflow-hidden mb-3 flex items-center justify-center">
                    {p.thumbnail ? (
                      <img src={p.thumbnail} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-slate-300">No thumbnail</div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="font-medium mb-2">{p.name}</div>
                    <div className="text-xs text-slate-400 mb-3">
                      edits: {p.edits?.cuts?.length || 0} cuts · {p.edits?.filters?.length || 0} filters
                    </div>
                  </div>

                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => openEditor(p.name)}
                      className="flex-1 bg-emerald-600 py-2 rounded text-sm"
                    >
                      Open
                    </button>
                    <button
                      onClick={() => renameProject(p.name)}
                      className="bg-yellow-500 px-3 py-2 rounded text-sm"
                    >
                      Rename
                    </button>
                    <button
                      onClick={() => deleteProject(p.name)}
                      className="bg-red-600 px-3 py-2 rounded text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* FOOTER */}
      <footer className="py-6 text-center text-slate-400">
        © {new Date().getFullYear()} My Video Editor — built with ❤️
      </footer>
    </div>
  );
}
