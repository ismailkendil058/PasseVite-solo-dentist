import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Doctor {
  id: string;
  name: string;
  initial: string;
}

interface DoctorQueueInfo {
  doctor: Doctor;
  nextPatient: string;
  nextPatientName?: string;
  waitingCount: number;
}

interface Announcement {
  clientId: string;
  patientName?: string;
  doctorName: string;
}

const LiveClock = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="text-right">
      <p className="text-xl md:text-3xl font-black text-foreground tabular-nums tracking-tighter">
        {time.toLocaleTimeString('fr-DZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </p>
      <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 capitalize font-bold tracking-widest opacity-60">
        {time.toLocaleDateString('fr-DZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </p>
    </div>
  );
};

const TV = () => {
  const [doctorQueues, setDoctorQueues] = useState<DoctorQueueInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const announcementTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevWaitingIds = useRef<Set<string>>(new Set());
  const waitingMeta = useRef<Map<string, { clientId: string; patientName?: string; doctorName: string }>>(new Map());

  const speakAnnouncement = useCallback((clientId: string, patientName: string | undefined, doctorName: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const displayName = patientName || `Monsieur ou Madame ${clientId}`;
    const text =
      `${displayName}, ` +
      `veuillez vous présenter, s'il vous plaît, ` +
      `au cabinet du Docteur ${doctorName}. ` +
      `Merci.`;

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'fr-FR';
    utter.rate = 0.88;
    utter.pitch = 1.05;
    utter.volume = 1;

    const voices = window.speechSynthesis.getVoices();
    const frVoice = voices.find(v => v.lang.startsWith('fr') && v.localService) ||
      voices.find(v => v.lang.startsWith('fr'));
    if (frVoice) utter.voice = frVoice;

    utter.onend = () => {
      setTimeout(() => {
        const utter2 = new SpeechSynthesisUtterance(text);
        utter2.lang = utter.lang;
        utter2.rate = utter.rate;
        utter2.pitch = utter.pitch;
        utter2.volume = utter.volume;
        if (frVoice) utter2.voice = frVoice;
        window.speechSynthesis.speak(utter2);
      }, 1200);
    };

    window.speechSynthesis.speak(utter);
  }, []);

  const showAnnouncement = useCallback((clientId: string, patientName: string | undefined, doctorName: string) => {
    if (announcementTimer.current) clearTimeout(announcementTimer.current);
    setAnnouncement({ clientId, patientName, doctorName });
    speakAnnouncement(clientId, patientName, doctorName);
    announcementTimer.current = setTimeout(() => {
      setAnnouncement(null);
    }, 10000);
  }, [speakAnnouncement]);

  const fetchQueue = useCallback(async () => {
    const [docsRes, sessionRes] = await Promise.all([
      supabase.from('doctors').select('id, name, initial').order('name', { ascending: true }),
      supabase.from('sessions').select('id').eq('is_active', true).maybeSingle()
    ]);

    const doctors = docsRes.data;
    const session = sessionRes.data;

    if (!doctors || doctors.length === 0) {
      setDoctorQueues([]);
      return;
    }

    if (!session) {
      setDoctorQueues(
        doctors.map(d => ({ doctor: d, nextPatient: '—', waitingCount: 0 }))
      );
      prevWaitingIds.current = new Set();
      waitingMeta.current = new Map();
      return;
    }

    const { data: allSessionEntries } = await supabase
      .from('queue_entries')
      .select('id, status, client_id, patient_name, doctor_id, state, state_number, doctor:doctors(name, initial)')
      .eq('session_id', session.id);

    const waitingEntries = (allSessionEntries || []).filter(e => e.status === 'waiting');
    const inCabinetIds = new Set((allSessionEntries || []).filter(e => e.status === 'in_cabinet').map(e => e.id));
    const currentWaitingIds = new Set(waitingEntries.map(e => e.id));

    prevWaitingIds.current.forEach(id => {
      if (!currentWaitingIds.has(id)) {
        if (inCabinetIds.has(id)) {
          const meta = waitingMeta.current.get(id);
          if (meta) {
            showAnnouncement(meta.clientId, meta.patientName, meta.doctorName);
          }
        }
        waitingMeta.current.delete(id);
      }
    });

    waitingEntries.forEach(e => {
      if (!waitingMeta.current.has(e.id)) {
        waitingMeta.current.set(e.id, {
          clientId: e.client_id,
          patientName: e.patient_name,
          doctorName: (e as any).doctor?.name || '',
        });
      }
    });

    prevWaitingIds.current = currentWaitingIds;

    const newQueues: DoctorQueueInfo[] = doctors.map(doctor => {
      const doctorEntries = (waitingEntries || []).filter(
        e => e.doctor_id === doctor.id
      );
      const sorted = [...doctorEntries].sort((a, b) => {
        if (a.state === 'U' && b.state !== 'U') return -1;
        if (a.state !== 'U' && b.state === 'U') return 1;
        if (a.state === 'U' && b.state === 'U') return a.state_number - b.state_number;

        const getRank = (e: any) => {
          const num = e.state_number || 0;
          if (e.state === 'N') return num * 2 - 1;
          if (e.state === 'R') return num * 2;
          return 999;
        };

        const rankA = getRank(a);
        const rankB = getRank(b);

        if (rankA !== rankB) return rankA - rankB;
        return (a.state_number || 0) - (b.state_number || 0);
      });
      return {
        doctor,
        nextPatient: sorted.length > 0 ? sorted[0].client_id : '—',
        nextPatientName: sorted.length > 0 ? sorted[0].patient_name : undefined,
        waitingCount: sorted.length,
      };
    });

    setDoctorQueues(newQueues);
    setLoading(false);
  }, [showAnnouncement]);

  useEffect(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.addEventListener('voiceschanged', () => {
        window.speechSynthesis.getVoices();
      });
    }

    fetchQueue();

    const channel = supabase
      .channel('tv-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'queue_entries' }, () => fetchQueue())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, () => fetchQueue())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (announcementTimer.current) clearTimeout(announcementTimer.current);
      window.speechSynthesis?.cancel();
    };
  }, [fetchQueue]);

  if (loading) {
    return (
      <div className="h-[100dvh] flex flex-col items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-6">
          <div className="w-20 h-20 rounded-full border-4 border-primary/10 border-t-primary animate-spin" />
          <h1 className="text-3xl font-black italic text-primary">PasseVite</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] overflow-hidden bg-background flex flex-col p-6 lg:p-10 relative" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── Full-screen Announcement Overlay ── */}
      {announcement && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center text-white"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.75) 100%)',
            animation: 'tvFadeIn 0.4s ease',
          }}
        >
          <div
            className="absolute w-[min(60vw,60vh)] h-[min(60vw,60vh)] rounded-full opacity-20"
            style={{ background: 'white', animation: 'tvPulse 2s ease-in-out infinite' }}
          />

          <p className="text-lg md:text-2xl font-light tracking-[0.35em] uppercase opacity-80 mb-6">Prochain patient</p>

          <div className="text-[20vw] md:text-[18vw] font-black leading-none tracking-tight text-shadow-2xl">
            {announcement.clientId}
          </div>

          {announcement.patientName && (
            <div className="text-4xl md:text-6xl font-bold mt-4 md:mt-6 text-center px-4">
              {announcement.patientName}
            </div>
          )}

          <div className="mt-8 md:mt-12 text-center">
            <p className="text-base md:text-xl font-light opacity-75 tracking-widest uppercase mb-1">Veuillez vous présenter au cabinet de</p>
            <p className="text-3xl md:text-5xl font-bold tracking-tight">Dr. {announcement.doctorName}</p>
          </div>

          <div className="absolute bottom-0 left-0 h-1 bg-white/40 w-full">
            <div className="h-full bg-white animate-[tvProgress_10s_linear_forwards]" />
          </div>
        </div>
      )}

      {/* CSS keyframes */}
      <style>{`
        @keyframes tvFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes tvPulse { 0%, 100% { transform: scale(1); opacity: 0.15; } 50% { transform: scale(1.1); opacity: 0.25; } }
        @keyframes tvProgress { from { width: 100%; } to { width: 0%; } }
        @keyframes marquee { from { transform: translateX(100%); } to { transform: translateX(-100%); } }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between mb-8 lg:mb-12 shrink-0 px-4">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/20 transform -rotate-3 transition-transform hover:rotate-0">
            <span className="text-primary-foreground font-black text-3xl italic">P</span>
          </div>
          <div>
            <h1 className="text-4xl font-black text-foreground tracking-tighter italic flex items-center gap-3">
              PasseVite <span className="h-6 w-[1px] bg-border mx-2" /> <span className="text-2xl not-italic font-medium text-muted-foreground tracking-normal">{doctorQueues[0]?.doctor.name}</span>
            </h1>
            <p className="text-[10px] tracking-[0.5em] text-muted-foreground uppercase font-black opacity-60">Espace Médical Numérique</p>
          </div>
        </div>
        <LiveClock />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0">
        {doctorQueues.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-1000">
            <div className="w-32 h-32 rounded-full bg-secondary/30 flex items-center justify-center mb-8 border border-border">
              <span className="text-7xl">🩺</span>
            </div>
            <h2 className="text-4xl font-black text-foreground tracking-tight">Séance fermée</h2>
            <p className="text-muted-foreground mt-4 text-xl max-w-md mx-auto">Le système d'attente est actuellement inactif. Veuillez vous adresser à l'accueil.</p>
          </div>
        ) : (
          <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-10">

            {/* Left Column: Now Serving */}
            <div className="lg:col-span-7 flex flex-col shrink-0 min-h-0">
              <div className="flex-1 bg-card/40 backdrop-blur-3xl rounded-[4rem] border border-white/10 shadow-2xl flex flex-col overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-60" />

                <div className="p-10 pb-0 z-10">
                  <div className="inline-flex items-center gap-3 bg-primary/10 px-6 py-2.5 rounded-full border border-primary/20">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-primary">Patient à l'appel</span>
                  </div>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center p-10 text-center z-10">
                  <div className="text-[20vw] lg:text-[18vw] font-black text-primary leading-none tracking-tighter drop-shadow-2xl">
                    {doctorQueues[0].nextPatient}
                  </div>
                  {doctorQueues[0].nextPatientName && (
                    <div className="mt-6 px-12 py-5 bg-secondary/60 backdrop-blur-xl rounded-[2.5rem] border border-white/10 shadow-2xl">
                      <p className="text-5xl lg:text-6xl font-black text-foreground tracking-tight truncate max-w-[600px]">
                        {doctorQueues[0].nextPatientName}
                      </p>
                    </div>
                  )}
                </div>

                <div className="p-10 bg-gradient-to-t from-primary/5 to-transparent border-t border-white/5 z-10 text-center text-muted-foreground text-2xl font-light italic opacity-80 tracking-wide uppercase">
                  Veuillez rejoindre le cabinet de consultation
                </div>
              </div>
            </div>

            {/* Right Column: Queue Overview */}
            <div className="lg:col-span-5 flex flex-col gap-10 min-h-0">

              <div className="bg-primary rounded-[3.5rem] p-10 shadow-2xl shadow-primary/30 flex items-center justify-between relative overflow-hidden group">
                <div className="absolute right-0 top-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 transition-transform group-hover:scale-110" />
                <div className="relative z-10">
                  <p className="text-primary-foreground/70 text-sm font-black uppercase tracking-[0.2em] mb-2">Patients en attente</p>
                  <div className="flex items-baseline gap-3">
                    <span className="text-8xl font-black text-white tabular-nums">{doctorQueues[0].waitingCount}</span>
                    <span className="text-xl font-bold text-white/80 uppercase tracking-widest">Personnes</span>
                  </div>
                </div>
                <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center relative z-10">
                  <span className="text-5xl">👥</span>
                </div>
              </div>

              <div className="flex-1 bg-card/30 backdrop-blur-2rem rounded-[3.5rem] border border-white/5 p-10 flex flex-col overflow-hidden">
                <h3 className="text-2xl font-black text-foreground tracking-tight mb-8">Liste de passage</h3>
                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30 grayscale gap-4">
                  <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center">
                    <span className="text-4xl">✨</span>
                  </div>
                  <p className="text-xl font-bold">Cabinet Actif</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Ticker */}
      <div className="mt-10 shrink-0">
        <div className="bg-card/20 backdrop-blur-md rounded-full border border-white/10 p-2 flex items-center overflow-hidden h-16">
          <div className="flex-1 overflow-hidden relative">
            <div className="whitespace-nowrap inline-block animate-[marquee_40s_linear_infinite] px-10">
              <span className="text-lg font-bold text-muted-foreground mx-10">Cabinet Médical du Docteur {doctorQueues[0]?.doctor.name} &bull; Bienvenue &bull; Le respect des horaires d'appel est essentiel &bull; Merci &bull; </span>
              <span className="text-lg font-bold text-muted-foreground mx-10">Cabinet Médical du Docteur {doctorQueues[0]?.doctor.name} &bull; Bienvenue &bull; Le respect des horaires d'appel est essentiel &bull; Merci &bull; </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TV;
