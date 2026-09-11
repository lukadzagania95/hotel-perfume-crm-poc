import { createEmailTemplate, updateEmailTemplate } from "@/app/actions/emailTemplates";
import { prisma } from "@/lib/db";
import {
  parseTriggerStatuses,
  TEMPLATE_STATUS_OPTIONS,
} from "@/lib/emailConfig";

export const dynamic = "force-dynamic";

export default async function EmailTemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const templates = await prisma.emailTemplate.findMany({
    orderBy: [{ isDefault: "desc" }, { label: "asc" }],
  });

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h1>Email Templates</h1>
          <p className="muted">Configure follow-up email copy and frequency.</p>
        </div>
      </div>

      {error ? <div className="notice">{error}</div> : null}

      <details className="panel">
        <summary className="section-summary">Add Template</summary>
        <form action={createEmailTemplate} className="form" style={{ marginTop: 14 }}>
          <div className="grid two">
            <div className="field">
              <label htmlFor="new-template-label">Template Name</label>
              <input
                id="new-template-label"
                name="label"
                placeholder="Low stock follow-up"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="new-template-frequency">Frequency in days</label>
              <input
                id="new-template-frequency"
                name="frequencyDays"
                type="number"
                min="1"
                defaultValue={7}
                required
              />
            </div>
          </div>
          <div className="field">
            <label htmlFor="new-template-subject">Subject</label>
            <input
              id="new-template-subject"
              name="subject"
              placeholder="Quick update on perfume sample"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="new-template-body">Body</label>
            <textarea
              id="new-template-body"
              name="body"
              placeholder="Hello {{hotelName}},&#10;&#10;Could you update us on the current sample status?&#10;&#10;Thank you."
              required
            />
          </div>
          <fieldset className="field">
            <legend>Send when hotel has opportunity status</legend>
            <div className="checkbox-grid">
              {TEMPLATE_STATUS_OPTIONS.map((option) => (
                <label className="checkbox-label" key={option.value}>
                  <input type="checkbox" name="triggerStatuses" value={option.value} />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <label className="checkbox-label">
            <input type="checkbox" name="isActive" defaultChecked />
            <span>Automation enabled</span>
          </label>
          <div className="form-actions">
            <button type="submit">Create template</button>
          </div>
        </form>
      </details>

      <div className="grid">
        {templates.map((template) => {
          const selectedStatuses = parseTriggerStatuses(template.triggerStatuses);

          return (
            <form action={updateEmailTemplate} className="panel form" key={template.id}>
              <input type="hidden" name="templateId" value={template.id} />
              <div className="template-title-row">
                <h2>{template.label}</h2>
                <span className={`badge ${template.isDefault ? "slate" : "green"}`}>
                  {template.isDefault ? "Default" : "Custom"}
                </span>
              </div>
              <div className="field">
                <label htmlFor={`${template.id}-label`}>Template Name</label>
                <input
                  id={`${template.id}-label`}
                  name="label"
                  defaultValue={template.label}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor={`${template.id}-subject`}>Subject</label>
                <input
                  id={`${template.id}-subject`}
                  name="subject"
                  defaultValue={template.subject}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor={`${template.id}-body`}>Body</label>
                <textarea
                  id={`${template.id}-body`}
                  name="body"
                  defaultValue={template.body}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor={`${template.id}-frequency`}>Frequency in days</label>
                <input
                  id={`${template.id}-frequency`}
                  name="frequencyDays"
                  type="number"
                  min="1"
                  defaultValue={template.frequencyDays}
                  required
                />
              </div>
              <fieldset className="field">
                <legend>Send when hotel has opportunity status</legend>
                <div className="checkbox-grid">
                  {TEMPLATE_STATUS_OPTIONS.map((option) => (
                    <label className="checkbox-label" key={option.value}>
                      <input
                        type="checkbox"
                        name="triggerStatuses"
                        value={option.value}
                        defaultChecked={selectedStatuses.includes(option.value)}
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
                {selectedStatuses.length === 0 ? (
                  <p className="muted">Default placement emails are sent when no active row exists.</p>
                ) : null}
              </fieldset>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="isActive"
                  defaultChecked={template.isActive}
                />
                <span>Automation enabled</span>
              </label>
              <div className="form-actions">
                <button type="submit">Save template</button>
              </div>
            </form>
          );
        })}
      </div>
    </div>
  );
}
