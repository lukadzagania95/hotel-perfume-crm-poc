type LoginPageProps = {
  searchParams: Promise<{ error?: string; next?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath = params.next?.startsWith("/") && !params.next.startsWith("//") ? params.next : "/";

  return (
    <section className="login-wrap">
      <div className="login-card">
        <div>
          <p className="login-eyebrow">Secure access</p>
          <h1>Sign in to HOC CRM</h1>
          <p className="muted">Enter the administrator credentials for this workspace.</p>
        </div>
        {params.error ? (
          <p className="login-error" role="alert">
            The username or password is incorrect.
          </p>
        ) : null}
        <form action="/api/auth/login" method="post" className="login-form">
          <input type="hidden" name="next" value={nextPath} />
          <label>
            Username
            <input name="username" autoComplete="username" required autoFocus />
          </label>
          <label>
            Password
            <input name="password" type="password" autoComplete="current-password" required />
          </label>
          <button type="submit">Sign in</button>
        </form>
      </div>
    </section>
  );
}
