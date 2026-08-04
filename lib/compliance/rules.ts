/**
 * Compliance rule engine — a direct translation of the "Backend Rules Master",
 * "Dashboard Status Rules", "Reminder Rules" and "Certificate Rules" blocks in
 * the client's Dashboard Framework sheet.
 *
 * Nothing here touches a database — it is pure logic over a service record so
 * the same functions drive both the generated demo roster and (later) real data.
 */

// ── Service definitions (Backend Rules Master) ───────────────────────────────

export type ServiceKey = "medical" | "hepA" | "hepB" | "typhoid" | "tetanus";

export interface ServiceRule {
  key: ServiceKey;
  /** Full name as it appears in the framework sheet */
  label: string;
  /** Compact label for table headers */
  shortLabel: string;
  /** Doses required for the service to count as complete (1 for a health check) */
  dosesRequired: number;
  /** Human-readable dose schedule, e.g. "0, 1, 6 Months" */
  schedule: string;
  /** Month offsets from dose 1 for each subsequent dose. Length = dosesRequired - 1 */
  doseOffsetsMonths: number[];
  /** Months after the last dose before a booster falls due (null = no booster) */
  boosterMonths: number | null;
  /** Months a completed health check stays valid (null = not applicable) */
  validityMonths: number | null;
  /** Status used when this service is past its due date */
  overdueStatus: "Health Check Due" | "Vaccination Due";
  /** Document produced on completion */
  certificate: string;
  /** Whether a sticker/image is issued alongside the certificate */
  sticker: boolean;
  /** Colour used for this service across the dashboard */
  color: string;
}

export const SERVICE_RULES: ServiceRule[] = [
  {
    key: "medical",
    label: "Medical Health Check",
    shortLabel: "Medical",
    dosesRequired: 1,
    schedule: "Annual",
    doseOffsetsMonths: [],
    boosterMonths: null,
    validityMonths: 12,
    overdueStatus: "Health Check Due",
    certificate: "Health Check Report",
    sticker: false,
    color: "#4f46e5",
  },
  {
    key: "hepA",
    label: "Hepatitis A",
    shortLabel: "Hep A",
    dosesRequired: 2,
    schedule: "0, 6 Months",
    doseOffsetsMonths: [6],
    boosterMonths: null,
    validityMonths: null,
    overdueStatus: "Vaccination Due",
    certificate: "Vaccination Certificate",
    sticker: true,
    color: "#4f46e5",
  },
  {
    key: "hepB",
    label: "Hepatitis B",
    shortLabel: "Hep B",
    dosesRequired: 3,
    schedule: "0, 1, 6 Months",
    doseOffsetsMonths: [1, 6],
    boosterMonths: null,
    validityMonths: null,
    overdueStatus: "Vaccination Due",
    certificate: "Vaccination Certificate",
    sticker: true,
    color: "#4f46e5",
  },
  {
    key: "typhoid",
    label: "Typhoid",
    shortLabel: "Typhoid",
    dosesRequired: 1,
    schedule: "Single Dose",
    doseOffsetsMonths: [],
    boosterMonths: 36, // every 3 years
    validityMonths: null,
    overdueStatus: "Vaccination Due",
    certificate: "Vaccination Certificate",
    sticker: true,
    color: "#4f46e5",
  },
  {
    key: "tetanus",
    label: "Tetanus (Td/Tdap)",
    shortLabel: "Tetanus",
    dosesRequired: 1,
    schedule: "Single Dose",
    doseOffsetsMonths: [],
    boosterMonths: 120, // every 10 years
    validityMonths: null,
    overdueStatus: "Vaccination Due",
    certificate: "Vaccination Certificate",
    sticker: true,
    color: "#4f46e5",
  },
];

export const SERVICE_BY_KEY: Record<ServiceKey, ServiceRule> = SERVICE_RULES.reduce(
  (acc, r) => { acc[r.key] = r; return acc; },
  {} as Record<ServiceKey, ServiceRule>,
);

// ── Status vocabulary (Dashboard Status Rules) ──────────────────────────────

export type ServiceStatus =
  | "Not Enrolled"
  | "Pending"
  | "In Progress"
  | "Completed"
  | "Booster Due"
  | "Health Check Due"
  | "Vaccination Due";

export type OverallStatus = "Compliant" | "Non-Compliant";

/**
 * Two colours do all the work here: an indigo ramp for how far along a service
 * is (darker = further), and one rose for anything that needs action. Grey is
 * "out of scope". Deliberately restrained — a status board reads better when
 * only the exceptions are coloured.
 */
export const STATUS_COLORS: Record<ServiceStatus, string> = {
  Completed: "#4f46e5",
  "In Progress": "#818cf8",
  Pending: "#c7d2fe",
  "Booster Due": "#e11d48",
  "Health Check Due": "#e11d48",
  "Vaccination Due": "#e11d48",
  "Not Enrolled": "#d4d4d8",
};

/** Order used for stacked bars and legends — best outcome first. */
export const STATUS_ORDER: ServiceStatus[] = [
  "Completed",
  "In Progress",
  "Pending",
  "Booster Due",
  "Health Check Due",
  "Vaccination Due",
  "Not Enrolled",
];

// ── Reminder buckets (Reminder Rules) ───────────────────────────────────────

export type ReminderBucket =
  | "Overdue"
  | "Due Today"
  | "Reminder"
  | "Upcoming Due"
  | "Not Due"
  | "None";

export const REMINDER_COLORS: Record<ReminderBucket, string> = {
  Overdue: "#e11d48",
  "Due Today": "#4f46e5",
  Reminder: "#818cf8",
  "Upcoming Due": "#c7d2fe",
  "Not Due": "#d4d4d8",
  None: "#d4d4d8",
};

/** Notification label the reminder engine would send for each bucket. */
export const REMINDER_NOTIFICATION: Record<ReminderBucket, string> = {
  Overdue: "Overdue",
  "Due Today": "Due Today",
  Reminder: "Reminder",
  "Upcoming Due": "Upcoming Due",
  "Not Due": "—",
  None: "—",
};

/**
 * 30 days before due date → Upcoming Due; 7 days before → Reminder;
 * on the due date → Due Today; past the due date → Overdue.
 */
export function reminderBucket(daysToDue: number | null): ReminderBucket {
  if (daysToDue === null) return "None";
  if (daysToDue < 0) return "Overdue";
  if (daysToDue === 0) return "Due Today";
  if (daysToDue <= 7) return "Reminder";
  if (daysToDue <= 30) return "Upcoming Due";
  return "Not Due";
}

// ── Date helpers (all dates are ISO yyyy-mm-dd strings) ─────────────────────

export function addMonths(iso: string, months: number): string {
  const [y, m, day] = iso.split("-").map(Number);
  const d = new Date(y, m - 1 + months, day);
  return toIso(d);
}

export function toIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function daysBetween(fromIso: string, toIsoDate: string): number {
  const [y1, m1, d1] = fromIso.split("-").map(Number);
  const [y2, m2, d2] = toIsoDate.split("-").map(Number);
  const a = Date.UTC(y1, m1 - 1, d1);
  const b = Date.UTC(y2, m2 - 1, d2);
  return Math.round((b - a) / 86400000);
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-12-04" → "Dec'26" — the format the framework sheet uses for Next Due. */
export function shortMonth(iso: string): string {
  const [y, m] = iso.split("-").map(Number);
  return `${MONTH_NAMES[m - 1]}'${String(y).slice(2)}`;
}

/** "2026-12-04" → "04 Dec 2026" */
export function longDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${String(d).padStart(2, "0")} ${MONTH_NAMES[m - 1]} ${y}`;
}

// ── Per-service evaluation ──────────────────────────────────────────────────

/** What the source system stores for one employee × one service. */
export interface ServiceRecord {
  /** Service not enrolled → dashboard status is "Not Enrolled" */
  enrolled: boolean;
  /** Date the employee became eligible — the first dose / health check is due from here */
  enrolledOn: string;
  /** Administered dose dates (or health check dates), oldest first */
  doses: string[];
}

export interface ServiceState {
  key: ServiceKey;
  label: string;
  shortLabel: string;
  status: ServiceStatus;
  /** Doses administered so far */
  dosesDone: number;
  dosesRequired: number;
  /** "2/3" style label used in the register table */
  doseLabel: string;
  /** Date of each administered dose */
  doseDates: string[];
  lastDoneOn: string | null;
  /** Next action date — null once nothing further is required */
  nextDueOn: string | null;
  daysToDue: number | null;
  reminder: ReminderBucket;
  /** True when nextDueOn is in the past */
  isOverdue: boolean;
  /** Counts towards overall compliance (Compliance Rule column) */
  isCompliant: boolean;
  /** Whether a certificate / report exists to download today */
  certificateAvailable: boolean;
  certificate: string;
  sticker: boolean;
}

/**
 * Applies the Status Rule / Next Due Rule / Booster Rule / Compliance Rule
 * columns for a single service.
 */
export function evaluateService(
  rule: ServiceRule,
  record: ServiceRecord,
  asOf: string,
): ServiceState {
  const doses = record.doses;
  const done = doses.length;
  const lastDoneOn = done > 0 ? doses[done - 1] : null;

  const base = {
    key: rule.key,
    label: rule.label,
    shortLabel: rule.shortLabel,
    dosesDone: done,
    dosesRequired: rule.dosesRequired,
    doseLabel: `${done}/${rule.dosesRequired}`,
    doseDates: doses,
    lastDoneOn,
    certificate: rule.certificate,
    sticker: rule.sticker,
    // A certificate is issued after every administered dose / completed check
    certificateAvailable: done > 0,
  };

  const finish = (status: ServiceStatus, nextDueOn: string | null, isCompliant: boolean): ServiceState => {
    const daysToDue = nextDueOn ? daysBetween(asOf, nextDueOn) : null;
    return {
      ...base,
      status,
      nextDueOn,
      daysToDue,
      reminder: reminderBucket(daysToDue),
      isOverdue: daysToDue !== null && daysToDue < 0,
      isCompliant,
    };
  };

  // Service not enrolled → Not Enrolled
  if (!record.enrolled) {
    return { ...finish("Not Enrolled", null, false), certificateAvailable: false, doseDates: [], dosesDone: 0, doseLabel: `0/${rule.dosesRequired}`, lastDoneOn: null };
  }

  // Enrolled but nothing done yet → Pending (first dose / health check due immediately)
  if (done === 0) {
    const dueOn = record.enrolledOn;
    const overdue = daysBetween(asOf, dueOn) < 0;
    return finish(overdue ? rule.overdueStatus : "Pending", dueOn, false);
  }

  // Part-way through a dose ladder → In Progress, or overdue if the next dose slipped
  if (done < rule.dosesRequired) {
    const nextDueOn = addMonths(doses[0], rule.doseOffsetsMonths[done - 1]);
    const overdue = daysBetween(asOf, nextDueOn) < 0;
    return finish(overdue ? rule.overdueStatus : "In Progress", nextDueOn, false);
  }

  // All required doses administered
  if (rule.validityMonths !== null) {
    // Health check — valid for a configurable window, then due again
    const nextDueOn = addMonths(lastDoneOn!, rule.validityMonths);
    const overdue = daysBetween(asOf, nextDueOn) < 0;
    return finish(overdue ? "Health Check Due" : "Completed", nextDueOn, !overdue);
  }

  if (rule.boosterMonths !== null) {
    // Booster-bearing vaccine — compliant until the booster falls due
    const nextDueOn = addMonths(lastDoneOn!, rule.boosterMonths);
    const overdue = daysBetween(asOf, nextDueOn) < 0;
    return finish(overdue ? "Booster Due" : "Completed", nextDueOn, !overdue);
  }

  // Full course, no booster — done for good
  return finish("Completed", null, true);
}

// ── Employee roll-up ────────────────────────────────────────────────────────

export interface EmployeeRecord {
  empId: string;
  name: string;
  age: number;
  gender: string;
  site: string;
  department: string;
  designation: string;
  mobile: string;
  /** "Medical Package = Yes" in the framework sheet */
  medicalPackage: boolean;
  services: Record<ServiceKey, ServiceRecord>;
}

export interface EmployeeState extends Omit<EmployeeRecord, "services"> {
  services: Record<ServiceKey, ServiceState>;
  overall: OverallStatus;
  /** Services that are complete out of the five mandatory ones */
  servicesComplete: number;
  servicesTotal: number;
  /** Worst reminder bucket across the employee's services — drives the row pill */
  reminder: ReminderBucket;
  /** Soonest outstanding due date across all services */
  nextDueOn: string | null;
  daysToDue: number | null;
  /** Count of services currently past their due date */
  overdueCount: number;
  compliancePct: number;
}

const REMINDER_SEVERITY: Record<ReminderBucket, number> = {
  Overdue: 5,
  "Due Today": 4,
  Reminder: 3,
  "Upcoming Due": 2,
  "Not Due": 1,
  None: 0,
};

/**
 * Compliance Rule roll-up: an employee is Compliant only when every mandatory
 * service is complete and nothing has fallen overdue.
 */
export function evaluateEmployee(emp: EmployeeRecord, asOf: string): EmployeeState {
  const services = {} as Record<ServiceKey, ServiceState>;
  let complete = 0;
  let overdueCount = 0;
  let worst: ReminderBucket = "None";
  let nextDueOn: string | null = null;
  let daysToDue: number | null = null;

  for (const rule of SERVICE_RULES) {
    const state = evaluateService(rule, emp.services[rule.key], asOf);
    services[rule.key] = state;
    if (state.isCompliant) complete += 1;
    if (state.isOverdue) overdueCount += 1;
    if (REMINDER_SEVERITY[state.reminder] > REMINDER_SEVERITY[worst]) worst = state.reminder;
    if (state.nextDueOn && (nextDueOn === null || state.nextDueOn < nextDueOn)) {
      nextDueOn = state.nextDueOn;
      daysToDue = state.daysToDue;
    }
  }

  const total = SERVICE_RULES.length;
  return {
    empId: emp.empId,
    name: emp.name,
    age: emp.age,
    gender: emp.gender,
    site: emp.site,
    department: emp.department,
    designation: emp.designation,
    mobile: emp.mobile,
    medicalPackage: emp.medicalPackage,
    services,
    overall: complete === total ? "Compliant" : "Non-Compliant",
    servicesComplete: complete,
    servicesTotal: total,
    reminder: worst,
    nextDueOn,
    daysToDue,
    overdueCount,
    compliancePct: Math.round((complete / total) * 100),
  };
}
