import { updateEmailTemplate } from "@/app/actions/emailTemplates";
import { prisma } from "@/lib/db";
import { DEFAULT_EMAIL_CONFIGS } from "@/lib/emailConfig";

export const dynamic = "force-dynamic";

async function ensureEmailConfigs() {
  for (const config of DEFAULT_EMAIL_CONFIGS) {
    await prisma.emailTemplate.upsert({
      where: { type: config.type },
      create: {
        type: config.type,
        label: config.label,
        subject: config.subject,
        body: config.body,
      },
      update: {
        label: config.label,
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
}

export default async function EmailTemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await ensureEmailConfigs();
  const { error } = await searchParams;
  const templates = await prisma.emailTemplate.findMany({
    orderBy: { label: "asc" },
  });
  const schedules = await prisma.emailSchedule.findMany();
  const scheduleByType = new Map(schedules.map((schedule) => [schedule.templateType, schedule]));

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h1>Email Templates</h1>
          <p className="muted">Configure simulated follow-up emails and frequency.</p>
        </div>
      </div>

      {error ? <div className="notice">{error}</div> : null}

      <div className="grid">
        {templates.map((template) => (
          <form action={updateEmailTemplate} className="panel form" key={template.id}>
            <input type="hidden" name="type" value={template.type} />
            <h2>{template.label}</h2>
            <div className="field">
              <label htmlFor={`${template.type}-subject`}>Subject</label>
              <input
                id={`${template.type}-subject`}
                name="subject"
                defaultValue={template.subject}
                required
              />
            </div>
            <div className="field">
              <label htmlFor={`${template.type}-body`}>Body</label>
              <textarea id={`${template.type}-body`} name="body" defaultValue={template.body} required />
            </div>
            <div className="field">
              <label htmlFor={`${template.type}-frequency`}>Frequency in days</label>
              <input
                id={`${template.type}-frequency`}
                name="frequencyDays"
                type="number"
                min="1"
                defaultValue={scheduleByType.get(template.type)?.frequencyDays ?? 7}
                required
              />
            </div>
            <div className="form-actions">
              <button type="submit">Save template</button>
            </div>
          </form>
        ))}
      </div>
    </div>
  );
}
