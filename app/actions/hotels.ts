"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { nonNegativeInteger, requiredText, validEmail } from "@/lib/validation";

function readHotel(formData: FormData) {
  const originalProductStock = nonNegativeInteger(
    formData.get("originalProductStock"),
    "Original product stock",
  );
  const currentProductStock = nonNegativeInteger(
    formData.get("currentProductStock"),
    "Current product stock",
  );
  const originalSampleStock = nonNegativeInteger(
    formData.get("originalSampleStock"),
    "Original sample stock",
  );
  const currentSampleStock = nonNegativeInteger(
    formData.get("currentSampleStock"),
    "Current sample stock",
  );

  if (currentProductStock > originalProductStock || currentSampleStock > originalSampleStock) {
    throw new Error("Current stock cannot be greater than original stock.");
  }

  return {
    hotelName: requiredText(formData.get("hotelName"), "Hotel name", 200),
    contactEmail: validEmail(formData.get("contactEmail"), "Contact email"),
    originalProductStock,
    currentProductStock,
    originalSampleStock,
    currentSampleStock,
  };
}

export async function createHotel(formData: FormData) {
  let data: ReturnType<typeof readHotel>;
  try {
    data = readHotel(formData);
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "Hotel details are invalid.";
    redirect(`/hotels/new?error=${encodeURIComponent(message)}`);
  }

  const hotel = await prisma.hotel.create({ data });
  revalidatePath("/");
  revalidatePath("/hotels");
  redirect(`/hotels/${hotel.id}`);
}

export async function updateHotel(formData: FormData) {
  const hotelId = String(formData.get("hotelId") ?? "").trim();
  if (!hotelId) redirect("/hotels");

  let data: ReturnType<typeof readHotel>;
  try {
    data = readHotel(formData);
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "Hotel details are invalid.";
    redirect(`/hotels/${hotelId}?error=${encodeURIComponent(message)}`);
  }

  await prisma.$transaction(async (tx) => {
    const existing = await tx.hotel.findUnique({ where: { id: hotelId } });
    if (!existing) throw new Error("Hotel was not found.");

    await tx.hotel.update({ where: { id: hotelId }, data });
    const productDelta = data.currentProductStock - existing.currentProductStock;
    const sampleDelta = data.currentSampleStock - existing.currentSampleStock;

    if (productDelta !== 0) {
      await tx.stockEvent.create({
        data: {
          hotelId,
          eventType: "MANUAL_PRODUCT_ADJUSTMENT",
          quantity: productDelta,
          reason: `Manual product stock adjustment (${existing.currentProductStock} → ${data.currentProductStock}).`,
        },
      });
    }

    if (sampleDelta !== 0) {
      await tx.stockEvent.create({
        data: {
          hotelId,
          eventType: "MANUAL_SAMPLE_ADJUSTMENT",
          quantity: sampleDelta,
          reason: `Manual sample stock adjustment (${existing.currentSampleStock} → ${data.currentSampleStock}).`,
        },
      });
    }
  });
  revalidatePath("/");
  revalidatePath("/hotels");
  revalidatePath(`/hotels/${hotelId}`);
  redirect(`/hotels/${hotelId}`);
}
