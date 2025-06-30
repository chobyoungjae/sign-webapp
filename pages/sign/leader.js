import React, { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";

export default function LeaderSignPage() {
  const sigRef = useRef();
  const [status, setStatus] = useState("ready");

  const handleClose = () => {
    window.close();
    if (window.opener) {
      window.opener.postMessage("close-sign-popup", "*");
    }
  };

  const handleSave = async () => {
    setStatus("saving");
    if (!sigRef.current || typeof sigRef.current.getTrimmedCanvas !== "function") {
      alert("서명 캔버스가 준비되지 않았습니다. 새로고침 후 다시 시도해 주세요.");
      setStatus("ready");
      return;
    }
    const dataUrl = sigRef.current.getTrimmedCanvas().toDataURL("image/png");
    const res = await fetch("/api/upload-signature", {
      method: "POST",
      body: JSON.stringify({ image: dataUrl, name: "팀장" }),
      headers: { "Content-Type": "application/json" },
    });
    if (res.ok) setStatus("done");
    else setStatus("ready");
  };

  return (
    <div style={{ width: 400, height: 400, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div style={{ marginBottom: 10, fontWeight: "bold" }}>
        {status === "done" ? "서명이 완료되었습니다." : "서명 후 '서명완료'를 눌러주세요."}
      </div>
      <SignatureCanvas
        ref={sigRef}
        penColor="black"
        canvasProps={{
          width: 320,
          height: 240,
          style: { border: "1px solid #000", borderRadius: 8, background: "#fafafa" },
        }}
      />
      <button
        onClick={status === "done" ? handleClose : handleSave}
        disabled={status === "saving"}
        style={{
          marginTop: 16,
          width: 320,
          height: 40,
          background: status === "done" ? "#4caf50" : "#1976d2",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          fontSize: 18,
          cursor: status === "saving" ? "not-allowed" : "pointer",
          transition: "background 0.2s",
        }}
      >
        {status === "ready" && "서명완료"}
        {status === "saving" && "서명 중..."}
        {status === "done" && "창 닫기"}
      </button>
    </div>
  );
}