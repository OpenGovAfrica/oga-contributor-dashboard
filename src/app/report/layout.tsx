import type { Metadata } from "next";
import "./report.css";

export const metadata: Metadata = {
  title: "Executive Report - OpenGovAfrica",
};

export default function ReportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[#f3f4f6] text-black print:bg-white m-0 p-0 antialiased min-h-screen flex justify-center w-full !text-[var(--color-text-primary)]">
      {children}
    </div>
  );
}
