export default async function PromotionsPage() {
  return (
    <section className="rounded-lg border bg-background p-4 shadow-sm">
      <h1 className="text-lg font-semibold">Promotions</h1>
      <p className="mb-4 text-sm text-muted-foreground">Preview-mode promotions center with static campaign cards.</p>
      <div className="grid gap-3 md:grid-cols-3">
        <article className="rounded-md border p-3 text-sm">
          <p className="font-medium">Welcome Cashback</p>
          <p className="text-muted-foreground">Status: Draft</p>
        </article>
        <article className="rounded-md border p-3 text-sm">
          <p className="font-medium">March Volume Bonus</p>
          <p className="text-muted-foreground">Status: Active</p>
        </article>
        <article className="rounded-md border p-3 text-sm">
          <p className="font-medium">IB Referral Sprint</p>
          <p className="text-muted-foreground">Status: Scheduled</p>
        </article>
      </div>
    </section>
  );
}
