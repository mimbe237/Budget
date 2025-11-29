"use client";
import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import AdminShell from "@/components/AdminShell";

interface TranslationDoc {
  id: string;
  key: string;
  fr?: string;
  en?: string;
  category?: string;
  updatedAt?: Date | string;
}

export default function AdminTranslationsPage() {
  const [rows, setRows] = useState<TranslationDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  async function load() {
    setLoading(true); setError("");
    try {
      const q = query(collection(db, "translations"), orderBy("key"));
      const snap = await getDocs(q);
      const list: TranslationDoc[] = snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          key: data.key ?? d.id,
          fr: data.fr,
          en: data.en,
          category: data.category ?? "general",
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
        };
      });
      setRows(list);
    } catch (e) {
      setError("Impossible de charger les traductions (permissions ou collection absente)");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const categories = useMemo(() => {
    const set = new Set<string>(["all", "general", "auth", "dashboard", "transactions", "budget", "settings"]);
    rows.forEach(r => { if (r.category) set.add(r.category); });
    return Array.from(set);
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter(r => {
      const s = search.trim().toLowerCase();
      const matchesSearch = !s || r.key.toLowerCase().includes(s) || (r.fr ?? "").toLowerCase().includes(s) || (r.en ?? "").toLowerCase().includes(s);
      const matchesCategory = categoryFilter === "all" || (r.category ?? "general") === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [rows, search, categoryFilter]);

  async function addTranslation() {
    const key = prompt("Clé de traduction (ex: Profil)");
    if (!key) return;
    const fr = prompt("Texte FR") ?? "";
    const en = prompt("Texte EN") ?? "";
    const category = prompt("Catégorie (ex: settings)") ?? "general";
    await addDoc(collection(db, "translations"), { key, fr, en, category, updatedAt: new Date() });
    load();
  }

  async function editTranslation(r: TranslationDoc) {
    const fr = prompt("Texte FR", r.fr ?? "") ?? r.fr ?? "";
    const en = prompt("Texte EN", r.en ?? "") ?? r.en ?? "";
    const category = prompt("Catégorie", r.category ?? "general") ?? r.category ?? "general";
    await updateDoc(doc(db, "translations", r.id), { fr, en, category, updatedAt: new Date() });
    load();
  }

  async function deleteTranslation(r: TranslationDoc) {
    if (!confirm(`Supprimer la clé \"${r.key}\" ?`)) return;
    await deleteDoc(doc(db, "translations", r.id));
    load();
  }

  return (
    <AdminShell>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">Gestion des traductions</h1>
          <button onClick={addTranslation} className="px-3 py-2 rounded bg-indigo-600 text-white">Ajouter</button>
        </div>
        <div className="flex gap-3 mb-4">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher (clé, FR, EN)"
            className="flex-1 border rounded px-3 py-2"
          />
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="border rounded px-3 py-2">
            {categories.map(c => (<option key={c} value={c}>{c}</option>))}
          </select>
          <button onClick={load} className="px-3 py-2 rounded border">Rafraîchir</button>
        </div>
        {loading && <p>Chargement…</p>}
        {error && <p className="text-red-600">{error}</p>}
        {!loading && filtered.length === 0 && <p className="text-gray-500">Aucune traduction.</p>}
        <div className="grid grid-cols-1 gap-2">
          {filtered.map(r => (
            <div key={r.id} className="rounded border p-3 bg-white flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="text-sm text-gray-500">{r.category ?? "general"}</div>
                <div className="font-semibold">{r.key}</div>
                <div className="text-gray-700">FR: {r.fr ?? "—"}</div>
                <div className="text-gray-700">EN: {r.en ?? "—"}</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => editTranslation(r)} className="px-3 py-2 rounded border">Modifier</button>
                <button onClick={() => deleteTranslation(r)} className="px-3 py-2 rounded border text-red-600">Supprimer</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
