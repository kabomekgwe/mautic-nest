'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function EmailsPage() {
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/emails').then(r => r.json()).then(d => { setEmails(d.data ?? []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Emails</h1>
        <Link href="/emails/new" className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">New Email</Link>
      </div>
      <div className="rounded-lg border">
        <table className="w-full">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Subject</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Sent/Opened/Clicked</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Created</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>}
            {!loading && emails.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No emails yet</td></tr>}
            {emails.map(e => (
              <tr key={e.id} className="border-b hover:bg-muted/30">
                <td className="px-4 py-3 text-sm font-medium">{e.name}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground truncate max-w-[200px]">{e.subject}</td>
                <td className="px-4 py-3 text-sm">{e.sentCount ?? 0}/{e.openCount ?? 0}/{e.clickCount ?? 0}</td>
                <td className="px-4 py-3 text-sm">{new Date(e.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-sm space-x-2">
                  <Link href={`/emails/${e.id}/editor`} className="text-blue-400 hover:text-blue-300">Edit</Link>
                  <button onClick={() => handleSend(e.id)} className="text-green-400 hover:text-green-300">Send</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function handleSend(id: string) {
  fetch(`/api/emails/${id}/send`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
}
