import React from 'react';
import {
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Thermometer,
  Droplet,
  Clock,
  FileCheck2,
} from 'lucide-react';
import { SystemCalculations } from '../types';

interface NormComplianceVisualizerProps {
  metrics: SystemCalculations;
}

export const NormComplianceVisualizer: React.FC<NormComplianceVisualizerProps> = ({
  metrics,
}) => {
  const { normCompliance } = metrics;

  const renderStatusPill = (status: 'OK' | 'WARNING' | 'ERROR' | 'INFO') => {
    switch (status) {
      case 'OK':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Norm eingehalten
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            Toleranzgrenze
          </span>
        );
      case 'ERROR':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Normverletzung
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div
      id="norm-compliance-visualizer"
      className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            Automatische Normen-Prüfung & Trinkwasserhygiene
          </h2>
          <p className="text-xs text-slate-500">
            Automatische Echtzeit-Bewertung gegen DIN 1988-200/300, DVGW W 551, DIN 4708 und VDI 6023
          </p>
        </div>

        {/* Global Compliance Score Gauge */}
        <div className="flex items-center gap-3 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
          <div className="text-right">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">
              Konformitäts-Index
            </span>
            <span
              className={`text-lg font-bold font-mono ${
                metrics.overallScorePercent >= 90
                  ? 'text-emerald-700'
                  : metrics.overallScorePercent >= 70
                  ? 'text-amber-600'
                  : 'text-rose-600'
              }`}
            >
              {metrics.overallScorePercent} / 100 %
            </span>
          </div>

          <div className="w-12 h-12 rounded-full border-4 border-slate-200 flex items-center justify-center relative">
            <div
              className={`text-xs font-bold ${
                metrics.overallScorePercent >= 90
                  ? 'text-emerald-600'
                  : metrics.overallScorePercent >= 70
                  ? 'text-amber-600'
                  : 'text-rose-600'
              }`}
            >
              {metrics.overallStatus === 'OK' ? 'PASSED' : metrics.overallStatus === 'WARNING' ? 'TOL' : 'FAIL'}
            </div>
          </div>
        </div>
      </div>

      {/* Norm Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 1. DVGW W 551 - Warmwassertemperatur Austritt */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold text-slate-800">
                DVGW W 551 Abs. 6.2
              </span>
              {renderStatusPill(normCompliance.w551OutletTemp.status)}
            </div>

            <h3 className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
              <Thermometer className="w-4 h-4 text-red-500" />
              WW-Austrittstemperatur (Großanlage)
            </h3>
            <p className="text-[11px] text-slate-500 mb-3">
              {normCompliance.w551OutletTemp.description}
            </p>

            {/* Visual Temperature Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span>Ist: <strong>{normCompliance.w551OutletTemp.actual.toFixed(1)} °C</strong></span>
                <span className="text-slate-500">Soll: ≥ 60,0 °C</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    normCompliance.w551OutletTemp.status === 'OK'
                      ? 'bg-emerald-500'
                      : normCompliance.w551OutletTemp.status === 'WARNING'
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                  style={{
                    width: `${Math.min(100, (normCompliance.w551OutletTemp.actual / 70) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-200 text-[11px] text-slate-600">
            {normCompliance.w551OutletTemp.actual >= 60 ? (
              <span className="text-emerald-700">Legionellen-Vermehrung zuverlässig gehemmt.</span>
            ) : (
              <span className="text-rose-700 font-medium">
                Monteur-Aktion: FWS-Sollwert oder Puffervorlauf anheben!
              </span>
            )}
          </div>
        </div>

        {/* 2. DVGW W 551 - Zirkulations-Rücklauftemperatur */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold text-slate-800">
                DVGW W 551 Abs. 6.3.1
              </span>
              {renderStatusPill(normCompliance.w551ReturnTemp.status)}
            </div>

            <h3 className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
              <Thermometer className="w-4 h-4 text-violet-500" />
              Zirkulations-Rücklauf ≥ 55°C
            </h3>
            <p className="text-[11px] text-slate-500 mb-3">
              {normCompliance.w551ReturnTemp.description}
            </p>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span>Ist: <strong>{normCompliance.w551ReturnTemp.actual.toFixed(1)} °C</strong></span>
                <span className="text-slate-500">Soll: ≥ 55,0 °C</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    normCompliance.w551ReturnTemp.status === 'OK'
                      ? 'bg-emerald-500'
                      : normCompliance.w551ReturnTemp.status === 'WARNING'
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                  style={{
                    width: `${Math.min(100, (normCompliance.w551ReturnTemp.actual / 65) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-200 text-[11px] text-slate-600">
            {normCompliance.w551ReturnTemp.actual >= 55 ? (
              <span className="text-emerald-700">Rücklauf im hygienisch sicheren Bereich.</span>
            ) : (
              <span className="text-rose-700 font-medium">
                Monteur-Aktion: Pumpenleistung erhöhen oder Zirkulationsstränge abgleichen!
              </span>
            )}
          </div>
        </div>

        {/* 3. DVGW W 551 - Max. 5 K Temperaturdifferenz */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold text-slate-800">
                DVGW W 551 & DIN 1988
              </span>
              {renderStatusPill(normCompliance.w551TempDrop.status)}
            </div>

            <h3 className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
              <ShieldCheck className="w-4 h-4 text-blue-500" />
              Zirkulationsspreizung (ΔT ≤ 5 K)
            </h3>
            <p className="text-[11px] text-slate-500 mb-3">
              {normCompliance.w551TempDrop.description}
            </p>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span>Ist: <strong>{normCompliance.w551TempDrop.actual.toFixed(1)} K</strong></span>
                <span className="text-slate-500">Max: ≤ 5,0 K</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    normCompliance.w551TempDrop.status === 'OK'
                      ? 'bg-emerald-500'
                      : normCompliance.w551TempDrop.status === 'WARNING'
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                  style={{
                    width: `${Math.min(100, (normCompliance.w551TempDrop.actual / 8) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-200 text-[11px] text-slate-600">
            {normCompliance.w551TempDrop.actual <= 5 ? (
              <span className="text-emerald-700">Wärmeverlust der Rohrleitungen normgerecht kompensiert.</span>
            ) : (
              <span className="text-rose-700 font-medium">
                Monteur-Aktion: Rohrdämmung prüfen oder Zirkulationspumpe anheben.
              </span>
            )}
          </div>
        </div>

        {/* 4. DVGW W 551 - 3-Liter-Regel */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold text-slate-800">
                DVGW W 551 3-Liter-Regel
              </span>
              {renderStatusPill(normCompliance.threeLiterRule.status)}
            </div>

            <h3 className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
              <Droplet className="w-4 h-4 text-cyan-500" />
              Stichleitungsinhalt zur Zapfstelle
            </h3>
            <p className="text-[11px] text-slate-500 mb-3">
              {normCompliance.threeLiterRule.description}
            </p>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span>Ist: <strong>{normCompliance.threeLiterRule.actualVolumeL.toFixed(1)} L</strong></span>
                <span className="text-slate-500">Grenzwert: ≤ 3,0 L</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    normCompliance.threeLiterRule.status === 'OK' ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                  style={{
                    width: `${Math.min(100, (normCompliance.threeLiterRule.actualVolumeL / 4.5) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-200 text-[11px] text-slate-600">
            {normCompliance.threeLiterRule.actualVolumeL <= 3.0 ? (
              <span className="text-emerald-700">Keine unzulässige Stagnation in Stichleitungen.</span>
            ) : (
              <span className="text-rose-700 font-medium">
                Monteur-Aktion: Zirkulationsleitung näher an Entnahmestellen heranführen!
              </span>
            )}
          </div>
        </div>

        {/* 5. DIN 1988-300 - Spitzenlast-Deckung der 4 FWS */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold text-slate-800">
                DIN 1988-300 / DIN EN 806
              </span>
              {renderStatusPill(normCompliance.fwsCapacityCheck.status)}
            </div>

            <h3 className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
              <Clock className="w-4 h-4 text-amber-500" />
              Spitzendurchfluss 4x FWS
            </h3>
            <p className="text-[11px] text-slate-500 mb-3">
              {normCompliance.fwsCapacityCheck.description}
            </p>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span>Auslastung: <strong>{normCompliance.fwsCapacityCheck.utilization} %</strong></span>
                <span className="text-slate-500">Max: 100 %</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    normCompliance.fwsCapacityCheck.status === 'OK'
                      ? 'bg-emerald-500'
                      : normCompliance.fwsCapacityCheck.status === 'WARNING'
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                  style={{
                    width: `${Math.min(100, normCompliance.fwsCapacityCheck.utilization)}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-200 text-[11px] text-slate-600">
            {normCompliance.fwsCapacityCheck.status === 'OK' ? (
              <span className="text-emerald-700">4 Stationen decken die 10 Duschbereiche mit Reserve ab.</span>
            ) : (
              <span className="text-rose-700 font-medium">
                Monteur-Aktion: Alle 4 FWS zuschalten oder Primärvorlauftemperatur anheben!
              </span>
            )}
          </div>
        </div>

        {/* 6. DIN 4708 & VDI 6023 - Puffer & Hygiene */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold text-slate-800">
                DIN 4708 & VDI 6023
              </span>
              {renderStatusPill(normCompliance.bufferDimensioningCheck.status)}
            </div>

            <h3 className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
              <FileCheck2 className="w-4 h-4 text-emerald-500" />
              Speichervorrat (6.000 l) & Spülung
            </h3>
            <p className="text-[11px] text-slate-500 mb-3">
              {normCompliance.bufferDimensioningCheck.description}
            </p>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span>Puffer-Autonomie: <strong>{metrics.autonomyStorageOnlyMinutes} min</strong></span>
                <span className="text-slate-500">Empf.: ≥ 15 min</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    normCompliance.bufferDimensioningCheck.status === 'OK'
                      ? 'bg-emerald-500'
                      : normCompliance.bufferDimensioningCheck.status === 'WARNING'
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                  style={{
                    width: `${Math.min(100, (metrics.autonomyStorageOnlyMinutes / 45) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-200 text-[11px] text-slate-600">
            <span>
              Wasserwechsel alle 72 Stunden (VDI 6023) durch Duschzyklen oder automatische Spülstation gewährleistet.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
