// index.js
import makeWASocket, { useMultiFileAuthState, downloadMediaMessage } from "@whiskeysockets/baileys"
import qrcode from "qrcode-terminal"
import express from "express"
import fetch from "node-fetch"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
app.use(express.json())

// === START BOT ===
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./session")

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true, // QR/Pairing code di terminal
  })

  sock.ev.on("creds.update", saveCreds)

  sock.ev.on("messages.upsert", async (m) => {
    const msg = m.messages[0]
    if (!msg.message || msg.key.fromMe) return

    const from = msg.key.remoteJid
    const body =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      ""

    // === COMMAND HANDLER ===
    if (body.startsWith(".menu")) {
      const menu = `
🌟 *BOT MENU* 🌟

1️⃣ .sticker   → ubah gambar jadi stiker
2️⃣ .brat      → random brat image
3️⃣ .bratvideo → random brat video
4️⃣ .ai <teks> → tanya AI gratis
5️⃣ .hd (balas gambar) → enhance foto
6️⃣ .google <teks> → cari di Google
`
      await sock.sendMessage(from, { text: menu })
    }

    // === AI ===
    if (body.startsWith(".ai ")) {
      const q = body.replace(".ai ", "")
      try {
        let res = await fetch(
          `https://api.safone.dev/ai/gpt?q=${encodeURIComponent(q)}`
        )
        let data = await res.json()
        await sock.sendMessage(from, { text: data.answer || "gagal ambil jawaban" })
      } catch (e) {
        await sock.sendMessage(from, { text: "Error AI API" })
      }
    }

    // === Google Search ===
    if (body.startsWith(".google ")) {
      const q = body.replace(".google ", "")
      try {
        let res = await fetch(
          `https://api.safone.dev/google?query=${encodeURIComponent(q)}`
        )
        let data = await res.json()
        let hasil = data.results
          .map((v, i) => `${i + 1}. ${v.title}\n${v.link}`)
          .join("\n\n")
        await sock.sendMessage(from, { text: hasil })
      } catch (e) {
        await sock.sendMessage(from, { text: "Error Google API" })
      }
    }

    // === Sticker ===
    if (body.startsWith(".sticker")) {
      if (msg.message.imageMessage || msg.message.videoMessage) {
        const buffer = await downloadMediaMessage(msg, "buffer", {}, { logger: console })
        await sock.sendMessage(from, { sticker: buffer })
      } else {
        await sock.sendMessage(from, { text: "❌ Kirim gambar/video + caption *.sticker*" })
      }
    }

    // === Brat Image ===
    if (body.startsWith(".brat")) {
      try {
        let res = await fetch("https://api.waifu.pics/sfw/waifu")
        let data = await res.json()
        await sock.sendMessage(from, { image: { url: data.url }, caption: "😏 Brat Image" })
      } catch {
        await sock.sendMessage(from, { text: "Error ambil brat image" })
      }
    }

    // === Brat Video ===
    if (body.startsWith(".bratvideo")) {
      try {
        let res = await fetch("https://api.waifu.pics/sfw/dance")
        let data = await res.json()
        await sock.sendMessage(from, { video: { url: data.url }, caption: "🎥 Brat Video" })
      } catch {
        await sock.sendMessage(from, { text: "Error ambil brat video" })
      }
    }

    // === HD Enhance (balas gambar) ===
    if (body.startsWith(".hd")) {
      if (!msg.message?.imageMessage && !msg.message?.extendedTextMessage) {
        await sock.sendMessage(from, { text: "❌ Balas gambar dengan caption .hd" })
        return
      }

      let quoted = m.messages[0].message?.extendedTextMessage?.contextInfo?.quotedMessage
      if (!quoted?.imageMessage) {
        await sock.sendMessage(from, { text: "❌ Balas gambar dengan caption .hd" })
        return
      }

      const buffer = await downloadMediaMessage(
        { message: quoted },
        "buffer",
        {},
        { logger: console }
      )

      // Upload ke API HD gratis (contoh pakai safo API fake)
      try {
        let res = await fetch("https://api.safone.dev/ai/hd", {
          method: "POST",
          body: buffer,
          headers: { "Content-Type": "application/octet-stream" },
        })
        let arrayBuffer = await res.arrayBuffer()
        let outPath = path.join(__dirname, "hd.jpg")
        fs.writeFileSync(outPath, Buffer.from(arrayBuffer))
        await sock.sendMessage(from, { image: fs.readFileSync(outPath), caption: "🔍 HD Enhanced" })
      } catch {
        await sock.sendMessage(from, { text: "Error HD API" })
      }
    }
  })

  console.log("✅ Bot ready")
}

startBot()

// === EXPRESS API SERVER ===
app.get("/", (req, res) => {
  res.send("API jalan ✅")
})

app.listen(3000, () => console.log("🌐 API jalan di http://localhost:3000"))
