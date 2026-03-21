"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyTableRow } from "@/components/ui/empty-table-row";
import { Table, TableHead } from "@/components/ui/table";

export default function PatientsPage() {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-title16 font-extrabold text-text-primary">Patients</p>
        <p className="mt-1 text-body14 text-text-secondary">Manage patient profiles and assign diets.</p>
      </div>

      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/15 border border-primary/25" />
              <div>
                <p className="text-body14 font-semibold text-text-secondary">Patient directory</p>
                <p className="text-small12 text-neutral-500">Ready for a list + detail view</p>
              </div>
            </div>

            <Button
              variant="primary"
              className="rounded-lg"
              onClick={() => alert("Add patient (MVP placeholder)")}
            >
              Add patient
            </Button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-bg-0">
            <Table className="min-w-[560px]">
              <thead>
                <tr>
                  <TableHead>Patient</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Assigned diet</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </tr>
              </thead>
              <tbody>
                <EmptyTableRow colSpan={4} message="No patients yet. Add a patient to start a diet plan." />
              </tbody>
            </Table>
          </div>

          <p className="text-small12 text-neutral-500">
            Tip: wire this list to Supabase in the next phase.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

