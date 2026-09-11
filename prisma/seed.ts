import { PrismaClient } from "@prisma/client";
import { DEFAULT_EMAIL_CONFIGS, serializeTriggerStatuses } from "../lib/emailConfig";

const prisma = new PrismaClient();

async function main() {
  for (const config of DEFAULT_EMAIL_CONFIGS) {
    await prisma.emailTemplate.upsert({
      where: { type: config.type },
      create: {
        type: config.type,
        label: config.label,
        subject: config.subject,
        body: config.body,
        frequencyDays: config.frequencyDays,
        triggerStatuses: serializeTriggerStatuses(config.triggerStatuses),
        isDefault: true,
        isActive: true,
      },
      update: {
        label: config.label,
        frequencyDays: config.frequencyDays,
        triggerStatuses: serializeTriggerStatuses(config.triggerStatuses),
        isDefault: true,
      },
    });

    await prisma.emailSchedule.upsert({
      where: { templateType: config.type },
      create: {
        templateType: config.type,
        frequencyDays: config.frequencyDays,
      },
      update: {},
    });
  }

  const shouldSeedDemoData =
    process.env.SEED_DEMO_DATA === "true" || process.env.NODE_ENV !== "production";
  const existingHotels = shouldSeedDemoData ? await prisma.hotel.count() : 1;

  if (existingHotels === 0) {
    const hotel = await prisma.hotel.create({
      data: {
        hotelName: "Hotel Lumiere",
        contactEmail: "reception@hotel-lumiere.example",
        originalProductStock: 12,
        currentProductStock: 12,
        originalSampleStock: 40,
        currentSampleStock: 40,
      },
    });

    await prisma.opportunity.create({
      data: {
        hotelId: hotel.id,
        status: "OPPORTUNITY",
        roomLabel: "Room 204",
        notes: "Sample placed during initial POC setup.",
      },
    });

    await prisma.hotel.create({
      data: {
        hotelName: "Maison Verde",
        contactEmail: "frontdesk@maison-verde.example",
        originalProductStock: 8,
        currentProductStock: 5,
        originalSampleStock: 30,
        currentSampleStock: 12,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
