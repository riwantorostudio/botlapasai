const { GoogleGenerativeAI } = require("@google/generative-ai");

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Hanya menerima POST');

  // 1. Menangkap pesan dari Fonnte
  const { message, sender } = req.body;

  // 2. Memanggil Gemini
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    systemInstruction: `
    Anda adalah asisten Lapas Kelas IIA Kerobokan. Gunakan data berikut:
    ${"Layanan kunjungan di Lapas kelas IIA Kerobokan dilaksanakan secara terbatas setiap hari Senin sampai dengan Juma't, dengan pembagian waktu pada sesi pagi pukul 09.00–11.30 WIB dan sesi siang pukul 13.30–15.00 WIB, Senin untuk blok A wisma Yudistira, Selasa Untuk Blok B wisma Yudistira, Rabu untuk Wisma Bima blok C, blok D untuk wisma Bima. Setiap pengunjung wajib membawa dokumen identitas berupa KTP asli serta Kartu Keluarga untuk membuktikan hubungan sebagai keluarga inti, seperti orang tua, suami/istri, anak, atau saudara kandung. Selama berada di lingkungan Lapas, pengunjung diharuskan berpakaian sopan dan rapi serta menggunakan sepatu. "}
    `
  });

  try {
    const result = await model.generateContent(message);
    let aiResponse = result.response.text();

    // 3. Logika jika AI perlu oper ke Admin
    if (aiResponse.includes("[OPERATOR]")) {
      aiResponse = "Mohon maaf, pertanyaan Anda akan saya teruskan ke Petugas Lapas. Silakan tunggu balasan admin.";
    }

    // 4. Perintahkan Fonnte kirim balasan ke WA
    await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: { 'Authorization': process.env.FONNTE_TOKEN },
      body: new URLSearchParams({
        'target': sender,
        'message': aiResponse
      })
    });

    res.status(200).json({ status: 'ok' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}