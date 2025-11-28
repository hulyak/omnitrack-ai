export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface dark:bg-zinc-900">
      <div className="max-w-md rounded-lg bg-white p-8 text-center shadow-lg dark:bg-zinc-800">
        <h1 className="mb-4 text-3xl font-bold text-error dark:text-error">Access Denied</h1>
        <p className="mb-6 text-text-secondary dark:text-zinc-400">
          You do not have permission to access this resource.
        </p>
        <a
          href="/dashboard"
          className="inline-block rounded-md bg-primary px-6 py-2 text-white hover:bg-primary-hover"
        >
          Return to Dashboard
        </a>
      </div>
    </div>
  );
}
