import { useEffect, useState } from "react";

/**
 * Editor page:
 * - Reads ?project=name from URL
 * - Loads project from localStorage or creates new
 * - Supports: addCut, addFilter, setAudio
 * - Undo/Redo (stack), auto-save (silent) + manual save
 * - Import / Export JSON
 * - Toast notifications
 */

export default function Editor() {
  const [projectName, setProjectName] = useState("");
  const [project, setProject] = useState(null);

  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [saveStatus, setSaveStatus] = useState("💾 Saved");

  const [toasts, setToasts] = useState([]);

  const showToast = (msg, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  };

  useEffect(() => {
    // parse query param (client-only)
    const params = new URLSearchParams(window.location.search);
    const param = params.get("project");
    if (param) {
      setProjectName(param);
      const stored = JSON.parse(localStorage.getItem("projects") || "[]");
      const found = stored.find((p) => p.name === param);
      if (found) {
        setProject(found);
      } else {
        // create default project if not found
        const newProj = { name: param, thumbnail: "", edits: { cuts: [], filters: [], audio: null } };
        setProject(newProj);
      }
    } else {
      // no query -> new anonymous project
      const newName = `project-${Date.now()}.mp4`;
      setProjectName(newName);
      const newProj = { name: newName, thumbnail: "", edits: { cuts: [], filters: [], audio: null } };
      setProject(newProj);
    }
  }, []);

  // Save to localStorage (replace or add)
  const saveProject = (silent = true) => {
    if (!project) return;
    setSaveStatus("⌛ Saving...");
    // slight delay so UI can show saving status
    setTimeout(() => {
      const stored = JSON.parse(localStorage.getItem("projects") || "[]");
      const exists = stored.find((p) => p.name === project.name);
      let updated;
      if (exists) {
        updated = stored.map((p) => (p.name === project.name ? project : p));
      } else {
        updated = [project, ...stored].slice(0, 50);
      }
      localStorage.setItem("projects", JSON.stringify(updated));
      setSaveStatus("💾 Saved");
      if (!silent) showToast("✅ Project saved!", "success");
    }, 250);
  };

  // auto-save on project change
  useEffect(() => {
    if (project) {
      saveProject(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project]);

  // push current state before modifications
  const pushToHistory = () => {
    if (!project) return;
    setUndoStack((s) => [...s, JSON.stringify(project)]);
    setRedoStack([]); // clear redo
  };

  // actions
  const addCut = (start = 0, end = 5) => {
    pushToHistory();
    setProject((prev) => ({
      ...prev,
      edits: { ...prev.edits, cuts: [...prev.edits.cuts, { start, end }] }
    }));
    showToast(`✂️ Cut ${start}s → ${end}s added`, "info");
  };

  const addFilter = (filter = "grayscale") => {
    pushToHistory();
    setProject((prev) => ({
      ...prev,
      edits: { ...prev.edits, filters: [...prev.edits.filters, filter] }
    }));
    showToast(`🎨 Filter "${filter}" added`, "info");
  };

  const setAudio = (audio = "background.mp3") => {
    pushToHistory();
    setProject((prev) => ({
      ...prev,
      edits: { ...prev.edits, audio }
    }));
    showToast(`🎵 Audio set: ${audio}`, "info");
  };

  // remove specific edit
  const removeCut = (idx) => {
    pushToHistory();
    setProject((prev) => ({
      ...prev,
      edits: { ...prev.edits, cuts: prev.edits.cuts.filter((_, i) => i !== idx) }
    }));
    showToast("✂️ Cut removed", "warning");
  };

  const removeFilter = (idx) => {
    pushToHistory();
    setProject((prev) => ({
      ...prev,
      edits: { ...prev.edits, filters: prev.edits.filters.filter((_, i) => i !== idx) }
    }));
    showToast("🎨 Filter removed", "warning");
  };

  const removeAudio = () => {
    pushToHistory();
    setProject((prev) => ({ ...prev, edits: { ...prev.edits, audio: null } }));
    showToast("🎵 Audio removed", "warning");
  };

  // Undo / Redo
  const undo = () => {
    if (undoStack.length === 0) return;
    const prevState = undoStack[undoStack.length - 1];
    setUndoStack((s) => s.slice(0, -1));
    setRedoStack((s) => [...s, JSON.stringify(project)]);
    setProject(JSON.parse(prevState));
    showToast("↺ Undo", "warning");
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    const nextState = redoStack[redoStack.length - 1];
    setRedoStack((s) => s.slice(0, -1));
    setUndoStack((s) => [...s, JSON.stringify(project)]);
    setProject(JSON.parse(nextState));
    showToast("↻ Redo", "warning");
  };

  // import / export
  const exportProject = () => {
    if (!project) return;
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.name}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("📤 Project exported", "success");
  };

  const importProject = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target.result);
        if (imported?.name && imported?.edits) {
          setProject(imported);
          setProjectName(imported.name);
          showToast("📥 Project imported", "success");
        } else {
          showToast("⚠️ Invalid project file", "error");
        }
      } catch (err) {
        showToast("❌ Failed to import", "error");
      }
    };
    reader.readAsText(f);
  };

  if (!project) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="flex items-center justify-between p-3 bg-white shadow">
        <div className="flex items-center gap-3">
          <a href="/" className="text-lg">◀ Back</a>
          <div className="text-sm text-slate-500">Editing: <span className="font-medium">{projectName}</span></div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={undo}
            disabled={undoStack.length === 0}
            className={`px-2 py-1 rounded ${undoStack.length === 0 ? "opacity-40" : "bg-slate-200"}`}
          >
            ↺
          </button>
          <button
            onClick={redo}
            disabled={redoStack.length === 0}
            className={`px-2 py-1 rounded ${redoStack.length === 0 ? "opacity-40" : "bg-slate-200"}`}
          >
            ↻
          </button>

          <div className="text-xs text-slate-500">{saveStatus}</div>

          <button onClick={() => saveProject(false)} className="bg-green-500 text-white px-3 py-1 rounded">💾 Save</button>
          <button onClick={exportProject} className="bg-blue-600 text-white px-3 py-1 rounded">📤 Export</button>
          <label className="bg-purple-600 text-white px-3 py-1 rounded cursor-pointer">
            📥 Import
            <input onChange={importProject} accept="application/json" type="file" className="hidden" />
          </label>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 p-4 flex flex-col items-center bg-black">
        <div className="w-full max-w-3xl bg-slate-800 rounded p-4 text-white">
          {/* Preview placeholder */}
          <div className="aspect-video bg-slate-900 rounded flex items-center justify-center mb-3">
            <div className="text-slate-400">[ Video Preview ]</div>
          </div>

          {/* Edit history panel */}
          <div className="bg-white text-black rounded p-3">
            <h3 className="font-semibold mb-2">Edit History</h3>
            <div className="text-xs text-slate-700 space-y-2">
              {/* Cuts */}
              <div>
                <div className="text-slate-500">✂️ Cuts</div>
                {project.edits.cuts.length === 0 ? <div className="italic text-slate-400">No cuts</div> :
                  <ul className="list-inside list-disc">
                    {project.edits.cuts.map((c, idx) => (
                      <li key={idx} className="flex justify-between items-center">
                        <span>From {c.start}s → {c.end}s</span>
                        <button onClick={() => removeCut(idx)} className="text-red-500 text-xs ml-2">❌</button>
                      </li>
                    ))}
                  </ul>
                }
              </div>

              {/* Filters */}
              <div>
                <div className="text-slate-500">🎨 Filters</div>
                {project.edits.filters.length === 0 ? <div className="italic text-slate-400">No filters</div> :
                  <ul className="list-inside list-disc">
                    {project.edits.filters.map((f, idx) => (
                      <li key={idx} className="flex justify-between items-center">
                        <span>{f}</span>
                        <button onClick={() => removeFilter(idx)} className="text-red-500 text-xs ml-2">❌</button>
                      </li>
                    ))}
                  </ul>
                }
              </div>

              {/* Audio */}
              <div>
                <div className="text-slate-500">🎵 Audio</div>
                {project.edits.audio ? (
                  <div className="flex justify-between items-center">
                    <span>{project.edits.audio}</span>
                    <button onClick={removeAudio} className="text-red-500 text-xs">❌</button>
                  </div>
                ) : <div className="italic text-slate-400">No audio</div>}
              </div>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex gap-3 mt-4">
            <button onClick={() => addCut(0,5)} className="bg-white text-black px-3 py-2 rounded">✂️ Cut</button>
            <button onClick={() => addFilter('grayscale')} className="bg-white text-black px-3 py-2 rounded">🎨 Filter</button>
            <button onClick={() => setAudio('bgm.mp3')} className="bg-white text-black px-3 py-2 rounded">🎵 Add Audio</button>
          </div>
        </div>
      </main>

      {/* Footer / timeline placeholder */}
      <footer className="bg-slate-200 p-3 text-center text-sm">
        <div className="mx-auto max-w-3xl">[ Timeline placeholder — nanti bisa digantikan UI timeline nyata ]</div>
      </footer>

      {/* Toasts */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-50">
        {toasts.map(t => (
          <div key={t.id} className={`px-3 py-2 rounded text-white text-sm shadow-lg ${
            t.type === 'success' ? 'bg-green-600' : t.type === 'error' ? 'bg-red-600' : t.type === 'warning' ? 'bg-yellow-600' : 'bg-gray-800'
          }`}>
            {t.msg}
          </div>
        ))}
      </div>
    </div>
  );
}
