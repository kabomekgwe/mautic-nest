'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Campaign {
  id: string;
  name: string;
  description: string;
  isPublished: boolean;
  contactCount: number;
  createdAt: string;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/campaigns').then(r => r.json()).then(d => { setCampaigns(d.data ?? []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Campaigns</h1>
        <Link href="/campaigns/new" className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">
          New Campaign
        </Link>
      </div>
      <div className="rounded-lg border">
        <table className="w-full">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Contacts</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Created</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>}
            {!loading && campaigns.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No campaigns yet</td></tr>}
            {campaigns.map(c => (
              <tr key={c.id} className="border-b hover:bg-muted/30">
                <td className="px-4 py-3 text-sm font-medium">{c.name}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${c.isPublished ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                    {c.isPublished ? 'Active' : 'Draft'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">{c.contactCount}</td>
                <td className="px-4 py-3 text-sm">{new Date(c.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-sm space-x-2">
                  <Link href={`/campaigns/${c.id}/builder`} className="text-blue-400 hover:text-blue-300">Builder</Link>
                  <Link href={`/campaigns/${c.id}`} className="text-muted-foreground hover:text-foreground">Details</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
