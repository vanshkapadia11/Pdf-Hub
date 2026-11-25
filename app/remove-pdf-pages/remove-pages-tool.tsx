"use client";

import PageSelectionTool from "@/components/site/PageSelectionTool";

/** Client wrapper: allows the page to stay a server component with metadata. */
export default function RemovePagesTool() {
  return (
    <PageSelectionTool
      endpoint="/api/remove-pdf-pages"
      fieldName="pagesToRemove"
      actionLabel="Pages to remove"
      processingMessage="Removing pages…"
      buttonLabel="Remove pages"
      downloadLabel="Download updated PDF"
      inputHint={(pageCount) =>
        `This document has ${pageCount} page${pageCount === 1 ? "" : "s"}. Type the pages to delete, e.g. 2 or 1-3,5.`
      }
      resultStats={(pageCount, removed) => [
        { label: "Pages removed", value: removed },
        { label: "Pages remaining", value: pageCount - removed },
      ]}
    />
  );
}
