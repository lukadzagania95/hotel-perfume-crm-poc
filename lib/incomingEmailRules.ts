import type { IncomingEmailIntent } from "@prisma/client";

const roomPatterns = [
  /\broom\s*([a-z0-9-]+)/i,
  /\brm\.?\s*([a-z0-9-]+)/i,
  /\bsuite\s*([a-z0-9-]+)/i,
  /\bchambre\s*([a-z0-9-]+)/i,
];

const globalRoomPattern = /\b(?:room|rm\.?|suite|chambre)s?\s*([a-z0-9-]+)/gi;

export function appendHotelToken(subject: string, hotelId: string) {
  if (subject.includes(`[HOC:${hotelId}]`)) {
    return subject;
  }

  return `${subject} [HOC:${hotelId}]`;
}

export function extractHotelIdFromSubject(subject: string) {
  return subject.match(/\[HOC:([a-z0-9]+)\]/i)?.[1] ?? null;
}

export function extractRoomLabel(text: string) {
  for (const pattern of roomPatterns) {
    const match = text.match(pattern);

    if (match?.[1]) {
      return `Room ${match[1].toUpperCase()}`;
    }
  }

  return null;
}

export function extractRoomLabels(text: string) {
  const labels = new Set<string>();
  for (const match of text.matchAll(globalRoomPattern)) {
    if (match[1]) labels.add(`Room ${match[1].toUpperCase()}`);
  }

  const paired = text.match(
    /\b(?:rooms?|suites?|chambres?)\s*([a-z0-9-]+)\s*(?:,|and|&|et)\s*([a-z0-9-]+)/i,
  );
  if (paired?.[1]) labels.add(`Room ${paired[1].toUpperCase()}`);
  if (paired?.[2]) labels.add(`Room ${paired[2].toUpperCase()}`);

  return [...labels];
}

export function extractReplyText(text: string) {
  const reply = text
    .split(/\n(?:On .+ wrote:|Le .+ a écrit\s*:|-{2,}\s*Original Message\s*-{2,})/i)[0]
    .split("\n")
    .filter((line) => !line.trimStart().startsWith(">"))
    .join("\n")
    .trim();

  return reply || text.trim();
}

export function classifyIncomingEmail(text: string): IncomingEmailIntent {
  const normalized = text.toLowerCase();

  if (
    /\b(no purchase|did not buy|didn't buy|without buying|without purchasing|checked out)\b/.test(
      normalized,
    ) ||
    /\b(sans achat|sans acheter|n'a pas achet|na pas achet|pas achet|parti sans acheter|partie sans acheter|départ sans achat|depart sans achat)\b/.test(
      normalized,
    )
  ) {
    return "GUEST_CHECKED_OUT";
  }

  if (
    /\b(bought|purchased|purchase made|sold|sale|guest bought|guest purchased)\b/.test(
      normalized,
    ) ||
    /\b(a achet|acheté|achetée|achetes|achetés|achat|a pris le parfum|vente|vendu|client a achet|cliente a achet)\b/.test(
      normalized,
    )
  ) {
    return "PRODUCT_PURCHASED";
  }

  if (
    /\b(used the sample|sample was used|tried the sample|opened the sample|guest used)\b/.test(
      normalized,
    ) ||
    /\b(a utilisé l'échantillon|a utilise l'echantillon|échantillon utilisé|echantillon utilise|a essayé l'échantillon|a essaye l'echantillon|client a utilisé|cliente a utilisé)\b/.test(
      normalized,
    )
  ) {
    return "SAMPLE_USED";
  }

  if (
    /\b(placed a sample|placed samples|samples were placed|sample placed|samples placed|put a sample|left a sample|sample in room|sample was placed)\b/.test(
      normalized,
    ) ||
    /(échantillon plac|echantillon plac|échantillons plac|echantillons plac|échantillons ont été plac|echantillons ont ete plac|été plac|ete plac|placé un échantillon|place un echantillon|mis un échantillon|mis un echantillon)/.test(
      normalized,
    )
  ) {
    return "SAMPLE_PLACED";
  }

  return "UNKNOWN";
}

export function intentLabel(intent: IncomingEmailIntent) {
  const labels: Record<IncomingEmailIntent, string> = {
    SAMPLE_PLACED: "Sample placed",
    SAMPLE_USED: "Sample used",
    PRODUCT_PURCHASED: "Product purchased",
    GUEST_CHECKED_OUT: "Guest checked out",
    UNKNOWN: "Unknown",
  };

  return labels[intent];
}
