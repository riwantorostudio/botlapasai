const { GoogleGenerativeAI } = require("@google/generative-ai");

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).send('Webhook Lapas Kerobokan Aktif (Ready)');
  }

  if (req.method === 'POST') {
    try {
      // Menyesuaikan dengan JSON dari Fonnte Anda
      const message = req.body.pesan || req.body.message;
      const sender = req.body.pengirim || req.body.sender;

      if (!message || !sender) {
        console.log("Data tidak lengkap:", req.body);
        return res.status(200).json({ status: 'ignored' });
      }

      const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: message }] }],
        systemInstruction: {
          role: "system",
          parts: [{ text: "Anda adalah asisten Lapas Kelas IIA Kerobokan. Layanan Senin-Jumat 09.00-11.30 & 13.30-15.00. Senin: Blok A, Selasa: Blok B, Rabu: Blok C, Kamis: Blok D. Syarat: KTP asli & KK. Jika butuh petugas atau tanya di luar data jawab: [OPERATOR]." }]
        }
      });

      let aiResponse = result.response.text();

      if (aiResponse.includes("[OPERATOR]")) {
        aiResponse = "Mohon maaf, pertanyaan Anda akan saya teruskan ke Petugas Lapas Kerobokan. Silakan tunggu balasan admin.";
      }

      // Kirim balik ke Fonnte
      const response = await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: { 'Authorization': process.env.FONNTE_TOKEN },
        body: new URLSearchParams({
          'target': sender,
          'message': aiResponse
        })
      });

      const resData = await response.json();
      console.log("Fonnte Response:", resData);

      return res.status(200).json({ status: 'ok' });

    } catch (error) {
      console.error("Error:", error);
      return res.status(200).json({ error: error.message });
    }
  }

  return res.status(405).send('Method Not Allowed');
}
