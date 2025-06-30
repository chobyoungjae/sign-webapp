export default async function handler(req, res) {
    if (req.method === "POST") {
      try {
        const { image, name } = req.body;
        res.status(200).json({ ok: true, message: "서명 이미지가 정상적으로 전송되었습니다." });
      } catch (e) {
        res.status(500).json({ ok: false, message: "에러 발생", error: e?.toString() });
      }
    } else {
      res.status(405).json({ message: "Method Not Allowed" });
    }
  }