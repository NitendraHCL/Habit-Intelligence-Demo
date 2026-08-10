/**
 * Builds the payload behind /api/compliance.
 *
 * The roster is small enough to ship whole, so the API returns evaluated
 * employee rows and the dashboard derives every KPI and chart from them with
 * the current filters applied. That keeps site/department/status drill-downs
 * instant instead of round-tripping, which is what the register in the
 * reference mockup does.
 */

import { getRoster, getSites, getDepartments, AS_OF } from "./generator";
import {
  evaluateEmployee,
  SERVICE_RULES,
  toIso,
  type EmployeeRecord,
  type ReminderBucket,
  type ServiceKey,
  type ServiceRecord,
  type ServiceStatus,
  type OverallStatus,
} from "./rules";

export interface ComplianceServiceCell {
  status: ServiceStatus;
  /** Doses administered */
  done: number;
  required: number;
  doseDates: string[];
  nextDueOn: string | null;
  daysToDue: number | null;
  reminder: ReminderBucket;
  overdue: boolean;
  compliant: boolean;
  /** A certificate / report can be downloaded today */
  certificate: boolean;
}

export interface ComplianceEmployeeRow {
  empId: string;
  name: string;
  age: number;
  gender: string;
  site: string;
  department: string;
  designation: string;
  mobile: string;
  medicalPackage: boolean;
  overall: OverallStatus;
  servicesComplete: number;
  servicesTotal: number;
  reminder: ReminderBucket;
  nextDueOn: string | null;
  daysToDue: number | null;
  overdueCount: number;
  compliancePct: number;
  services: Record<ServiceKey, ComplianceServiceCell>;
  /** 1 = compliant at that month-end, oldest first. Aligns with `months`. */
  history: number[];
}

export interface CompliancePayload {
  asOf: string;
  /** Month-end dates behind `history`, oldest first */
  months: Array<{ iso: string; label: string }>;
  sites: string[];
  departments: string[];
  employees: ComplianceEmployeeRow[];
}

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** The 12 month-ends leading up to (and including) the as-of date. */
function trailingMonths(asOf: string, count: number): Array<{ iso: string; label: string }> {
  const [y, m] = asOf.split("-").map(Number);
  const out: Array<{ iso: string; label: string }> = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(y, m - i, 0); // day 0 of the next month = last day of this one
    out.push({ iso: toIso(d), label: `${MONTH_LABELS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}` });
  }
  // The most recent point should be the as-of date itself, not a future month-end
  out[out.length - 1] = { iso: asOf, label: `${MONTH_LABELS[m - 1]} ${String(y).slice(2)}` };
  return out;
}

/**
 * The employee record as it stood on `iso` — doses administered after that date
 * and enrolments that hadn't happened yet are stripped out, so evaluating a past
 * month-end reports what the dashboard would have shown on the day.
 */
function recordAsOf(emp: EmployeeRecord, iso: string): EmployeeRecord {
  const services = {} as Record<ServiceKey, ServiceRecord>;
  for (const rule of SERVICE_RULES) {
    const rec = emp.services[rule.key];
    services[rule.key] = {
      enrolled: rec.enrolled && rec.enrolledOn <= iso,
      enrolledOn: rec.enrolledOn,
      doses: rec.doses.filter((d) => d <= iso),
    };
  }
  return { ...emp, services };
}

function buildPayload(cugCode: string): CompliancePayload {
  const roster = getRoster(cugCode);
  const months = trailingMonths(AS_OF, 12);

  const employees: ComplianceEmployeeRow[] = roster.map((emp) => {
    const state = evaluateEmployee(emp, AS_OF);

    const services = {} as Record<ServiceKey, ComplianceServiceCell>;
    for (const rule of SERVICE_RULES) {
      const s = state.services[rule.key];
      services[rule.key] = {
        status: s.status,
        done: s.dosesDone,
        required: s.dosesRequired,
        doseDates: s.doseDates,
        nextDueOn: s.nextDueOn,
        daysToDue: s.daysToDue,
        reminder: s.reminder,
        overdue: s.isOverdue,
        compliant: s.isCompliant,
        certificate: s.certificateAvailable,
      };
    }

    // Re-run the same rules at each past month-end so the trend line is derived
    // from the dose history rather than invented.
    const history = months.map((mo) =>
      evaluateEmployee(recordAsOf(emp, mo.iso), mo.iso).overall === "Compliant" ? 1 : 0,
    );

    return {
      empId: state.empId,
      name: state.name,
      age: state.age,
      gender: state.gender,
      site: state.site,
      department: state.department,
      designation: state.designation,
      mobile: state.mobile,
      medicalPackage: state.medicalPackage,
      overall: state.overall,
      servicesComplete: state.servicesComplete,
      servicesTotal: state.servicesTotal,
      reminder: state.reminder,
      nextDueOn: state.nextDueOn,
      daysToDue: state.daysToDue,
      overdueCount: state.overdueCount,
      compliancePct: state.compliancePct,
      services,
      history,
    };
  });

  return {
    asOf: AS_OF,
    months,
    sites: getSites(cugCode),
    departments: getDepartments(),
    employees,
  };
}

const cache: Record<string, CompliancePayload> = {};

export function getCompliance(cugCode: string): CompliancePayload {
  const key = cugCode === "DUMMY01" ? "DUMMY01" : "DUMMY02";
  if (!cache[key]) cache[key] = buildPayload(key);
  return cache[key];
}
