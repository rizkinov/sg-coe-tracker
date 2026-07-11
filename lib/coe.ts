export const CATEGORY_KEYS = ["A", "B", "C", "D", "E"] as const;
export type CategoryKey = (typeof CATEGORY_KEYS)[number];

export const CATEGORY_MEANINGS: Record<CategoryKey, string> = {
  A: "Cars up to 1,600cc and 130bhp (97kW)",
  B: "Cars above 1,600cc or 130bhp (97kW)",
  C: "Goods vehicles and buses",
  D: "Motorcycles",
  E: "Open category (all vehicles except motorcycles)",
};

type RawRecord = {
  month?: unknown;
  bidding_no?: unknown;
  vehicle_class?: unknown;
  quota?: unknown;
  bids_success?: unknown;
  bids_received?: unknown;
  premium?: unknown;
};

export type CategoryResult = {
  quota: number;
  bidsReceived: number;
  bidsSuccess: number;
  premium: number;
};

export type Exercise = {
  month: string; // "2026-07"
  biddingNo: number;
  categories: Partial<Record<CategoryKey, CategoryResult>>;
};

const API_URL =
  "https://data.gov.sg/api/action/datastore_search?resource_id=d_69b3380ad7e51aff3a7dcc84eba52b8a&limit=250&sort=month%20desc";

/** Record values are strings and may contain thousands separators (e.g. "1,241"). */
function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const n = Number(value.replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : null;
}

function toCategoryKey(vehicleClass: unknown): CategoryKey | null {
  if (typeof vehicleClass !== "string") return null;
  const m = vehicleClass.match(/^Category ([A-E])$/);
  return m ? (m[1] as CategoryKey) : null;
}

/**
 * Fetches LTA COE bidding results from data.gov.sg and groups them into
 * exercises (month + bidding_no), sorted oldest -> newest.
 * Returns null on any failure so the page can render a fallback shell.
 */
export async function fetchExercises(): Promise<Exercise[] | null> {
  try {
    const res = await fetch(API_URL, { next: { revalidate: 21600 } });
    if (!res.ok) return null;
    const json: unknown = await res.json();
    if (
      typeof json !== "object" ||
      json === null ||
      (json as { success?: unknown }).success !== true
    ) {
      return null;
    }
    const records = (json as { result?: { records?: unknown } }).result
      ?.records;
    if (!Array.isArray(records)) return null;

    const byExercise = new Map<string, Exercise>();
    for (const raw of records as RawRecord[]) {
      const month = typeof raw.month === "string" ? raw.month : null;
      const biddingNo = toNumber(raw.bidding_no);
      const category = toCategoryKey(raw.vehicle_class);
      const quota = toNumber(raw.quota);
      const bidsReceived = toNumber(raw.bids_received);
      const bidsSuccess = toNumber(raw.bids_success);
      const premium = toNumber(raw.premium);
      if (
        month === null ||
        biddingNo === null ||
        category === null ||
        quota === null ||
        bidsReceived === null ||
        bidsSuccess === null ||
        premium === null
      ) {
        continue;
      }
      const key = `${month}#${biddingNo}`;
      let exercise = byExercise.get(key);
      if (!exercise) {
        exercise = { month, biddingNo, categories: {} };
        byExercise.set(key, exercise);
      }
      exercise.categories[category] = {
        quota,
        bidsReceived,
        bidsSuccess,
        premium,
      };
    }

    const exercises = Array.from(byExercise.values()).sort((a, b) =>
      a.month === b.month
        ? a.biddingNo - b.biddingNo
        : a.month < b.month
          ? -1
          : 1,
    );
    return exercises.length > 0 ? exercises : null;
  } catch {
    return null;
  }
}

const nf = new Intl.NumberFormat("en-SG");

export function formatNumber(n: number): string {
  return nf.format(n);
}

export function formatMoney(n: number): string {
  return `S$${nf.format(Math.round(n))}`;
}

const MONTHS_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** "2026-07" -> "July 2026" */
export function formatMonthLong(month: string): string {
  const [y, m] = month.split("-");
  const idx = Number(m) - 1;
  return MONTHS_LONG[idx] ? `${MONTHS_LONG[idx]} ${y}` : month;
}

/** "2026-07" -> "Jul 26" */
export function formatMonthShort(month: string): string {
  const [y, m] = month.split("-");
  const idx = Number(m) - 1;
  return MONTHS_SHORT[idx] ? `${MONTHS_SHORT[idx]} ${y.slice(2)}` : month;
}

/** e.g. "Jul 26 · Ex 1" */
export function formatExerciseShort(exercise: Exercise): string {
  return `${formatMonthShort(exercise.month)} · Ex ${exercise.biddingNo}`;
}

/** e.g. "Bidding exercise 1 · July 2026" */
export function formatExerciseLong(exercise: Exercise): string {
  return `Bidding exercise ${exercise.biddingNo} · ${formatMonthLong(exercise.month)}`;
}
