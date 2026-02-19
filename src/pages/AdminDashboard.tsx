cimport React, { useState } from 'react';
import { PANDA_CHANNELS_LIST } from '../config/channels'; // تأكد من المسار

const AdminDashboard: React.FC = () => {
  // --- States ---
  const [teamA, setTeamA] = useState('');
  const [teamB, setTeamB] = useState('');
  const [matchTime, setMatchTime] = useState('');
  const [selectedChannel, setSelectedChannel] = useState(PANDA_CHANNELS_LIST[0].slug);
  const [manualUrl, setManualUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // --- Logic: الحفظ ---
  const handleSaveMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const matchData = {
      teamA,
      teamB,
      matchTime,
      channelSlug: selectedChannel,
      isManual: selectedChannel === 'manual',
      customUrl: selectedChannel === 'manual' ? manualUrl : '',
      createdAt: new Date().toISOString(),
    };

    try {
      // هنا كتحط الكود ديال Firebase ديالك
      // await addDoc(collection(db, "matches"), matchData);
      
      console.log("Match Saved:", matchData);
      alert("✅ تم حفظ المباراة بنجاح!");
    } catch (error) {
      console.error(error);
      alert("❌ وقع مشكل أثناء الحفظ");
    } finally {
      setIsSaving(false);
    }
  };

  // --- Logic: كوبي بوست السوشيال ميديا ---
  const copySocialPost = () => {
    const channel = PANDA_CHANNELS_LIST.find(c => c.slug === selectedChannel);
    const postText = `
🚨 مباراة اليوم: ${teamA} 🆚 ${teamB}
⏰ التوقيت: ${matchTime}
📺 القناة: ${channel?.name || "بث مباشر"}
🔗 تابع المباراة من هنا:
https://dyalsite.com/live
    `;
    navigator.clipboard.writeText(postText);
    alert("📋 تم نسخ نص المنشور!");
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-2xl mx-auto bg-gray-900 rounded-2xl shadow-2xl border border-gray-800 p-8">
        <h1 className="text-3xl font-bold mb-8 text-center text-blue-500">لوحة تحكم المباريات ⚽</h1>

        <form onSubmit={handleSaveMatch} className="space-y-6">
          {/* الفرق */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">الفريق الأول</label>
              <input type="text" value={teamA} onChange={(e) => setTeamA(e.target.value)} className="w-full bg-gray-800 border border-gray-700 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="الرجاء" required />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">الفريق الثاني</label>
              <input type="text" value={teamB} onChange={(e) => setTeamB(e.target.value)} className="w-full bg-gray-800 border border-gray-700 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="الوداد" required />
            </div>
          </div>

          {/* الوقت */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">وقت المباراة</label>
            <input type="time" value={matchTime} onChange={(e) => setMatchTime(e.target.value)} className="w-full bg-gray-800 border border-gray-700 p-3 rounded-lg text-white" required />
          </div>

          {/* اختيار القناة */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">القناة الناقلة (Panda)</label>
            <select value={selectedChannel} onChange={(e) => setSelectedChannel(e.target.value)} className="w-full bg-gray-800 border border-gray-700 p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
              {PANDA_CHANNELS_LIST.map((channel) => (
                <option key={channel.id} value={channel.slug}>{channel.name}</option>
              ))}
            </select>
          </div>

          {/* حقل يدوي إضافي */}
          {selectedChannel === 'manual' && (
            <div className="animate-pulse">
              <label className="block text-sm text-gray-400 mb-2">رابط خارجي (Iframe/URL)</label>
              <textarea value={manualUrl} onChange={(e) => setManualUrl(e.target.value)} className="w-full bg-gray-800 border border-gray-700 p-3 rounded-lg h-24" placeholder="حط الرابط هنا..." />
            </div>
          )}

          {/* الأزرار */}
          <div className="flex flex-col gap-3">
            <button type="submit" disabled={isSaving} className="w-full bg-blue-600 hover:bg-blue-700 p-4 rounded-xl font-bold transition-all transform active:scale-95 disabled:bg-gray-600">
              {isSaving ? "جاري الحفظ..." : "حفظ ونشر المباراة 🚀"}
            </button>
            
            <button type="button" onClick={copySocialPost} className="w-full bg-green-600 hover:bg-green-700 p-3 rounded-xl font-semibold transition-all">
              نسخ منشور السوشيال ميديا 📢
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminDashboard;