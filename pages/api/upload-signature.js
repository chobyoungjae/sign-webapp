import { parse } from "csv-parse/sync";

export default async function handler(req, res) {
  const { docName, ...rest } =
    typeof req.body === "string" ? JSON.parse(req.body) : req.body;

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
  const body = JSON.stringify(rest);
  const response = await fetch(GAS_WEBAPP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  const text = await response.text();
  res.status(response.status).send(text);
}
