# 💊 EURECA IV Medication Administration Simulation

An interactive web-based simulation for practicing safe IV push medication administration, built as part of a cross-disciplinary undergraduate research project at **Midwestern State University** (Texas Tech University System).

> **Presented at UGRCAF 2026** — Undergraduate Research and Creative Activities Forum, April 2026

---

## 📋 About the Project

This application was developed through the **EURECA** (Enhancement of Undergraduate Research and Creative Activities) program as a collaboration between the **Wilson School of Nursing** and the **Department of Computer Science** at MSU Texas.

The research investigates whether a digital simulation tool can support nursing professionals in practicing timed IV push medication administration. Instead of relying solely on paper-based instructions, participants work through an interactive, guided experience that mirrors real clinical workflows, while the system automatically collects performance data for later analysis.

### Research Team

| Role | Name | Department |
| --- | --- | --- |
| Faculty Sponsor | Dr. Robin Lockhart | Wilson School of Nursing |
| Co-Researcher | Trinity Munoz | Nursing |
| Co-Researcher/Developer | Noah Bustard | Computer Science |
| Faculty Advisor | Dr. Tina Johnson | Computer Science |

---

## ✨ Key Features

- **Guided Simulation Flow** — Participants complete an informed consent form, a demographics survey, and then work through medications one at a time
- **Interactive Syringe** — On-screen syringe component for simulated IV push administration
- **Real-Time Clock & Timer** — Clock display to support timing awareness during medication administration
- **Medication Order Display** — Large, readable medication details and administration instructions on-screen
- **Drug Reference Pop-Up** — Quick-access reference for medication guidance during the simulation
- **Automatic Data Collection** — Tracks participant actions, administration timing, and compliance status throughout the session
- **CSV Export** — One-click download of all session data formatted for Excel analysis

---

## 🛠️ Tech Stack

| Technology | Purpose |
| --- | --- |
| **Next.js 16** | React framework with App Router |
| **React 19** | UI component library |
| **TypeScript** | Type-safe development |
| **Tailwind CSS v4** | Utility-first styling |
| **PostCSS** | CSS processing pipeline |
| **ESLint** | Code quality and linting |

---

## 📊 Data Collected

Each simulation session exports the following fields to CSV:

| Field | Description |
| --- | --- |
| Patient ID | Unique participant identifier |
| Years of Experience | Nursing experience (from survey) |
| Level of Nursing | LVN, RN, etc. (from survey) |
| Medication | Name of the administered medication |
| Administration Time | Time taken to complete administration |
| Required Minimum Time | Expected minimum safe administration time |
| Compliance Status | Whether administration met the time threshold |
| Completed At | Timestamp of completion |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- npm

### Installation

```bash
git clone https://github.com/noahbustard/EURECA_IV_WEBSITE.git
cd EURECA_IV_WEBSITE
npm install

```

### Run Locally

```bash
npm run dev

```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start

```

---

## 🏗️ Project Structure

```plaintext
EURECA_IV_WEBSITE/
├── src/
│   └── app/
│       ├── layout.tsx        # Root layout
│       ├── page.tsx          # Main simulation application
│       ├── globals.css       # Global styles (Tailwind)
│       └── favicon.ico
├── public/                   # Static assets
├── next.config.ts
├── tailwind / postcss config
├── tsconfig.json
└── package.json

```

---

## 🎯 Challenges & Design Decisions

- **Translating clinical workflows to web** — Mapped the real IV medication administration process into a step-by-step digital experience while keeping the steps realistic and easy for participants to follow
- **UI density** — Organized medication details, instructions, timing tools, and interactive components on a single screen without overwhelming the user
- **Consistent data capture** — Designed the application to accurately track participant actions and timing so results could be collected reliably for research analysis

---

## 📄 License

This project was developed for academic research purposes at Midwestern State University.

---

*Built with ☕ and Next.js by [Noah Bustard*](https://github.com/noahbustard)
