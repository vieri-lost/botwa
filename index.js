const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  downloadMediaMessage
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const fs = require("fs");
const { exec } = require("child_process");
const { aiChat, hdImage, googleSearch } = require("./apis");

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./session");
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger: pino({ level: "silent" }),
    auth: state,
    printQRInTerminal: false,
  });

  // Pairing code
  if (!sock.authState.creds.registered) {
    let phoneNumber = process.env.NUMBER || "62xxxxxxx";
    let code = await sock.requestPairingCode(phoneNumber);
    console.log("Pairing code:", code);
  }

  sock.ev.on("creds.update", saveCreds);

  // Handler pesan
  sock.ev.on("messages.upsert", async (m) => {
    const msg = m.messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const from = msg.key.remoteJid;
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";

    // Menu
    if (text === "menu") {
      let menu = `*📌 MENU BOT*
1. sticker (balas gambar/vid)
2. brat
3. bratvideo
4. ai <teks>
5. hd <url gambar>
6. google <query>`;
      await sock.sendMessage(from, { text: menu }, { quoted: msg });
    }

    // Sticker (reply image/video)
    else if (text === "sticker") {
      if (msg.message.imageMessage || msg.message.videoMessage) {
        let buffer = await downloadMediaMessage(msg, "buffer", {}, { logger: pino() });
        await sock.sendMessage(from, { sticker: buffer }, { quoted: msg });
      } else {
        await sock.sendMessage(from, { text: "Reply gambar/video dengan ketik: sticker" }, { quoted: msg });
      }
    }

    // Brat (audio)
    else if (text === "brat") {
      await sock.sendMessage(from, {
        audio: { url: "https://file.niduka.dev/file/brat.mp3" },
        mimetype: "audio/mpeg",
        ptt: true
      }, { quoted: msg });
    }

    // Bratvideo
    else if (text === "bratvideo") {
      await sock.sendMessage(from, {
        video: { url: "https://file.niduka.dev/file/brat.mp4" },
        caption: "Brat Video 🎥"
      }, { quoted: msg });
    }

    // AI
    else if (text.startsWith("ai ")) {
      let query = text.slice(3);
      let res = await aiChat(query);
      await sock.sendMessage(from, { text: res }, { quoted: msg });
    }

    // HD
    else if (text.startsWith("hd ")) {
      let url = text.slice(3);
      let res = await hdImage(url);
      await sock.sendMessage(from, { text: res }, { quoted: msg });
    }

    // Google
    else if (text.startsWith("google ")) {
      let query = text.slice(7);
      let res = await googleSearch(query);
      await sock.sendMessage(from, { text: res }, { quoted: msg });
    }
  });
}

startBot();
