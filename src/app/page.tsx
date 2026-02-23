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
};

type Screen = "home" | "med" | "done";

type InfusionResult = { complete: boolean; elapsedSeconds: number | null };

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
  },
];

function parseMl(dose: string) {
  const match = dose.match(/=\s*(\d+(?:\.\d+)?)\s*mL/i);
  if (!match) return 3;
  return Math.max(3, Math.round(Number(match[1])));
}

function InfusionPanel({ orderedAdminDose, onChange }: { orderedAdminDose: string; onChange: (r: InfusionResult) => void }) {
  const totalMl = parseMl(orderedAdminDose);
  const STEP_ML = 0.1;
  const totalUnits = Math.round(totalMl / STEP_ML);
  const [remainingUnits, setRemainingUnits] = useState(totalUnits);
  const [firstPushAt, setFirstPushAt] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);

  const complete = remainingUnits === 0;

  useEffect(() => {
    if (!firstPushAt || complete) return;
    const id = setInterval(() => setElapsedMs(performance.now() - firstPushAt), 50);
    return () => clearInterval(id);
  }, [firstPushAt, complete]);

  const totalSeconds = elapsedMs / 1000;
  const seconds = Math.floor(totalSeconds % 60);
  const minutes = Math.floor(totalSeconds / 60);
  const sweepDeg = (totalSeconds % 60) * 6;

  useEffect(() => {
    onChange({ complete: false, elapsedSeconds: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pushOne = () => {
    if (remainingUnits <= 0) return;

    const start = firstPushAt ?? performance.now();
    if (!firstPushAt) setFirstPushAt(start);

    const nextRemaining = Math.max(0, remainingUnits - 1);
    setRemainingUnits(nextRemaining);

    if (nextRemaining === 0) {
      const finalElapsedMs = performance.now() - start;
      setElapsedMs(finalElapsedMs);
      onChange({ complete: true, elapsedSeconds: Number((finalElapsedMs / 1000).toFixed(2)) });
    }
  };

  const reset = () => {
    setRemainingUnits(totalUnits);
    setFirstPushAt(null);
    setElapsedMs(0);
    onChange({ complete: false, elapsedSeconds: null });
  };

  const remainingMl = remainingUnits * STEP_ML;
  const filledPct = (remainingUnits / totalUnits) * 100;
  const majorStep = totalMl === 3 ? 0.5 : 1;

  return (
    <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold text-zinc-900">Syringe Infusion Trainer</h3>

      <div className="mx-auto flex h-[510px] w-[300px] items-end justify-center gap-4">
        <div className="relative h-[390px] w-[120px]">
          <div className="absolute left-1/2 top-0 h-[2px] w-[112px] -translate-x-1/2 bg-zinc-500" />
          <div className="absolute left-1/2 top-[2px] h-8 w-2 -translate-x-1/2 rounded bg-zinc-400" />
          <div className="absolute left-1/2 top-8 h-10 w-10 -translate-x-1/2 rounded-md border border-zinc-400 bg-zinc-100 shadow-sm" />

          <div className="absolute left-1/2 top-[52px] h-[286px] w-[100px] -translate-x-1/2 rounded-[22px] border-4 border-zinc-300 bg-zinc-50 shadow-inner">
            <div
              className="absolute bottom-0 left-0 right-0 rounded-b-[18px] bg-gradient-to-t from-yellow-400 to-yellow-200 transition-all duration-300"
              style={{ height: `${filledPct}%` }}
            />

            {Array.from({ length: totalUnits + 1 }).map((_, i) => {
              const y = (i / totalUnits) * 100;
              const labelValue = totalMl - i * STEP_ML;
              const isMajor = Math.abs(labelValue / majorStep - Math.round(labelValue / majorStep)) < 1e-6;
              const safeLabel = Number(labelValue.toFixed(1));
              return (
                <div key={`tick-${i}`} className="absolute left-0 right-0" style={{ top: `${y}%` }}>
                  <div className={`ml-1 ${isMajor ? "h-[2px] w-8 bg-zinc-700" : "h-[1px] w-4 bg-zinc-500/80"}`} />
                  {isMajor && (
                    <span className="absolute -left-9 -top-2 text-[10px] font-bold text-zinc-600">{safeLabel}</span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="absolute left-1/2 top-[352px] h-4 w-[112px] -translate-x-1/2 rounded-b-xl border-x-2 border-b-2 border-zinc-400 bg-zinc-100" />
          <div className="absolute left-1/2 top-[365px] h-10 w-[3px] -translate-x-1/2 rounded bg-zinc-400" />
          <div className="absolute left-1/2 top-[404px] h-5 w-[2px] -translate-x-1/2 bg-zinc-500" />
          <div className="absolute left-1/2 top-[408px] h-2 w-5 -translate-x-1/2 rounded-full border border-zinc-400 bg-zinc-100" />

          <div className="absolute -right-8 top-[206px] rounded-lg bg-zinc-900 px-2 py-1 text-[10px] font-bold text-white">mL</div>
        </div>

        <div className="grid h-[250px] place-items-center rounded-full border-[8px] border-zinc-200 bg-gradient-to-b from-white to-zinc-100 p-3 shadow-inner">
          <div className="relative h-40 w-40 rounded-full border-2 border-zinc-300 bg-white">
            {[...Array(12)].map((_, i) => {
              const angle = i * 30 - 90;
              const r = 64;
              const x = 80 + r * Math.cos((angle * Math.PI) / 180);
              const y = 80 + r * Math.sin((angle * Math.PI) / 180);
              const label = i === 0 ? "60" : String(i * 5);
              return (
                <span
                  key={i}
                  className="absolute -translate-x-1/2 -translate-y-1/2 text-[10px] font-bold text-zinc-500"
                  style={{ left: `${x}px`, top: `${y}px` }}
                >
                  {label}
                </span>
              );
            })}
            <div
              className="absolute left-1/2 top-1/2 h-[58px] w-[3px] -translate-x-1/2 rounded-full bg-gradient-to-t from-red-700 to-red-400"
              style={{ transform: `translate(-50%, -100%) rotate(${sweepDeg}deg)`, transformOrigin: "50% 100%" }}
            />
            <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white bg-zinc-900" />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-zinc-950 p-4 text-center shadow-inner">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">Time since first push</p>
        <p className="font-mono text-4xl font-bold tracking-wider text-emerald-300 [text-shadow:0_0_10px_rgba(52,211,153,0.45)]">
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={pushOne}
          disabled={complete}
          className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-500 disabled:opacity-40"
        >
          Push 0.1 mL
        </button>
        <button
          onClick={reset}
          className="rounded-xl bg-zinc-700 px-4 py-3 text-sm font-bold text-white hover:bg-zinc-600"
        >
          Reset Dose
        </button>
      </div>

      <div className="rounded-xl border border-zinc-200 p-3 text-sm">
        <p>
          Remaining: <span className="font-bold">{remainingMl.toFixed(1)} mL</span> / {totalMl.toFixed(1)} mL
        </p>
      </div>

      {complete && (
        <div className="animate-pulse rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
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

  const med = MEDS[index];
  const progress = useMemo(() => `${index + 1} / ${MEDS.length}`, [index]);
  const canAdvance = infusionByMed[index]?.complete ?? false;

  const handleInfusionChange = useCallback(
    (result: InfusionResult) => {
      setInfusionByMed((prev) => ({ ...prev, [index]: result }));
    },
    [index],
  );

  const toHome = () => {
    setShowRef(false);
    setScreen("home");
    setIndex(0);
  };

  if (screen === "home") {
    return (
      <main className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 px-8 py-12 text-zinc-900">
        <div className="mx-auto max-w-5xl rounded-3xl border border-zinc-200 bg-white p-10 shadow-xl">
          <p className="inline-flex rounded-full bg-blue-100 px-4 py-1 text-sm font-semibold text-blue-700">Medication Rate Simulation</p>
          <h1 className="mt-5 text-5xl font-black tracking-tight">IV Push Medication Training</h1>
          <p className="mt-4 max-w-3xl text-lg text-zinc-600">
            Infuse intravenous medications at a safe rate of administration. Use medication reference information as needed, then return and continue the simulation.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
              <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Total Medications</p>
              <p className="mt-1 text-3xl font-bold">10</p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
              <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Format</p>
              <p className="mt-1 text-3xl font-bold">Step-by-step</p>
            </div>
          </div>

          <button onClick={() => setScreen("med")} className="mt-10 rounded-2xl bg-blue-600 px-8 py-5 text-xl font-bold text-white shadow-lg transition hover:bg-blue-500">
            Start Simulation
          </button>
        </div>
      </main>
    );
  }

  if (screen === "done") {
    return (
      <main className="grid min-h-screen place-items-center bg-gradient-to-b from-emerald-50 to-zinc-100 p-10">
        <div className="w-full max-w-3xl rounded-3xl border border-emerald-200 bg-white p-10 text-center shadow-xl">
          <h1 className="text-4xl font-black text-zinc-900">Thank you for completing this simulation!</h1>
          <p className="mt-4 text-zinc-600">You reviewed all medication administration cards.</p>
          <button onClick={toHome} className="mt-8 rounded-2xl bg-zinc-900 px-6 py-4 text-lg font-bold text-white hover:bg-zinc-700">
            Back to Home
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-100 px-6 py-8 text-zinc-900">
      <div className="mx-auto grid max-w-[1400px] gap-6 xl:grid-cols-[1fr_420px]">
        <section className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-xl">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-3xl font-black">IV Medication Card</h1>
            <span className="rounded-full bg-blue-100 px-4 py-1 text-sm font-bold text-blue-700">{progress}</span>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
            <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Linked line</p>
            <p className="mt-1 text-lg font-semibold text-zinc-900">{med.linkedLine}</p>
            <p className="mt-3 text-base font-medium text-zinc-800">{med.name}</p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <Info label="Ordered Admin Dose" value={med.orderedAdminDose} />
            <Info label="Concentration" value={med.concentration} />
            <Info label="Last Admin" value={med.lastAdmin} />
            <Info label="Frequency" value={med.frequency} />
            <Info label="Route" value={med.route} />
            <Info label="Ordered Dose" value={med.orderedDose} />
            <Info label="Reason" value={med.reason} />
            <Info label="Order information" value="Administration Instructions" />
          </div>

          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold uppercase tracking-wide text-amber-700">Administration Instructions</p>
            <p className="mt-2 text-zinc-900">{med.administrationInstructions || "None listed"}</p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button onClick={() => setShowRef(true)} className="rounded-2xl border border-emerald-300 bg-emerald-50 px-6 py-4 text-base font-bold text-emerald-800 hover:bg-emerald-100">
              Open Drug Reference
            </button>
            <button
              onClick={() => {
                if (index === 0) setScreen("home");
                else setIndex((v) => v - 1);
                setShowRef(false);
              }}
              className="rounded-2xl bg-zinc-800 px-6 py-4 text-base font-bold text-white hover:bg-zinc-700"
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
              className="rounded-2xl bg-blue-600 px-6 py-4 text-base font-bold text-white hover:bg-blue-500 disabled:opacity-40"
            >
              Next Medication
            </button>
          </div>
          {!canAdvance && <p className="mt-3 text-sm font-semibold text-amber-700">Complete syringe infusion to continue.</p>}
        </section>

        <aside>
          <InfusionPanel key={index} orderedAdminDose={med.orderedAdminDose} onChange={handleInfusionChange} />
        </aside>
      </div>

      {showRef && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
          <div className="w-full max-w-2xl rounded-3xl border border-emerald-200 bg-white p-7 shadow-2xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Drug Reference</p>
            <h2 className="mt-2 text-2xl font-black text-zinc-900">{med.referenceTitle}</h2>
            <p className="mt-4 text-lg text-zinc-800">{med.referenceBody}</p>
            <button onClick={() => setShowRef(false)} className="mt-6 rounded-2xl bg-zinc-900 px-6 py-3 text-base font-bold text-white hover:bg-zinc-700">
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
    <div className="rounded-2xl border border-zinc-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-1 text-base font-semibold text-zinc-900">{value}</p>
    </div>
  );
}
