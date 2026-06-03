"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Notebook from "@/components/Notebook";
import { db, NotebookPage } from "@/lib/db";
import { Menu } from "lucide-react";

interface DeleteModalState {
  isOpen: boolean;
  pageId: string | null;
  pageTitle: string;
}

export default function Workspace() {
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [angle, setAngle] = useState<"rad" | "deg">("deg");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [pageData, setPageData] = useState<NotebookPage | null>(null);
  const [deleteModal, setDeleteModal] = useState<DeleteModalState>({
    isOpen: false,
    pageId: null,
    pageTitle: "",
  });

  useEffect(() => {
    const initializeApp = async () => {
      const savedTheme = await db.config.get("theme");
      if (savedTheme) setTheme(savedTheme.value);

      const savedAngle = await db.config.get("angle");
      if (savedAngle) setAngle(savedAngle.value);

      const latest = await db.pages.orderBy("updatedAt").reverse().first();
      if (latest) setActivePageId(latest.id);
    };
    initializeApp();
  }, []);

  useEffect(() => {
    function check() {
      if (!activePageId) {
        setPageData(null);
        return true;
      }
      return false;
    }

    if (check()) return;

    const loadActivePage = async () => {
      const page = await db.pages.get(activePageId);
      if (page) setPageData(page);
    };
    loadActivePage();
    const interval = setInterval(loadActivePage, 1000);
    return () => clearInterval(interval);
  }, [activePageId]);

  const handleToggleTheme = async () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    await db.config.put({ key: "theme", value: nextTheme });
  };

  const handleToggleAngle = async () => {
    const nextAngle = angle === "rad" ? "deg" : "rad";
    setAngle(nextAngle);
    await db.config.put({ key: "angle", value: nextAngle });
  };

  const handleTitleChange = async (newTitle: string) => {
    if (!activePageId || !pageData) return;
    const updatedPage = { ...pageData, title: newTitle, updatedAt: Date.now() };
    setPageData(updatedPage);
    await db.pages.put(updatedPage);
  };

  const triggerDeletePrompt = (pageId: string, pageTitle: string) => {
    setDeleteModal({ isOpen: true, pageId, pageTitle });
  };

  const executeDeletePage = async () => {
    if (!deleteModal.pageId) return;

    await db.pages.delete(deleteModal.pageId);

    if (activePageId === deleteModal.pageId) {
      const fallback = await db.pages.orderBy("updatedAt").reverse().first();
      setActivePageId(fallback ? fallback.id : null);
    }

    setDeleteModal({ isOpen: false, pageId: null, pageTitle: "" });
  };

  return (
    <div
      className={`flex h-screen w-screen overflow-hidden transition-colors duration-300 font-sans ${
        theme === "light"
          ? "bg-neutral-50 text-neutral-900"
          : "bg-black text-white"
      }`}
    >
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activePageId={activePageId}
        onSelectPage={(id) => setActivePageId(id)}
        theme={theme}
        angle={angle}
        onToggleTheme={handleToggleTheme}
        onToggleAngle={handleToggleAngle}
        onRequestDelete={triggerDeletePrompt}
      />

      <main className="flex-1 overflow-y-auto p-16 flex flex-col items-center justify-start relative pt-24">
        <div
          className={`w-full max-w-2xl mb-12 flex items-center justify-start gap-4 fixed top-0 ${theme === "light" ? "bg-white/25" : "bg-black/25"} backdrop-blur-xs pt-8 pb-16 mask-[linear-gradient(to_bottom,white_60%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,white_60%,transparent_100%)]`}
        >
          <button
            onClick={() => setIsSidebarOpen(true)}
            className={`p-2 border rounded-xl shadow-sm active:shadow-none transition-all duration-200 cursor-pointer ${
              theme === "light"
                ? "bg-white border-neutral-200/80 hover:bg-neutral-50 text-black"
                : "bg-neutral-900 border-neutral-800/80 hover:bg-neutral-800 text-white"
            }`}
          >
            <Menu className="w-4 h-4" />
          </button>

          {pageData && (
            <input
              type="text"
              value={pageData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Untitled Workspace"
              className={`bg-transparent font-sans font-medium tracking-tight text-xl border-none outline-none focus:ring-0 p-0 m-0 ${
                theme === "light"
                  ? "text-neutral-900 placeholder-neutral-300"
                  : "text-neutral-100 placeholder-neutral-800"
              }`}
            />
          )}
        </div>

        <Notebook
          activePageId={activePageId}
          theme={theme}
          title={pageData?.title || ""}
        />
      </main>

      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/40">
          <div
            className={`max-w-sm w-full p-6 border rounded-xl shadow-2xl transition-all duration-300 ${
              theme === "light"
                ? "bg-white border-neutral-200 text-neutral-900"
                : "bg-neutral-900 border-neutral-800 text-white"
            }`}
          >
            <h3 className="text-sm font-bold uppercase tracking-wider font-mono mb-2">
              Confirm Destruction
            </h3>
            <p className="text-xs opacity-70 leading-relaxed mb-6">
              Are you sure you want to permanently delete{" "}
              <span className="font-semibold">
                &quot;{deleteModal.pageTitle}&quot;
              </span>
              ? This clear transactional action cannot be reversed.
            </p>
            <div className="flex justify-end gap-2 font-mono text-xs">
              <button
                onClick={() =>
                  setDeleteModal({ isOpen: false, pageId: null, pageTitle: "" })
                }
                className={`px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                  theme === "light"
                    ? "bg-neutral-50 border-neutral-200 hover:bg-neutral-100"
                    : "bg-neutral-800 border-neutral-700 hover:bg-neutral-700"
                }`}
              >
                Cancel
              </button>
              <button
                onClick={executeDeletePage}
                className="px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-500 transition-colors cursor-pointer"
              >
                Delete Space
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
