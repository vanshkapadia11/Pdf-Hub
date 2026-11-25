"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { callToolApi, infoHeader, type ToolApiResult } from "@/lib/client/api";

export interface ToolJobState {
  isProcessing: boolean;
  error: string | null;
  result: {
    url: string;
    filename: string;
    size: number;
    headers: Headers;
  } | null;
}

/**
 * Shared state machine for tool pages: processing flag, error message,
 * and a result blob URL that is revoked automatically when replaced or
 * on unmount (no memory leaks).
 */
export function useToolJob() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ToolJobState["result"]>(null);
  const urlRef = useRef<string | null>(null);

  // Revoke the previous object URL whenever a new result arrives.
  const adoptUrl = useCallback((url: string) => {
    if (urlRef.current && urlRef.current !== url) {
      URL.revokeObjectURL(urlRef.current);
    }
    urlRef.current = url;
  }, []);

  // Revoke on unmount.
  useEffect(() => {
    return () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setResult(null);
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
  }, []);

  const run = useCallback(
    async (
      endpoint: string,
      formData: FormData,
      options?: { onDone?: (api: ToolApiResult, url: string) => void }
    ): Promise<boolean> => {
      setIsProcessing(true);
      setError(null);
      try {
        const api = await callToolApi(endpoint, formData);
        if (!api.ok || !api.blob) {
          setError(api.error || "The request failed. Please try again.");
          return false;
        }
        const url = URL.createObjectURL(api.blob);
        adoptUrl(url);
        setResult({
          url,
          filename: api.filename || "download",
          size: api.blob.size,
          headers: api.headers,
        });
        options?.onDone?.(api, url);
        return true;
      } finally {
        setIsProcessing(false);
      }
    },
    [adoptUrl]
  );

  return { isProcessing, error, result, run, reset, setError };
}

export { infoHeader };
