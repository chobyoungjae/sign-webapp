import React, { useRef, useState, useEffect } from "react";
import SignaturePad from "signature_pad";

function getQueryParam(param) {
  if (typeof window === "undefined") return "";
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param) || "";
}

export default function CeoSignPage() {
  const canvasRef = useRef();
  const sigPadRef = useRef();
  const [status, setStatus] = useState("ready");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [row, setRow] = useState("");

  useEffect(() => {
    setName(getQueryParam("name"));
    setRole(getQueryParam("role"));
    setRow(getQueryParam("row"));
  }, []);

  useEffect(() => {
    if (canvasRef.current) {
      sigPadRef.current = new SignaturePad(canvasRef.current, {
        penColor: "black",
        backgroundColor: "#fff",
      });
    }
    return () => {
      if (sigPadRef.current) {
        sigPadRef.current.off();
        sigPadRef.current = null;
      }
    };
  }, [canvasRef.current]);

  const handleClose = () => {
    window.close();
    if (window.opener) {
      window.opener.postMessage("close-sign-popup", "*");
    }
  };

  const handleSave = async () => {
    setStatus("saving");
    if (!sigPadRef.current || sigPadRef.current.isEmpty()) {
      alert(
        "서명 캔버스가 준비되지 않았거나, 서명이 입력되지 않았습니다. 새로고침 후 다시 시도해 주세요."
      );
      setStatus("ready");
      return;
    }
    const dataUrl = sigPadRef.current.toDataURL();
    const docName = getQueryParam("docName"); // 쿼리스트링에서 동적으로 문서명 받기
    console.log("서명 전송 데이터", { dataUrl, row, role, docName });
    try {
      const res = await fetch("/api/upload-signature", {
        method: "POST",
        body: JSON.stringify({ docName, dataUrl, row, role }),
        headers: { "Content-Type": "application/json" },
      });
      const result = await res.text();
      console.log("Apps Script 응답:", result);
      if (res.ok) {
        setStatus("done");
        setTimeout(() => {
          window.close();
          if (window.opener) {
            window.opener.postMessage("close-sign-popup", "*");
          }
        }, 700); // 0.7초 후 자동 닫힘
      } else setStatus("ready");
    } catch (err) {
      console.error("Apps Script fetch 에러:", err);
      setStatus("ready");
    }
  };

  const handleClear = () => {
    if (sigPadRef.current) {
      sigPadRef.current.clear();
    }
  };

  return (
    <div
      style={{
        width: 400,
        height: 400,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#f5f5f5",
        borderRadius: 16,
        boxShadow: "0 2px 16px rgba(0,0,0,0.10)",
        margin: "auto",
      }}
    >
      <div style={{ marginBottom: 10, fontWeight: "bold" }}>
        {status === "done"
          ? "대표 서명이 완료되었습니다."
          : "대표 서명 후 '서명완료'를 눌러주세요."}
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#fff",
          border: "none",
          borderRadius: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          padding: 12,
          marginBottom: 12,
        }}
      >
        <canvas
          ref={canvasRef}
          width={320}
          height={240}
          style={{
            background: "#fff",
            borderRadius: 8,
            border: "2px solid #222",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}
        />
        <div
          style={{ width: 320, display: "flex", justifyContent: "flex-end" }}
        >
          <button
            onClick={handleClear}
            style={{
              marginTop: 8,
              width: 120,
              height: 32,
              background: "#bbb",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            지우기
          </button>
        </div>
      </div>
      <button
        onClick={handleSave}
        disabled={status === "saving"}
        style={{
          width: 320,
          height: 40,
          background: status === "saving" ? "#bbb" : "#1976d2",
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
        {status === "done" && "대표 서명이 완료되었습니다! 창이 곧 닫힙니다."}
      </button>
      <div style={{ marginTop: 8, fontSize: 14, color: "#555" }}>
        {name && (
          <span>
            서명자: <b>{name}</b>
          </span>
        )}
        {role && (
          <span style={{ marginLeft: 8 }}>
            역할: <b>{role}</b>
          </span>
        )}
      </div>
    </div>
  );
}
