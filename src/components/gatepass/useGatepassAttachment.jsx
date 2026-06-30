import { useState } from "react";
import { downloadGatepassFile } from "../../services/gatepass.service"; // adjust path

/**
 * Hook — handles PDF (open in new tab) vs other files (force download).
 * Usage:
 *   const { openAttachment, loading } = useGatepassAttachment();
 *   <button onClick={() => openAttachment(gatepassId, filename)}>📎 {filename}</button>
 */
const useGatepassAttachment = () => {
  const [loading, setLoading] = useState(false);

  const openAttachment = async (gatepassId, filename) => {
    if (!gatepassId) return;
    setLoading(true);
    try {
      const { blob, contentType } = await downloadGatepassFile(gatepassId);
      const objectUrl = URL.createObjectURL(new Blob([blob], { type: contentType }));
      const isPdf = contentType === "application/pdf"
        || (filename ?? "").toLowerCase().endsWith(".pdf");

      if (isPdf) {
        // Open PDF inline in a new browser tab
        window.open(objectUrl, "_blank", "noopener,noreferrer");
        // Revoke after a short delay to allow the tab to load
        setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
      } else {
        // Force-download all other file types
        const anchor = document.createElement("a");
        anchor.href = objectUrl;
        anchor.download = filename ?? "attachment";
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(objectUrl);
      }
    } catch (err) {
      console.error("Failed to open attachment:", err);
      alert("Could not open the attachment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return { openAttachment, loading };
};

export default useGatepassAttachment;