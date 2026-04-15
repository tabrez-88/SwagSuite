// Idempotent seed for built-in imprint options.
// Run once after migration: `tsx scripts/seed-imprint-options.ts`
// Safe to re-run — uses ON CONFLICT DO NOTHING on (type, value) unique index.
import "dotenv/config";
import { db } from "../server/db";
import { imprintOptions } from "../shared/schema";

const BUILT_IN_LOCATIONS = [
  { value: "left_chest", label: "Left Chest" },
  { value: "right_chest", label: "Right Chest" },
  { value: "full_front", label: "Full Front" },
  { value: "full_back", label: "Full Back" },
  { value: "left_sleeve", label: "Left Sleeve" },
  { value: "right_sleeve", label: "Right Sleeve" },
  { value: "collar", label: "Collar / Nape" },
  { value: "cap_front", label: "Cap Front" },
  { value: "cap_back", label: "Cap Back" },
  { value: "front_panel", label: "Front Panel" },
];

const BUILT_IN_METHODS = [
  { value: "screen_print", label: "Screen Printing" },
  { value: "embroidery", label: "Embroidery" },
  { value: "heat_transfer", label: "Heat Transfer" },
  { value: "dtf", label: "Direct-to-Film (DTF)" },
  { value: "sublimation", label: "Sublimation" },
  { value: "laser_engraving", label: "Laser Engraving" },
  { value: "pad_print", label: "Pad Printing" },
  { value: "deboss", label: "Deboss / Emboss" },
  { value: "none", label: "No Decoration" },
];

async function run() {
  const locationRows = BUILT_IN_LOCATIONS.map((o, i) => ({
    type: "location" as const,
    value: o.value,
    label: o.label,
    displayOrder: i,
    isActive: true,
    isBuiltIn: true,
  }));
  const methodRows = BUILT_IN_METHODS.map((o, i) => ({
    type: "method" as const,
    value: o.value,
    label: o.label,
    displayOrder: i,
    isActive: true,
    isBuiltIn: true,
  }));

  await db
    .insert(imprintOptions)
    .values([...locationRows, ...methodRows])
    .onConflictDoNothing({ target: [imprintOptions.type, imprintOptions.value] });

  const rows = await db.select().from(imprintOptions);
  console.log(`imprint_options rows: ${rows.length}`);
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
