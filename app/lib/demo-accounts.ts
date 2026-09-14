import type { Role } from "@prisma/client";

// D-18: the single source of the 5 seeded demo accounts, shared between
// prisma/seed.ts (creates them) and the login page's Demo Accounts panel
// (D-17, click-to-fill). All demo accounts share one easy-to-type password
// — this is a hackathon prototype seed, not a production credential
// policy, and DEMO_PASSWORD is only ever shipped to the client bundle when
// DEMO_MODE=true (gated server-side in app/(auth)/login/page.tsx).
export const DEMO_PASSWORD = "CaseVault@123";

export type DemoAccount = {
  fullName: string;
  username: string;
  role: Role;
  designation: string;
  unit: string;
  badgeId: string;
};

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    fullName: "Ramesh Kulkarni",
    username: "ramesh.kulkarni",
    role: "POLICE",
    designation: "Inspector",
    unit: "Kotwali PS",
    badgeId: "PS-1042",
  },
  {
    fullName: "Dr. Anjali Menon",
    username: "anjali.menon",
    role: "FORENSICS",
    designation: "Scientific Officer",
    unit: "Regional FSL",
    badgeId: "FSL-0231",
  },
  {
    fullName: "Priya Deshmukh",
    username: "priya.deshmukh",
    role: "PROSECUTION",
    designation: "Public Prosecutor",
    unit: "District Court Complex",
    badgeId: "PP-0087",
  },
  {
    fullName: "Justice Arvind Rao",
    username: "arvind.rao",
    role: "COURT",
    designation: "Judge",
    unit: "Sessions Court",
    badgeId: "JD-0015",
  },
  {
    fullName: "Suresh Iyer",
    username: "suresh.iyer",
    role: "ADMIN",
    designation: "System Administrator",
    unit: "CaseVault HQ",
    badgeId: "ADM-0001",
  },
];
