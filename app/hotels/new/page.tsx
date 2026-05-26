import Link from "next/link";
import { createHotel } from "@/app/actions/hotels";

export default async function NewHotelPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h1>Create Hotel</h1>
          <p className="muted">Add the parent hotel record and starting stock values.</p>
        </div>
        <Link href="/hotels" className="button secondary">
          Back to hotels
        </Link>
      </div>

      {error ? <div className="notice">{error}</div> : null}

      <form action={createHotel} className="panel form">
        <div className="grid two">
          <div className="field">
            <label htmlFor="hotelName">Hotel Name</label>
            <input id="hotelName" name="hotelName" required />
          </div>
          <div className="field">
            <label htmlFor="contactEmail">Contact Email</label>
            <input id="contactEmail" name="contactEmail" type="email" required />
          </div>
        </div>

        <div className="grid two">
          <div className="field">
            <label htmlFor="originalProductStock">Original Product Stock</label>
            <input id="originalProductStock" name="originalProductStock" type="number" min="0" required />
          </div>
          <div className="field">
            <label htmlFor="currentProductStock">Current Product Stock</label>
            <input id="currentProductStock" name="currentProductStock" type="number" min="0" required />
          </div>
          <div className="field">
            <label htmlFor="originalSampleStock">Original Sample Stock</label>
            <input id="originalSampleStock" name="originalSampleStock" type="number" min="0" required />
          </div>
          <div className="field">
            <label htmlFor="currentSampleStock">Current Sample Stock</label>
            <input id="currentSampleStock" name="currentSampleStock" type="number" min="0" required />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit">Create hotel</button>
        </div>
      </form>
    </div>
  );
}
