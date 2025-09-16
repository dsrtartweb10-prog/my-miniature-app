import { useEffect, useState } from "react";

export default function Editor() {
  const [projectName, setProjectName] = useState("");
  const [project, setProject] = useState(null);

  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [saveStatus, setSaveStatus] = useState("💾 Saved");

  // Toast state
  const [toasts, setToasts] = useState([]);

  const showToast = (msg, type = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const projectParam = params.get("project");

    if (projectParam) {
      setProjectName(projectParam);

      const stored = JSON.parse(localStorage.getItem("projects") || "[]");
      const found = stored.find((p) => p.name === projectParam);
      if (found) {
        setProject(found);
      } else {
        const newProj = {
          name: projectParam,
          thumbnail: "",
          edits: { cuts: [], filters: [], audio: null },
        };
        setProject(newProj);
      }
    }
  }, []);

  const saveProject = (silent = false) => {
    if (!project) return;

    setSaveStatus("⌛ Saving...");

    setTimeout(() => {
      const stored = JSON.parse(localStorage.getItem("projects") || "[]");
      const exists = stored.find((p) => p.name === project.name);
      let updated;
      if (exists) {
        updated = stored.map((p) => (p.name === project.name ? project : p));
      } else {
        updated = [...stored, project];
      }

      localStorage.setItem("projects", JSON.stringify(updated));
      setSaveStatus("💾 Saved");

      if (!silent) showToast("✅ Project saved!", "success");
    }, 300);
  };

  useEffect(() => {
    if (project) saveProject(true);
  }, [project]);

  const pushToHistory = () => {
    setUndoStack((prev) => [...prev, JSON.stringify(project)]);
    setRedoStack([]);
  };

  const addFilter = (filter) => {
    pushToHistory();
    setProject((prev) => ({
      ...prev,
      edits: { ...prev.edits, filters: [...prev.edits.filters, filter] },
    }));
    showToast(`🎨 Filter "${filter}" added`, "info");
  };

  const addCut = (start, end) => {
    pushToHistory();
    setProject((prev) => ({
      ...prev,
      edits: { ...prev.edits, cuts: [...prev.edits.cuts, { start, end }] },
    }));
    showToast(`✂️ Cut added: ${start}s → ${end}s`, "info");
  };

  const setAudio = (audioFile) => {
    pushToHistory();
    setProject((prev) => ({
      ...prev,
      edits: { ...prev.edits, audio: audioFile },
    }));
    showToast(`🎵 Audio set: ${audioFile}`, "info");
  };

  const undo = () => {
    if (undoStack.length === 0) return;
    const prevState = undoStack[undoStack.length - 1];
    setUndoStack((stack) => stack.slice(0, -1));
    setRedoStack((stack) => [...stack, JSON.stringify(project)]);
    setProject(JSON.parse(prevState));
    showToast("↺ Undo", "warning");
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    const nextState = redoStack[redoStack.length - 1];
    setRedoStack((stack) => stack.slice(0, -1));
    setUndoStack((stack) => [...stack, JSON.stringify(project)]);
    setProject(JSON.parse(nextState));
    showToast("↻ Redo", "warning");
  };

  const exportProject = () => {
    if (!project) return;
    const blob = new Blob([JSON.stringify(project, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${project.name}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("📤 Project exported!", "success");
  };

  const importProject = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (imported.name && imported.edits) {
          setProject(imported);
          setProjectName(imported.name);
          showToast("📥 Project imported!", "success");
        } else {
          showToast("⚠️ Invalid project file", "error");
        }
      } catch (err) {
        showToast("❌ Failed to load project file", "error");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-gray-100 flex flex-col h-screen">
      {/* Header */}
      <header className="flex justify-between items-center p-3 bg-white shadow">
        <a href="/" className="text-lg">◀ Back</a>
        <div className="flex gap-4 items-center">
          <button
            className={`text-gray-600 ${undoStack.length === 0 ? "opacity-30" : ""}`}
            onClick={undo}
            disabled={undoStack.length === 0}
          >
            ↺
          </button>
          <button
            className={`text-gray-600 ${redoStack.length === 0 ? "opacity-30" : ""}`}
            onClick={redo}
            disabled={redoStack.length === 0}
          >
            ↻
          </button>
          <span className="text-xs text-gray-500">{saveStatus}</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => saveProject(false)}
            className="bg-green-500 text-white px-3 py-1 rounded"
          >
            💾 Save
          </button>
          <button
            onClick={exportProject}
            className="bg-blue-500 text-white px-3 py-1 rounded"
          >
            📤 Export
          </button>
          <label className="bg-purple-500 text-white px-3 py-1 rounded cursor-pointer">
            📥 Import
            <input
              type="file"
              accept="application/json"
              onChange={importProject}
              className="hidden"
            />
          </label>
        </div>
      </header>

      {/* Video Preview */}
      <main className="flex-1 flex flex-col items-center justify-center bg-black text-white p-4">
        <div className="w-full max-w-md aspect-video bg-gray-800 flex items-center justify-center">
          [ Video Preview ]
        </div>
        {projectName && (
          <p className="mt-4 text-sm text-gray-300">Editing: {projectName}</p>
        )}

        {/* Edit History */}
        {project && (
          <div className="w-full max-w-md bg-white rounded p-3 mt-4 shadow">
            <h2 className="text-sm font-semibold mb-2">Edit History</h2>
            <ul className="text-xs text-gray-700 space-y-1">
              {project.edits.cuts.map((cut, idx) => (
                <li key={`cut-${idx}`} className="flex justify-between">
                  ✂️ Cut: {cut.start}s → {cut.end}s
                </li>
              ))}
              {project.edits.filters.map((f, idx) => (
                <li key={`filter-${idx}`} className="flex justify-between">
                  🎨 Filter: {f}
                </li>
              ))}
              {project.edits.audio && (
                <li className="flex justify-between">
                  🎵 Audio: {project.edits.audio}
                </li>
              )}
              {project.edits.cuts.length === 0 &&
                project.edits.filters.length === 0 &&
                !project.edits.audio && (
                  <li className="text-gray-400 italic">No edits yet</li>
                )}
            </ul>
          </div>
        )}
      </main>

      {/* Toolbar */}
      <nav className="bg-white border-t p-2 flex justify-around text-sm">
        <button
          className="flex flex-col items-center"
          onClick={() => addCut(0, 5)}
        >
          ✂️<span>Cut</span>
        </button>
        <button
          className="flex flex-col items-center"
          onClick={() => addFilter("grayscale")}
        >
          🎨<span>Filter</span>
        </button>
        <button
          className="flex flex-col items-center"
          onClick={() => setAudio("background.mp3")}
        >
          🎵<span>Audio</span>
        </button>
      </nav>

      {/* Timeline */}
      <footer className="bg-gray-200 p-2 overflow-x-auto whitespace-nowrap">
        <div className="flex gap-2">
          <div className="w-20 h-12 bg-gray-400 rounded"></div>
          <div className="w-20 h-12 bg-gray-500 rounded"></div>
        </div>
        <p className="text-center text-xs text-gray-600 mt-1">[ Timeline Scroll ]</p>
      </footer>

      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-3 py-2 rounded shadow text-white text-sm ${
              toast.type === "success"
                ? "bg-green-600"
                : toast.type === "error"
                ? "bg-red-600"
                : toast.type === "warning"
                ? "bg-yellow-600"
                : "bg-gray-800"
            }`}
          >
            {toast.msg}
          </div>
        ))}
      </div>
    </div>
  );
}
