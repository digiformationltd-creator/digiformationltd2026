import { useEffect } from "react";
import { trackPageView } from "@/lib/attribution";

const AttributionTracker = () => {
  useEffect(() => {
    void trackPageView();
  }, []);
  return null;
};

export default AttributionTracker;
