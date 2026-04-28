export default function SegmentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Segments</h1>
        <a
          href="/segments/new"
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
        >
          New Segment
        </a>
      </div>
      <p className="text-muted-foreground">Create static and dynamic contact segments with filter conditions.</p>
    </div>
  );
}
