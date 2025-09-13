import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = 3000;

// AI (ChatGPT gratis)
app.get("/ai", async (req, res) => {
  let q = req.query.q;
  if (!q) return res.json({ error: "Masukkan pertanyaan ?q=" });

  try {
    let r = await fetch(`https://api.akuari.my.id/ai/gpt?chat=${encodeURIComponent(q)}`);
    let data = await r.json();
    res.json({ answer: data.respon || data.result || "Tidak ada jawaban" });
  } catch (e) {
    res.json({ error: e.message });
  }
});

// HD (Enhance foto)
app.get("/hd", async (req, res) => {
  let url = req.query.url;
  if (!url) return res.json({ error: "Masukkan link gambar ?url=" });

  try {
    let r = await fetch(`https://api.akuari.my.id/photo/hd?link=${encodeURIComponent(url)}`);
    let data = await r.json();
    res.json({ result: data.result || "Gagal proses HD" });
  } catch (e) {
    res.json({ error: e.message });
  }
});

// Google Search
app.get("/google", async (req, res) => {
  let q = req.query.q;
  if (!q) return res.json({ error: "Masukkan query ?q=" });

  try {
    let r = await fetch(`https://api.akuari.my.id/search/google?query=${encodeURIComponent(q)}`);
    let data = await r.json();
    res.json({ result: data.result || data.hasil || [] });
  } catch (e) {
    res.json({ error: e.message });
  }
});

app.listen(PORT, () => console.log(`✅ API jalan di http://localhost:${PORT}`));
