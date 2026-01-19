import React, { useRef, useState, useEffect } from "react";
import SignaturePad from "signature_pad";
import { useRouter } from "next/router";

function getQueryParam(param, query) {
  return query[param] || "";
}

// 역할별 한글명칭(여러명 지원)
const roleLabels = {
  leader: ["팀장", "조병재"],
  reviewer: ["검토자"],
  ceo: ["대표"],
  // 필요시 추가
};

export default function SignPage() {
  const canvasRef = useRef();
  const sigPadRef = useRef();
  const [status, setStatus] = useState("ready");
  const [name, setName] = useState("");
  const [row, setRow] = useState("");
  const router = useRouter();
  const { role } = router.query;

  useEffect(() => {
    setName(getQueryParam("name", router.query));
    setRow(getQueryParam("row", router.query));
  }, [router.query]);

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
    const docName = getQueryParam("docName", router.query);
    try {
      const res = await fetch("/api/upload-signature", {
        method: "POST",
        body: JSON.stringify({ docName, dataUrl, row, role }),
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        setStatus("done");
        setTimeout(() => {
          window.close();
          if (window.opener) {
            // 동일 출처에만 메시지 전송 (보안 강화)
            window.opener.postMessage("close-sign-popup", window.location.origin);
          }
        }, 700);
      } else setStatus("ready");
    } catch (err) {
      setStatus("ready");
    }
  };

  const handleClear = () => {
    if (sigPadRef.current) {
      sigPadRef.current.clear();
    }
  };

  // 역할 한글명칭(여러명 지원)
  const roleLabelArr = roleLabels[role] || [role];
  const roleLabel = roleLabelArr.join(", ");
  // name이 여러명(쉼표구분)일 때 표시
  const nameArr = name ? name.split(",") : [];
  const nameLabel = nameArr.length > 1 ? nameArr.join(", ") : name;

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
          ? `${roleLabel} 서명이 완료되었습니다.`
          : `${roleLabel} 서명 후 '서명완료'를 눌러주세요.`}
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
        {status === "done" &&
          `${roleLabel} 서명이 완료되었습니다! 창이 곧 닫힙니다.`}
      </button>
      <div style={{ marginTop: 8, fontSize: 14, color: "#555" }}>
        {nameLabel && (
          <span>
            서명자: <b>{nameLabel}</b>
          </span>
        )}
        {role && (
          <span style={{ marginLeft: 8 }}>
            역할: <b>{roleLabel}</b>
          </span>
        )}
      </div>
    </div>
  );
}
