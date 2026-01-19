import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    function handleMessage(event) {
      // 동일 출처에서 온 메시지만 처리 (보안 강화)
      if (event.origin !== window.location.origin) {
        return;
      }
      if (event.data === "close-sign-popup") {
        window.location.reload(); // 팝업 닫힘 신호 받으면 새로고침
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const openSignPopup = () => {
    window.open("/sign/leader", "signPopup", "width=500,height=600");
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
      }}
    >
      <h1 style={{ marginBottom: 24 }}>메인 페이지</h1>
      <button
        onClick={openSignPopup}
        style={{
          width: 200,
          height: 50,
          fontSize: 20,
          borderRadius: 8,
          background: "#1976d2",
          color: "#fff",
          border: "none",
          cursor: "pointer",
        }}
      >
        서명하기
      </button>
    </div>
  );
}
