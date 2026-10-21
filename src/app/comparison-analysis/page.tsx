"use client";

import { Calendar } from "lucide-react";
import {  } from "@/components/layout/TIDLogo";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent } from "@/components/ui/card";

export default function ComparisonAnalysisPage() {
  return (
    <>
      <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
        <div className="flex h-16 items-center gap-4 px-4">
          <SidebarTrigger />
          <div className="flex items-center gap-3 flex-1">
            
            <h1 className="text-xl font-bold text-foreground">
              Tourism Insight AI — Comparison & Analysis
            </h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">
              {new Date().toLocaleDateString("en-US", { dateStyle: "long" })}
            </span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="p-8 bg-card border-border shadow-lg">
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <h2 className="text-2xl font-bold mb-4 text-foreground">
                Comparison & Analysis
              </h2>
              <p className="text-sm">
                Comparison and analysis tools will be displayed here.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}

