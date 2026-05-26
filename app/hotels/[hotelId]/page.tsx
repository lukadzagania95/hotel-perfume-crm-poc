import Link from "next/link";
import { notFound } from "next/navigation";
import { updateHotel } from "@/app/actions/hotels";
import { createOpportunity, transitionOpportunity } from "@/app/actions/opportunities";
import { prisma } from "@/lib/db";
import { calculateStockStatus } from "@/lib/stock";
import {
  ACTIVE_STATUSES,
  CLOSED_STATUSES,
  formatStatus,
  getNextStatuses,
} from "@/lib/statusLifecycle";

export const dynamic = "force-dynamic";

function formatDate(date: Date | null) {
  if (!date) {
    return "-";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function HotelDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ hotelId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { hotelId } = await params;
  const { error } = await searchParams;
  const hotel = await prisma.hotel.findUnique({
    where: { id: hotelId },
    include: {
      opportunities: {
        orderBy: { createdAt: "desc" },
      },
      stockEvents: {
        orderBy: { createdAt: "desc" },
        take: 8,
      },
    },
  });

  if (!hotel) {
    notFound();
  }

  const stockStatus = calculateStockStatus(hotel);
  const activeRows = hotel.opportunities.filter((row) => ACTIVE_STATUSES.includes(row.status));
  const closedRows = hotel.opportunities.filter((row) => CLOSED_STATUSES.includes(row.status));

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h1>{hotel.hotelName}</h1>
          <p className="muted">{hotel.contactEmail}</p>
        </div>
        <Link href="/hotels" className="button secondary">
          Back to hotels
        </Link>
      </div>

      {error ? <div className="notice">{error}</div> : null}

      <section className="grid three">
        <div className="panel metric">
          <span>Stock Status</span>
          <strong>
            <span className={`badge ${stockStatus.tone}`}>
              {stockStatus.label} ({stockStatus.percentRemaining}%)
            </span>
          </strong>
        </div>
        <div className="panel metric">
          <span>Product Stock</span>
          <strong>
            {hotel.currentProductStock} / {hotel.originalProductStock}
          </strong>
        </div>
        <div className="panel metric">
          <span>Sample Stock</span>
          <strong>
            {hotel.currentSampleStock} / {hotel.originalSampleStock}
          </strong>
        </div>
      </section>

      <section className="panel">
        <h2>Edit Hotel</h2>
        <form action={updateHotel} className="form" style={{ marginTop: 14 }}>
          <input type="hidden" name="hotelId" value={hotel.id} />
          <div className="grid two">
            <div className="field">
              <label htmlFor="hotelName">Hotel Name</label>
              <input id="hotelName" name="hotelName" defaultValue={hotel.hotelName} required />
            </div>
            <div className="field">
              <label htmlFor="contactEmail">Contact Email</label>
              <input
                id="contactEmail"
                name="contactEmail"
                type="email"
                defaultValue={hotel.contactEmail}
                required
              />
            </div>
          </div>
          <div className="grid two">
            <div className="field">
              <label htmlFor="originalProductStock">Original Product Stock</label>
              <input
                id="originalProductStock"
                name="originalProductStock"
                type="number"
                min="0"
                defaultValue={hotel.originalProductStock}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="currentProductStock">Current Product Stock</label>
              <input
                id="currentProductStock"
                name="currentProductStock"
                type="number"
                min="0"
                defaultValue={hotel.currentProductStock}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="originalSampleStock">Original Sample Stock</label>
              <input
                id="originalSampleStock"
                name="originalSampleStock"
                type="number"
                min="0"
                defaultValue={hotel.originalSampleStock}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="currentSampleStock">Current Sample Stock</label>
              <input
                id="currentSampleStock"
                name="currentSampleStock"
                type="number"
                min="0"
                defaultValue={hotel.currentSampleStock}
                required
              />
            </div>
          </div>
          <div className="form-actions">
            <button type="submit">Save hotel</button>
          </div>
        </form>
      </section>

      <section className="panel">
        <h2>Create Opportunity Row</h2>
        <form action={createOpportunity} className="form" style={{ marginTop: 14 }}>
          <input type="hidden" name="hotelId" value={hotel.id} />
          <div className="grid two">
            <div className="field">
              <label htmlFor="roomLabel">Room / Reference</label>
              <input id="roomLabel" name="roomLabel" placeholder="Room 204" />
            </div>
            <div className="field">
              <label htmlFor="notes">Notes</label>
              <input id="notes" name="notes" placeholder="Sample placed by reception" />
            </div>
          </div>
          <div className="form-actions">
            <button type="submit">Add Opportunity</button>
          </div>
        </form>
      </section>

      <section className="stack">
        <h2>Active Rows</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Room / Reference</th>
                <th>Status</th>
                <th>Created</th>
                <th>Notes</th>
                <th>Next Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeRows.map((row) => (
                <tr key={row.id}>
                  <td>{row.roomLabel || "-"}</td>
                  <td>
                    <span className="badge amber">{formatStatus(row.status)}</span>
                  </td>
                  <td>{formatDate(row.createdAt)}</td>
                  <td>{row.notes || "-"}</td>
                  <td>
                    <div className="inline-actions">
                      {getNextStatuses(row.status).map((nextStatus) => (
                        <form action={transitionOpportunity} key={nextStatus}>
                          <input type="hidden" name="hotelId" value={hotel.id} />
                          <input type="hidden" name="opportunityId" value={row.id} />
                          <input type="hidden" name="nextStatus" value={nextStatus} />
                          <button
                            type="submit"
                            className={nextStatus === "FAIL" ? "danger" : "secondary"}
                          >
                            Move to {formatStatus(nextStatus)}
                          </button>
                        </form>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {activeRows.length === 0 ? <div className="empty">No active rows.</div> : null}
        </div>
      </section>

      <section className="stack">
        <h2>Closed Rows</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Room / Reference</th>
                <th>Status</th>
                <th>Closed At</th>
                <th>Sample Deducted</th>
                <th>Product Deducted</th>
              </tr>
            </thead>
            <tbody>
              {closedRows.map((row) => (
                <tr key={row.id}>
                  <td>{row.roomLabel || "-"}</td>
                  <td>
                    <span className={`badge ${row.status === "SALE" ? "green" : "slate"}`}>
                      {formatStatus(row.status)}
                    </span>
                  </td>
                  <td>{formatDate(row.productSoldAt ?? row.failedAt)}</td>
                  <td>{row.sampleStockDeducted ? "Yes" : "No"}</td>
                  <td>{row.productStockDeducted ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {closedRows.length === 0 ? <div className="empty">No closed rows.</div> : null}
        </div>
      </section>

      <section className="stack">
        <h2>Recent Stock Events</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Quantity</th>
                <th>Reason</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {hotel.stockEvents.map((event) => (
                <tr key={event.id}>
                  <td>{event.eventType}</td>
                  <td>{event.quantity}</td>
                  <td>{event.reason}</td>
                  <td>{formatDate(event.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {hotel.stockEvents.length === 0 ? (
            <div className="empty">No stock deductions yet.</div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
