import { sendSuggestedEmails } from "@/app/actions/automation";
import { prisma } from "@/lib/db";
import { getEmailSettings } from "@/lib/emailTransport";

export const dynamic = "force-dynamic";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function statusTone(status: string) {
  if (status === "SENT") {
    return "green";
  }

  if (status === "FAILED") {
    return "red";
  }

  return "amber";
}

function formatOptionalDate(date: Date | null) {
  return date ? formatDate(date) : "-";
}

export default async function EmailLogsPage({
  searchParams,
}: {
  searchParams: Promise<{
    eligible?: string;
    due?: string;
    skipped?: string;
    sent?: string;
    failed?: string;
    mode?: string;
    error?: string;
  }>;
}) {
  const { eligible, due, skipped, sent, failed, mode, error } = await searchParams;
  const settings = getEmailSettings();
  const logs = await prisma.emailLog.findMany({
    include: {
      hotel: {
        select: {
          hotelName: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h1>Email Log</h1>
          <p className="muted">
            Run contextual follow-ups and inspect the last 200 CRM-generated messages.
          </p>
        </div>
        <form action={sendSuggestedEmails}>
          <button type="submit">
            {settings.mode === "test" ? "Send Test Emails" : "Run Due Emails"}
          </button>
        </form>
      </div>

      {error ? <div className="notice">{error}</div> : null}
      {sent ? (
        <div className="notice">
          Mode: {(mode || settings.mode).toUpperCase()}. Eligible: {eligible || 0}. Due: {due || 0}.
          Skipped: {skipped || 0}. Sent: {sent}. Failed: {failed || 0}.
        </div>
      ) : null}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Created</th>
              <th>Hotel</th>
              <th>Template</th>
              <th>Recipient</th>
              <th>Mode</th>
              <th>Subject</th>
              <th>Status</th>
              <th>Sent At</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td>{formatDate(log.createdAt)}</td>
                <td>{log.hotel.hotelName}</td>
                <td>{log.templateLabel}</td>
                <td>{log.recipientEmail}</td>
                <td>
                  <span className={`badge ${log.deliveryMode === "LIVE" ? "green" : "amber"}`}>
                    {log.deliveryMode}
                  </span>
                  {log.intendedRecipientEmail && log.intendedRecipientEmail !== log.recipientEmail ? (
                    <small className="table-note">Intended: {log.intendedRecipientEmail}</small>
                  ) : null}
                </td>
                <td>{log.subject}</td>
                <td>
                  <span className={`badge ${statusTone(log.status)}`}>{log.status}</span>
                </td>
                <td>{formatOptionalDate(log.sentAt)}</td>
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
              {log.hotel.hotelName} / {log.templateLabel} / attempt {log.attemptCount}
            </p>
            {log.errorMessage ? <p className="error-text">{log.errorMessage}</p> : null}
            <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>{log.body}</pre>
          </article>
        ))}
      </div>
    </div>
  );
}
