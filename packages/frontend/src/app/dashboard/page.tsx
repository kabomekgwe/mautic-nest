export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Contacts', value: '0', change: '+0%' },
          { label: 'Active Campaigns', value: '0', change: '+0%' },
          { label: 'Emails Sent', value: '0', change: '+0%' },
          { label: 'Form Submissions', value: '0', change: '+0%' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border bg-card p-6">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold">{stat.value}</p>
            <p className="mt-1 text-xs text-green-500">{stat.change}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
