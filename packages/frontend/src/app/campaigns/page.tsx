export default function CampaignsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Campaigns</h1>
        <a
          href="/campaigns/new"
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
        >
          New Campaign
        </a>
      </div>
      <p className="text-muted-foreground">
        Create and manage marketing automation campaigns with the visual builder.
      </p>
      <div className="rounded-lg border p-8 text-center text-muted-foreground">
        Campaign list will appear here
      </div>
    </div>
  );
}
