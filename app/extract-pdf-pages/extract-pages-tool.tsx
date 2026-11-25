"use client";

import PageSelectionTool from "@/components/site/PageSelectionTool";

/** Client wrapper: allows the page to stay a server component with metadata. */
export default function ExtractPagesTool() {
  return (
    <PageSelectionTool
      endpoint="/api/extract-pdf-pages"
      fieldName="pagesToKeep"
      actionLabel="Pages to extract"
      processingMessage="Extracting pages…"
      buttonLabel="Extract pages"
      downloadLabel="Download extracted PDF"
      inputHint={(pageCount) =>
        `This document has ${pageCount} page${pageCount === 1 ? "" : "s"}. Type the pages to keep, e.g. 2 or 1-3,5.`
      }
      resultStats={(_pageCount, kept) => [{ label: "Pages extracted", value: kept }]}
      resultNote={(pageCount, kept) =>
        kept === pageCount
          ? "Every page was selected, so the extracted copy contains the whole document."
          : "Only the pages you selected were copied into the new PDF."
      }
    />
  );
}
