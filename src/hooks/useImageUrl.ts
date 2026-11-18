"use client";
import { useEffect, useState } from "react";
import { predictionService } from "@/services/predictionService";
import { errorMessage } from "@/utils/format";

/** Object URL of a screening's X-ray, fetched with the Bearer token; revoked on change and unmount.
 *  Pass null when the screening has no image. */
export function useImageUrl(predictionId: string | null | undefined) {
  const [state, setState] = useState<{ id: string; url: string; error: string } | null>(null);
  useEffect(() => {
    if (!predictionId) return;
    let url = "";
    let active = true;
    predictionService
      .imageUrl(predictionId)
      .then((value) => {
        url = value;
        if (active) setState({ id: predictionId, url, error: "" });
        else URL.revokeObjectURL(url);
      })
      .catch((reason) => {
        if (active) setState({ id: predictionId, url: "", error: errorMessage(reason) });
      });
    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [predictionId]);
  // A state left over from a previous screening is not shown.
  const current = state?.id === predictionId ? state : null;
  return {
    url: current?.url || "",
    error: current?.error || "",
    loading: !!predictionId && !current,
  };
}
