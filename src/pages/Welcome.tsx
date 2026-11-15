import { useNavigate } from "react-router-dom";
import { Wrench, ArrowRight, ShieldCheck, Zap } from "lucide-react";

export function WelcomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-6 md:p-12 relative overflow-hidden">
      {/* Background Glow Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-orange-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header / Logo */}
      <div className="flex items-center gap-3 z-10">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-orange-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Wrench className="w-6 h-6 text-white" />
        </div>
        <span className="text-2xl font-black tracking-wider bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
          SYNLY
        </span>
      </div>

      {/* Hero Content */}
      <div className="max-w-2xl mx-auto text-center z-10 my-auto py-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-orange-400 text-xs font-semibold mb-6">
          <Zap className="w-3.5 h-3.5" />
          <span>منصة خدمات ومساعدة السيارات الذكية</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
          طريقك آمن، ومراكز الصيانة أصبحت{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-orange-500">
            أقرب إليك
          </span>
        </h1>
        <p className="text-slate-400 text-base md:text-lg mb-10 leading-relaxed">
          اربط مركز صيانك أو متجر قطع الغيار الخاص بك بآلاف السائقين على الطريق واستقبل
          طلبات الصيانة والطوارئ الفورية لحظة بلحظة.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => navigate("/login")}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold flex items-center justify-center gap-3 shadow-xl shadow-blue-600/30 transition-all transform hover:-translate-y-0.5"
          >
            <span>ابدأ الآن وتسجيل الدخول</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Footer Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto w-full z-10 pt-6 border-t border-slate-900">
        <div className="flex items-center gap-3 text-slate-400 text-sm">
          <ShieldCheck className="w-5 h-5 text-blue-500 flex-shrink-0" />
          <span>مراكز صيانة معتمدة وموثوقة</span>
        </div>
        <div className="flex items-center gap-3 text-slate-400 text-sm">
          <Zap className="w-5 h-5 text-orange-500 flex-shrink-0" />
          <span>استقبال طلبات الطوارئ لحظياً</span>
        </div>
        <div className="flex items-center gap-3 text-slate-400 text-sm">
          <Wrench className="w-5 h-5 text-blue-400 flex-shrink-0" />
          <span>إدارة متكاملة لقطع الغيار والطلبات</span>
        </div>
      </div>
    </div>
  );
}