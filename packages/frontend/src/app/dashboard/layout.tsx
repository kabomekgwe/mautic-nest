import Link from 'next/link';

const navItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Contacts', href: '/contacts' },
  { label: 'Segments', href: '/segments' },
  { label: 'Campaigns', href: '/campaigns' },
  { label: 'Emails', href: '/emails' },
  { label: 'Forms', href: '/forms' },
  { label: 'Pages', href: '/pages' },
  { label: 'Reports', href: '/reports' },
  { label: 'Settings', href: '/settings' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <aside className="w-64 border-r bg-card p-4">
        <div className="mb-8">
          <h2 className="text-xl font-bold">Mautic-Nest</h2>
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
}
