/**
 * Seed script: populates Cosmos DB with realistic sample data.
 * Run with: npm run db:seed
 * Requires .env.local with COSMOS_ENDPOINT and COSMOS_KEY
 */

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { initializeDatabase, upsertItem } from "./cosmos";
import type { Client, Member, Claim } from "../types";

const INDUSTRIES = [
  "Αεροπορία",
  "Τράπεζες",
  "Τηλεπικοινωνίες",
  "Ενέργεια",
  "Ναυτιλία",
  "Τεχνολογία",
  "Λιανεμπόριο",
  "Κατασκευές",
  "Τουρισμός",
  "Φαρμακοβιομηχανία",
];

const GREEK_CITIES = [
  "Αθήνα",
  "Θεσσαλονίκη",
  "Πάτρα",
  "Ηράκλειο",
  "Λάρισα",
  "Βόλος",
  "Ιωάννινα",
  "Καβάλα",
  "Ρόδος",
  "Χανιά",
];

const PROVIDER_TYPES = [
  "hospital",
  "clinic",
  "pharmacy",
  "lab",
  "dental",
  "optical",
] as const;

const DIAGNOSES = [
  { desc: "Οξεία βρογχίτιδα", icd: "J20.9" },
  { desc: "Υπέρταση", icd: "I10" },
  { desc: "Σακχαρώδης διαβήτης τύπου 2", icd: "E11.9" },
  { desc: "Οσφυαλγία", icd: "M54.5" },
  { desc: "Γαστρίτιδα", icd: "K29.7" },
  { desc: "Αλλεργική ρινίτιδα", icd: "J30.4" },
  { desc: "Κατάθλιψη", icd: "F32.9" },
  { desc: "Οδοντική τερηδόνα", icd: "K02.9" },
  { desc: "Μυωπία", icd: "H52.1" },
  { desc: "Δερματίτιδα", icd: "L30.9" },
];

function randomId(): string {
  return Math.random().toString(36).substring(2, 10);
}

function randomPick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(start: Date, end: Date): string {
  const d = new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
  return d.toISOString().split("T")[0];
}

async function seed() {
  console.log("🚀 Initializing database...");
  await initializeDatabase();

  const now = new Date().toISOString();
  const clientIds: string[] = [];
  const memberIds: Array<{ id: string; clientId: string }> = [];

  // ── Seed Clients ─────────────────────────────────────
  console.log("📦 Seeding clients...");
  for (let i = 0; i < 15; i++) {
    const id = `client-${randomId()}`;
    clientIds.push(id);

    const client: Client = {
      id,
      type: "client",
      name: `Company ${i + 1} ${randomPick(INDUSTRIES)}`,
      taxId: `EL${String(800000000 + i).padStart(9, "0")}`,
      industry: randomPick(INDUSTRIES),
      contactEmail: `info@company${i + 1}.gr`,
      contactPhone: `+30 210 ${String(1000000 + i * 111111).substring(0, 7)}`,
      address: {
        street: `Λεωφ. Κηφισίας ${100 + i * 10}`,
        city: randomPick(GREEK_CITIES),
        postalCode: `${10000 + i * 100}`,
        country: "GR",
      },
      status: Math.random() > 0.15 ? "active" : "inactive",
      contractStart: randomDate(new Date(2022, 0, 1), new Date(2024, 6, 1)),
      contractEnd: randomDate(new Date(2026, 0, 1), new Date(2028, 11, 31)),
      createdAt: now,
      updatedAt: now,
    };

    await upsertItem("clients", client);
  }
  console.log(`  ✓ ${clientIds.length} clients created`);

  // ── Seed Members ─────────────────────────────────────
  console.log("👥 Seeding members...");
  for (const clientId of clientIds) {
    const memberCount = 50 + Math.floor(Math.random() * 200);
    for (let j = 0; j < memberCount; j++) {
      const id = `member-${randomId()}`;
      memberIds.push({ id, clientId });

      const member: Member = {
        id,
        type: "member",
        clientId,
        firstName: `Μέλος`,
        lastName: `${j + 1}`,
        dateOfBirth: randomDate(new Date(1960, 0, 1), new Date(2005, 0, 1)),
        gender: randomPick(["M", "F", "Other"] as const),
        employeeId: `EMP-${String(j + 1).padStart(5, "0")}`,
        email: `member${j}@example.gr`,
        phone: `+30 69${String(Math.floor(Math.random() * 100000000)).padStart(8, "0")}`,
        planType: randomPick(["basic", "standard", "premium"] as const),
        status: Math.random() > 0.1 ? "active" : "suspended",
        enrollmentDate: randomDate(new Date(2022, 0, 1), new Date(2025, 6, 1)),
        createdAt: now,
        updatedAt: now,
      };

      await upsertItem("members", member);
    }
  }
  console.log(`  ✓ ${memberIds.length} members created`);

  // ── Seed Claims ──────────────────────────────────────
  console.log("📋 Seeding claims...");
  let claimCount = 0;
  for (const { id: memberId, clientId } of memberIds) {
    const numClaims = Math.floor(Math.random() * 5);
    for (let k = 0; k < numClaims; k++) {
      const diag = randomPick(DIAGNOSES);
      const billed = 50 + Math.floor(Math.random() * 2000);
      const approved = Math.floor(billed * (0.6 + Math.random() * 0.35));
      const statusVal = randomPick([
        "submitted",
        "under_review",
        "approved",
        "rejected",
        "paid",
      ] as const);

      const claim: Claim = {
        id: `claim-${randomId()}`,
        type: "claim",
        clientId,
        memberId,
        claimNumber: `CLM-${String(claimCount + 1).padStart(6, "0")}`,
        serviceDate: randomDate(new Date(2025, 0, 1), new Date(2026, 2, 28)),
        submissionDate: randomDate(new Date(2025, 0, 5), new Date(2026, 2, 28)),
        providerName: `Provider ${Math.floor(Math.random() * 50)}`,
        providerType: randomPick(PROVIDER_TYPES),
        diagnosis: diag.desc,
        icdCode: diag.icd,
        amountBilled: billed,
        amountApproved: statusVal === "rejected" ? 0 : approved,
        amountPaid: statusVal === "paid" ? approved : 0,
        currency: "EUR",
        status: statusVal,
        createdAt: now,
        updatedAt: now,
      };

      await upsertItem("claims", claim);
      claimCount++;
    }
  }
  console.log(`  ✓ ${claimCount} claims created`);

  console.log("\n✅ Seeding complete!");
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
