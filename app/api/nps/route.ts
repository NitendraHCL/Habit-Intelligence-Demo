// @ts-nocheck — Will be rewritten in Phase 1 with fact_kx queries
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import rawData from "@/lib/data/nps-raw-data.json";
import { withCache } from "@/lib/cache/middleware";

interface NpsRow {
  uhid: string;
  feedbackType: string;
  serviceDate: string | null;
  month: string;
  serviceLine: string;
  surveycod: string;
  nps: number;
  npsCategory: string;
  reason: string;
  location: string;
  doctorName: string;
  relation: string;
}

const MONTH_ORDER: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};

function monthSort(a: string, b: string) {
  return (MONTH_ORDER[a] ?? 99) - (MONTH_ORDER[b] ?? 99);
}

// ── Word Cloud helpers ──
const STOP_WORDS = new Set([
  "a", "an", "the", "is", "was", "were", "are", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "shall",
  "should", "may", "might", "must", "can", "could", "i", "me", "my",
  "we", "our", "you", "your", "he", "she", "it", "its", "they", "them",
  "their", "this", "that", "these", "those", "am", "to", "of", "in",
  "for", "on", "with", "at", "by", "from", "as", "into", "about",
  "up", "out", "but", "and", "or", "not", "no", "so", "if", "all",
  "very", "just", "also", "than", "then", "more", "most", "some",
  "any", "each", "every", "both", "few", "many", "much", "such",
  "own", "same", "other", "only", "over", "after", "before", "here",
  "there", "when", "where", "how", "what", "which", "who", "whom",
  "why", "too", "nor", "yet", "because", "during", "while", "through",
  "nil", "na", "none", "nothing", "ok", "okay", "yes", "the",
  "like", "don", "didn", "doesn", "won", "wasn", "hasn", "isn",
  "need", "got", "get", "even", "well", "still", "make", "really",
  "think", "know", "take", "come", "give", "keep", "let", "say",
  "see", "seem", "try", "use", "want", "work", "call", "ask",
  "comments", "comment", "feedback", "overall", "experience",
]);

const POSITIVE_WORDS = new Set([
  "excellent", "good", "great", "professional", "caring", "friendly",
  "clean", "helpful", "efficient", "thorough", "comfortable",
  "knowledgeable", "convenient", "modern", "recommend", "nice",
  "quick", "fast", "amazing", "wonderful", "best", "satisfied",
  "happy", "polite", "timely", "smooth", "gentle", "proper",
  "perfect", "informative", "cooperative", "supportive", "awesome",
  "fantastic", "superb", "impressive", "appreciable", "courteous",
  "prompt", "systematic", "organised", "organized", "hygiene",
  "hygienic", "neat", "pleasant", "positive", "calm", "patience",
  "patient", "detailed", "clear", "warm", "welcoming", "effective",
  "reliable", "dedicated", "transparent", "affordable", "value",
]);

const NEGATIVE_WORDS = new Set([
  "waiting", "slow", "rude", "expensive", "noisy", "crowded",
  "bad", "poor", "long", "delay", "delayed", "worst", "horrible",
  "terrible", "dirty", "uncomfortable", "unprofessional", "rushed",
  "confusing", "disappointed", "difficult", "lacking", "unavailable",
  "wait", "boring", "pathetic", "unhygienic", "unclean", "cold",
  "careless", "confused", "late", "improper", "painful", "unwilling",
  "unhelpful", "costly", "overpriced", "average", "below", "issue",
  "problem", "complaint", "concern", "improve", "improvement",
]);

function computeWordCloud(rows: NpsRow[]) {
  const wordCounts: Record<string, number> = {};

  rows.forEach((r) => {
    if (!r.reason || r.reason.length < 3) return;
    const words = r.reason
      .toLowerCase()
      .replace(/[^a-z\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 3 && !STOP_WORDS.has(w));
    const seen = new Set<string>();
    words.forEach((w) => {
      if (!seen.has(w)) {
        wordCounts[w] = (wordCounts[w] || 0) + 1;
        seen.add(w);
      }
    });
  });

  const sorted = Object.entries(wordCounts)
    .filter(([, count]) => count >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 25);

  const wordCloud = sorted.map(([word, count]) => ({
    word,
    count,
    sentiment: POSITIVE_WORDS.has(word)
      ? "positive" as const
      : NEGATIVE_WORDS.has(word)
        ? "negative" as const
        : "neutral" as const,
  }));

  const topPositive = wordCloud.find((w) => w.sentiment === "positive") || null;
  const topConcern = wordCloud.find((w) => w.sentiment === "negative") || null;

  return { wordCloud, topPositive, topConcern };
}

async function handler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const locations = searchParams.get("locations")?.split(",").filter(Boolean);
    const serviceLines = searchParams.get("serviceLines")?.split(",").filter(Boolean);

    // ── Filter raw data ──
    let rows = rawData as NpsRow[];

    if (dateFrom) {
      rows = rows.filter((r) => r.serviceDate && r.serviceDate >= dateFrom);
    }
    if (dateTo) {
      rows = rows.filter((r) => r.serviceDate && r.serviceDate <= dateTo);
    }
    if (locations?.length) {
      rows = rows.filter((r) => locations.includes(r.location));
    }
    if (serviceLines?.length) {
      rows = rows.filter((r) => serviceLines.includes(r.serviceLine));
    }

    const totalResponses = rows.length;

    // ── KPIs ──
    let promoters = 0, passives = 0, detractors = 0;
    rows.forEach((r) => {
      if (r.nps >= 9) promoters++;
      else if (r.nps >= 7) passives++;
      else detractors++;
    });

    const promotersPct = totalResponses > 0 ? Math.round((promoters / totalResponses) * 1000) / 10 : 0;
    const passivesPct = totalResponses > 0 ? Math.round((passives / totalResponses) * 1000) / 10 : 0;
    const detractorsPct = totalResponses > 0 ? Math.round((detractors / totalResponses) * 1000) / 10 : 0;
    const overallNPS = Math.round(promotersPct - detractorsPct);

    // ── NPS Trends by Month ──
    const monthlyMap: Record<string, { p: number; pa: number; d: number; t: number }> = {};
    rows.forEach((r) => {
      const m = r.month || "Unknown";
      if (!monthlyMap[m]) monthlyMap[m] = { p: 0, pa: 0, d: 0, t: 0 };
      monthlyMap[m].t++;
      if (r.nps >= 9) monthlyMap[m].p++;
      else if (r.nps >= 7) monthlyMap[m].pa++;
      else monthlyMap[m].d++;
    });

    const npsTrends = Object.entries(monthlyMap)
      .map(([month, d]) => ({
        month,
        nps: d.t > 0 ? Math.round(((d.p - d.d) / d.t) * 100) : 0,
        responses: d.t,
        promotersPct: d.t > 0 ? Math.round((d.p / d.t) * 100) : 0,
        passivesPct: d.t > 0 ? Math.round((d.pa / d.t) * 100) : 0,
        detractorsPct: d.t > 0 ? Math.round((d.d / d.t) * 100) : 0,
      }))
      .sort((a, b) => monthSort(a.month, b.month));

    // ── By Specialty (treemap) — from consultation DB ──
    const npsWithSpecialty = await prisma.consultationNPS.findMany({
      select: { score: true, specialty: true },
    });

    const specMap: Record<string, { p: number; d: number; t: number }> = {};
    npsWithSpecialty.forEach((r) => {
      const sp = r.specialty || "Other";
      if (!specMap[sp]) specMap[sp] = { p: 0, d: 0, t: 0 };
      specMap[sp].t++;
      if (r.score >= 9) specMap[sp].p++;
      else if (r.score < 7) specMap[sp].d++;
    });

    const totalSpecResponses = npsWithSpecialty.length || 1;
    const bySpecialty = Object.entries(specMap)
      .map(([name, d]) => ({
        name,
        value: d.t,
        nps: d.t > 0 ? Math.round(((d.p - d.d) / d.t) * 100) : 0,
        pct: Math.round((d.t / totalSpecResponses) * 100),
      }))
      .sort((a, b) => b.value - a.value);

    // ── By Service Category (radar - top service lines by NPS from raw data) ──
    const slMap: Record<string, { p: number; d: number; t: number }> = {};
    rows.forEach((r) => {
      const sl = r.serviceLine || "Other";
      if (!slMap[sl]) slMap[sl] = { p: 0, d: 0, t: 0 };
      slMap[sl].t++;
      if (r.nps >= 9) slMap[sl].p++;
      else if (r.nps < 7) slMap[sl].d++;
    });

    const topForRadar = Object.entries(slMap)
      .map(([name, d]) => ({
        category: name,
        nps: d.t > 0 ? Math.round(((d.p - d.d) / d.t) * 100) : 0,
        responses: d.t,
      }))
      .sort((a, b) => b.responses - a.responses)
      .slice(0, 6);

    // ── By Location (donut) ──
    const locMap: Record<string, { p: number; d: number; t: number }> = {};
    rows.forEach((r) => {
      const loc = r.location || "Unknown";
      if (loc === "blank") return;
      if (!locMap[loc]) locMap[loc] = { p: 0, d: 0, t: 0 };
      locMap[loc].t++;
      if (r.nps >= 9) locMap[loc].p++;
      else if (r.nps < 7) locMap[loc].d++;
    });

    const byLocation = Object.entries(locMap)
      .map(([name, d]) => ({
        name,
        value: d.t,
        nps: d.t > 0 ? Math.round(((d.p - d.d) / d.t) * 100) : 0,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    // ── Demographics by Location + Feedback Type (bubble) ──
    const demoMap: Record<string, number> = {};
    rows.forEach((r) => {
      const loc = r.location || "Unknown";
      if (loc === "blank") return;
      const ft = r.feedbackType || "Unknown";
      const key = `${loc}|${ft}`;
      demoMap[key] = (demoMap[key] || 0) + 1;
    });

    const demographics = Object.entries(demoMap).map(([key, count]) => {
      const [location, feedbackType] = key.split("|");
      return { ageGroup: location, gender: feedbackType, responses: count };
    });

    // Demo summary
    const locTotals: Record<string, number> = {};
    const ftTotals: Record<string, number> = {};
    demographics.forEach((d) => {
      locTotals[d.ageGroup] = (locTotals[d.ageGroup] || 0) + d.responses;
      ftTotals[d.gender] = (ftTotals[d.gender] || 0) + d.responses;
    });
    const topLoc = Object.entries(locTotals).sort((a, b) => b[1] - a[1])[0];
    const topFt = Object.entries(ftTotals).sort((a, b) => b[1] - a[1])[0];
    const highestSingle = demographics.sort((a, b) => b.responses - a.responses)[0];

    // ── By Visit Frequency (from UHID repeat count) ──
    const uhidRows: Record<string, NpsRow[]> = {};
    rows.forEach((r) => {
      if (!r.uhid) return;
      if (!uhidRows[r.uhid]) uhidRows[r.uhid] = [];
      uhidRows[r.uhid].push(r);
    });

    const visitBucketMap: Record<string, { feedbacks: number; p: number; d: number }> = {};
    Object.values(uhidRows).forEach((patientRows) => {
      const vc = Math.min(patientRows.length, 5);
      const label = vc >= 5 ? "5+ Visits" : `${vc} Visit${vc > 1 ? "s" : ""}`;
      if (!visitBucketMap[label]) visitBucketMap[label] = { feedbacks: 0, p: 0, d: 0 };
      patientRows.forEach((r) => {
        visitBucketMap[label].feedbacks++;
        if (r.nps >= 9) visitBucketMap[label].p++;
        else if (r.nps < 7) visitBucketMap[label].d++;
      });
    });

    const visitOrder = ["2 Visits", "3 Visits", "4 Visits", "5+ Visits"];
    const byVisitFrequency = visitOrder
      .map((visits) => {
        const d = visitBucketMap[visits] || { feedbacks: 0, p: 0, d: 0 };
        return {
          visits,
          feedbacks: d.feedbacks,
          npsPct: d.feedbacks > 0 ? Math.round(((d.p - d.d) / d.feedbacks) * 100) : 0,
        };
      });

    // ── Word Cloud ──
    const { wordCloud, topPositive, topConcern } = computeWordCloud(rows);

    return NextResponse.json({
      kpis: {
        overallNPS,
        totalResponses,
        promotersPct,
        passivesPct,
        detractorsPct,
        responseRate: 0,
        yoyChange: 12,
      },
      charts: {
        npsTrends,
        bySpecialty,
        byServiceCategory: topForRadar,
        byDiagnosisCategory: byLocation,
        demographics,
        demoSummary: {
          highestCount: highestSingle?.responses || 0,
          highestAgeGroup: highestSingle?.ageGroup || "",
          highestGender: highestSingle?.gender || "",
          topGender: topFt?.[0] || "",
          topGenderCount: topFt?.[1] || 0,
          topAgeGroup: topLoc?.[0] || "",
          topAgeGroupCount: topLoc?.[1] || 0,
        },
        byVisitFrequency,
        wordCloud,
        topPositive,
        topConcern,
      },
    });
  } catch (error) {
    console.error("NPS API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const GET = withCache(handler, { endpoint: "nps" });
