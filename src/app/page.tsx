"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Med = {
  name: string;
  linkedLine: string;
  orderedAdminDose: string;
  concentration: string;
  lastAdmin: string;
  frequency: string;
  route: string;
  orderedDose: string;
  reason: string;
  administrationInstructions: string;
  referenceTitle: string;
  referenceBody: string;
  requiredSeconds: number;
};

type Screen = "home" | "med" | "done";

type InfusionResult = {
  complete: boolean;
  elapsedSeconds: number | null;
  completedAt: string | null;
};

type Participant = {
  patientIdentifier: string;
  yearsNursingExperience: string;
  nursingLevel: string;
};

type ComplianceStatus = "In compliance" | "Not in compliance";

type ExportRow = {
  patientIdentifier: string;
  yearsNursingExperience: string;
  nursingLevel: string;
  medicationName: string;
  medicationAdministrationTimeSeconds: number;
  requiredMinimumSeconds: number;
  complianceStatus: ComplianceStatus;
  completedAt: string;
};

const NURSING_LEVELS = ["LVN", "RN", "BSN RN", "MSN RN", "NP", "Other"];

const MEDS: Med[] = [
  {
    name: "ondansetron (Zofran) injection 4 mg IV every 8 hours PRN",
    linkedLine: "PICC single lumen left basilic",
    orderedAdminDose: "4 mg = 2 mL",
    concentration: "2 mg/1 mL",
    lastAdmin: "Yesterday at 1930",
    frequency: "Every 8 hours PRN",
    route: "Intravenous",
    orderedDose: "4 mg",
    reason: "nausea and vomiting",
    administrationInstructions: "Administer over 3 minutes.",
    referenceTitle: "Ondansetron Recommended Administration",
    referenceBody: "May be given undiluted. Administer 4 mg preferably over 3 minutes.",
    requiredSeconds: 180,
  },
  {
    name: "famotidine (Pepcid) injection 20 mg IV every 12 hours",
    linkedLine: "PICC single lumen left basilic",
    orderedAdminDose: "20 mg = 5 mL",
    concentration: "4 mg/1 mL",
    lastAdmin: "Yesterday at 2100",
    frequency: "Every 12 hours",
    route: "Intravenous",
    orderedDose: "20 mg",
    reason: "gastric reflux",
    administrationInstructions: "Dilute to a concentration of 4 mg/mL prior to administration.",
    referenceTitle: "Famotidine Recommended Administration",
    referenceBody: "Dilute to a concentration no greater than 4 mg/mL. Administer 20 mg over 2 minutes.",
    requiredSeconds: 120,
  },
  {
    name: "hydromorphone ( Dilaudid ) injection 4 mg IV every 4 hours PRN",
    linkedLine: "PICC single lumen left basilic",
    orderedAdminDose: "4 mg = 1 mL",
    concentration: "4 mg/1 mL",
    lastAdmin: "Yesterday at 2100",
    frequency: "Every 4 hours PRN",
    route: "Intravenous",
    orderedDose: "4 mg",
    reason: "pain",
    administrationInstructions: "",
    referenceTitle: "Hydromorphone Recommended Administration",
    referenceBody: "May be given undiluted. Administer 4 mg over 2 minutes.",
    requiredSeconds: 120,
  },
  {
    name: "furosemide (Lasix) injection 30 mg IV every 12 hours",
    linkedLine: "PICC single lumen left basilic",
    orderedAdminDose: "30 mg = 3 mL",
    concentration: "10 mg/1 mL",
    lastAdmin: "Yesterday at 2100",
    frequency: "Every 12 hours",
    route: "Intravenous",
    orderedDose: "30 mg",
    reason: "fluid volume excess",
    administrationInstructions: "Administer over 1.5 minutes.",
    referenceTitle: "Furosemide Recommended Administration",
    referenceBody: "May be given undiluted. Administer no faster than 20 mg/minute.",
    requiredSeconds: 90,
  },
  {
    name: "pantoprazole (Protonix) injection 40 mg IV every 24 hours",
    linkedLine: "PICC single lumen left basilic",
    orderedAdminDose: "40 mg = 10 mL",
    concentration: "4 mg/1 mL",
    lastAdmin: "Yesterday at 0900",
    frequency: "Every 24 hours",
    route: "Intravenous",
    orderedDose: "40 mg",
    reason: "gastric reflux",
    administrationInstructions: "Administer over 2 minutes",
    referenceTitle: "Pantoprazole Recommended Administration",
    referenceBody: "Reconstitute to a concentration of 4 mg/mL. Administer 40 mg over 2 minutes.",
    requiredSeconds: 120,
  },
  {
    name: "methylprednisolone ( Solu-medrol ) injection 80 mg IV every 12 hours",
    linkedLine: "PICC single lumen left basilic",
    orderedAdminDose: "80 mg = 2 mL",
    concentration: "40 mg/1 mL",
    lastAdmin: "Yesterday at 2100",
    frequency: "Every 12 hours",
    route: "Intravenous",
    orderedDose: "80 mg",
    reason: "inflammation",
    administrationInstructions: "Reconstitute with provided solution .",
    referenceTitle: "Methylprednisolone Recommended Administration",
    referenceBody: "Reconstitute with provided solution. Administer over 3 minutes.",
    requiredSeconds: 180,
  },
  {
    name: "ketorolac (Toradol) injection 30 mg IV every 6 hours",
    linkedLine: "PICC single lumen left basilic",
    orderedAdminDose: "30 mg = 1 mL",
    concentration: "30 mg/1 mL",
    lastAdmin: "Yesterday at 2100",
    frequency: "Every 6 hours",
    route: "Intravenous",
    orderedDose: "30 mg",
    reason: "pain",
    administrationInstructions: "Do not exceed 120 mg every 24 hours",
    referenceTitle: "Ketorolac Recommended Administration",
    referenceBody: "May be given undiluted. Administer over one minute.",
    requiredSeconds: 60,
  },
  {
    name: "bumetanide (Bumex) injection 1 mg IV every 6 hours",
    linkedLine: "PICC single lumen left basilic",
    orderedAdminDose: "1 mg = 4 mL",
    concentration: "0.25 mg/mL",
    lastAdmin: "Yesterday at 2100",
    frequency: "Every 6 hours",
    route: "Intravenous",
    orderedDose: "1 mg",
    reason: "renal impairment",
    administrationInstructions: "Administer over 1 minute",
    referenceTitle: "Bumetanide Recommended Administration",
    referenceBody: "May be given undiluted. Administer slowly over 1 minute.",
    requiredSeconds: 60,
  },
  {
    name: "phenytoin (Dilantin) injection 150 mg IV every 8 hours",
    linkedLine: "PICC single lumen left basilic",
    orderedAdminDose: "150 mg = 3 mL",
    concentration: "50 mg/1 mL",
    lastAdmin: "Yesterday at 2300",
    frequency: "Every 8 hours",
    route: "Intravenous",
    orderedDose: "150 mg",
    reason: "prevent seizures",
    administrationInstructions: "Administer over 3 minutes",
    referenceTitle: "Phenytoin Recommended Administration",
    referenceBody: "Give undiluted. Administer no faster than 50 mg/minute.",
    requiredSeconds: 180,
  },
  {
    name: "lorazepam (Ativan) injection 4 mg IV every 15 minutes PRN",
    linkedLine: "PICC single lumen left basilic",
    orderedAdminDose: "4 mg = 2 mL",
    concentration: "4 mg/1 mL",
    lastAdmin: "Yesterday at 2100",
    frequency: "Every 15 minutues",
    route: "Intravenous",
    orderedDose: "4 mg",
    reason: "active seizure",
    administrationInstructions:
      "Dilute with equal amount of normal saline for injection. Notify the physician if seizure continues after two doses.",
    referenceTitle: "Lorazepam Recommended Administration",
    referenceBody: "Dilute with equal volume of diluent. Administer over 2 minutes.",
    requiredSeconds: 120,
  },
];

function parseMl(dose: string) {
  const match = dose.match(/=\s*(\d+(?:\.\d+)?)\s*mL/i);
  if (!match) return 1;
  return Math.max(1, Math.round(Number(match[1])));
}

function vialSizeForDose(doseMl: number) {
  if (doseMl <= 2) return 3;
  if (doseMl <= 4) return 5;
  return 10;
}

function randomPatientId() {
  return `P-${Math.floor(100000 + Math.random() * 900000)}`;
}

function formatCompletedAt(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const hour24 = date.getHours();
  const suffix = hour24 >= 12 ? "pm" : "am";
  const hour12 = hour24 % 12 || 12;
  return `${month}/${day}/${year} ${hour12}:${minutes}${suffix}`;
}

function complianceForElapsed(elapsedSeconds: number, requiredSeconds: number): ComplianceStatus {
  return elapsedSeconds >= requiredSeconds ? "In compliance" : "Not in compliance";
}

function formatSeconds(totalSeconds: number) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function csvEscape(value: string | number) {
  const text = String(value ?? "");
  if (/["\n,]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function rowsToCsv(rows: ExportRow[]) {
  const headers = [
    "patient_identifier",
    "years_nursing_experience",
    "level_of_nursing",
    "medication_name",
    "medication_administration_time_seconds",
    "required_minimum_time_seconds",
    "compliance_status",
    "completed_at",
  ];

  const values = rows.map((row) =>
    [
      row.patientIdentifier,
      row.yearsNursingExperience,
      row.nursingLevel,
      row.medicationName,
      row.medicationAdministrationTimeSeconds,
      row.requiredMinimumSeconds,
      row.complianceStatus,
      row.completedAt,
    ]
      .map(csvEscape)
      .join(","),
  );

  return [headers.join(","), ...values].join("\n");
}

function InfusionPanel({ orderedAdminDose, onChange }: { orderedAdminDose: string; onChange: (r: InfusionResult) => void }) {
  const doseMl = parseMl(orderedAdminDose);
  const vialMl = vialSizeForDose(doseMl);
  const STEP_ML = 0.1;
  const totalUnits = Math.round(doseMl / STEP_ML);
  const [remainingUnits, setRemainingUnits] = useState(totalUnits);
  const [firstPushAt, setFirstPushAt] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [nowMs, setNowMs] = useState(performance.now());
  const [flowMode, setFlowMode] = useState<"idle" | "click" | "hold">("idle");
  const holdIntervalRef = useMemo<{ current: ReturnType<typeof setInterval> | null }>(() => ({ current: null }), []);
  const holdStartTimeoutRef = useMemo<{ current: ReturnType<typeof setTimeout> | null }>(() => ({ current: null }), []);
  const isHoldingRef = useMemo<{ current: boolean }>(() => ({ current: false }), []);
  const firstPushRef = useMemo<{ current: number | null }>(() => ({ current: null }), []);
  const remainingUnitsRef = useMemo<{ current: number }>(() => ({ current: totalUnits }), [totalUnits]);

  const complete = remainingUnits === 0;

  useEffect(() => {
    if (!firstPushAt || complete) return;
    const id = setInterval(() => setElapsedMs(performance.now() - firstPushAt), 50);
    return () => clearInterval(id);
  }, [firstPushAt, complete]);

  useEffect(() => {
    const id = setInterval(() => setNowMs(performance.now()), 100);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    remainingUnitsRef.current = remainingUnits;
  }, [remainingUnits, remainingUnitsRef]);

  const clearHold = useCallback(() => {
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
    if (holdStartTimeoutRef.current) {
      clearTimeout(holdStartTimeoutRef.current);
      holdStartTimeoutRef.current = null;
    }
    isHoldingRef.current = false;
  }, [holdIntervalRef, holdStartTimeoutRef, isHoldingRef]);

  const pulseFlow = () => {
    setFlowMode("click");
    setTimeout(() => setFlowMode("idle"), 420);
  };

  const pushOne = () => {
    if (remainingUnitsRef.current <= 0) return false;

    const pushedAt = performance.now();
    if (firstPushRef.current === null) {
      firstPushRef.current = pushedAt;
      setFirstPushAt(pushedAt);
    }

    const next = Math.max(0, remainingUnitsRef.current - 1);
    remainingUnitsRef.current = next;
    setRemainingUnits(next);
    return true;
  };

  const startHoldPush = () => {
    if (complete || holdIntervalRef.current || holdStartTimeoutRef.current) return;

    holdStartTimeoutRef.current = setTimeout(() => {
      isHoldingRef.current = true;
      setFlowMode("hold");
      const pushed = pushOne();
      if (!pushed) {
        clearHold();
        setFlowMode("idle");
        return;
      }
      holdIntervalRef.current = setInterval(() => {
        const didPush = pushOne();
        if (!didPush) {
          clearHold();
          setFlowMode("idle");
        }
      }, 220);
      holdStartTimeoutRef.current = null;
    }, 180);
  };

  const stopHoldPush = () => {
    if (isHoldingRef.current) {
      clearHold();
      setFlowMode("idle");
      return;
    }

    if (holdStartTimeoutRef.current) {
      clearTimeout(holdStartTimeoutRef.current);
      holdStartTimeoutRef.current = null;
    }

    const pushed = pushOne();
    if (pushed) pulseFlow();
  };

  useEffect(() => {
    onChange({ complete: false, elapsedSeconds: null, completedAt: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (remainingUnits !== 0 || !firstPushAt) return;
    const finalElapsedMs = performance.now() - firstPushAt;
    setElapsedMs(finalElapsedMs);
    clearHold();
    setFlowMode("idle");
    onChange({
      complete: true,
      elapsedSeconds: Number((finalElapsedMs / 1000).toFixed(2)),
      completedAt: formatCompletedAt(new Date()),
    });
  }, [remainingUnits, firstPushAt, onChange, clearHold]);

  useEffect(() => {
    return () => clearHold();
  }, [clearHold]);

  const reset = () => {
    clearHold();
    firstPushRef.current = null;
    remainingUnitsRef.current = totalUnits;
    setRemainingUnits(totalUnits);
    setFirstPushAt(null);
    setElapsedMs(0);
    setFlowMode("idle");
    onChange({ complete: false, elapsedSeconds: null, completedAt: null });
  };

  const totalSeconds = elapsedMs / 1000;
  const elapsedSeconds = Math.floor(totalSeconds % 60);
  const elapsedMinutes = Math.floor(totalSeconds / 60);

  const completionMs = elapsedMs;
  const sinceFirstPushMs = firstPushAt ? Math.max(0, nowMs - firstPushAt) : 0;
  const formatElapsed = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const mm = Math.floor(s / 60);
    const ss = s % 60;
    return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  };

  const [wallClockMs, setWallClockMs] = useState<number | null>(null);

  useEffect(() => {
    setWallClockMs(Date.now());
    const id = setInterval(() => setWallClockMs(Date.now()), 100);
    return () => clearInterval(id);
  }, []);

  const wallDate = wallClockMs ? new Date(wallClockMs) : null;
  const wallSeconds = wallDate ? wallDate.getSeconds() + wallDate.getMilliseconds() / 1000 : 0;
  const wallMinutes = wallDate ? wallDate.getMinutes() + wallSeconds / 60 : 0;
  const wallHours = wallDate ? (wallDate.getHours() % 12) + wallMinutes / 60 : 0;
  const secondHandDeg = wallSeconds * 6;
  const minuteHandDeg = wallMinutes * 6;
  const hourHandDeg = wallHours * 30;
  const wallTimeLabel = wallDate ? wallDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "--:--:--";

  const remainingMl = remainingUnits * STEP_ML;
  const majorStep = vialMl === 3 ? 0.5 : 1;
  const scaleStep = vialMl === 10 ? 0.2 : 0.1;
  const activeStartPct = 100 / 6;
  const activeHeightPct = 100 - activeStartPct;
  const filledPct = (remainingMl / vialMl) * activeHeightPct;

  return (
    <div className="space-y-5 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h3 className="text-xl font-semibold text-zinc-900">Syringe Infusion Trainer</h3>

      <div className="mx-auto flex min-h-[500px] w-full max-w-[520px] flex-wrap items-start justify-center gap-8 pt-2">
        <div className="relative h-[458px] w-[120px] origin-top scale-[1.12]">
          <div className="absolute left-1/2 top-[34px] h-[2px] w-[80px] -translate-x-1/2 bg-zinc-700" />
          <div className="absolute left-1/2 top-[35px] h-14 w-[50px] -translate-x-1/2 border border-zinc-700 bg-zinc-100 shadow-sm" />

          <div className="absolute left-1/2 top-[48px] h-[286px] w-[100px] -translate-x-1/2 rounded-[3px] border-4 border-zinc-700 bg-zinc-50 shadow-inner">
            <div
              className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-yellow-400 to-yellow-200 transition-all duration-300"
              style={{ height: `${filledPct}%` }}
            />

            {Array.from({ length: Math.round(vialMl / scaleStep) + 1 }).map((_, i) => {
              const vialUnits = Math.round(vialMl / scaleStep);
              const y = activeStartPct + (i / vialUnits) * activeHeightPct;
              const labelValue = vialMl - i * scaleStep;
              const isZero = Math.abs(labelValue) < 1e-6;
              if (isZero) return null;
              const isMajor = Math.abs(labelValue / majorStep - Math.round(labelValue / majorStep)) < 1e-6;
              const safeLabel = Number(labelValue.toFixed(1));
              return (
                <div key={`tick-${i}`} className="absolute left-0 right-0" style={{ top: `${y}%` }}>
                  <div className={`ml-1 ${isMajor ? "h-[2px] w-8 bg-zinc-700" : "h-[1px] w-4 bg-zinc-500/80"}`} />
                  {isMajor && (
                    <span className="absolute left-10 -top-[6px] text-[9px] font-bold leading-none text-zinc-600">
                      {safeLabel === vialMl ? `${safeLabel}mL` : safeLabel}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <svg className="absolute left-0 top-0" width="120" height="458" viewBox="0 0 120 458" aria-hidden>
            <path
              d="M8 333 L42 349 L48 390 L61 390 L68 349 L102 333"
              fill="none"
              stroke="rgb(63 63 70)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          <div className="absolute left-1/2 top-[390px] h-8 w-[2px] -translate-x-1/2 bg-zinc-700" />
          <div
            className="absolute left-1/2 top-[390px] h-8 w-[2px] bg-yellow-300"
            style={{
              opacity: flowMode === "idle" ? 0 : 1,
              transform: flowMode === "idle" ? "translateX(-50%) translateY(0px)" : "translateX(-50%) translateY(10px)",
              transition: flowMode === "click" ? "transform 420ms ease-out, opacity 420ms ease-out" : "transform 220ms linear, opacity 220ms linear",
            }}
          />
          <div
            className="absolute left-1/2 top-[420px] h-[4px] w-[4px] -translate-x-1/2 rounded-full bg-yellow-300"
            style={{ opacity: flowMode === "idle" ? 0 : 1, transition: flowMode === "click" ? "opacity 420ms ease-out" : "opacity 220ms linear" }}
          />
        </div>

        <div className="grid h-[264px] w-[264px] shrink-0 place-items-center rounded-full border-[4px] border-zinc-200 bg-gradient-to-b from-white to-zinc-100 p-1 shadow-inner">
          <div className="relative h-52 w-52 rounded-full border-2 border-zinc-300 bg-white">
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 160 160" aria-hidden>
              {Array.from({ length: 60 }).map((_, i) => {
                const angle = i * 6 - 90;
                const longTick = i % 5 === 0;
                const outerR = 79;
                const innerR = longTick ? 69 : 73;
                const x1 = 80 + innerR * Math.cos((angle * Math.PI) / 180);
                const y1 = 80 + innerR * Math.sin((angle * Math.PI) / 180);
                const x2 = 80 + outerR * Math.cos((angle * Math.PI) / 180);
                const y2 = 80 + outerR * Math.sin((angle * Math.PI) / 180);
                return (
                  <line
                    key={`tick-${i}`}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={longTick ? "rgb(82 82 91)" : "rgb(161 161 170)"}
                    strokeWidth={longTick ? 1.8 : 1}
                    strokeLinecap="round"
                  />
                );
              })}
            </svg>
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 160 160" aria-hidden>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((hour) => {
                const angle = hour * 30 - 90;
                const r = 57;
                const x = 80 + r * Math.cos((angle * Math.PI) / 180);
                const y = 80 + r * Math.sin((angle * Math.PI) / 180);
                return (
                  <text
                    key={hour}
                    x={x}
                    y={y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="11"
                    fontWeight="700"
                    fill="rgb(113 113 122)"
                  >
                    {hour}
                  </text>
                );
              })}
            </svg>
            <div
              className="absolute h-[48px] w-[5px] rounded-full bg-zinc-800"
              style={{ left: "50%", bottom: "50%", transform: `translateX(-50%) rotate(${hourHandDeg}deg)`, transformOrigin: "50% 100%" }}
            />
            <div
              className="absolute h-[66px] w-[4px] rounded-full bg-zinc-600"
              style={{ left: "50%", bottom: "50%", transform: `translateX(-50%) rotate(${minuteHandDeg}deg)`, transformOrigin: "50% 100%" }}
            />
            <div
              className="absolute h-[74px] w-[2px] rounded-full bg-red-500"
              style={{ left: "50%", bottom: "50%", transform: `translateX(-50%) rotate(${secondHandDeg}deg)`, transformOrigin: "50% 100%" }}
            />
            <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white bg-zinc-900" />
          </div>
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-500">Room clock</p>
        <p className="font-mono text-3xl font-bold text-zinc-900">{wallTimeLabel}</p>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-zinc-950 p-5 text-center shadow-inner">
        {!complete ? (
          <>
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-400">Time since first push</p>
            <p className="font-mono text-5xl font-bold tracking-wider text-emerald-300 [text-shadow:0_0_10px_rgba(52,211,153,0.45)]">
              {String(elapsedMinutes).padStart(2, "0")}:{String(elapsedSeconds).padStart(2, "0")}
            </p>
          </>
        ) : (
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">Since first push</p>
              <p className="font-mono text-3xl font-bold tracking-wider text-emerald-300">{formatElapsed(sinceFirstPushMs)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">Completion time</p>
              <p className="font-mono text-3xl font-bold tracking-wider text-cyan-300">{formatElapsed(completionMs)}</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onMouseDown={startHoldPush}
          onMouseUp={stopHoldPush}
          onMouseLeave={stopHoldPush}
          onTouchStart={startHoldPush}
          onTouchEnd={stopHoldPush}
          onTouchCancel={stopHoldPush}
          disabled={complete}
          className="rounded-xl bg-blue-600 px-4 py-4 text-base font-bold text-white hover:bg-blue-500 disabled:opacity-40"
        >
          Push 0.1 mL
        </button>
        <button
          onClick={reset}
          className="rounded-xl bg-zinc-700 px-4 py-4 text-base font-bold text-white hover:bg-zinc-600"
        >
          Reset Dose
        </button>
      </div>

      <div className="rounded-xl border border-zinc-200 p-4 text-base">
        <p>
          Remaining: <span className="font-bold">{remainingMl.toFixed(1)} mL</span> / {doseMl.toFixed(1)} mL
        </p>
      </div>

      {complete && (
        <div className="animate-pulse rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-base font-semibold text-emerald-800">
          Medication infused ✅ Total infusion time: {Number((elapsedMs / 1000).toFixed(2))} seconds
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>("home");
  const [index, setIndex] = useState(0);
  const [showRef, setShowRef] = useState(false);
  const [infusionByMed, setInfusionByMed] = useState<Record<number, InfusionResult>>({});
  const [participant, setParticipant] = useState<Participant>({
    patientIdentifier: "",
    yearsNursingExperience: "",
    nursingLevel: "RN",
  });

  const med = MEDS[index];
  const progress = useMemo(() => `${index + 1} / ${MEDS.length}`, [index]);
  const canAdvance = infusionByMed[index]?.complete ?? false;
  const participantIdForSession = participant.patientIdentifier.trim() || "Unassigned";

  const handleInfusionChange = useCallback(
    (result: InfusionResult) => {
      setInfusionByMed((prev) => ({ ...prev, [index]: result }));
    },
    [index],
  );

  const exportRows = useMemo<ExportRow[]>(() => {
    return MEDS.flatMap((entry, medIndex) => {
      const result = infusionByMed[medIndex];
      if (!result?.complete || result.elapsedSeconds === null || !result.completedAt) return [];

      return [
        {
          patientIdentifier: participantIdForSession,
          yearsNursingExperience: participant.yearsNursingExperience.trim() || "Not provided",
          nursingLevel: participant.nursingLevel.trim() || "Not provided",
          medicationName: entry.name,
          medicationAdministrationTimeSeconds: Number(result.elapsedSeconds.toFixed(2)),
          requiredMinimumSeconds: entry.requiredSeconds,
          complianceStatus: complianceForElapsed(result.elapsedSeconds, entry.requiredSeconds),
          completedAt: result.completedAt,
        },
      ];
    });
  }, [infusionByMed, participant.yearsNursingExperience, participant.nursingLevel, participantIdForSession]);

  const downloadCsv = useCallback(() => {
    if (!exportRows.length) return;

    const csv = rowsToCsv(exportRows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const safePatientId = participantIdForSession.replace(/[^a-z0-9_-]+/gi, "-");
    anchor.href = url;
    anchor.download = `simulation-data-${safePatientId}-${timestamp}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, [exportRows, participantIdForSession]);

  const startSimulation = () => {
    setShowRef(false);
    setIndex(0);
    setInfusionByMed({});
    const providedId = participant.patientIdentifier.trim();
    if (!providedId) {
      const generatedId = randomPatientId();
      setParticipant((prev) => ({ ...prev, patientIdentifier: generatedId }));
    }
    setScreen("med");
  };

  const toHome = () => {
    setShowRef(false);
    setScreen("home");
    setIndex(0);
    setInfusionByMed({});
    setParticipant((prev) => ({ ...prev, patientIdentifier: "" }));
  };

  if (screen === "home") {
    return (
      <main className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 px-6 py-10 text-zinc-900">
        <div className="mx-auto max-w-6xl rounded-3xl border border-zinc-200 bg-white p-8 shadow-xl md:p-10">
          <p className="inline-flex rounded-full bg-blue-100 px-4 py-1 text-sm font-semibold text-blue-700">Medication Rate Simulation</p>
          <h1 className="mt-5 text-4xl font-black tracking-tight md:text-5xl">IV Push Medication Training</h1>
          <p className="mt-4 max-w-3xl text-lg text-zinc-600">
            Infuse intravenous medications at a safe rate of administration. Use medication reference information as needed, then return and continue the simulation.
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
              <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Total Medications</p>
              <p className="mt-1 text-3xl font-bold">{MEDS.length}</p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
              <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Format</p>
              <p className="mt-1 text-3xl font-bold">Step-by-step</p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
              <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Data Export</p>
              <p className="mt-1 text-3xl font-bold">CSV / Excel</p>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
            <h2 className="text-2xl font-bold text-zinc-900">Participant Data</h2>
            <p className="mt-2 text-sm text-zinc-600">This data is included in the CSV export and can be sorted in Excel.</p>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <label className="space-y-2">
                <span className="text-sm font-semibold uppercase tracking-wide text-zinc-600">Patient Identifier</span>
                <input
                  type="text"
                  value={participant.patientIdentifier}
                  onChange={(event) => setParticipant((prev) => ({ ...prev, patientIdentifier: event.target.value }))}
                  placeholder="Optional (auto-generated if blank)"
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-lg font-semibold text-zinc-900 outline-none ring-blue-200 transition focus:ring"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold uppercase tracking-wide text-zinc-600">Years of Nursing Experience</span>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={participant.yearsNursingExperience}
                  onChange={(event) => setParticipant((prev) => ({ ...prev, yearsNursingExperience: event.target.value }))}
                  placeholder="e.g. 6"
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-lg font-semibold text-zinc-900 outline-none ring-blue-200 transition focus:ring"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold uppercase tracking-wide text-zinc-600">Level of Nursing</span>
                <select
                  value={participant.nursingLevel}
                  onChange={(event) => setParticipant((prev) => ({ ...prev, nursingLevel: event.target.value }))}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-lg font-semibold text-zinc-900 outline-none ring-blue-200 transition focus:ring"
                >
                  {NURSING_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <p className="mt-4 text-sm text-zinc-600">
              If patient identifier is left blank, one will be generated automatically when simulation starts.
            </p>
          </div>

          <button onClick={startSimulation} className="mt-10 rounded-2xl bg-blue-600 px-8 py-5 text-xl font-bold text-white shadow-lg transition hover:bg-blue-500">
            Start Simulation
          </button>
        </div>
      </main>
    );
  }

  if (screen === "done") {
    return (
      <main className="grid min-h-screen place-items-center bg-gradient-to-b from-emerald-50 to-zinc-100 p-6 md:p-10">
        <div className="w-full max-w-6xl rounded-3xl border border-emerald-200 bg-white p-6 shadow-xl md:p-10">
          <h1 className="text-4xl font-black text-zinc-900">Simulation Complete</h1>
          <p className="mt-3 text-lg text-zinc-600">
            Participant ID: <span className="font-semibold text-zinc-900">{participantIdForSession}</span>
          </p>
          <p className="mt-1 text-zinc-600">You can download the collected data below and open it directly in Excel.</p>

          <div className="mt-6 overflow-x-auto rounded-2xl border border-zinc-200">
            <table className="min-w-full divide-y divide-zinc-200 text-left text-sm">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-4 py-3 font-semibold text-zinc-700">Medication</th>
                  <th className="px-4 py-3 font-semibold text-zinc-700">Time (sec)</th>
                  <th className="px-4 py-3 font-semibold text-zinc-700">Minimum (sec)</th>
                  <th className="px-4 py-3 font-semibold text-zinc-700">Compliance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 bg-white">
                {exportRows.map((row) => (
                  <tr key={row.medicationName}>
                    <td className="px-4 py-3 text-zinc-900">{row.medicationName}</td>
                    <td className="px-4 py-3 font-semibold text-zinc-900">{row.medicationAdministrationTimeSeconds}</td>
                    <td className="px-4 py-3 text-zinc-700">{row.requiredMinimumSeconds}</td>
                    <td className={`px-4 py-3 font-semibold ${row.complianceStatus === "In compliance" ? "text-emerald-700" : "text-rose-700"}`}>
                      {row.complianceStatus}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={downloadCsv}
              disabled={!exportRows.length}
              className="rounded-2xl bg-blue-600 px-6 py-4 text-base font-bold text-white hover:bg-blue-500 disabled:opacity-40"
            >
              Download CSV for Excel
            </button>
            <button onClick={toHome} className="rounded-2xl bg-zinc-900 px-6 py-4 text-base font-bold text-white hover:bg-zinc-700">
              Back to Home
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-zinc-100 px-4 py-4 text-zinc-900">
      <div className="mx-auto grid max-w-[1580px] gap-4 xl:grid-cols-[1fr_560px]">
        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-xl md:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-4xl font-black">IV Medication Card</h1>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-blue-100 px-4 py-2 text-base font-bold text-blue-700">{progress}</span>
              <span className="rounded-full bg-zinc-100 px-4 py-2 text-base font-semibold text-zinc-700">Patient ID: {participantIdForSession}</span>
            </div>
          </div>

          <p className="mb-4 text-base font-semibold text-zinc-700">Compliance target: complete in at least {formatSeconds(med.requiredSeconds)}.</p>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
              <p className="text-base font-semibold uppercase tracking-wide text-zinc-500">Linked line</p>
              <p className="mt-2 text-xl font-semibold text-zinc-900">{med.linkedLine}</p>
              <p className="mt-3 text-lg font-medium text-zinc-800">{med.name}</p>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <p className="text-base font-semibold uppercase tracking-wide text-amber-700">Administration Instructions</p>
              <p className="mt-2 text-lg text-zinc-900">{med.administrationInstructions || "None listed"}</p>
            </div>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <Info label="Ordered Admin Dose" value={med.orderedAdminDose} />
            <Info label="Concentration" value={med.concentration} />
            <Info label="Last Admin" value={med.lastAdmin} />
            <Info label="Frequency" value={med.frequency} />
            <Info label="Route" value={med.route} />
            <Info label="Ordered Dose" value={med.orderedDose} />
            <Info label="Reason" value={med.reason} />
            <Info label="Order information" value="Administration Instructions" />
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button onClick={() => setShowRef(true)} className="rounded-2xl border border-emerald-300 bg-emerald-50 px-6 py-4 text-lg font-bold text-emerald-800 hover:bg-emerald-100">
              Open Drug Reference
            </button>
            <button
              onClick={downloadCsv}
              disabled={!exportRows.length}
              className="rounded-2xl border border-blue-300 bg-blue-50 px-6 py-4 text-lg font-bold text-blue-800 hover:bg-blue-100 disabled:opacity-40"
            >
              Download CSV
            </button>
            <button
              onClick={() => {
                if (index === 0) toHome();
                else setIndex((v) => v - 1);
                setShowRef(false);
              }}
              className="rounded-2xl bg-zinc-800 px-6 py-4 text-lg font-bold text-white hover:bg-zinc-700"
            >
              Back
            </button>
            <button
              onClick={() => {
                setShowRef(false);
                if (index === MEDS.length - 1) setScreen("done");
                else setIndex((v) => v + 1);
              }}
              disabled={!canAdvance}
              className="rounded-2xl bg-blue-600 px-6 py-4 text-lg font-bold text-white hover:bg-blue-500 disabled:opacity-40"
            >
              Next Medication
            </button>
          </div>
          {!canAdvance && <p className="mt-2 text-base font-semibold text-amber-700">Complete syringe infusion to continue.</p>}
          {canAdvance && infusionByMed[index]?.elapsedSeconds !== null && (
            <p
              className={`mt-3 text-base font-semibold ${
                complianceForElapsed(infusionByMed[index].elapsedSeconds ?? 0, med.requiredSeconds) === "In compliance" ? "text-emerald-700" : "text-rose-700"
              }`}
            >
              {complianceForElapsed(infusionByMed[index].elapsedSeconds ?? 0, med.requiredSeconds)}:{" "}
              {Number((infusionByMed[index].elapsedSeconds ?? 0).toFixed(2))} seconds (target {med.requiredSeconds} seconds or more).
            </p>
          )}
        </section>

        <aside>
          <InfusionPanel key={index} orderedAdminDose={med.orderedAdminDose} onChange={handleInfusionChange} />
        </aside>
      </div>

      {showRef && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
          <div className="w-full max-w-3xl rounded-3xl border border-emerald-200 bg-white p-7 shadow-2xl">
            <p className="text-base font-semibold uppercase tracking-wide text-emerald-700">Drug Reference</p>
            <h2 className="mt-2 text-3xl font-black text-zinc-900">{med.referenceTitle}</h2>
            <p className="mt-4 text-xl text-zinc-800">{med.referenceBody}</p>
            <button onClick={() => setShowRef(false)} className="mt-6 rounded-2xl bg-zinc-900 px-6 py-3 text-lg font-bold text-white hover:bg-zinc-700">
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5">
      <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-2 text-xl font-semibold leading-snug text-zinc-900">{value}</p>
    </div>
  );
}
