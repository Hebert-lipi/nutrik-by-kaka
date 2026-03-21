"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHead } from "@/components/ui/table";
import { StatusPill } from "@/components/ui/status-pill";

const columns = ["Plan", "Status", "Patients", "Action"];

export default function DietPlansPage() {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-title16 font-extrabold text-text-primary">Diet Plans</p>
        <p className="mt-1 text-body14 text-text-secondary">Draft or publish diets per patient.</p>
      </div>

      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-yellow/20 border border-yellow/25" />
              <div>
                <p className="text-body14 font-semibold text-text-secondary">Your plans</p>
                <p className="text-small12 text-neutral-500">Status pills for draft/published</p>
              </div>
            </div>

            <Button variant="primary" className="rounded-lg" onClick={() => alert("Create plan (MVP placeholder)")}>
              Create diet plan
            </Button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-bg-0">
            <Table className="min-w-[560px]">
              <thead>
                <tr>
                  <TableHead>{columns[0]}</TableHead>
                  <TableHead>{columns[1]}</TableHead>
                  <TableHead>{columns[2]}</TableHead>
                  <TableHead className="text-right">{columns[3]}</TableHead>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={columns.length} className="px-4 py-10">
                    <div className="mx-auto max-w-md space-y-3 rounded-lg border border-neutral-200 bg-bg-0 p-6 text-center shadow-soft">
                      <p className="text-h4 text-text-primary">No diet plans yet</p>
                      <p className="text-body14 text-text-secondary">
                        Create your first diet plan. When you publish, status will update automatically.
                      </p>
                      <div className="flex items-center justify-center gap-2">
                        <StatusPill status="draft" />
                        <StatusPill status="published" />
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </Table>
          </div>

          <p className="text-small12 text-neutral-500">List structure is ready for Supabase data next phase.</p>
        </CardContent>
      </Card>
    </div>
  );
}

