"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { clampStockValue } from "@/lib/stock";

function readStockValue(formData: FormData, key: string) {
  return clampStockValue(Number(formData.get(key) ?? 0));
}

export async function createHotel(formData: FormData) {
  const hotelName = String(formData.get("hotelName") ?? "").trim();
  const contactEmail = String(formData.get("contactEmail") ?? "").trim();

  if (!hotelName || !contactEmail) {
    redirect("/hotels/new?error=Hotel%20name%20and%20contact%20email%20are%20required");
  }

  const hotel = await prisma.hotel.create({
    data: {
      hotelName,
      contactEmail,
      originalProductStock: readStockValue(formData, "originalProductStock"),
      currentProductStock: readStockValue(formData, "currentProductStock"),
      originalSampleStock: readStockValue(formData, "originalSampleStock"),
      currentSampleStock: readStockValue(formData, "currentSampleStock"),
    },
  });

  revalidatePath("/hotels");
  redirect(`/hotels/${hotel.id}`);
}

export async function updateHotel(formData: FormData) {
  const hotelId = String(formData.get("hotelId") ?? "");
  const hotelName = String(formData.get("hotelName") ?? "").trim();
  const contactEmail = String(formData.get("contactEmail") ?? "").trim();

  if (!hotelId || !hotelName || !contactEmail) {
    redirect(`/hotels/${hotelId}?error=Hotel%20name%20and%20contact%20email%20are%20required`);
  }

  await prisma.hotel.update({
    where: { id: hotelId },
    data: {
      hotelName,
      contactEmail,
      originalProductStock: readStockValue(formData, "originalProductStock"),
      currentProductStock: readStockValue(formData, "currentProductStock"),
      originalSampleStock: readStockValue(formData, "originalSampleStock"),
      currentSampleStock: readStockValue(formData, "currentSampleStock"),
    },
  });

  revalidatePath("/hotels");
  revalidatePath(`/hotels/${hotelId}`);
  redirect(`/hotels/${hotelId}`);
}
