/**
 * Deterministic demo roster for the Compliance dashboard.
 *
 * Uses the same seeded-PRNG approach as `visit-generator.ts` so the numbers are
 * identical on every request and every machine. Sites are pulled from the same
 * facility list the rest of the portal filters on, so Compliance lines up with
 * OHC for the same client.
 */

import { getCugData } from "../visit-generator";
import {
  SERVICE_RULES,
  addMonths,
  toIso,
  type EmployeeRecord,
  type ServiceKey,
  type ServiceRecord,
} from "./rules";

// ── Seeded PRNG (Mulberry32) ────────────────────────────────────────────────

function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, items: T[]): T {
  return items[Math.floor(rng() * items.length)];
}

function wpick<T>(rng: () => number, items: T[], w: number[]): T {
  const r = rng();
  let s = 0;
  for (let i = 0; i < items.length; i++) {
    s += w[i];
    if (r < s) return items[i];
  }
  return items[items.length - 1];
}

function randInt(rng: () => number, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

// ── Reference date ──────────────────────────────────────────────────────────

/**
 * The demo dataset across this portal runs to 10 Apr 2026, so the compliance
 * dashboard reports "as of" the same day rather than the wall clock.
 */
export const AS_OF = "2026-04-10";

function shiftDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  return toIso(new Date(y, m - 1, d + days));
}

// ── Name / attribute pools ──────────────────────────────────────────────────

const MALE_NAMES = [
  "Aarav", "Akash", "Ankit", "Arjun", "Chetan", "Deepak", "Farhan", "Gaurav", "Ishaan", "Kabir",
  "Madhav", "Manish", "Mohit", "Nikhil", "Pranav", "Rahul", "Rajesh", "Rakesh", "Ravi", "Rohit",
  "Sagar", "Sandeep", "Siddharth", "Suresh", "Tarun", "Vaibhav", "Varun", "Vikram", "Vinod", "Yash",
];

const FEMALE_NAMES = [
  "Aditi", "Amrita", "Ananya", "Anjali", "Asha", "Bhavana", "Divya", "Jyoti", "Kavya", "Lakshmi",
  "Meera", "Namrata", "Neha", "Nisha", "Pallavi", "Pooja", "Priya", "Ramya", "Sanjana", "Shalini",
  "Shreya", "Sneha", "Sunita", "Swati", "Tanvi", "Uma", "Vidya", "Zoya",
];

const UNISEX_NAMES = ["Harsha", "Kiran", "Anand", "Jyotsna", "Shashi"];

const LAST_NAMES = [
  "Agarwal", "Bhatt", "Chatterjee", "Chauhan", "Desai", "Dutta", "Gandhi", "Ghosh", "Gupta", "Iyer",
  "Jain", "Joshi", "Kapoor", "Khanna", "Krishnan", "Kulkarni", "Kumar", "Malhotra", "Mehta", "Menon",
  "Mishra", "Nair", "Pandey", "Patel", "Pillai", "Rao", "Reddy", "Saxena", "Sharma", "Shetty",
  "Singh", "Sinha", "Srinivasan", "Thakur", "Trivedi", "Verma", "Yadav",
];

const DEPARTMENTS = ["Engineering", "Operations", "Facilities", "Sales", "Finance", "HR", "Quality", "Logistics"];
const DEPT_W = [0.24, 0.19, 0.12, 0.14, 0.08, 0.07, 0.09, 0.07];

const DESIGNATIONS: Record<string, string[]> = {
  Engineering: ["Software Engineer", "Senior Engineer", "Engineering Manager", "QA Analyst"],
  Operations: ["Operations Executive", "Shift Supervisor", "Operations Manager", "Process Associate"],
  Facilities: ["Facility Technician", "Housekeeping Lead", "Facility Manager", "Cafeteria Staff"],
  Sales: ["Account Manager", "Sales Executive", "Regional Sales Lead", "Inside Sales Rep"],
  Finance: ["Financial Analyst", "Accounts Executive", "Finance Manager", "Payroll Specialist"],
  HR: ["HR Business Partner", "Recruiter", "HR Operations Executive", "L&D Specialist"],
  Quality: ["QC Supervisor", "Quality Analyst", "Compliance Officer", "Audit Executive"],
  Logistics: ["Warehouse Handler", "Logistics Coordinator", "Dispatch Supervisor", "Store Keeper"],
};

const GENDERS = ["Male", "Female", "Others"];
const GENDER_W = [0.6, 0.38, 0.02];

/**
 * Sites and departments run their health programmes with different rigour, so
 * each gets a fixed nudge to its employees' diligence. Without this every site
 * lands within a point or two of the average and the site chart says nothing.
 */
const SITE_BIAS = [0.12, -0.11, 0.03, -0.07, 0.08];

const DEPT_BIAS: Record<string, number> = {
  Engineering: 0.04,
  Operations: -0.03,
  Facilities: -0.10,
  Sales: -0.06,
  Finance: 0.07,
  HR: 0.09,
  Quality: 0.06,
  Logistics: -0.08,
};

// ── Roster configuration per client ─────────────────────────────────────────

interface RosterConfig {
  seed: number;
  size: number;
  idPrefix: string;
}

const ROSTERS: Record<string, RosterConfig> = {
  HCLHEALTHCARE: { seed: 9041, size: 520, idPrefix: "HH" },
  DUMMY01: { seed: 7317, size: 900, idPrefix: "DC" },
};

// ── Service history generation ──────────────────────────────────────────────

/**
 * Employees are given a single "diligence" score which drives every service, so
 * the same people tend to be up to date across the board — that correlation is
 * what makes a roll-up compliance rate behave like a real one.
 */
function buildServiceRecord(
  key: ServiceKey,
  rng: () => number,
  diligence: number,
): ServiceRecord {
  // Small per-service jitter around the employee's overall diligence
  const eff = diligence + (rng() - 0.5) * 0.3;

  // A few employees simply aren't enrolled in a given service yet
  if (eff < 0.06) {
    return { enrolled: false, enrolledOn: AS_OF, doses: [] };
  }

  const rule = SERVICE_RULES.find((r) => r.key === key)!;

  /** Nothing done yet — either newly eligible (Pending) or already slipped. */
  const noDoses = (): ServiceRecord => {
    const upcoming = rng() < 0.35;
    const enrolledOn = upcoming
      ? shiftDays(AS_OF, randInt(rng, 1, 45))
      : shiftDays(AS_OF, -randInt(rng, 45, 540));
    return { enrolled: true, enrolledOn, doses: [] };
  };

  /** Dose 1 taken `monthsAgo` months back, plus `count-1` follow-ups on schedule. */
  const ladder = (monthsAgo: number, count: number): ServiceRecord => {
    const dose1 = addMonths(shiftDays(AS_OF, -randInt(rng, 0, 25)), -monthsAgo);
    const doses = [dose1];
    for (let i = 1; i < count; i++) {
      // Follow-ups land on schedule, give or take a fortnight
      doses.push(shiftDays(addMonths(dose1, rule.doseOffsetsMonths[i - 1]), randInt(rng, -7, 14)));
    }
    return { enrolled: true, enrolledOn: addMonths(dose1, -1), doses };
  };

  /**
   * A recurring service — annual health checks, or a vaccine whose booster has
   * come round more than once. `rounds` prior events are back-filled at the
   * booster/validity interval so history reads like a real record rather than a
   * programme that started last year.
   */
  const recurring = (lastMonthsAgo: number, rounds: number, intervalMonths: number): ServiceRecord => {
    const last = addMonths(shiftDays(AS_OF, -randInt(rng, 0, 25)), -lastMonthsAgo);
    const doses: string[] = [];
    for (let i = rounds - 1; i >= 0; i--) {
      doses.push(shiftDays(addMonths(last, -i * intervalMonths), i === 0 ? 0 : randInt(rng, -20, 20)));
    }
    return { enrolled: true, enrolledOn: addMonths(doses[0], -1), doses };
  };

  switch (key) {
    case "medical": {
      // Completed = a health check inside its 12-month validity window, on top
      // of the previous years' checks
      if (eff >= 0.34) return recurring(randInt(rng, 0, 10), randInt(rng, 2, 4), 12);
      // Health Check Due = last check has aged out
      if (eff >= 0.20) return recurring(randInt(rng, 14, 28), randInt(rng, 1, 3), 12);
      return noDoses();
    }
    case "hepA": {
      if (eff >= 0.36) return ladder(randInt(rng, 7, 44), 2); // both doses done
      if (eff >= 0.22) {
        // One dose in — In Progress if dose 2 isn't due yet, otherwise overdue
        return rng() < 0.45 ? ladder(randInt(rng, 1, 5), 1) : ladder(randInt(rng, 8, 22), 1);
      }
      return noDoses();
    }
    case "hepB": {
      if (eff >= 0.38) return ladder(randInt(rng, 7, 48), 3); // full 3-dose course
      if (eff >= 0.26) {
        return rng() < 0.45 ? ladder(randInt(rng, 2, 5), 2) : ladder(randInt(rng, 8, 20), 2);
      }
      if (eff >= 0.16) {
        return rng() < 0.4 ? ladder(0, 1) : ladder(randInt(rng, 3, 16), 1);
      }
      return noDoses();
    }
    case "typhoid": {
      // Booster every 3 years — a dose older than 36 months falls due again
      if (eff >= 0.30) return recurring(randInt(rng, 0, 33), randInt(rng, 1, 3), 36);
      if (eff >= 0.18) return recurring(randInt(rng, 38, 62), randInt(rng, 1, 2), 36);
      return noDoses();
    }
    case "tetanus": {
      // Booster every 10 years
      if (eff >= 0.26) return ladder(randInt(rng, 0, 115), 1);
      if (eff >= 0.14) return ladder(randInt(rng, 123, 168), 1);
      return noDoses();
    }
  }
}

// ── Roster build ────────────────────────────────────────────────────────────

function buildRoster(cugCode: string): EmployeeRecord[] {
  const cfg = ROSTERS[cugCode] ?? ROSTERS.HCLHEALTHCARE;
  const cug = getCugData(cugCode);
  const sites = cug.config.facilities;
  const siteWeights = cug.config.facilityWeights;
  const rng = mulberry32(cfg.seed);

  const employees: EmployeeRecord[] = [];
  const usedNames = new Set<string>();

  for (let i = 0; i < cfg.size; i++) {
    const gender = wpick(rng, GENDERS, GENDER_W);
    const firstNames = gender === "Male" ? MALE_NAMES : gender === "Female" ? FEMALE_NAMES : UNISEX_NAMES;

    let name = `${pick(rng, firstNames)} ${pick(rng, LAST_NAMES)}`;
    // Keep names unique so the register search behaves predictably
    let guard = 0;
    while (usedNames.has(name) && guard < 12) {
      name = `${pick(rng, firstNames)} ${pick(rng, LAST_NAMES)}`;
      guard++;
    }
    usedNames.add(name);

    const department = wpick(rng, DEPARTMENTS, DEPT_W);
    const site = wpick(rng, sites, siteWeights);
    const diligence = Math.min(
      1,
      Math.max(0, rng() + SITE_BIAS[sites.indexOf(site) % SITE_BIAS.length] + DEPT_BIAS[department]),
    );

    const services = {} as Record<ServiceKey, ServiceRecord>;
    for (const rule of SERVICE_RULES) {
      services[rule.key] = buildServiceRecord(rule.key, rng, diligence);
    }

    employees.push({
      empId: `${cfg.idPrefix}-${String(10001 + i)}`,
      name,
      age: randInt(rng, 21, 58),
      gender,
      site,
      department,
      designation: pick(rng, DESIGNATIONS[department]),
      mobile: `${pick(rng, ["98", "99", "88", "76", "70"])}${String(randInt(rng, 10000000, 99999999))}`,
      // "Medical Package = Yes" drives whether a health check is part of the plan
      medicalPackage: services.medical.enrolled && rng() < 0.82,
      services,
    });
  }

  return employees;
}

// Built once per process, exactly like the visit generator's cache.
const rosterCache: Record<string, EmployeeRecord[]> = {
  HCLHEALTHCARE: buildRoster("HCLHEALTHCARE"),
  DUMMY01: buildRoster("DUMMY01"),
};

export function getRoster(cugCode: string): EmployeeRecord[] {
  return rosterCache[cugCode === "DUMMY01" ? "DUMMY01" : "HCLHEALTHCARE"];
}

export function getSites(cugCode: string): string[] {
  return getCugData(cugCode === "DUMMY01" ? "DUMMY01" : "HCLHEALTHCARE").config.facilities;
}

export function getDepartments(): string[] {
  return [...DEPARTMENTS];
}
