export default function FormsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Forms</h1>
        <a
          href="/forms/new"
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
        >
          New Form
        </a>
      </div>
      <p className="text-muted-foreground">Build drag-and-drop forms to capture leads and gather data.</p>
    </div>
  );
}
