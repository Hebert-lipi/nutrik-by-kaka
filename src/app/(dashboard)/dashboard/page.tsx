"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="space-y-5 md:space-y-6">
      <div>
        <h2 className="text-h2 font-extrabold">Nutrik by Kaká</h2>
        <p className="mt-2 text-body14 text-text-secondary">
          Manage your patients and create diet plans with a clean, mobile-first experience.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard title="Patients" value="0" meta={<span className="text-small12 text-text-muted">Ready to add</span>} />
        <StatCard title="Diet plans" value="0" meta={<span className="text-small12 text-text-muted">Create your first plan</span>} />
        <StatCard
          title="Published"
          value="0"
          meta={<span className="text-small12 text-text-muted">Preview when ready</span>}
        />
      </div>

      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-title16 font-extrabold text-text-primary">Patients</p>
              <p className="mt-1 text-body14 text-text-secondary">Your patient list will appear here.</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => alert("Add patient (MVP placeholder)")}
                className="rounded-lg"
              >
                Add patient
              </Button>
              <Link
                href="/diet-plans"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-95"
              >
                Create diet plan
              </Link>
            </div>
          </div>

          <EmptyState
            title="No patients yet"
            description="Start by adding a patient to create a personalized diet plan."
            action={{ label: "Add patient", onClick: () => alert("Add patient (MVP placeholder)") }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

