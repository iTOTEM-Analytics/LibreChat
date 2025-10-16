import { useEffect, useMemo, useState } from "react";
import { CirclePlus, Pencil, Trash2, LayoutList } from "lucide-react";
import { useNavigate } from "react-router-dom";
import StoryProjectModal from "../components/StoryProjectSetupModal";
import ConfirmDialog from "../components/ConfirmProjectDeleteDialog";
import {
  type StoryCollection,
  getProjects,
  createProject,
  updateProject,  
  deleteProject,
} from "../services/projectsApi";

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

export default function StoryFinderPage() {
  const [projects, setProjects] = useState<StoryCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState<{ id: string; name: string } | null>(null);
  const [editing, setEditing] = useState<StoryCollection | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const res = await getProjects();
        setProjects(Array.isArray(res) ? res : []);
      } catch (err) {
        console.error("Failed to fetch projects", err);
        setProjects([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleCreate = async (payload: {
    name: string;
    connectedProject: string;
    description: string;
  }) => {
    const p = await createProject(payload);
    setProjects((x) => [p, ...x]);
  };

  const handleEdit = async (payload: {
    id: string;
    name: string;
    connectedProject: string;
    description: string;
  }) => {
    const p = await updateProject(payload);
    setProjects((x) => x.map((i) => (i.id === p.id ? p : i)));
  };

  const handleDelete = async (id: string) => {
    await deleteProject(id);
    setProjects((x) => x.filter((p) => p.id !== id));
  };

  const sorted = useMemo(
    () =>
      [...projects].sort((a, b) =>
        (b.updatedAt || b.createdAt).localeCompare(a.updatedAt || a.createdAt)
      ),
    [projects]
  );

  return (
    <div className="px-4 sm:px-6">
      <div className="mx-auto w-full">
        <div className="flex items-center justify-between mb-14">
          <h1 className="text-2xl font-semibold text-slate-600">Story Collections</h1>            
          <button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-700 text-white px-4 py-2 shadow-sm hover:bg-teal-600"
          >
            <CirclePlus className="w-4 h-4" /> New Story Collection 
          </button>
        </div>

        <div className="space-y-4">
          {loading && sorted.length > 0 && (
            <>
              {[...Array(3)].map((_, idx) => (
                <div
                  key={idx}
                  className="w-full rounded-2xl bg-white border border-gray-200/70 shadow-sm"
                  style={{ minHeight: 120 }}
                >
                  <div className="p-5 animate-pulse">
                    <div className="h-5 bg-gray-200 rounded w-1/3 mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </div>
              ))}
            </>
          )}

          {!loading &&
            sorted.map((p) => (
              <button
                key={p.id}
                onClick={() => navigate(`/storyfinder/${p.id}`)}
                className="w-full text-left rounded-2xl bg-white border border-gray-200/70 shadow-sm hover:shadow-md transition relative"
                style={{ minHeight: 120 }}
              >
                <div className="p-5 pr-28">
                  <div className="text-lg font-medium text-blue-900">
                    {truncate(p.name, 50)}
                  </div>
                  {p.description && (
                    <p className="mt-1 text-sm text-gray-600 leading-6">
                      {p.description}
                    </p>
                  )}
                  <div className="mt-3 text-xs text-gray-500">
                    Linked Project: {p.connectedProject || "No project linked."}
                  </div>
                </div>

                <div className="absolute right-4 top-4 flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditing(p);
                      setOpen(true);
                    }}
                    className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm text-slate-500 hover:text-teal-700 hover:bg-gray-50"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirm({ id: p.id, name: p.name });
                    }}
                    className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm text-slate-500 hover:text-red-700 hover:bg-gray-50"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="absolute right-4 bottom-4 text-[11px] text-gray-500 text-right">
                  {(p.updatedAt ? "Updated" : "Created") +
                    " " +
                    new Date(p.updatedAt || p.createdAt).toLocaleString()}
                </div>
              </button>
            ))}

          {!loading && sorted.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-xl bg-white border border-dashed border-gray-300 p-12 text-center text-gray-500 mx-auto">
              <LayoutList className="w-10 h-10 mb-3 text-gray-400" />
              <p className="text-base font-medium">No story collections yet</p>
              <p className="text-sm mt-1">Click on New Story Collection to create your first collection!</p>
            </div>
          )}
        </div>
      </div>

      {open && (
        <StoryProjectModal
          open={open}
          initial={editing || undefined}
          onClose={() => setOpen(false)}
          onCreate={handleCreate}
          onUpdate={handleEdit}
        />
      )}

      {confirm && (
        <ConfirmDialog
          title="Delete project?"
          body={`${truncate(confirm.name, 60)}`}
          confirmText="Delete"
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            handleDelete(confirm.id);
            setConfirm(null);
          }}
        />
      )}
    </div>
  );
}
