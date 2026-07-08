// AuthLayout.tsx — shared wrapper
export default function AuthLayout({
    title,
    subtitle,
    children,
  }: {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
  }) {
    return (
      <div className="flex min-h-full flex-1 items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-black sm:px-6">
        <div className="w-full max-w-md rounded-2xl border border-black/[.08] bg-white p-6 shadow-sm dark:border-white/[.145] dark:bg-zinc-950 sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{subtitle}</p>
          )}
          <div className="mt-6">{children}</div>
        </div>
      </div>
    );
  }