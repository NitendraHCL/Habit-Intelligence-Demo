interface PageWrapperProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function PageWrapper({ title, subtitle, children }: PageWrapperProps) {
  return (
    <div className="animate-fade-in space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight font-[var(--font-inter)]">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  );
}
