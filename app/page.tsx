import { Fragment } from "react";
import Link from "next/link";
import { transitionOpportunity } from "@/app/actions/opportunities";
import { prisma } from "@/lib/db";
import { calculateStockStatus } from "@/lib/stock";
import { ACTIVE_STATUSES, formatStatus, getNextStatuses } from "@/lib/statusLifecycle";

export const dynamic = "force-dynamic";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const hotels = await prisma.hotel.findMany({
    include: {
      opportunities: {
        where: { status: { in: ACTIVE_STATUSES } },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { hotelName: "asc" },
  });

  const activeRowCount = hotels.reduce((count, hotel) => count + hotel.opportunities.length, 0);

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h1>Active Hotel Rows</h1>
          <p className="muted">Open sample opportunities grouped by hotel.</p>
        </div>
        <Link href="/hotels/new" className="button">
          Create hotel
        </Link>
      </div>

      {error ? <div className="notice">{error}</div> : null}

      <section className="grid two">
        <div className="panel metric">
          <span>Hotels</span>
          <strong>{hotels.length}</strong>
        </div>
        <div className="panel metric">
          <span>Active Rows</span>
          <strong>{activeRowCount}</strong>
        </div>
      </section>

      <section className="table-wrap hotel-dashboard">
        <table className="hotel-table">
          <thead>
            <tr>
              <th>Contact</th>
              <th>Stock Status</th>
              <th>Product Stock</th>
              <th>Sample Stock</th>
              <th>Active Rows</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {hotels.map((hotel) => {
              const stockStatus = calculateStockStatus(hotel);

              return (
                <Fragment key={hotel.id}>
                  <tr className="hotel-title-row">
                    <td colSpan={6}>
                      <div className="hotel-title-content">
                        <Link href={`/hotels/${hotel.id}`} className="subtle-link">
                          {hotel.hotelName}
                        </Link>
                        <span>{hotel.contactEmail}</span>
                      </div>
                    </td>
                  </tr>
                  <tr className="hotel-object-row">
                    <td>{hotel.contactEmail}</td>
                    <td>
                      <span className={`badge ${stockStatus.tone}`}>
                        {stockStatus.label} ({stockStatus.percentRemaining}%)
                      </span>
                    </td>
                    <td>
                      <span className="stock-count">
                        {hotel.currentProductStock} / {hotel.originalProductStock}
                      </span>
                    </td>
                    <td>
                      <span className="stock-count">
                        {hotel.currentSampleStock} / {hotel.originalSampleStock}
                      </span>
                    </td>
                    <td>{hotel.opportunities.length}</td>
                    <td>
                      <Link href={`/hotels/${hotel.id}`} className="button secondary">
                        View hotel
                      </Link>
                    </td>
                  </tr>
                  <tr className="opportunity-subrow">
                    <td colSpan={6}>
                      <div className="subtable-shell">
                        <div className="subtable-title">
                          <span>Opportunity Rows</span>
                          <span>{hotel.opportunities.length} open</span>
                        </div>
                        <div className="table-wrap compact nested">
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
                              {hotel.opportunities.map((row) => (
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
                                          <input
                                            type="hidden"
                                            name="opportunityId"
                                            value={row.id}
                                          />
                                          <input
                                            type="hidden"
                                            name="nextStatus"
                                            value={nextStatus}
                                          />
                                          <input type="hidden" name="returnTo" value="/" />
                                          <button
                                            type="submit"
                                            className={
                                              nextStatus === "FAIL" ? "danger" : "secondary"
                                            }
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
                          {hotel.opportunities.length === 0 ? (
                            <div className="empty">No active rows for this hotel.</div>
                          ) : null}
                        </div>
                      </div>
                    </td>
                  </tr>
                </Fragment>
              );
            })}
          </tbody>
        </table>
        {hotels.length === 0 ? <div className="empty">No hotels yet.</div> : null}
      </section>
    </div>
  );
}
