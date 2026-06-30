import { BookOpen, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteRagDocument,
  getRagDocuments,
  ingestRagDocument,
  searchRag,
  type RagSearchHit,
} from "../lib/api";

export function Knowledge() {
  const qc = useQueryClient();
  const { data: docs } = useQuery({ queryKey: ["rag-docs"], queryFn: getRagDocuments });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", source: "", content: "" });

  const add = useMutation({
    mutationFn: () =>
      ingestRagDocument({ title: form.title, source: form.source || undefined, content: form.content }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rag-docs"] });
      setForm({ title: "", source: "", content: "" });
      setOpen(false);
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteRagDocument(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rag-docs"] }),
  });

  // Search tester
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<RagSearchHit[] | null>(null);
  const search = useMutation({
    mutationFn: () => searchRag(query, 5),
    onSuccess: setHits,
  });

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Knowledge Base</h1>
          <p className="text-muted-foreground mt-1">
            Documents are chunked, embedded, and retrieved as context for RAG-enabled policies.
          </p>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-accent-foreground font-medium hover:bg-accent/90"
        >
          <Plus className="h-4 w-4" /> Add Document
        </button>
      </div>

      {add.isError && (
        <p className="text-sm text-red-500 mb-4">{(add.error as Error).message}</p>
      )}

      {open && (
        <div className="rounded-lg border border-border bg-card p-6 mb-6 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="px-3 py-2 rounded-lg bg-background border border-border text-foreground" />
            <input placeholder="Source (optional, e.g. URL)" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} className="px-3 py-2 rounded-lg bg-background border border-border text-foreground" />
          </div>
          <textarea placeholder="Paste document content…" rows={8} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground font-mono text-sm" />
          <div className="flex justify-end">
            <button onClick={() => add.mutate()} disabled={!form.title || !form.content || add.isPending} className="px-4 py-2 rounded-lg bg-accent text-accent-foreground font-medium disabled:opacity-50">
              {add.isPending ? "Embedding…" : "Ingest"}
            </button>
          </div>
        </div>
      )}

      {/* Documents */}
      <div className="rounded-lg border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Title</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Source</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Chunks</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Added</th>
              <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(docs ?? []).map((d) => (
              <tr key={d.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                <td className="py-3 px-4 text-foreground font-medium">{d.title}</td>
                <td className="py-3 px-4 text-muted-foreground truncate max-w-[16rem]">{d.source || "—"}</td>
                <td className="py-3 px-4 text-foreground">{d.chunks}</td>
                <td className="py-3 px-4 text-muted-foreground">{d.createdAt}</td>
                <td className="py-3 px-4 text-right">
                  <button onClick={() => { if (confirm(`Delete "${d.title}"?`)) remove.mutate(d.id); }} className="text-muted-foreground hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {(docs ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="py-10 text-center text-muted-foreground">
                  <BookOpen className="h-6 w-6 mx-auto mb-2 opacity-50" />
                  No documents yet. Add one to build your knowledge base.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Search tester */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-foreground mb-3">Test retrieval</h2>
        <p className="text-muted-foreground text-sm mb-3">
          Run a similarity search to see what context a prompt would retrieve (the same query the gateway runs for RAG-enabled policies).
        </p>
        <div className="flex gap-2">
          <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && query.trim()) search.mutate(); }} placeholder="e.g. What is our refund policy?" className="flex-1 px-3 py-2 rounded-lg bg-background border border-border text-foreground" />
          <button onClick={() => search.mutate()} disabled={!query.trim() || search.isPending} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-accent-foreground font-medium disabled:opacity-50">
            <Search className="h-4 w-4" /> {search.isPending ? "Searching…" : "Search"}
          </button>
        </div>
        {search.isError && <p className="text-sm text-red-500 mt-2">{(search.error as Error).message}</p>}
        {hits && (
          <div className="mt-4 space-y-3">
            {hits.length === 0 && <p className="text-muted-foreground text-sm">No matches.</p>}
            {hits.map((h, i) => (
              <div key={i} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-foreground">{h.title}</span>
                  <span className="text-xs text-accent font-mono">score {h.score.toFixed(3)}</span>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{h.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
