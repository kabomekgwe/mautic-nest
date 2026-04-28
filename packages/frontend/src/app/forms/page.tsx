'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function FormsPage() {
  const [forms, setForms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/forms').then(r => r.json()).then(d => { setForms(d.data ?? []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Forms</h1>
        <Link href="/forms/new" className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">New Form</Link>
      </div>
      <div className="rounded-lg border">
        <table className="w-full">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Fields</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Submissions</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Created</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>}
            {!loading && forms.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No forms yet</td></tr>}
            {forms.map(f => (
              <tr key={f.id} className="border-b hover:bg-muted/30">
                <td className="px-4 py-3 text-sm font-medium">{f.name}</td>
                <td className="px-4 py-3 text-sm">{f.fields?.length ?? 0}</td>
                <td className="px-4 py-3 text-sm">{f.submissionCount ?? 0}</td>
                <td className="px-4 py-3 text-sm">{new Date(f.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-sm space-x-2">
                  <Link href={`/forms/${f.id}/builder`} className="text-blue-400 hover:text-blue-300">Builder</Link>
                  <Link href={`/forms/${f.id}`} className="text-muted-foreground hover:text-foreground">Submissions</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
