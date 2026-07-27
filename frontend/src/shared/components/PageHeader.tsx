interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
}

export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">{title}</h1>
        <p className="mt-3 leading-6" style={{ color: 'var(--muted)' }}>{description}</p>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}
