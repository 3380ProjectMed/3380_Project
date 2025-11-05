import React, { useEffect, useRef } from "react";
import NurseClinicalWorkSpace from "./NurseClinicalWorkSpace";

/**
 * Wraps NurseClinicalWorkSpace and nudges it to "Vitals" after mount by
 * simulating a click on the Vitals tab.
 */
export default function NurseIntake(props) {
  const hostRef = useRef(null);

  useEffect(() => {
    // After first paint, try clicking the Vitals tab if present
    const id = setTimeout(() => {
      const root = hostRef.current;
      if (!root) return;
      const vitalsBtn = root.querySelector(".tabs button:nth-child(2)"); // notes, vitals, history
      vitalsBtn?.click();
    }, 0);
    return () => clearTimeout(id);
  }, []);

  return (
    <div ref={hostRef} className="nurse-page">
      <NurseClinicalWorkSpace role="nurse" mode="intake" {...props} />
    </div>
  );
}
