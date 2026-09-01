import Link from "next/link";

export default function NotFound() {
  return (
    <main className="site-shell">
      <section className="content-section">
        <p className="eyebrow">404 / Not found</p>
        <h1>This page wandered off.</h1>
        <Link className="text-link" href="/">
          Return home →
        </Link>
      </section>
    </main>
  );
}
