import makeWASocket, { useMultiFileAuthState, fetchLatestBaileysVersion } from "@whiskeysockets/baileys"
import qrcode from "qrcode-terminal"
import fs from "fs"
import fetch from "node-fetch"
import "./api.js"  // jalanin API lokal

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("session")
  const { version } = await fetchLatestBaileysVersion()
  const sock = makeWASocket({
    auth: state,
    version,
    printQRInTerminal: true
  })

  sock.ev.on("creds.update", saveCreds)

  sock.ev.on("connection.update", (update) => {
    const { connection } = update
    if (connection === "open") {
      console.log("✅ Bot WA tersambung!")
    }
  })

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const m = messages[0]
    if (!m.message || m.key.fromMe) return
    const body = m.message.conversation || m.message.extendedTextMessage?.text || ""
    const sender = m.key.remoteJid

    if (body === ".menu") {
      let menu = `
*📌 MENU BOT WA*
.menu - daftar menu
.sticker - ubah foto/video jadi stiker
.brat - teks random
.bratvideo - video random
.ai <tanya> - AI chat
.hd <url foto> - bikin foto HD
.google <query> - search google
      `
      await sock.sendMessage(sender, { text: menu })
    }

    // Sticker
    if (body === ".sticker" && m.message.imageMessage) {
      const buffer = await sock.downloadMediaMessage(m)
      await sock.sendMessage(sender, { sticker: buffer })
    }

    // Brat
    if (body === ".brat") {
      await sock.sendMessage(sender, { text: "bratt bratt 😝🔥" })
    }

    // Brat Video (contoh pakai link)
    if (body === ".bratvideo") {
      await sock.sendMessage(sender, { video: { url: "https://media.tenor.com/UnBratVideo.mp4" }, caption: "Bratt video 😂🔥" })
    }

    // AI
    if (body.startsWith(".ai ")) {
      let q = body.slice(4)
      let r = await fetch(`http://localhost:3000/ai?q=${encodeURIComponent(q)}`)
      let data = await r.json()
      await sock.sendMessage(sender, { text: data.answer })
    }

    // HD
    if (body.startsWith(".hd ")) {
      let url = body.slice(4)
      let r = await fetch(`http://localhost:3000/hd?url=${encodeURIComponent(url)}`)
      let data = await r.json()
      await sock.sendMessage(sender, { text: "HD Result: " + data.result })
    }

    // Google
    if (body.startsWith(".google ")) {
      let q = body.slice(8)
      let r = await fetch(`http://localhost:3000/google?q=${encodeURIComponent(q)}`)
      let data = await r.json()
      let hasil = data.result.slice(0, 5).map((v, i) => `${i+1}. ${v.title}\n${v.link}`).join("\n\n")
      await sock.sendMessage(sender, { text: hasil || "Tidak ada hasil" })
    }
  })
}

startBot()
