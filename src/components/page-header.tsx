export function PageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-10 space-y-2">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
      {description && <p className="text-base text-muted-foreground">{description}</p>}
    </div>
  )
}
