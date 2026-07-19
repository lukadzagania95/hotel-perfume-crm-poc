import { checkIncomingInbox } from "@/app/actions/incomingEmails";
import { prisma } from "@/lib/db";
import { getEmailSettings } from "@/lib/emailTransport";
import { intentLabel } from "@/lib/incomingEmailRules";

export const dynamic = "force-dynamic";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function statusTone(status: string) {
  if (status === "APPLIED") {
    return "green";
  }

  if (status === "ERROR") {
    return "red";
  }

  return "amber";
}

export default async function IncomingEmailsPage({
  searchParams,
}: {
  searchParams: Promise<{
    scanned?: string;
    contextual?: string;
    applied?: string;
    review?: string;
    errors?: string;
    error?: string;
  }>;
}) {
  const params = await searchParams;
  const settings = getEmailSettings();
  const incomingEmails = await prisma.incomingEmail.findMany({
    include: {
      hotel: {
        select: {
          hotelName: true,
        },
      },
      opportunity: {
        select: {
          roomLabel: true,
          status: true,
        },
      },
    },
    orderBy: { receivedAt: "desc" },
    take: 50,
  });

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h1>Incoming Emails</h1>
          <p className="muted">
            Check {settings.imap.user || "the configured mailbox"} for contextual replies.
            Trusted single-room updates are applied; everything else is held for review.
          </p>
        </div>
        <form action={checkIncomingInbox}>
          <button type="submit">Check Inbox</button>
        </form>
      </div>

      {params.error ? <div className="notice">{params.error}</div> : null}
      {params.scanned ? (
        <div className="notice">
          Scanned {params.scanned} unread email(s). Contextual: {params.contextual || 0}. Applied:{" "}
          {params.applied || 0}. Needs review: {params.review || 0}. Errors: {params.errors || 0}.
        </div>
      ) : null}

      <section className="panel">
        <h2>Demo Reply Examples</h2>
        <div className="example-list">
          <code>We placed a sample in room 777.</code>
          <code>The guest used the sample in room 777.</code>
          <code>Room 777 bought the perfume.</code>
          <code>Room 777 checked out without buying.</code>
        </div>
      </section>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Received</th>
              <th>Hotel</th>
              <th>From</th>
              <th>Intent</th>
              <th>Status</th>
              <th>Room</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {incomingEmails.map((email) => (
              <tr key={email.id}>
                <td>{formatDate(email.receivedAt)}</td>
                <td>{email.hotel.hotelName}</td>
                <td>{email.fromEmail}</td>
                <td>{intentLabel(email.intent)}</td>
                <td>
                  <span className={`badge ${statusTone(email.status)}`}>{email.status}</span>
                </td>
                <td>{email.roomLabel || email.opportunity?.roomLabel || "-"}</td>
                <td>{email.errorMessage || email.actionSummary}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {incomingEmails.length === 0 ? (
          <div className="empty">No contextual incoming email replies processed yet.</div>
        ) : null}
      </div>

      <div className="grid">
        {incomingEmails.map((email) => (
          <article className="panel" key={`${email.id}-body`}>
            <h3>{email.subject}</h3>
            <p className="muted">
              {email.hotel.hotelName} / {intentLabel(email.intent)}
            </p>
            <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>{email.body}</pre>
          </article>
        ))}
      </div>
    </div>
  );
}
