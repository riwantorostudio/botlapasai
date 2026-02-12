const { GoogleGenerativeAI } = require("@google/generative-ai");

export default async function handler(req, res) {
  // 1. Dukungan untuk metode GET (Agar Webhook Fonnte Valid/Terverifikasi)
  if (req.method === 'GET') {
    return res.status(200).send('Webhook Lapas Kerobokan Aktif (Ready)');
  }

  // 2. Hanya proses jika metode adalah POST
  if (req.method === 'POST') {
    try {
      // Menangkap pesan dan nomor pengirim dari Fonnte
      const { message, sender } = req.body;

      if (!message || !sender) {
        return res.status(400).json({ status: 'error', message: 'Data tidak lengkap' });
      }

      // 3. Memanggil Gemini
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        systemInstruction: `
        Anda adalah asisten Lapas Kelas IIA Kerobokan. Gunakan data berikut sebagai pedoman:
        Layanan kunjungan di Lapas kelas IIA Kerobokan dilaksanakan secara terbatas setiap hari Senin sampai dengan Juma't, dengan pembagian waktu pada sesi pagi pukul 09.00–11.30 WIB dan sesi siang pukul 13.30–15.00 WIB.
        Jadwal Per Blok:
        - Senin: Blok A (Wisma Yudistira)
        - Selasa: Blok B (Wisma Yudistira)
        - Rabu: Wisma Bima (Blok C)
        - Kamis: Wisma Bima (Blok D)
        
        Syarat: Wajib membawa KTP asli dan Kartu Keluarga (Keluarga Inti: Orang tua, suami/istri, anak, atau saudara kandung). 
        Aturan: Berpakaian sopan, rapi, dan menggunakan sepatu.
        
        Jika user bertanya di luar data ini atau ingin bicara dengan petugas, jawab wajib mengandung kata: [OPERATOR]`
      });

      const result = await model.generateContent(message);
      let aiResponse = result.response.text();

      // 4. Logika jika AI perlu oper ke Admin
      if (aiResponse.includes("[OPERATOR]")) {
        aiResponse = "Mohon maaf, pertanyaan Anda akan saya teruskan ke Petugas Lapas. Silakan tunggu balasan admin atau hubungi kami di jam kerja.";
      }

      // 5. Kirim balasan ke WA melalui Fonnte
      await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: { 
          'Authorization': process.env.FONNTE_TOKEN 
        },
        body: new URLSearchParams({
          'target': sender,
          'message': aiResponse
        })
      });

      return res.status(200).json({ status: 'ok' });

    } catch (error) {
      console.error("Error:", error.message);
      return res.status(500).json({ error: "Terjadi kesalahan pada server AI" });
    }
  }

  // Jika metode bukan GET atau POST
  return res.status(405).send('Method Not Allowed');
}
