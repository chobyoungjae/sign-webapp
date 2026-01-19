import { parse } from "csv-parse/sync";

// 허용된 역할 목록
const VALID_ROLES = ["leader", "reviewer", "ceo"];

// 입력값 검증 함수
function validateInput(data) {
  const { docName, dataUrl, row, role } = data;

  // docName 검증
  if (!docName || typeof docName !== "string" || docName.length > 256) {
    return { valid: false, error: "유효하지 않은 문서명입니다." };
  }

  // role 검증
  if (!role || !VALID_ROLES.includes(role)) {
    return { valid: false, error: "유효하지 않은 역할입니다." };
  }

  // row 검증 (숫자형 문자열)
  if (row !== undefined && row !== "") {
    const rowNum = parseInt(row, 10);
    if (isNaN(rowNum) || rowNum < 0 || rowNum > 10000) {
      return { valid: false, error: "유효하지 않은 행 번호입니다." };
    }
  }

  // dataUrl 검증 (PNG base64)
  if (!dataUrl || typeof dataUrl !== "string") {
    return { valid: false, error: "서명 이미지가 필요합니다." };
  }
  if (!dataUrl.startsWith("data:image/png;base64,")) {
    return { valid: false, error: "유효하지 않은 이미지 형식입니다." };
  }
  // 크기 제한 (약 2MB)
  if (dataUrl.length > 2 * 1024 * 1024) {
    return { valid: false, error: "이미지 크기가 너무 큽니다." };
  }

  return { valid: true };
}

export default async function handler(req, res) {
  // HTTP 메서드 검증
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // 요청 본문 파싱
  let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch (e) {
    return res.status(400).json({ error: "잘못된 요청 형식입니다." });
  }

  // 입력값 검증
  const validation = validateInput(body);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }

  const { docName, ...rest } = body;

  // 1. 구글 시트에서 CSV로 데이터 읽기
  const sheetUrl =
    "https://docs.google.com/spreadsheets/d/1yKTyA71yTK8l92K48oJzATGQVEsDkUoXPiXNQPZleuI/gviz/tq?tqx=out:csv&sheet=문서ID";
  const csvRes = await fetch(sheetUrl);
  const csvText = await csvRes.text();

  // 2. CSV 파싱
  const records = parse(csvText, { columns: true, skip_empty_lines: true });

  // 3. 문서명으로 해당 행 찾기
  const row = records.find((r) => r["문서명"] === docName);
  if (!row || !row["최신 배포 URL"]) {
    return res
      .status(400)
      .json({ error: "문서명에 해당하는 웹앱 URL을 찾을 수 없습니다." });
  }
  const GAS_WEBAPP_URL = row["최신 배포 URL"];

  // 4. Apps Script로 POST
  const postBody = JSON.stringify(rest);
  const response = await fetch(GAS_WEBAPP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: postBody,
  });
  const text = await response.text();
  res.status(response.status).send(text);
}
