import { Suspense } from "react";
import type { Metadata } from "next";
import { RefuelingForm } from "@/components/RefuelingForm";

export const metadata: Metadata = {
  title: "Ny tankning",
  description:
    "Logga en tankning på under 15 sekunder – TankKoll räknar ut körsträcka och förbrukning automatiskt.",
};

export default function RefuelingPage() {
  return (
    <Suspense>
      <RefuelingForm />
    </Suspense>
  );
}
