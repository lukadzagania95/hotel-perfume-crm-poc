import Link from "next/link";
import { prisma } from "@/lib/db";
import { calculateStockStatus } from "@/lib/stock";
import { ACTIVE_STATUSES } from "@/lib/statusLifecycle";

export const dynamic = "force-dynamic";

export default async function HotelsPage() {
  const hotels = await prisma.hotel.findMany({
    include: {
      opportunities: {
        select: { status: true },
      },
    },
    orderBy: { hotelName: "asc" },
  });

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h1>Hotels</h1>
          <p className="muted">Track hotel stock, sample rows, and follow-up state.</p>
        </div>
        <Link href="/hotels/new" className="button">
          Create hotel
        </Link>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Hotel</th>
              <th>Contact</th>
              <th>Product Stock</th>
              <th>Sample Stock</th>
              <th>Status</th>
              <th>Active Rows</th>
            </tr>
          </thead>
          <tbody>
            {hotels.map((hotel) => {
              const stockStatus = calculateStockStatus(hotel);
              const activeRows = hotel.opportunities.filter((opportunity) =>
                ACTIVE_STATUSES.includes(opportunity.status),
              ).length;

              return (
                <tr key={hotel.id}>
                  <td>
                    <Link href={`/hotels/${hotel.id}`} className="subtle-link">
                      {hotel.hotelName}
                    </Link>
                  </td>
                  <td>{hotel.contactEmail}</td>
                  <td>
                    {hotel.currentProductStock} / {hotel.originalProductStock}
                  </td>
                  <td>
                    {hotel.currentSampleStock} / {hotel.originalSampleStock}
                  </td>
                  <td>
                    <span className={`badge ${stockStatus.tone}`}>
                      {stockStatus.label} ({stockStatus.percentRemaining}%)
                    </span>
                  </td>
                  <td>{activeRows}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {hotels.length === 0 ? <div className="empty">No hotels yet.</div> : null}
      </div>
    </div>
  );
}
