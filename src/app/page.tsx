"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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

type Screen = "landing" | "consent" | "demographics" | "practice" | "med" | "done";

type InfusionResult = {
  complete: boolean;
  elapsedSeconds: number | null;
  completedAt: string | null;
};

type Participant = {
  participantId: string;
  age: string;
  gender: string;
  levelOfNursing: string;
  areaOfNursing: string;
  yearsOfNursingExperience: string;
};

type ParticipantErrors = Partial<Record<keyof Participant, string>>;

type ComplianceStatus = "In compliance" | "Not in compliance";

type ExportRow = {
  participantId: string;
  age: string;
  gender: string;
  levelOfNursing: string;
  areaOfNursing: string;
  yearsOfNursingExperience: string;
  medicationName: string;
  medicationAdministrationTimeSeconds: number;
  requiredMinimumSeconds: number;
  complianceStatus: ComplianceStatus;
  additionalDrugInformationViewed: "Yes" | "No";
  completedAt: string;
};

type ConsentSection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

type ConsentChoice = "agree" | "disagree";

const GENDER_OPTIONS = ["Female", "Male", "Non-binary", "Prefer not to say"];
const NURSING_LEVEL_OPTIONS = [
  "Undergraduate Nursing Student",
  "Nursing Student",
  "LVN/LPN",
  "RN",
  "BSN",
  "ADN",
  "MSN",
  "DNP",
  "Other",
  "Prefer not to say",
];

const CONSENT_SECTIONS: ConsentSection[] = [
  {
    title: "Purpose of the study",
    paragraphs: [
      "You are invited to participate in a research study examining nurses decisions on intravenous (IV) medication infusion rates in a virtual simulation. The goal of this study is to evaluate a simulation tool designed to measure compliance with recommended IV medication infusion rates and to examine whether embedded alerts influence infusion decisions.",
    ],
  },
  {
    title: "What you will do",
    bullets: [
      "Complete a brief virtual simulation involving IV medication administration scenarios.",
      "Select infusion rates for medications presented in the simulation.",
      "Optionally complete a short demographic questionnaire, such as years of nursing experience or practice setting.",
    ],
    paragraphs: ["The simulation will take approximately 10-15 minutes to complete."],
  },
  {
    title: "Risks",
    paragraphs: [
      "This study involves minimal risk. Some participants may experience mild discomfort if unsure about their answers. The simulation is for research purposes only and does not evaluate professional competence or job performance.",
    ],
  },
  {
    title: "Benefits",
    paragraphs: [
      "There may be no direct benefit to you. However, your participation may help improve nursing education tools and support research aimed at improving patient safety in IV medication administration.",
    ],
  },
  {
    title: "Confidentiality",
    paragraphs: [
      "Your responses will be recorded electronically and stored securely. No identifying information will be reported in research publications or presentations. Results will be reported in aggregate form only.",
    ],
  },
  {
    title: "Voluntary Participation",
    paragraphs: ["Participation in this study is completely voluntary. You may stop at any time without penalty."],
  },
  {
    title: "Questions",
    paragraphs: [
      "If you have questions about the study, contact Trinity Munoz, Wilson School of Nursing, Midwestern State University, tdmunoz0118@my.msutexas.edu.",
      "You may also contact Dr. Robin Lockhart, Wilson School of Nursing, Midwestern State University, robin.lockhart@msutexas.edu.",
    ],
  },
  {
    title: "Consent",
    paragraphs: ["By selecting I Agree, you confirm that:"],
    bullets: [
      "You are 18 years of age or older.",
      "You are a licensed nurse.",
      "You have read the information above.",
      "You voluntarily agree to participate in this study.",
    ],
  },
];

const PRACTICE_MED: Med = {
  name: "practice medication (DemoCaine) injection 5 mg IV once",
  linkedLine: "Peripheral IV right forearm",
  orderedAdminDose: "5 mg = 2 mL",
  concentration: "2.5 mg/1 mL",
  lastAdmin: "Today at 0800",
  frequency: "Once",
  route: "Intravenous",
  orderedDose: "5 mg",
  reason: "practice scenario",
  administrationInstructions: "Administer over 2 minutes.",
  referenceTitle: "Practice Medication Reference",
  referenceBody: "This is a sample medication used for the practice run. Administer the 2 mL dose slowly over 2 minutes.",
  requiredSeconds: 120,
};

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

function generateParticipantId() {
  return `P${Math.floor(100000 + Math.random() * 900000)}`;
}

function createParticipant(): Participant {
  return {
    participantId: "",
    age: "",
    gender: "",
    levelOfNursing: "",
    areaOfNursing: "",
    yearsOfNursingExperience: "",
  };
}

function vialSizeForDose(doseMl: number) {
  if (doseMl <= 2) return 3;
  if (doseMl <= 4) return 5;
  return 10;
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

function validateParticipant(participant: Participant): ParticipantErrors {
  const errors: ParticipantErrors = {};
  const age = participant.age.trim();
  const yearsOfNursingExperience = participant.yearsOfNursingExperience.trim();

  if (age && !/^\d+$/.test(age)) {
    errors.age = "Age must be entered as a whole number.";
  } else if (age) {
    const parsedAge = Number(age);
    if (parsedAge < 16 || parsedAge > 100) {
      errors.age = "Age must be between 16 and 100.";
    }
  }

  if (yearsOfNursingExperience && !/^\d+(?:\.\d+)?$/.test(yearsOfNursingExperience)) {
    errors.yearsOfNursingExperience = "Years of nursing experience must be a number.";
  } else if (yearsOfNursingExperience) {
    const parsedYears = Number(yearsOfNursingExperience);
    if (parsedYears < 0 || parsedYears > 80) {
      errors.yearsOfNursingExperience = "Years of nursing experience must be between 0 and 80.";
    }
  }

  return errors;
}

function csvEscape(value: string | number) {
  const text = String(value ?? "");
  if (/["\n,]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function displayParticipantValue(value: string) {
  return value.trim() || "Not entered";
}

function rowsToCsv(rows: ExportRow[]) {
  const headers = [
    "Participant ID",
    "Age",
    "Gender",
    "Level Of Nursing",
    "Area Of Nursing",
    "Years of Nursing Experience",
    "Medication",
    "Administration Time",
    "Required Minimum Administration Time",
    "Compliance Status",
    "Viewed Additional Drug Information",
    "Completed At",
  ];

  const values = rows.map((row) =>
    [
      row.participantId,
      row.age,
      row.gender,
      row.levelOfNursing,
      row.areaOfNursing,
      row.yearsOfNursingExperience,
      row.medicationName,
      row.medicationAdministrationTimeSeconds,
      row.requiredMinimumSeconds,
      row.complianceStatus,
      row.additionalDrugInformationViewed,
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
  const [showResetConfirm, setShowResetConfirm] = useState(false);
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

  useEffect(() => {
    if (!showResetConfirm) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowResetConfirm(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showResetConfirm]);

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
              d="M12 333 L46 349 L54 390 L65 390 L72 349 L106 333"
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
          onClick={() => setShowResetConfirm(true)}
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

      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-dialog-title"
            className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl"
          >
            <p id="reset-dialog-title" className="text-2xl font-black text-zinc-900">
              Are you sure?
            </p>
            <p className="mt-3 text-base text-zinc-600">
              Resetting now will clear the current syringe progress and timer for this run.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                autoFocus
                onClick={() => setShowResetConfirm(false)}
                className="rounded-2xl bg-zinc-200 px-5 py-3 text-base font-bold text-zinc-900 hover:bg-zinc-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  reset();
                  setShowResetConfirm(false);
                }}
                className="rounded-2xl bg-rose-600 px-5 py-3 text-base font-bold text-white hover:bg-rose-500"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [index, setIndex] = useState(0);
  const [showRef, setShowRef] = useState(false);
  const [infusionByMed, setInfusionByMed] = useState<Record<number, InfusionResult>>({});
  const [referenceOpenedByMed, setReferenceOpenedByMed] = useState<Record<number, boolean>>({});
  const [participant, setParticipant] = useState<Participant>(() => createParticipant());
  const [participantErrors, setParticipantErrors] = useState<ParticipantErrors>({});
  const [consentChoice, setConsentChoice] = useState<ConsentChoice | null>(null);
  const [consentAcceptedAt, setConsentAcceptedAt] = useState<string | null>(null);
  const [consentReachedBottom, setConsentReachedBottom] = useState(false);
  const [consentError, setConsentError] = useState("");
  const consentScrollRef = useRef<HTMLDivElement | null>(null);

  const med = MEDS[index];
  const activeMed = screen === "practice" ? PRACTICE_MED : med;
  const progress = useMemo(() => String(index + 1) + " / " + String(MEDS.length), [index]);
  const canAdvance = infusionByMed[index]?.complete ?? false;
  const participantIdForSession = participant.participantId.trim();
  const consentAccepted = Boolean(consentAcceptedAt);

  const updateParticipantField = (field: keyof Participant, value: string) => {
    setParticipant((prev) => ({ ...prev, [field]: value }));
    setParticipantErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleInfusionChange = useCallback(
    (result: InfusionResult) => {
      setInfusionByMed((prev) => ({ ...prev, [index]: result }));
    },
    [index],
  );

  const handlePracticeChange = useCallback(() => {}, []);

  const handleConsentScroll = () => {
    const node = consentScrollRef.current;
    if (!node) return;

    const distanceFromBottom = node.scrollHeight - node.scrollTop - node.clientHeight;
    if (distanceFromBottom <= 8) setConsentReachedBottom(true);
  };

  const selectConsentChoice = (choice: ConsentChoice) => {
    setConsentChoice(choice);
    setConsentError("");
  };

  const goToConsent = () => {
    setConsentError("");
    setScreen("consent");
  };

  const continueFromConsent = () => {
    if (!consentReachedBottom) {
      setConsentError("Scroll to the bottom of the consent form before agreeing.");
      return;
    }

    if (!consentChoice) {
      setConsentError("Select I Agree or I Do Not Agree before continuing.");
      return;
    }

    if (consentChoice === "disagree") {
      setConsentError("You must agree to the following terms to participate in this study.");
      return;
    }

    setParticipant((prev) => (prev.participantId ? prev : { ...prev, participantId: generateParticipantId() }));
    setConsentAcceptedAt((prev) => prev ?? formatCompletedAt(new Date()));
    setConsentError("");
    setScreen("demographics");
  };

  const openDrugReference = () => {
    if (screen === "med") {
      setReferenceOpenedByMed((prev) => ({ ...prev, [index]: true }));
    }

    setShowRef(true);
  };

  const exportRows = useMemo<ExportRow[]>(() => {
    return MEDS.flatMap((entry, medIndex) => {
      const result = infusionByMed[medIndex];
      if (!result?.complete || result.elapsedSeconds === null || !result.completedAt) return [];

      return [
        {
          participantId: participant.participantId.trim(),
          age: participant.age.trim(),
          gender: participant.gender,
          levelOfNursing: participant.levelOfNursing,
          areaOfNursing: participant.areaOfNursing.trim(),
          yearsOfNursingExperience: participant.yearsOfNursingExperience.trim(),
          medicationName: entry.name,
          medicationAdministrationTimeSeconds: Number(result.elapsedSeconds.toFixed(2)),
          requiredMinimumSeconds: entry.requiredSeconds,
          complianceStatus: complianceForElapsed(result.elapsedSeconds, entry.requiredSeconds),
          additionalDrugInformationViewed: referenceOpenedByMed[medIndex] ? "Yes" : "No",
          completedAt: result.completedAt,
        },
      ];
    });
  }, [
    infusionByMed,
    participant.age,
    participant.areaOfNursing,
    participant.gender,
    participant.levelOfNursing,
    participant.participantId,
    participant.yearsOfNursingExperience,
    referenceOpenedByMed,
  ]);

  const downloadCsv = useCallback(() => {
    if (!exportRows.length) return;

    const csv = rowsToCsv(exportRows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const safeParticipantId = participant.participantId.trim().replace(/[^a-z0-9_-]+/gi, "-") || "participant";
    anchor.href = url;
    anchor.download = "simulation-data-" + safeParticipantId + "-" + timestamp + ".csv";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, [exportRows, participant.participantId]);

  const openPracticeRun = () => {
    if (!consentAccepted) {
      setScreen("consent");
      setConsentError("You must agree to the following terms to participate in this study.");
      return;
    }

    const errors = validateParticipant(participant);
    setParticipantErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setShowRef(false);
    setIndex(0);
    setInfusionByMed({});
    setReferenceOpenedByMed({});
    setScreen("practice");
  };

  const startActualSimulation = () => {
    if (!consentAccepted) {
      setConsentError("You must agree to the following terms to participate in this study.");
      setScreen("consent");
      return;
    }

    const errors = validateParticipant(participant);
    setParticipantErrors(errors);
    if (Object.keys(errors).length > 0) {
      setScreen("demographics");
      return;
    }

    setShowRef(false);
    setIndex(0);
    setInfusionByMed({});
    setReferenceOpenedByMed({});
    setScreen("med");
  };

  const backToDemographics = () => {
    setShowRef(false);
    setScreen("demographics");
    setIndex(0);
    setInfusionByMed({});
    setReferenceOpenedByMed({});
  };

  const toHome = () => {
    setShowRef(false);
    setScreen("landing");
    setIndex(0);
    setInfusionByMed({});
    setReferenceOpenedByMed({});
    setParticipant(createParticipant());
    setParticipantErrors({});
    setConsentChoice(null);
    setConsentAcceptedAt(null);
    setConsentReachedBottom(false);
    setConsentError("");
  };

  if (screen === "landing") {
    return (
      <main className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 px-6 py-10 text-zinc-900">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-xl md:p-10">
            <p className="inline-flex rounded-full bg-blue-100 px-4 py-1 text-sm font-semibold text-blue-700">Medication Rate Simulation</p>
            <h1 className="mt-5 text-4xl font-black tracking-tight md:text-5xl">IV Push Medication Training</h1>
            <p className="mt-4 max-w-3xl text-lg text-zinc-600">
              Review participant information, move through a practice run, and then begin the actual medication simulation.
            </p>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
                <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Total Medications</p>
                <p className="mt-1 text-3xl font-bold">{MEDS.length}</p>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
                <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Pre-Simulation Step</p>
                <p className="mt-1 text-3xl font-bold">Practice Run</p>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
                <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Data Export</p>
                <p className="mt-1 text-3xl font-bold">CSV / Excel</p>
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
              <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">How it works</p>
              <ol className="mt-3 space-y-2 text-base text-zinc-700">
                <li>1. Review the informed consent form.</li>
                <li>2. Complete the participant information page.</li>
                <li>3. Move through the practice run and then the medication simulation.</li>
              </ol>
            </div>

            <button
              onClick={goToConsent}
              className="mt-10 rounded-2xl bg-blue-600 px-8 py-5 text-xl font-bold text-white shadow-lg transition hover:bg-blue-500"
            >
              Next
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (screen === "consent") {
    return (
      <main className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 px-6 py-10 text-zinc-900">
        <div className="mx-auto max-w-5xl">
          <ParticipantIdTab participantId={participantIdForSession} />
          <div className="rounded-3xl border border-blue-200 bg-white p-8 shadow-xl md:p-10">
            <p className="inline-flex rounded-full bg-blue-100 px-4 py-1 text-sm font-semibold text-blue-700">Step 1 of 3</p>
            <h1 className="mt-5 text-4xl font-black tracking-tight md:text-5xl">Informed Consent</h1>
            <p className="mt-4 max-w-3xl text-lg text-zinc-600">
              Read the consent form, choose whether you agree to participate, and then continue to the participant information page.
            </p>

            <div
              ref={consentScrollRef}
              onScroll={handleConsentScroll}
              className="mt-8 max-h-[28rem] space-y-5 overflow-y-auto rounded-2xl border border-blue-200 bg-blue-50 p-6 text-sm leading-7 text-zinc-700"
            >
              {CONSENT_SECTIONS.map((section) => (
                <div key={section.title} className="space-y-2">
                  <h2 className="text-base font-bold text-zinc-900">{section.title}</h2>
                  {section.paragraphs?.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                  {section.bullets && (
                    <ul className="space-y-2 pl-5">
                      {section.bullets.map((bullet) => (
                        <li key={bullet} className="list-disc">
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
              <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Consent Selection</p>
              <p className="mt-2 text-base text-zinc-700">
                {consentReachedBottom ? "Select one option below." : "Scroll to the bottom of the consent form before selecting an option."}
              </p>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <ConsentChoiceCard
                  label="I Agree"
                  description="I have read the information above and agree to participate."
                  selected={consentChoice === "agree"}
                  disabled={!consentReachedBottom}
                  onClick={() => selectConsentChoice("agree")}
                />
                <ConsentChoiceCard
                  label="I Do Not Agree"
                  description="I do not agree to participate in this study."
                  selected={consentChoice === "disagree"}
                  disabled={!consentReachedBottom}
                  onClick={() => selectConsentChoice("disagree")}
                />
              </div>

              {consentError && <p className="mt-4 text-sm font-semibold text-rose-700">{consentError}</p>}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <button onClick={toHome} className="rounded-2xl bg-zinc-800 px-6 py-4 text-lg font-bold text-white hover:bg-zinc-700">
                Back
              </button>
              <button onClick={continueFromConsent} className="rounded-2xl bg-blue-600 px-6 py-4 text-lg font-bold text-white hover:bg-blue-500">
                Next
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (screen === "demographics") {
    return (
      <main className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 px-6 py-10 text-zinc-900">
        <div className="mx-auto max-w-6xl">
          <ParticipantIdTab participantId={participantIdForSession} />
          <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-xl md:p-10">
            <p className="inline-flex rounded-full bg-blue-100 px-4 py-1 text-sm font-semibold text-blue-700">Step 2 of 3</p>
            <h1 className="mt-5 text-4xl font-black tracking-tight md:text-5xl">Participant Information</h1>
            <p className="mt-4 max-w-3xl text-lg text-zinc-600">
              Complete the participant information below before moving to the practice run.
            </p>

            <div className="mt-8 rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold text-zinc-900">Demographics Survey</h2>
                  <p className="mt-2 text-base text-zinc-600">The participant ID is assigned automatically and shown in the top-right corner.</p>
                </div>
                {consentAcceptedAt && (
                  <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-bold text-emerald-800">Agreed {consentAcceptedAt}</span>
                )}
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <label className="space-y-2">
                  <span className="text-sm font-semibold uppercase tracking-wide text-zinc-600">Age</span>
                  <input
                    type="number"
                    min="16"
                    max="100"
                    step="1"
                    inputMode="numeric"
                    value={participant.age}
                    onChange={(event) => updateParticipantField("age", event.target.value)}
                    placeholder="e.g. 24"
                    aria-invalid={Boolean(participantErrors.age)}
                    className={
                      "w-full rounded-xl border bg-white px-4 py-3 text-lg font-semibold text-zinc-900 outline-none transition focus:ring " +
                      (participantErrors.age ? "border-rose-500 ring-rose-200" : "border-zinc-300 ring-blue-200")
                    }
                  />
                  {participantErrors.age && <p className="text-sm font-semibold text-rose-700">{participantErrors.age}</p>}
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold uppercase tracking-wide text-zinc-600">Gender</span>
                  <select
                    value={participant.gender}
                    onChange={(event) => updateParticipantField("gender", event.target.value)}
                    aria-invalid={Boolean(participantErrors.gender)}
                    className={
                      "w-full rounded-xl border bg-white px-4 py-3 text-lg font-semibold text-zinc-900 outline-none transition focus:ring " +
                      (participantErrors.gender ? "border-rose-500 ring-rose-200" : "border-zinc-300 ring-blue-200")
                    }
                  >
                    <option value="">Select an option</option>
                    {GENDER_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  {participantErrors.gender && <p className="text-sm font-semibold text-rose-700">{participantErrors.gender}</p>}
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold uppercase tracking-wide text-zinc-600">Level of Nursing</span>
                  <select
                    value={participant.levelOfNursing}
                    onChange={(event) => updateParticipantField("levelOfNursing", event.target.value)}
                    aria-invalid={Boolean(participantErrors.levelOfNursing)}
                    className={
                      "w-full rounded-xl border bg-white px-4 py-3 text-lg font-semibold text-zinc-900 outline-none transition focus:ring " +
                      (participantErrors.levelOfNursing ? "border-rose-500 ring-rose-200" : "border-zinc-300 ring-blue-200")
                    }
                  >
                    <option value="">Select an option</option>
                    {NURSING_LEVEL_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  {participantErrors.levelOfNursing && <p className="text-sm font-semibold text-rose-700">{participantErrors.levelOfNursing}</p>}
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold uppercase tracking-wide text-zinc-600">Area of Nursing</span>
                  <input
                    type="text"
                    value={participant.areaOfNursing}
                    onChange={(event) => updateParticipantField("areaOfNursing", event.target.value)}
                    placeholder="e.g. ICU, Med Surg"
                    aria-invalid={Boolean(participantErrors.areaOfNursing)}
                    className={
                      "w-full rounded-xl border bg-white px-4 py-3 text-lg font-semibold text-zinc-900 outline-none transition focus:ring " +
                      (participantErrors.areaOfNursing ? "border-rose-500 ring-rose-200" : "border-zinc-300 ring-blue-200")
                    }
                  />
                  {participantErrors.areaOfNursing && <p className="text-sm font-semibold text-rose-700">{participantErrors.areaOfNursing}</p>}
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold uppercase tracking-wide text-zinc-600">Years of Nursing Experience</span>
                  <input
                    type="number"
                    min="0"
                    max="80"
                    step="0.5"
                    inputMode="decimal"
                    value={participant.yearsOfNursingExperience}
                    onChange={(event) => updateParticipantField("yearsOfNursingExperience", event.target.value)}
                    placeholder="e.g. 2.5"
                    aria-invalid={Boolean(participantErrors.yearsOfNursingExperience)}
                    className={
                      "w-full rounded-xl border bg-white px-4 py-3 text-lg font-semibold text-zinc-900 outline-none transition focus:ring " +
                      (participantErrors.yearsOfNursingExperience ? "border-rose-500 ring-rose-200" : "border-zinc-300 ring-blue-200")
                    }
                  />
                  {participantErrors.yearsOfNursingExperience && (
                    <p className="text-sm font-semibold text-rose-700">{participantErrors.yearsOfNursingExperience}</p>
                  )}
                </label>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <button onClick={() => setScreen("consent")} className="rounded-2xl bg-zinc-800 px-6 py-4 text-lg font-bold text-white hover:bg-zinc-700">
                Back
              </button>
              <button onClick={openPracticeRun} className="rounded-2xl bg-blue-600 px-6 py-4 text-lg font-bold text-white hover:bg-blue-500">
                Continue to Practice Run
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (screen === "done") {
    return (
      <main className="grid min-h-screen place-items-center bg-gradient-to-b from-emerald-50 to-zinc-100 p-6 md:p-10">
        <div className="w-full max-w-6xl">
          <ParticipantIdTab participantId={participantIdForSession} />
          <div className="rounded-3xl border border-emerald-200 bg-white p-6 shadow-xl md:p-10">
            <h1 className="text-4xl font-black text-zinc-900">Simulation Complete</h1>
            <p className="mt-3 text-lg text-zinc-600">
              Participant ID: <span className="font-semibold text-zinc-900">{displayParticipantValue(participant.participantId)}</span>
            </p>
            <p className="mt-1 text-zinc-600">You can download the collected data below and open it directly in Excel.</p>

          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <SummaryCard label="Participant ID" value={displayParticipantValue(participant.participantId)} />
            <SummaryCard label="Age" value={displayParticipantValue(participant.age)} />
            <SummaryCard label="Gender" value={displayParticipantValue(participant.gender)} />
            <SummaryCard label="Level of Nursing" value={displayParticipantValue(participant.levelOfNursing)} />
            <SummaryCard label="Area of Nursing" value={displayParticipantValue(participant.areaOfNursing)} />
            <SummaryCard label="Years of Nursing Experience" value={displayParticipantValue(participant.yearsOfNursingExperience)} />
          </div>

          <div className="mt-6 overflow-x-auto rounded-2xl border border-zinc-200">
            <table className="min-w-full divide-y divide-zinc-200 text-left text-sm">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-4 py-3 font-semibold text-zinc-700">Medication</th>
                  <th className="px-4 py-3 font-semibold text-zinc-700">Time (sec)</th>
                  <th className="px-4 py-3 font-semibold text-zinc-700">Minimum (sec)</th>
                  <th className="px-4 py-3 font-semibold text-zinc-700">Compliance</th>
                  <th className="px-4 py-3 font-semibold text-zinc-700">Additional Drug Info</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 bg-white">
                {exportRows.map((row) => (
                  <tr key={row.medicationName}>
                    <td className="px-4 py-3 text-zinc-900">{row.medicationName}</td>
                    <td className="px-4 py-3 font-semibold text-zinc-900">{row.medicationAdministrationTimeSeconds}</td>
                    <td className="px-4 py-3 text-zinc-700">{row.requiredMinimumSeconds}</td>
                    <td
                      className={
                        row.complianceStatus === "In compliance"
                          ? "px-4 py-3 font-semibold text-emerald-700"
                          : "px-4 py-3 font-semibold text-rose-700"
                      }
                    >
                      {row.complianceStatus}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">{row.additionalDrugInformationViewed}</td>
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
        </div>
      </main>
    );
  }

  const isPractice = screen === "practice";

  return (
    <main className={`${isPractice ? "bg-gradient-to-b from-amber-50 to-zinc-100" : "bg-zinc-100"} min-h-screen px-4 py-4 text-zinc-900`}>
      <div className="mx-auto max-w-[1580px]">
        <ParticipantIdTab participantId={participantIdForSession} />
      </div>
      <div className="mx-auto grid max-w-[1580px] gap-4 xl:grid-cols-[1fr_560px]">
        <section className={`rounded-3xl border bg-white p-6 shadow-xl md:p-8 ${isPractice ? "border-amber-200" : "border-zinc-200"}`}>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className={`inline-flex rounded-full px-4 py-1 text-sm font-semibold ${isPractice ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-700"}`}>
                {isPractice ? "Practice Mode" : "Medication Rate Simulation"}
              </p>
              <h1 className="mt-5 text-4xl font-black">IV Medication Order</h1>
            </div>
            <span className={`rounded-full px-4 py-2 text-base font-bold ${isPractice ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-700"}`}>
              {isPractice ? "Practice Run" : progress}
            </span>
          </div>

          <p className="mb-4 text-base font-semibold text-zinc-700">
            Compliance target: complete in at least {formatSeconds(activeMed.requiredSeconds)}.
          </p>

          {isPractice && (
            <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <p className="text-lg font-bold text-zinc-900">This practice screen uses sample medication information.</p>
              <p className="mt-2 text-base text-zinc-700">
                Nothing from the practice run is included in the exported study data, and the actual simulation will begin fresh.
              </p>
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
              <p className="text-base font-semibold uppercase tracking-wide text-zinc-500">Linked line</p>
              <p className="mt-2 text-xl font-semibold text-zinc-900">{activeMed.linkedLine}</p>
              <p className="mt-3 text-lg font-medium text-zinc-800">{activeMed.name}</p>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <p className="text-base font-semibold uppercase tracking-wide text-amber-700">Administration Instructions</p>
              <p className="mt-2 text-lg text-zinc-900">{activeMed.administrationInstructions || "None listed"}</p>
            </div>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <Info label="Ordered Admin Dose" value={activeMed.orderedAdminDose} />
            <Info label="Concentration" value={activeMed.concentration} />
            <Info label="Last Admin" value={activeMed.lastAdmin} />
            <Info label="Frequency" value={activeMed.frequency} />
            <Info label="Route" value={activeMed.route} />
            <Info label="Ordered Dose" value={activeMed.orderedDose} />
            <Info label="Reason" value={activeMed.reason} />
            <Info label="Order information" value="Administration Instructions" />
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button onClick={openDrugReference} className="rounded-2xl border border-emerald-300 bg-emerald-50 px-6 py-4 text-lg font-bold text-emerald-800 hover:bg-emerald-100">
              Additional Drug Information
            </button>
            {!isPractice && (
              <button
                onClick={downloadCsv}
                disabled={!exportRows.length}
                className="rounded-2xl border border-blue-300 bg-blue-50 px-6 py-4 text-lg font-bold text-blue-800 hover:bg-blue-100 disabled:opacity-40"
              >
                Download CSV
              </button>
            )}
            <button
              onClick={() => {
                if (isPractice || index === 0) backToDemographics();
                else setIndex((value) => value - 1);
                setShowRef(false);
              }}
              className="rounded-2xl bg-zinc-800 px-6 py-4 text-lg font-bold text-white hover:bg-zinc-700"
            >
              {isPractice || index === 0 ? "Back to Participant Information" : "Back"}
            </button>
            {isPractice ? (
              <button onClick={startActualSimulation} className="rounded-2xl bg-blue-600 px-6 py-4 text-lg font-bold text-white hover:bg-blue-500">
                Start Actual Simulation
              </button>
            ) : (
              <button
                onClick={() => {
                  setShowRef(false);
                  if (index === MEDS.length - 1) setScreen("done");
                  else setIndex((value) => value + 1);
                }}
                disabled={!canAdvance}
                className="rounded-2xl bg-blue-600 px-6 py-4 text-lg font-bold text-white hover:bg-blue-500 disabled:opacity-40"
              >
                Next Medication
              </button>
            )}
          </div>
          {!isPractice && !canAdvance && <p className="mt-2 text-base font-semibold text-amber-700">Complete syringe infusion to continue.</p>}
          {!isPractice && canAdvance && infusionByMed[index]?.elapsedSeconds !== null && (
            <p
              className={
                complianceForElapsed(infusionByMed[index].elapsedSeconds ?? 0, activeMed.requiredSeconds) === "In compliance"
                  ? "mt-3 text-base font-semibold text-emerald-700"
                  : "mt-3 text-base font-semibold text-rose-700"
              }
            >
              {complianceForElapsed(infusionByMed[index].elapsedSeconds ?? 0, activeMed.requiredSeconds)}:{" "}
              {Number((infusionByMed[index].elapsedSeconds ?? 0).toFixed(2))} seconds (target {activeMed.requiredSeconds} seconds or more).
            </p>
          )}
          {isPractice && (
            <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-base text-zinc-700">
              Use this practice run to get comfortable with the syringe controls and timer before beginning the actual medication sequence.
            </div>
          )}
        </section>

        <aside>
          <InfusionPanel key={isPractice ? "practice" : index} orderedAdminDose={activeMed.orderedAdminDose} onChange={isPractice ? handlePracticeChange : handleInfusionChange} />
        </aside>
      </div>

      {showRef && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
          <div className="w-full max-w-3xl rounded-3xl border border-emerald-200 bg-white p-7 shadow-2xl">
            <p className="text-base font-semibold uppercase tracking-wide text-emerald-700">Drug Reference</p>
            <h2 className="mt-2 text-3xl font-black text-zinc-900">{activeMed.referenceTitle}</h2>
            <p className="mt-4 text-xl text-zinc-800">{activeMed.referenceBody}</p>
            <button onClick={() => setShowRef(false)} className="mt-6 rounded-2xl bg-zinc-900 px-6 py-3 text-lg font-bold text-white hover:bg-zinc-700">
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function ParticipantIdTab({ participantId }: { participantId: string }) {
  if (!participantId) return null;

  return (
    <div className="mb-4 flex justify-end">
      <div className="rounded-b-2xl rounded-t-md border border-blue-200 bg-white px-4 py-3 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Participant ID</p>
        <p className="text-lg font-black text-zinc-900">{participantId}</p>
      </div>
    </div>
  );
}

function ConsentChoiceCard({
  label,
  description,
  selected,
  disabled,
  onClick,
}: {
  label: string;
  description: string;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={
        "flex items-start gap-4 rounded-2xl border px-5 py-4 text-left transition " +
        (selected ? "border-blue-500 bg-blue-50" : "border-zinc-200 bg-white") +
        (disabled ? " cursor-not-allowed opacity-50" : " hover:border-blue-300 hover:bg-blue-50/60")
      }
    >
      <span
        className={
          "mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-md border text-sm font-bold " +
          (selected ? "border-blue-600 bg-blue-600 text-white" : "border-zinc-300 bg-white text-transparent")
        }
      >
        ✓
      </span>
      <span>
        <span className="block text-base font-bold text-zinc-900">{label}</span>
        <span className="mt-1 block text-sm text-zinc-600">{description}</span>
      </span>
    </button>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4">
      <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-zinc-900">{value}</p>
    </div>
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
