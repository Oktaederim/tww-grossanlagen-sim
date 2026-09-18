import React from 'react';
import {
  FileText,
  RotateCcw,
  ShieldCheck,
  Zap,
  Activity,
  Droplets,
  Flame,
} from 'lucide-react';
import { SystemCalculations } from '../types';

interface HeaderProps {
  metrics: SystemCalculations;
  onOpenPdfModal: () => void;
  onResetDefaults: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  metrics,
  onOpenPdfModal,
  onResetDefaults,
}) => {
  const getStatusBadge = () => {
    switch (metrics.overallStatus) {
      case 'OK':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-300',
          dot: 'bg-emerald-500',
          label: 'DIN & DVGW konform (100%)',
        };
      case 'WARNING':
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-300',
          dot: 'bg-amber-500',
          label: 'Hinweise beachten (Toleranz)',
        };
      case 'ERROR':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-300',
          dot: 'bg-rose-500',
          label: 'Normabweichung festgestellt',
        };
    }
  };

  const statusBadge = getStatusBadge();

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Title & Facility Info */}
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
                <Flame className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  Warmwasser-Anlagenrechner & Monteur-Prüftool
                </h1>
                <p className="text-xs sm:text-sm text-slate-300">
                  Auslegung & Hygieneüberprüfung nach DIN 1988-200/300, DVGW W 551, DIN 4708 & VDI 6023
                </p>
              </div>
            </div>

            {/* Plant Tags with Status Classification */}
            <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-800 border border-emerald-600/40 text-emerald-300" title="Dokumentierter Typenschild-Bestand">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                3x Mitsubishi QAHV (120 kW th / COP 3,65)
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-800 border border-blue-600/40 text-blue-300" title="Planungsvorgabe Wärmetauscher">
                <Flame className="w-3.5 h-3.5 text-blue-400" />
                136 kW WT (Plan 70/55 °C, DN40)
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-200">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                3x 2.000 L Pufferspeicher (6.000 L)
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-800 border border-amber-600/40 text-amber-300" title="Typenschild 70/25°C, Prüfpunkt 65°C Primär">
                <Droplets className="w-3.5 h-3.5 text-amber-400" />
                4x Danfoss FWS 130 kW (Nenn 149 l/min)
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-200">
                10 Duschbereiche (50 Duschen + 50 WT)
              </span>
            </div>
          </div>

          {/* Action Buttons & Norm Badge */}
          <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${statusBadge.bg}`}
            >
              <span className={`w-2 h-2 rounded-full ${statusBadge.dot} animate-pulse`} />
              <ShieldCheck className="w-4 h-4" />
              <span>{statusBadge.label}</span>
            </div>

            <button
              id="btn-reset-defaults"
              type="button"
              onClick={onResetDefaults}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition cursor-pointer"
              title="Auf Standardwerte der Anlage zurücksetzen"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Standard</span>
            </button>

            <button
              id="btn-open-pdf-export"
              type="button"
              onClick={onOpenPdfModal}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 border border-blue-400 shadow-sm transition cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Prüfprotokoll (PDF)</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
