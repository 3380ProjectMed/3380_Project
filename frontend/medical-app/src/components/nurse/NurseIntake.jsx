import React, { useEffect, useRef } from "react";
import ClinicalWorkSpace from "../doctor/ClinicalWorkSpace";

/**
 * Wraps ClinicalWorkSpace and nudges it to "Vitals" after mount by
 * simulating a click on the Vitals tab. This avoids editing the original.
 */
export default function NurseIntake(props) {
  const hostRef = useRef(null);

  useEffect(() => {
    // After first paint, try clicking the Vitals tab if present
    const id = setTimeout(() => {
      const root = hostRef.current;
      if (!root) return;
      const vitalsBtn = root.querySelector(".tab-btn:nth-child(2)"); // notes, vitals, history
      vitalsBtn?.click();
    }, 0);
    return () => clearTimeout(id);
  }, []);

  return (
    <div ref={hostRef}>
      <ClinicalWorkSpace role="nurse" mode="intake" {...props} />
    </div>
  );
}
