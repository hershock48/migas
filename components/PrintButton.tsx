"use client";

/**
 * The one JavaScript affordance on the one-pager. window.print() is the whole
 * feature: the browser's own dialog does PDF, paper, and margins better than any
 * code here could. The button hides itself from the printed sheet, and the page
 * keeps a keyboard hint beside it so the no-JS visitor still knows the document
 * prints — the print stylesheet does not need this button to work.
 */
export default function PrintButton({ label = "Print, or save as PDF" }: { label?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className="btn-primary print:hidden">
      {label}
    </button>
  );
}
