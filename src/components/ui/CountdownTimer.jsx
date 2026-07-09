/**
 * CountdownTimer — Compte à rebours dynamique vers une date de fin.
 * Se met à jour chaque seconde. Quand le temps est écoulé, appelle onExpire().
 * Design : badges néon vert/rouge selon l'urgence, compatible dark mode.
 */
import { useState, useEffect, useCallback } from 'react';
import { Clock } from 'lucide-react';

const pad = (n) => String(n).padStart(2, '0');

const computeTimeLeft = (endTimestamp) => {
  const diff = new Date(endTimestamp).getTime() - Date.now();
  if (diff <= 0) return null;
  const totalSeconds = Math.floor(diff / 1000);
  const days    = Math.floor(totalSeconds / 86400);
  const hours   = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds, totalSeconds };
};

const CountdownTimer = ({ endTimestamp, language = 'fr', onExpire, compact = false }) => {
  const [timeLeft, setTimeLeft] = useState(() => computeTimeLeft(endTimestamp));

  useEffect(() => {
    if (!endTimestamp) return;
    const tick = () => {
      const t = computeTimeLeft(endTimestamp);
      setTimeLeft(t);
      if (!t) onExpire?.();
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endTimestamp, onExpire]);

  if (!timeLeft) return null;

  const isUrgent = timeLeft.totalSeconds < 3600; // < 1h → rouge
  const accentClass = isUrgent
    ? 'bg-red-500/10 border-red-500/20 text-red-500 dark:text-red-400'
    : 'bg-dakora-green/10 border-dakora-green/20 text-dakora-green dark:text-green-400';

  const labelExpire = language === 'fr' ? 'Offre expire dans' : 'Offer expires in';
  const labelDays   = language === 'fr' ? 'j' : 'd';
  const labelHours  = 'h';
  const labelMins   = 'min';
  const labelSecs   = 's';

  if (compact) {
    // Version compacte pour les cartes boutique
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-black ${accentClass}`}>
        <Clock size={9}/>
        {timeLeft.days > 0 && `${timeLeft.days}${labelDays} `}
        {pad(timeLeft.hours)}{labelHours} {pad(timeLeft.minutes)}{labelMins} {pad(timeLeft.seconds)}{labelSecs}
      </span>
    );
  }

  // Version complète pour la fiche produit
  return (
    <div className={`flex flex-col gap-2 p-3 md:p-4 rounded-[1.2rem] md:rounded-[1.5rem] border ${accentClass}`}>
      <div className="flex items-center gap-2">
        <Clock size={14} className="flex-shrink-0"/>
        <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">{labelExpire}</span>
        {isUrgent && (
          <span className="ml-auto text-[8px] font-black uppercase px-2 py-0.5 bg-red-500 text-white rounded-full animate-pulse">
            {language === 'fr' ? '🔥 Dernières heures' : '🔥 Last hours'}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 md:gap-3">
        {timeLeft.days > 0 && (
          <div className="flex flex-col items-center">
            <span className="text-2xl md:text-3xl font-black leading-none">{pad(timeLeft.days)}</span>
            <span className="text-[8px] font-bold uppercase opacity-70">{language === 'fr' ? 'Jours' : 'Days'}</span>
          </div>
        )}
        {timeLeft.days > 0 && <span className="text-xl font-black opacity-40 mb-3">:</span>}
        <div className="flex flex-col items-center">
          <span className="text-2xl md:text-3xl font-black leading-none">{pad(timeLeft.hours)}</span>
          <span className="text-[8px] font-bold uppercase opacity-70">{language === 'fr' ? 'Heures' : 'Hours'}</span>
        </div>
        <span className="text-xl font-black opacity-40 mb-3">:</span>
        <div className="flex flex-col items-center">
          <span className="text-2xl md:text-3xl font-black leading-none">{pad(timeLeft.minutes)}</span>
          <span className="text-[8px] font-bold uppercase opacity-70">{language === 'fr' ? 'Min' : 'Min'}</span>
        </div>
        <span className="text-xl font-black opacity-40 mb-3">:</span>
        <div className="flex flex-col items-center">
          <span className={`text-2xl md:text-3xl font-black leading-none ${isUrgent ? 'animate-pulse' : ''}`}>{pad(timeLeft.seconds)}</span>
          <span className="text-[8px] font-bold uppercase opacity-70">{language === 'fr' ? 'Sec' : 'Sec'}</span>
        </div>
      </div>
    </div>
  );
};

export default CountdownTimer;
