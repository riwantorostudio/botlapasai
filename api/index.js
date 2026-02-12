const { GoogleGenerativeAI } = require("@google/generative-ai");

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).send('Webhook Lapas Kerobokan Aktif (Ready)');
  }

  if (req.method === 'POST') {
    try {
      const { message, sender } = req.body;

      if (!message || !sender) {
        return res.status(200).json({ status: 'ignored', message: 'Bukan pesan teks' });
      }

      const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);
      
      // PERBAIKAN DI SINI: Menggunakan nama model lengkap
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash", 
      });

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: message }] }],
        systemInstruction: {
          role: "system",
          parts: [{ text: "Anda adalah asisten Lapas Kelas IIA Kerobokan. Layanan Senin-Jumat 09.00-11.30 & 13.30-15.00. Senin: Blok A, Selasa: Blok B, Rabu: Blok C, Kamis: Blok D. Syarat: KTP asli & KK. Jika butuh petugas jawab: [OPERATOR]." }]
        }
      });

      let aiResponse = result.response.text();

      if (aiResponse.includes("[OPERATOR]")) {
        aiResponse = "Mohon maaf, pertanyaan Anda akan saya teruskan ke Petugas Lapas. Silakan tunggu balasan admin.";
      }

      await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: { 'Authorization': process.env.FONNTE_TOKEN },
        body: new URLSearchParams({
          'target': sender,
          'message': aiResponse
        })
      });

      return res.status(200).json({ status: 'ok' });

    } catch (error) {
      console.error("Error Detail:", error);
      return res.status(200).json({ error: "Internal Server Error" }); 
      // Kita tetap kirim 200 agar Fonnte tidak terus-terusan mencoba kirim ulang jika error
    }
  }

  return res.status(405).send('Method Not Allowed');
}
