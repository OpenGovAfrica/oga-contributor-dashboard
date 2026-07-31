"use client";

import { Printer } from "lucide-react";

export function PrintAction() {
  return (
    <button 
      className="print-button"
      onClick={() => window.print()}
    >
      <Printer className="w-4 h-4" /> Save as PDF
    </button>
  );
}
