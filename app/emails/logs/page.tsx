import { simulateEmailAutomation } from "@/app/actions/automation";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function EmailLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  const { created } = await searchParams;
  const logs = await prisma.emailLog.findMany({
    include: {
      hotel: {
        select: {
          hotelName: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h1>Email Log</h1>
          <p className="muted">Generate and inspect simulated follow-up emails. No emails are sent.</p>
        </div>
        <form action={simulateEmailAutomation}>
          <button type="submit">Generate Suggested Emails</button>
        </form>
      </div>

      {created ? <div className="notice">Created {created} simulated email log(s).</div> : null}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Created</th>
              <th>Hotel</th>
              <th>Template</th>
              <th>Recipient</th>
              <th>Subject</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td>{formatDate(log.createdAt)}</td>
                <td>{log.hotel.hotelName}</td>
                <td>{log.templateLabel}</td>
                <td>{log.recipientEmail}</td>
                <td>{log.subject}</td>
                <td>
                  <span className="badge green">{log.status === "SIMULATED" ? "Simulated" : "Draft"}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 ? <div className="empty">No email logs yet.</div> : null}
      </div>

      <div className="grid">
        {logs.map((log) => (
          <article className="panel" key={`${log.id}-body`}>
            <h3>{log.subject}</h3>
            <p className="muted">
              {log.hotel.hotelName} / {log.templateLabel}
            </p>
            <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>{log.body}</pre>
          </article>
        ))}
      </div>
    </div>
  );
}
