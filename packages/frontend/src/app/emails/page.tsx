export default function EmailsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Emails</h1>
        <a
          href="/emails/new"
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
        >
          New Email
        </a>
      </div>
      <p className="text-muted-foreground">Design and send marketing emails with drag-and-drop builder.</p>
    </div>
  );
}
