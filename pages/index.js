import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function Landing() {
  const [projects, setProjects] = useState([]);
  const [newName, setNewName] = useState("");
  const router = useRouter();

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("projects") || "[]");
    setProjects(stored);
  }, []);

  const saveProjects = (updated) => {
    setProjects(updated);
    localStorage.setItem("projects", JSON.stringify(updated));
  };

  const createProject = () => {
    if (!newName) return;
    const exists = projects.find((p) => p.name === newName);
    if (exists) {
      alert("⚠️ Project name already exists");
      return;
    }
    const newProj = {
      name: newName,
      thumbnail: "",
      edits: { cuts: [], filters: [], audio: null },
    };
    const updated = [...projects, newProj];
    saveProjects(updated);
    setNewName("");
  };

  const renameProject = (oldName, newName) => {
    const updated = projects.map((p) =>
      p.name === oldName ? { ...p, name: newName } : p
    );
    saveProjects(updated);
  };

  const deleteProject = (name) => {
    if (!confirm("Delete this project?")) return;
    const updated = projects.filter((p) => p.name !== name);
    saveProjects(updated);
  };

  const openEditor = (name) => {
    router.push(`/editor?project=${encodeURIComponent(name)}`);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-6">
      <h1 className="text-2xl font-bold mb-6">🎬 My Video Projects</h1>

      {/* Create New Project */}
      <div className="flex gap-2 mb-6">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Project name..."
          className="border px-2 py-1 rounded"
        />
        <button
          onClick={createProject}
          className="bg-blue-500 text-white px-4 py-1 rounded"
        >
          ➕ Create
        </button>
      </div>

      {/* Project List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-3xl">
        {projects.map((proj, idx) => (
          <div
            key={idx}
            className="bg-white rounded-lg shadow p-4 flex flex-col justify-between"
          >
            {/* Thumbnail */}
            <div className="aspect-video bg-gray-300 rounded flex items-center justify-center mb-3">
              {proj.thumbnail ? (
                <img src={proj.thumbnail} alt={proj.name} className="w-full h-full object-cover rounded" />
              ) : (
                <span className="text-gray-500">No Thumbnail</span>
              )}
            </div>

            {/* Project Name */}
            <h2 className="text-lg font-semibold mb-2">{proj.name}</h2>

            {/* Actions */}
            <div className="flex justify-between items-center text-sm">
              <button
                onClick={() => openEditor(proj.name)}
                className="bg-green-500 text-white px-3 py-1 rounded"
              >
                ✏️ Open
              </button>
              <button
                onClick={() => {
                  const newName = prompt("Rename project:", proj.name);
                  if (newName) renameProject(proj.name, newName);
                }}
                className="bg-yellow-500 text-white px-3 py-1 rounded"
              >
                ✏️ Rename
              </button>
              <button
                onClick={() => deleteProject(proj.name)}
                className="bg-red-500 text-white px-3 py-1 rounded"
              >
                🗑 Delete
              </button>
            </div>
          </div>
        ))}

        {projects.length === 0 && (
          <p className="text-gray-500 italic text-center col-span-full">
            No projects yet. Create one!
          </p>
        )}
      </div>
    </div>
  );
}
