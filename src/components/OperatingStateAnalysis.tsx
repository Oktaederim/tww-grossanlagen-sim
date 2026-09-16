import React from 'react';
import {
  Activity,
  Zap,
  Flame,
  Layers,
  Droplets,
  Clock,
  Gauge,
  HelpCircle,
  TrendingUp,
  TrendingDown,
  Info,
  CheckCircle2,
  AlertCircle,
  Users,
  Timer,
  Fuel,
} from 'lucide-react';
import {
  HeatPumpConfig,
  CentralHeatingConfig,
  BufferStorageConfig,
  FreshWaterStationConfig,
  SanitaryConsumerConfig,
  SystemCalculations,
} from '../types';

interface OperatingStateAnalysisProps {
  heatPumps: HeatPumpConfig[];
  setHeatPumps: React.Dispatch<React.SetStateAction<HeatPumpConfig[]>>;
  centralHeating: CentralHeatingConfig;
  setCentralHeating: React.Dispatch<React.SetStateAction<CentralHeatingConfig>>;
  buffer: BufferStorageConfig;
  fws: FreshWaterStationConfig;
  sanitary: SanitaryConsumerConfig;
  setSanitary: React.Dispatch<React.SetStateAction<SanitaryConsumerConfig>>;
  metrics: SystemCalculations;
}

export const OperatingStateAnalysis: React.FC<OperatingStateAnalysisProps> = ({
  heatPumps,
  setHeatPumps,
  centralHeating,
  setCentralHeating,
  buffer,
  fws,
  sanitary,
  setSanitary,
  metrics,
}) => {
  // Direct input handlers for shower count and washbasin count
  const handleShowersCountChange = (count: number) => {
    const clamped = Math.max(0, Math.min(50, count));
    const percent = Math.round((clamped / 50) * 100);
    setSanitary((prev) => ({
      ...prev,
      activeShowersCount: clamped,
      showerSimultaneityPercent: percent,
    }));
  };

  const handleWashbasinsCountChange = (count: number) => {
    const clamped = Math.max(0, Math.min(50, count));
    const percent = Math.round((clamped / 50) * 100);
    setSanitary((prev) => ({
      ...prev,
      activeWashbasinsCount: clamped,
      washbasinSimultaneityPercent: percent,
    }));
  };

  // Quick mode switchers
  const setEcoHeatPumpOnly = () => {
    setHeatPumps((prev) => prev.map((wp) => ({ ...wp, enabled: true })));
    setCentralHeating((prev) => ({ ...prev, enabled: false }));
  };

  const setHybridBoost = () => {
    setHeatPumps((prev) => prev.map((wp) => ({ ...wp, enabled: true })));
    setCentralHeating((prev) => ({ ...prev, enabled: true, powerKw: 136 }));
  };

  const setAlternativeHeatExchangerOnly = () => {
    setHeatPumps((prev) => prev.map((wp) => ({ ...wp, enabled: false })));
    setCentralHeating((prev) => ({ ...prev, enabled: true, powerKw: 136 }));
  };

  const getStateColor = () => {
    switch (metrics.operatingStateKey) {
      case 'CHARGING':
        return {
          border: 'border-emerald-500/40',
          bg: 'bg-emerald-950/20',
          badge: 'bg-emerald-600 text-white',
          text: 'text-emerald-400',
        };
      case 'BALANCED':
        return {
          border: 'border-cyan-500/40',
          bg: 'bg-cyan-950/20',
          badge: 'bg-cyan-600 text-white',
          text: 'text-cyan-400',
        };
      case 'DISCHARGING_FAST':
        return {
          border: 'border-amber-500/40',
          bg: 'bg-amber-950/20',
          badge: 'bg-amber-600 text-white',
          text: 'text-amber-400',
        };
      case 'DISCHARGING_SLOW':
        return {
          border: 'border-yellow-500/40',
          bg: 'bg-yellow-950/20',
          badge: 'bg-yellow-600 text-white',
          text: 'text-yellow-400',
        };
      case 'STANDBY_CIRCULATION':
        return {
          border: 'border-indigo-500/40',
          bg: 'bg-indigo-950/20',
          badge: 'bg-indigo-600 text-white',
          text: 'text-indigo-400',
        };
    }
  };

  const stateStyle = getStateColor();

  return (
    <div
      id="operating-state-analysis-card"
      className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden"
    >
      {/* Header Section */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-900 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
              <Activity className="w-4 h-4" />
              <span>Betriebszustands-Analyse & Thermodynamische Bilanz</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              Analyse der Anlagenbetriebszustände & Duschversorgung
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Echtzeit-Leistungsbilanz, Speicherentladung, Wiederaufladedauer und Wassermengen nach freier Verbrauchereingabe
            </p>
          </div>

          {/* Quick Operating Mode Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-slate-400 hidden sm:inline">Betriebsart testen:</span>
            <button
              type="button"
              onClick={setEcoHeatPumpOnly}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer border ${
                heatPumps.some((wp) => wp.enabled) && !centralHeating.enabled
                  ? 'bg-amber-600 text-white border-amber-500 shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700'
              }`}
              title="3x Wärmepumpen (135 kW), 136 kW WT aus"
            >
              Öko-WP (135 kW)
            </button>

            <button
              type="button"
              onClick={setHybridBoost}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer border ${
                heatPumps.some((wp) => wp.enabled) && centralHeating.enabled
                  ? 'bg-orange-600 text-white border-orange-500 shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700'
              }`}
              title="3x WP + 136 kW Wärmetauscher = 271 kW Gesamtleistung"
            >
              Hybrid-Boost (271 kW)
            </button>

            <button
              type="button"
              onClick={setAlternativeHeatExchangerOnly}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer border ${
                !heatPumps.some((wp) => wp.enabled) && centralHeating.enabled
                  ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700'
              }`}
              title="Wärmepumpen aus, Pufferladung nur über 136 kW WT"
            >
              Nur 136 kW WT
            </button>
          </div>
        </div>

        {/* Live Status Bar Card */}
        <div className={`mt-4 p-3.5 rounded-lg border ${stateStyle.border} ${stateStyle.bg} flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
          <div className="flex items-center gap-3">
            <span className={`px-2.5 py-1 rounded text-xs font-bold font-mono uppercase ${stateStyle.badge}`}>
              {metrics.operatingStateKey}
            </span>
            <div>
              <span className="font-bold text-sm text-white block">
                {metrics.operatingStateTitle}
              </span>
              <p className="text-xs text-slate-300 mt-0.5">
                {metrics.operatingStateDescription}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono self-start sm:self-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
            <div>
              <span className="text-slate-400 block text-[10px]">Netto-Bilanz:</span>
              <span className={`text-sm font-bold ${metrics.netPowerBalanceKw >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {metrics.netPowerBalanceKw >= 0 ? `+${metrics.netPowerBalanceKw}` : metrics.netPowerBalanceKw} kW
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Dauerdeckung:</span>
              <span className="text-sm font-bold text-white">
                {metrics.continuousFlowCoveragePercent}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        {/* SECTION 1: FREIE EINGABE DER VERBRAUCHER (DUSCHEN & WASCHTISCHE) */}
        <div className="bg-slate-50 rounded-xl p-4 sm:p-5 border border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                Freie Eingabe der in Betrieb befindlichen Sanitärarmaturen
              </h3>
              <p className="text-xs text-slate-500">
                Geben Sie die exakte Anzahl aktiver Duschpaneele und Waschtischarmaturen zur Analyse frei ein (10 Duschbereiche à 5 Duschen = 50 max.)
              </p>
            </div>
            <div className="text-xs font-mono text-slate-600">
              Gesamtanlage: <strong>50 Duschpaneele & 50 Waschtische</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Box 1: Duschpaneele */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5 text-blue-600" />
                  In Betrieb befindliche Duschpaneele
                </label>
                <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  {metrics.activeShowersCount} von 50 ({sanitary.showerSimultaneityPercent}%)
                </span>
              </div>

              {/* Direct Numeric Input & Slider */}
              <div className="flex items-center gap-3">
                <div className="w-24 shrink-0">
                  <input
                    type="number"
                    min="0"
                    max="50"
                    step="1"
                    value={metrics.activeShowersCount}
                    onChange={(e) => handleShowersCountChange(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-sm font-bold font-mono text-center rounded-lg border-2 border-blue-500 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <span className="text-[10px] text-slate-400 text-center block mt-0.5">Duschen</span>
                </div>

                <div className="flex-1">
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="1"
                    value={metrics.activeShowersCount}
                    onChange={(e) => handleShowersCountChange(Number(e.target.value))}
                    className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>0 (Ruhe)</span>
                    <span>25 (50%)</span>
                    <span>50 (Volllast)</span>
                  </div>
                </div>
              </div>

              {/* Quick Presets for Showers */}
              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="text-slate-500 font-medium">Schnellwahl:</span>
                {[
                  { label: '0 Duschen', count: 0 },
                  { label: '5 (1 Zone)', count: 5 },
                  { label: '15 (3 Zonen)', count: 15 },
                  { label: '25 (50%)', count: 25 },
                  { label: '40 (Sport)', count: 40 },
                  { label: '50 (Volllast)', count: 50 },
                ].map((item) => (
                  <button
                    key={item.count}
                    type="button"
                    onClick={() => handleShowersCountChange(item.count)}
                    className={`px-2 py-0.5 rounded transition cursor-pointer ${
                      metrics.activeShowersCount === item.count
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Box 2: Waschtischarmaturen */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5 text-teal-600" />
                  In Betrieb befindliche Waschtischarmaturen
                </label>
                <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                  {metrics.activeWashbasinsCount} von 50 ({sanitary.washbasinSimultaneityPercent}%)
                </span>
              </div>

              {/* Direct Numeric Input & Slider */}
              <div className="flex items-center gap-3">
                <div className="w-24 shrink-0">
                  <input
                    type="number"
                    min="0"
                    max="50"
                    step="1"
                    value={metrics.activeWashbasinsCount}
                    onChange={(e) => handleWashbasinsCountChange(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-sm font-bold font-mono text-center rounded-lg border-2 border-teal-500 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                  <span className="text-[10px] text-slate-400 text-center block mt-0.5">Armaturen</span>
                </div>

                <div className="flex-1">
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="1"
                    value={metrics.activeWashbasinsCount}
                    onChange={(e) => handleWashbasinsCountChange(Number(e.target.value))}
                    className="w-full accent-teal-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>0 (Ruhe)</span>
                    <span>25 (50%)</span>
                    <span>50 (Volllast)</span>
                  </div>
                </div>
              </div>

              {/* Quick Presets for Washbasins */}
              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="text-slate-500 font-medium">Schnellwahl:</span>
                {[
                  { label: '0 WT', count: 0 },
                  { label: '5 (1 Zone)', count: 5 },
                  { label: '15 (3 Zonen)', count: 15 },
                  { label: '20 (Normal)', count: 20 },
                  { label: '35 (Hoch)', count: 35 },
                  { label: '50 (Volllast)', count: 50 },
                ].map((item) => (
                  <button
                    key={item.count}
                    type="button"
                    onClick={() => handleWashbasinsCountChange(item.count)}
                    className={`px-2 py-0.5 rounded transition cursor-pointer ${
                      metrics.activeWashbasinsCount === item.count
                        ? 'bg-teal-600 text-white font-semibold'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: ERMITTELTE WASSERMENGEN & DURCHFLÜSSE */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Gauge className="w-4 h-4 text-blue-600" />
            Ermittelte Wassermengen & thermischer Entzug
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <span className="text-slate-500 block text-[11px] mb-1">
                Warmwasservolumenstrom (60°C aus FWS)
              </span>
              <span className="text-xl font-bold text-blue-700 font-mono block">
                {metrics.peakHotWaterFlowLmin} l/min
              </span>
              <span className="text-[11px] text-slate-500 block mt-1">
                = <strong>{metrics.peakHotWaterFlowM3h} m³/h</strong> Primärabgang
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <span className="text-slate-500 block text-[11px] mb-1">
                Mischwasservolumenstrom (38°C an Armaturen)
              </span>
              <span className="text-xl font-bold text-slate-900 font-mono block">
                {metrics.peakMixedWaterFlowLmin} l/min
              </span>
              <span className="text-[11px] text-slate-500 block mt-1">
                = <strong>{((metrics.peakMixedWaterFlowLmin * 60) / 1000).toFixed(2)} m³/h</strong> Gesamtbezug
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <span className="text-slate-500 block text-[11px] mb-1">
                Kaltwasser-Zumischung (10°C)
              </span>
              <span className="text-xl font-bold text-cyan-700 font-mono block">
                {metrics.coldWaterFlowLmin} l/min
              </span>
              <span className="text-[11px] text-slate-500 block mt-1">
                Vor-Ort-Thermostatbeimischung
              </span>
            </div>

            <div className={`p-3.5 rounded-xl border text-xs ${
              metrics.fwsCapacityUtilizationPercent > 100
                ? 'bg-amber-50/70 border-amber-300'
                : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 block text-[11px] mb-1">
                  Thermische Spitzenlast (FWS-Leistung)
                </span>
                <span title="Physikalische Momentanleistung: V_ww * rho * c * deltaT">
                  <Info className="w-3.5 h-3.5 text-slate-400" />
                </span>
              </div>
              <span className={`text-xl font-bold font-mono block ${
                metrics.fwsCapacityUtilizationPercent > 100 ? 'text-amber-700' : 'text-red-600'
              }`}>
                {metrics.peakThermalDemandKw} kW
              </span>
              <div className="text-[11px] text-slate-600 mt-1 flex items-center justify-between">
                <span>Auslastung FWS: <strong className={metrics.fwsCapacityUtilizationPercent > 100 ? 'text-amber-700' : 'text-slate-800'}>{metrics.fwsCapacityUtilizationPercent}%</strong></span>
                {metrics.fwsCapacityUtilizationPercent > 100 && (
                  <span className="text-[10px] font-semibold text-amber-800 bg-amber-200/80 px-1.5 py-0.2 rounded">
                    &gt; 200 l/min Nennlast
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Ingenieur-Hinweis bei FWS-Überlast (> 100%) */}
          {metrics.fwsCapacityUtilizationPercent > 100 && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-950 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">
                  Ingenieur-Hinweis zur Spitzenlast ({metrics.peakThermalDemandKw} kW / {metrics.fwsCapacityUtilizationPercent}% FWS-Auslastung):
                </strong>
                <p className="mt-0.5 text-[11px] text-amber-900 leading-relaxed">
                  Die 4 Frischwasserstationen sind für zusammen <strong>200 l/min</strong> Warmwasser (ca. 698 kW) ausgelegt. 
                  Bei {metrics.activeShowersCount} gleichzeitig voll geöffneten Duschen werden physikalisch <strong>{metrics.peakHotWaterFlowLmin} l/min</strong> (60°C) angefordert. 
                  Das 6.000 L Puffer-Wärmevolumen liefert die Energie ({metrics.totalStoredEnergyKwh} kWh nutzbar) problemlos, 
                  jedoch laufen die Plattenwärmetauscher der Stationen mit 112% oberhalb der Nennleistung (wodurch die Auslauftemperatur ohne Durchflussbegrenzer kurzzeitig um 2–4 K absinken kann).
                </p>
              </div>
            </div>
          )}

          {/* Duschgang-Bilanz (Wasser & Energie pro Duschzyklus) */}
          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                <Timer className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-blue-950 block text-sm">
                  Bilanz für 1 Duschzyklus ({sanitary.showerDurationMinutes} Minuten Duschzeit):
                </span>
                <p className="text-blue-900 mt-0.5">
                  Für {metrics.activeShowersCount} aktive Duschen werden in {sanitary.showerDurationMinutes} Min. exakt entnommen:
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 font-mono text-center shrink-0">
              <div className="bg-white/80 px-3 py-1.5 rounded-lg border border-blue-200">
                <span className="text-[10px] text-slate-500 block">Mischwasser (38°C)</span>
                <strong className="text-blue-800 text-sm">{metrics.showerSessionTotalMixedLiters} L</strong>
              </div>
              <div className="bg-white/80 px-3 py-1.5 rounded-lg border border-blue-200">
                <span className="text-[10px] text-slate-500 block">Warmwasser (60°C)</span>
                <strong className="text-blue-800 text-sm">{metrics.showerSessionTotalHot60Liters} L</strong>
              </div>
              <div className="bg-white/80 px-3 py-1.5 rounded-lg border border-blue-200">
                <span className="text-[10px] text-slate-500 block">Entzogene Energie</span>
                <strong className="text-red-700 text-sm">{metrics.showerSessionEnergyKwh} kWh</strong>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: DAUER DER SPEICHERLADUNG & VERSORGUNGSDAUER DER DUSCHEN */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            Analyse der Lade- und Versorgungsdauer der 6.000 L Pufferspeicher
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Box A: Versorgungsdauer der Duschen */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
              <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                <Timer className="w-4 h-4 text-slate-700" />
                Wie lange reicht der Speichervorrat zur Versorgung der Duschen?
              </span>

              <div className="space-y-2">
                <div className="p-2.5 rounded-lg bg-white border border-slate-200 flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-slate-800 block">1. Reiner Speicherbetrieb (ohne Erzeuger):</span>
                    <span className="text-[10px] text-slate-500">
                      Nur der 6.000 L Vorrat ({metrics.totalStoredEnergyKwh} kWh nutzbar)
                    </span>
                  </div>
                  <span className="text-base font-bold font-mono text-cyan-700">
                    {metrics.autonomyStorageOnlyMinutes} Minuten
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-white border border-slate-200 flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-slate-800 block">2. Mit aktiven Erzeugern ({metrics.totalHeatGenerationPowerKw} kW):</span>
                    <span className="text-[10px] text-slate-500">
                      Erzeugung puffert kontinuierlich nach
                    </span>
                  </div>
                  <span className="text-base font-bold font-mono text-emerald-600">
                    {metrics.autonomyWithGenerationMinutes === 999
                      ? 'Dauerbetrieb gesichert (∞)'
                      : `${metrics.autonomyWithGenerationMinutes} Minuten`}
                  </span>
                </div>
              </div>
            </div>

            {/* Box B: Wiederaufladedauer des Speichers */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
              <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                <TrendingUp className="w-4 h-4 text-amber-600" />
                Wiederaufladedauer für 1 Duschgang ({metrics.showerSessionEnergyKwh} kWh)
              </span>

              <div className="grid grid-cols-3 gap-2">
                <div className="p-2 rounded-lg bg-white border border-slate-200 text-center">
                  <span className="text-[10px] text-slate-500 block">Mit 3x WP (135 kW)</span>
                  <strong className="text-sm font-mono text-slate-900 block mt-1">
                    {metrics.showerSessionRechargeTimeWpMinutes} Min.
                  </strong>
                  <span className="text-[9px] text-slate-400 block mt-0.5">Wärmepumpen</span>
                </div>

                <div className="p-2 rounded-lg bg-white border border-slate-200 text-center">
                  <span className="text-[10px] text-slate-500 block">Mit 136 kW WT</span>
                  <strong className="text-sm font-mono text-orange-600 block mt-1">
                    {metrics.showerSessionRechargeTimeWtMinutes} Min.
                  </strong>
                  <span className="text-[9px] text-slate-400 block mt-0.5">Alternative Heizung</span>
                </div>

                <div className="p-2 rounded-lg bg-white border border-orange-300 text-center bg-orange-50/40">
                  <span className="text-[10px] text-orange-800 font-semibold block">WP + 136 kW WT</span>
                  <strong className="text-sm font-mono text-emerald-700 block mt-1">
                    {metrics.showerSessionRechargeTimeCombinedMinutes} Min.
                  </strong>
                  <span className="text-[9px] text-emerald-600 font-medium block mt-0.5">271 kW Turbo!</span>
                </div>
              </div>

              {/* Complete storage recharge comparison */}
              <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-600 flex justify-between items-center">
                <span>Vollständige Pufferaufladung (6.000 L, 55°C → 65°C):</span>
                <span className="font-mono font-bold text-slate-800">
                  WP: {metrics.fullStorageRechargeHoursWp} h | WT: {metrics.fullStorageRechargeHoursWt} h | Kombi: {metrics.fullStorageRechargeHoursCombined} h
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 4: FACHLICHE ERLÄUTERUNGEN ZUR ANALYSE VOR ORT */}
        <div className="p-4 rounded-xl bg-slate-900 text-slate-200 text-xs space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
            <Info className="w-4 h-4" />
            <span>Fachliche Erläuterung für den Monteur vor Ort</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[11px] text-slate-300 leading-relaxed">
            <div className="space-y-1">
              <strong className="text-white block font-semibold">1. Funktion des 136 kW Wärmetauschers:</strong>
              <p>
                Der 136 kW Plattenwärmetauscher dient als multifunktionale Weiche: Er fungiert entweder als{' '}
                <strong>vollwertige alternative Heizung</strong> (z.B. bei Ausfall oder Wartung der Wärmepumpen) oder als{' '}
                <strong>zusätzlicher Spitzenlast-Booster</strong>. Bei gleichzeitiger Zuschaltung mit den 3 Wärmepumpen
                stehen 271 kW Heizleistung zur Verfügung, wodurch selbst bei 40 parallel laufenden Duschen eine
                Wiederaufladung in unter 15 Minuten gelingt.
              </p>
            </div>

            <div className="space-y-1">
              <strong className="text-white block font-semibold">2. Hydraulische Pufferentlastung:</strong>
              <p>
                Durch die 4 Frischwasserstationen wird das Primärwasser extrem stark ausgekühlt (bis auf 28°C im Rücklauf).
                Dieses kalte Wasser schichtet sich unten in den 3x 2.000 Liter Puffern ein. Dadurch arbeiten die Wärmepumpen
                stets im optimalen Wirkungsgradbereich mit hohem COP (~3,4).
              </p>
            </div>

            <div className="space-y-1">
              <strong className="text-white block font-semibold">3. Praxistipp bei Spitzenbetrieb:</strong>
              <p>
                Vor geplanten Stoßzeiten (z.B. Turnieren oder Trainingsende) empfiehlt sich die Vorladung der Pufferspeicher
                auf 65°C. Bei drohender Spitzenlast kann der 136 kW Wärmetauscher frühzeitig über das GLT-Signal
                zugeschaltet werden, um Temperaturabfälle am FWS-Vorlauf unter 60°C präventiv auszuschließen.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
