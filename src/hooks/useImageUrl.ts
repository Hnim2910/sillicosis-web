"use client";
import { useEffect, useState } from "react";
import { imageService } from "@/services/imageService";
import { errorMessage } from "@/utils/format";

/** Object URL of a stored image, fetched with the Bearer token; revoked on change and unmount. */
export function useImageUrl(imageId: string | null | undefined) {
  const [state, setState] = useState<{ id: string; url: string; error: string } | null>(null);
  useEffect(() => {
    if (!imageId) return;
    let url = "";
    let active = true;
    imageService
      .contentUrl(imageId)
      .then((value) => {
        url = value;
        if (active) setState({ id: imageId, url, error: "" });
        else URL.revokeObjectURL(url);
      })
      .catch((reason) => {
        if (active) setState({ id: imageId, url: "", error: errorMessage(reason) });
      });
    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [imageId]);
  // A state left over from a previous image id is not shown.
  const current = state?.id === imageId ? state : null;
  return { url: current?.url || "", error: current?.error || "", loading: !!imageId && !current };
}
