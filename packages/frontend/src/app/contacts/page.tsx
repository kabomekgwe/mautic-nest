'use client';
import { useState, useEffect } from 'react';

interface Contact {
  id: string;
  fields: Record<string, unknown>;
  points: number;
  createdAt: string;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/contacts')
      .then((res) => res.json())
      .then((data) => {
        setContacts(data.data ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Contacts</h1>
        <a
          href="/contacts/new"
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
        >
          New Contact
        </a>
      </div>

      <div className="rounded-lg border">
        <table className="w-full">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Points</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
            )}
            {!loading && contacts.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No contacts found</td></tr>
            )}
            {contacts.map((contact) => (
              <tr key={contact.id} className="border-b hover:bg-muted/30">
                <td className="px-4 py-3 text-sm">{String(contact.fields['email'] ?? '')}</td>
                <td className="px-4 py-3 text-sm">
                  {String(contact.fields['firstname'] ?? '')} {String(contact.fields['lastname'] ?? '')}
                </td>
                <td className="px-4 py-3 text-sm">{contact.points}</td>
                <td className="px-4 py-3 text-sm">{new Date(contact.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
