const fetch = require("node-fetch");

// AI Chat (gratis, proxy GPT)
async function aiChat(prompt) {
  try {
    let res = await fetch(`https://api.ryzendesu.vip/api/ai/gpt?text=${encodeURIComponent(prompt)}`);
    let data = await res.json();
    return data.result || "Gagal ambil jawaban AI";
  } catch (e) {
    return "Error API AI";
  }
}

// HD / Upscale
async function hdImage(url) {
  try {
    let res = await fetch(`https://api.ryzendesu.vip/api/tools/upscale?url=${encodeURIComponent(url)}`);
    let data = await res.json();
    return data.result || "Gagal memperjelas gambar";
  } catch (e) {
    return "Error API HD";
  }
}

// Search Google
async function googleSearch(query) {
  try {
    let res = await fetch(`https://api.ryzendesu.vip/api/search/google?query=${encodeURIComponent(query)}`);
    let data = await res.json();
    if (!data.result) return "Tidak ada hasil";
    return data.result.slice(0, 5).map((v, i) => `${i + 1}. ${v.title}\n${v.link}`).join("\n\n");
  } catch (e) {
    return "Error API Google";
  }
}

module.exports = { aiChat, hdImage, googleSearch };
