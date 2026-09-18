import React, { useState } from 'react';
import {
  Zap,
  Flame,
  Layers,
  Droplets,
  Users,
  ShieldAlert,
  Sliders,
  Sparkles,
} from 'lucide-react';
import {
  HeatPumpConfig,
  CentralHeatingConfig,
  BufferStorageConfig,
  FreshWaterStationConfig,
  SanitaryConsumerConfig,
  CirculationConfig,
  SystemCalculations,
} from '../types';

interface ParameterControlsProps {
  heatPumps: HeatPumpConfig[];
  setHeatPumps: React.Dispatch<React.SetStateAction<HeatPumpConfig[]>>;
  centralHeating: CentralHeatingConfig;
  setCentralHeating: React.Dispatch<React.SetStateAction<CentralHeatingConfig>>;
  buffer: BufferStorageConfig;
  setBuffer: React.Dispatch<React.SetStateAction<BufferStorageConfig>>;
  fws: FreshWaterStationConfig;
  setFws: React.Dispatch<React.SetStateAction<FreshWaterStationConfig>>;
  sanitary: SanitaryConsumerConfig;
  setSanitary: React.Dispatch<React.SetStateAction<SanitaryConsumerConfig>>;
  circulation: CirculationConfig;
  setCirculation: React.Dispatch<React.SetStateAction<CirculationConfig>>;
  metrics: SystemCalculations;
}

type TabType = 'generators' | 'storage' | 'fws' | 'consumers' | 'circulation';

export const ParameterControls: React.FC<ParameterControlsProps> = ({
  heatPumps,
  setHeatPumps,
  centralHeating,
  setCentralHeating,
  buffer,
  setBuffer,
  fws,
  setFws,
  sanitary,
  setSanitary,
  circulation,
  setCirculation,
  metrics,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('consumers');

  const handleWpToggle = (id: string) => {
    setHeatPumps((prev) =>
      prev.map((wp) => (wp.id === id ? { ...wp, enabled: !wp.enabled } : wp))
    );
  };

  const handleWpPowerChange = (id: string, thermalKw: number) => {
    setHeatPumps((prev) =>
      prev.map((wp) => {
        if (wp.id === id) {
          const cop = wp.electricalPowerKw > 0 ? wp.thermalPowerKw / wp.electricalPowerKw : 3.4;
          const newEl = Math.round((thermalKw / cop) * 10) / 10;
          return { ...wp, thermalPowerKw: thermalKw, electricalPowerKw: newEl };
        }
        return wp;
      })
    );
  };

  const handleWpSourceTempChange = (id: string, temp: number) => {
    setHeatPumps((prev) =>
      prev.map((wp) => (wp.id === id ? { ...wp, sourceTempC: temp } : wp))
    );
  };

  const handleWpFlowTempChange = (id: string, temp: number) => {
    setHeatPumps((prev) =>
      prev.map((wp) => (wp.id === id ? { ...wp, flowTempC: temp } : wp))
    );
  };

  return (
    <div
      id="parameter-controls-card"
      className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden"
    >
      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 overflow-x-auto bg-slate-50/70 p-1.5 gap-1">
        <button
          id="tab-btn-consumers"
          type="button"
          onClick={() => setActiveTab('consumers')}
          className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition whitespace-nowrap cursor-pointer ${
            activeTab === 'consumers'
              ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-blue-600" />
          <span>10 Duschbereiche & Last ({metrics.activeShowersCount} Duschen)</span>
        </button>

        <button
          id="tab-btn-generators"
          type="button"
          onClick={() => setActiveTab('generators')}
          className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition whitespace-nowrap cursor-pointer ${
            activeTab === 'generators'
              ? 'bg-white text-amber-700 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          <span>3x Wärmepumpen & Zusatzheizung ({metrics.totalHeatGenerationPowerKw} kW)</span>
        </button>

        <button
          id="tab-btn-storage"
          type="button"
          onClick={() => setActiveTab('storage')}
          className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition whitespace-nowrap cursor-pointer ${
            activeTab === 'storage'
              ? 'bg-white text-cyan-700 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-cyan-500" />
          <span>3x 2.000 L Puffer ({buffer.topTempC}°C)</span>
        </button>

        <button
          id="tab-btn-fws"
          type="button"
          onClick={() => setActiveTab('fws')}
          className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition whitespace-nowrap cursor-pointer ${
            activeTab === 'fws'
              ? 'bg-white text-teal-700 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Droplets className="w-3.5 h-3.5 text-teal-500" />
          <span>4x FWS Kaskade ({metrics.fwsCapacityUtilizationPercent}%)</span>
        </button>

        <button
          id="tab-btn-circulation"
          type="button"
          onClick={() => setActiveTab('circulation')}
          className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition whitespace-nowrap cursor-pointer ${
            activeTab === 'circulation'
              ? 'bg-white text-rose-700 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
          <span>Zirkulation & Hygiene ({metrics.circulationTempDropK} K ΔT)</span>
        </button>
      </div>

      {/* Tab Content Panels */}
      <div className="p-4 sm:p-6">
        {/* TAB 1: CONSUMERS & SANITARY */}
        {activeTab === 'consumers' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Verbraucher & Duschbetrieb (10 Duschbereiche à 5 Duschen + 5 Waschtische)
                </h3>
                <p className="text-xs text-slate-500">
                  Berechnung des Spitzenvolumenstroms und Mischwasserbedarfs nach DIN 1988-300
                </p>
              </div>

              {/* Quick Simultaneity Presets */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-slate-500 font-medium mr-1">Voreinstellungen:</span>
                <button
                  type="button"
                  onClick={() =>
                    setSanitary((prev) => ({
                      ...prev,
                      activeShowersCount: 40,
                      activeWashbasinsCount: 25,
                      showerSimultaneityPercent: 80,
                      washbasinSimultaneityPercent: 50,
                    }))
                  }
                  className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition cursor-pointer"
                >
                  Sport / Schichtende (40 Duschen / 80%)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSanitary((prev) => ({
                      ...prev,
                      activeShowersCount: 25,
                      activeWashbasinsCount: 18,
                      showerSimultaneityPercent: 50,
                      washbasinSimultaneityPercent: 35,
                    }))
                  }
                  className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition cursor-pointer"
                >
                  Fitnesscenter (25 Duschen / 50%)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSanitary((prev) => ({
                      ...prev,
                      activeShowersCount: 15,
                      activeWashbasinsCount: 10,
                      showerSimultaneityPercent: 30,
                      washbasinSimultaneityPercent: 20,
                    }))
                  }
                  className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition cursor-pointer"
                >
                  Normalbetrieb (15 Duschen / 30%)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSanitary((prev) => ({
                      ...prev,
                      activeShowersCount: 0,
                      activeWashbasinsCount: 0,
                      showerSimultaneityPercent: 0,
                      washbasinSimultaneityPercent: 0,
                    }))
                  }
                  className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition cursor-pointer"
                >
                  Ruhe / Nacht (0)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Shower Direct Inputs & Sliders */}
              <div className="space-y-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Droplets className="w-3.5 h-3.5 text-blue-600" />
                      Freie Eingabe: Aktive Duschpaneele (0 bis 50)
                    </label>
                    <span className="text-xs font-bold text-blue-700 font-mono">
                      {metrics.activeShowersCount} von 50 ({sanitary.showerSimultaneityPercent}%)
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-24 shrink-0">
                      <input
                        type="number"
                        min="0"
                        max="50"
                        step="1"
                        value={metrics.activeShowersCount}
                        onChange={(e) => {
                          const count = Math.max(0, Math.min(50, Number(e.target.value)));
                          const percent = Math.round((count / 50) * 100);
                          setSanitary((prev) => ({
                            ...prev,
                            activeShowersCount: count,
                            showerSimultaneityPercent: percent,
                          }));
                        }}
                        className="w-full px-2.5 py-1.5 text-sm font-bold font-mono text-center rounded border-2 border-blue-500 bg-white"
                      />
                      <span className="text-[10px] text-slate-400 text-center block mt-0.5">Stk. Duschen</span>
                    </div>

                    <div className="flex-1">
                      <input
                        type="range"
                        min="0"
                        max="50"
                        step="1"
                        value={metrics.activeShowersCount}
                        onChange={(e) => {
                          const count = Number(e.target.value);
                          const percent = Math.round((count / 50) * 100);
                          setSanitary((prev) => ({
                            ...prev,
                            activeShowersCount: count,
                            showerSimultaneityPercent: percent,
                          }));
                        }}
                        className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                        <span>0 (Ruhe)</span>
                        <span>25 (50%)</span>
                        <span>50 (Volllast)</span>
                      </div>
                    </div>
                  </div>

                  {/* Shower Quick-Click Chips */}
                  <div className="flex flex-wrap items-center gap-1 text-[10px] pt-1">
                    <span className="text-slate-500 mr-0.5">Schnell:</span>
                    {[0, 5, 10, 15, 25, 40, 50].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          const percent = Math.round((c / 50) * 100);
                          setSanitary((prev) => ({
                            ...prev,
                            activeShowersCount: c,
                            showerSimultaneityPercent: percent,
                          }));
                        }}
                        className={`px-1.5 py-0.5 rounded cursor-pointer ${
                          metrics.activeShowersCount === c
                            ? 'bg-blue-600 text-white font-bold'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {c} D
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                  <div>
                    <label className="text-[11px] font-medium text-slate-700 block mb-1">
                      Durchfluss / Duschpaneel
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="6"
                        max="18"
                        step="0.5"
                        value={sanitary.showerPanelFlowLmin}
                        onChange={(e) =>
                          setSanitary((prev) => ({
                            ...prev,
                            showerPanelFlowLmin: Math.max(1, Number(e.target.value)),
                          }))
                        }
                        className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 font-mono bg-white"
                      />
                      <span className="text-xs text-slate-500">l/min</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-700 block mb-1">
                      Mischwassertemperatur
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="30"
                        max="45"
                        step="0.5"
                        value={sanitary.showerMixedTempC}
                        onChange={(e) =>
                          setSanitary((prev) => ({
                            ...prev,
                            showerMixedTempC: Number(e.target.value),
                          }))
                        }
                        className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 font-mono bg-white"
                      />
                      <span className="text-xs text-slate-500">°C</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Washbasin Direct Inputs & Sliders */}
              <div className="space-y-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Droplets className="w-3.5 h-3.5 text-teal-600" />
                      Freie Eingabe: Aktive Waschtische (0 bis 50)
                    </label>
                    <span className="text-xs font-bold text-teal-700 font-mono">
                      {metrics.activeWashbasinsCount} von 50 ({sanitary.washbasinSimultaneityPercent}%)
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-24 shrink-0">
                      <input
                        type="number"
                        min="0"
                        max="50"
                        step="1"
                        value={metrics.activeWashbasinsCount}
                        onChange={(e) => {
                          const count = Math.max(0, Math.min(50, Number(e.target.value)));
                          const percent = Math.round((count / 50) * 100);
                          setSanitary((prev) => ({
                            ...prev,
                            activeWashbasinsCount: count,
                            washbasinSimultaneityPercent: percent,
                          }));
                        }}
                        className="w-full px-2.5 py-1.5 text-sm font-bold font-mono text-center rounded border-2 border-teal-500 bg-white"
                      />
                      <span className="text-[10px] text-slate-400 text-center block mt-0.5">Stk. Armaturen</span>
                    </div>

                    <div className="flex-1">
                      <input
                        type="range"
                        min="0"
                        max="50"
                        step="1"
                        value={metrics.activeWashbasinsCount}
                        onChange={(e) => {
                          const count = Number(e.target.value);
                          const percent = Math.round((count / 50) * 100);
                          setSanitary((prev) => ({
                            ...prev,
                            activeWashbasinsCount: count,
                            washbasinSimultaneityPercent: percent,
                          }));
                        }}
                        className="w-full accent-teal-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                        <span>0 (Ruhe)</span>
                        <span>25 (50%)</span>
                        <span>50 (Volllast)</span>
                      </div>
                    </div>
                  </div>

                  {/* Washbasin Quick-Click Chips */}
                  <div className="flex flex-wrap items-center gap-1 text-[10px] pt-1">
                    <span className="text-slate-500 mr-0.5">Schnell:</span>
                    {[0, 5, 10, 20, 35, 50].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          const percent = Math.round((c / 50) * 100);
                          setSanitary((prev) => ({
                            ...prev,
                            activeWashbasinsCount: c,
                            washbasinSimultaneityPercent: percent,
                          }));
                        }}
                        className={`px-1.5 py-0.5 rounded cursor-pointer ${
                          metrics.activeWashbasinsCount === c
                            ? 'bg-teal-600 text-white font-bold'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {c} WT
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                  <div>
                    <label className="text-[11px] font-medium text-slate-700 block mb-1">
                      Durchfluss / Waschtisch
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="2"
                        max="12"
                        step="0.5"
                        value={sanitary.washbasinFlowLmin}
                        onChange={(e) =>
                          setSanitary((prev) => ({
                            ...prev,
                            washbasinFlowLmin: Math.max(1, Number(e.target.value)),
                          }))
                        }
                        className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 font-mono bg-white"
                      />
                      <span className="text-xs text-slate-500">l/min</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-700 block mb-1">
                      Mittlere Duschdauer
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="3"
                        max="20"
                        step="1"
                        value={sanitary.showerDurationMinutes}
                        onChange={(e) =>
                          setSanitary((prev) => ({
                            ...prev,
                            showerDurationMinutes: Math.max(1, Number(e.target.value)),
                          }))
                        }
                        className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 font-mono bg-white"
                      />
                      <span className="text-xs text-slate-500">Min.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Calculation Outcomes Callout */}
            <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-xl space-y-3 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-200 pb-2">
                <div>
                  <span className="font-bold text-blue-950 text-sm">
                    Resultierende Wassermengen & Lastdaten ({metrics.activeShowersCount} Duschen & {metrics.activeWashbasinsCount} Waschtische):
                  </span>
                  <p className="text-blue-900 text-[11px]">
                    Warmwasserbereitstellung über die 4 Frischwasserstationen bei 60°C Sollwert
                  </p>
                </div>
                <div className="font-mono text-blue-900 bg-white px-2.5 py-1 rounded border border-blue-200">
                  Benötigte FWS-Heizleistung: <strong>{metrics.peakThermalDemandKw} kW</strong>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-700">
                <div className="bg-white p-2.5 rounded-lg border border-blue-100">
                  <span className="text-[10px] text-slate-500 block">Warmwasser (60°C)</span>
                  <span className="text-base font-bold text-blue-700 font-mono">
                    {metrics.peakHotWaterFlowLmin} l/min
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">({metrics.peakHotWaterFlowM3h} m³/h)</span>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-blue-100">
                  <span className="text-[10px] text-slate-500 block">Mischwasser (38°C)</span>
                  <span className="text-base font-bold text-slate-900 font-mono">
                    {metrics.peakMixedWaterFlowLmin} l/min
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">An den Armaturen</span>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-blue-100">
                  <span className="text-[10px] text-slate-500 block">Kaltwasser (10°C)</span>
                  <span className="text-base font-bold text-cyan-700 font-mono">
                    {metrics.coldWaterFlowLmin} l/min
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Beimischung</span>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-blue-100">
                  <span className="text-[10px] text-slate-500 block">1 Duschgang ({sanitary.showerDurationMinutes} Min)</span>
                  <span className="text-base font-bold text-red-600 font-mono">
                    {metrics.showerSessionEnergyKwh} kWh
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">{metrics.showerSessionTotalHot60Liters} L WW</span>
                </div>
              </div>

              <div className="pt-2 border-t border-blue-200 text-[11px] text-blue-950 flex flex-wrap items-center justify-between gap-2">
                <span>
                  <strong>Dauer der Pufferaufladung für diesen Duschgang:</strong> mit 3x WP:{' '}
                  <strong>{metrics.showerSessionRechargeTimeWpMinutes} Min.</strong> | mit 136 kW WT:{' '}
                  <strong>{metrics.showerSessionRechargeTimeWtMinutes} Min.</strong> | Kombi (271 kW):{' '}
                  <strong className="text-emerald-700">{metrics.showerSessionRechargeTimeCombinedMinutes} Min.</strong>
                </span>
                <span className="font-mono text-blue-800">
                  Puffer-Autonomie: <strong>{metrics.autonomyStorageOnlyMinutes} Min.</strong>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: GENERATORS (3x WP + CENTRAL HEATING) */}
        {activeTab === 'generators' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">
                    Wärmeerzeuger (3x Mitsubishi QAHV-N560YA-HPB + 136 kW Plattenwärmetauscher)
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Bestätigter Typenschild-Bestand
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Dokumentierter Referenzpunkt: 40,0 kW thermisch, 10,97 kW elektrisch, COP 3,65 bei A7/W9→65°C.
                </p>
              </div>
              <div className="text-right text-xs">
                <span className="text-slate-500">Gesamte Erzeugerleistung: </span>
                <strong className="text-slate-900 font-mono text-sm">{metrics.totalHeatGenerationPowerKw} kW</strong>
              </div>
            </div>

            {/* Heat Pumps Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {heatPumps.map((wp, idx) => (
                <div
                  key={wp.id}
                  className={`p-4 rounded-xl border transition ${
                    wp.enabled
                      ? 'bg-slate-50 border-slate-300'
                      : 'bg-slate-100/60 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                        WP {idx + 1}: QAHV-N560YA
                      </span>
                      <span className="text-[10px] text-slate-500">CO2-Hochtemperatur-WP</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleWpToggle(wp.id)}
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold transition cursor-pointer ${
                        wp.enabled
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-300 text-slate-700'
                      }`}
                    >
                      {wp.enabled ? 'Aktiv' : 'Aus'}
                    </button>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div>
                      <div className="flex justify-between text-slate-600 mb-1">
                        <span>Thermische Leistung (kW)</span>
                        <span className="font-bold font-mono">{wp.thermalPowerKw} kW</span>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="60"
                        step="1"
                        disabled={!wp.enabled}
                        value={wp.thermalPowerKw}
                        onChange={(e) => handleWpPowerChange(wp.id, Number(e.target.value))}
                        className="w-full accent-amber-500 h-1.5 bg-slate-200 rounded"
                      />
                      <span className="text-[10px] text-slate-400">Nennleistung nach Typenschild: 40,0 kW</span>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-600 mb-0.5">
                        <span>Quellentemperatur T_Quelle:</span>
                        <span className="font-mono font-bold text-blue-700">{wp.sourceTempC}°C</span>
                      </div>
                      <input
                        type="range"
                        min="-10"
                        max="20"
                        step="1"
                        disabled={!wp.enabled}
                        value={wp.sourceTempC}
                        onChange={(e) => handleWpSourceTempChange(wp.id, Number(e.target.value))}
                        className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded"
                      />
                      <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                        <span>-10°C</span>
                        <span>+7°C (Typenschild)</span>
                        <span>+20°C</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-600 mb-0.5">
                        <span>Vorlauftemperatur T_VL:</span>
                        <span className="font-mono font-bold text-blue-700">{wp.flowTempC}°C</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="70"
                        step="1"
                        disabled={!wp.enabled}
                        value={wp.flowTempC}
                        onChange={(e) => handleWpFlowTempChange(wp.id, Number(e.target.value))}
                        className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded"
                      />
                    </div>

                    <div className="flex justify-between items-center pt-1 border-t border-slate-200 text-slate-600">
                      <span>Elektrische Leistung (Pel):</span>
                      <span className="font-mono font-medium">{wp.electricalPowerKw} kW</span>
                    </div>

                    <div className="flex justify-between items-center text-slate-600">
                      <span>Berechneter Arbeits-COP:</span>
                      <span className="font-mono font-bold text-emerald-700">
                        {wp.electricalPowerKw > 0
                          ? (wp.thermalPowerKw / wp.electricalPowerKw).toFixed(2)
                          : '0.00'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Central Heating Heat Exchanger Card */}
            <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-blue-600 shrink-0" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-blue-950">
                        136 kW Plattenwärmetauscher (Alternative & zusätzliche Pufferladung)
                      </h4>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-300">
                        Planungsstand (70/55 °C)
                      </span>
                    </div>
                    <p className="text-[11px] text-blue-800">
                      Auslegung laut Planung: 70/55 °C, 7,8 m³/h Heizwasser-Volumenstrom, Anschluss DN40 (nicht mit 75/50 °C rechnen!).
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setCentralHeating((prev) => ({
                        ...prev,
                        enabled: true,
                        powerKw: 136,
                        flowTempC: 70,
                        returnTempC: 55,
                      }))
                    }
                    className="px-2.5 py-1 rounded text-[11px] font-semibold bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer"
                  >
                    Planwert 136 kW (70/55°C)
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setCentralHeating((prev) => ({ ...prev, enabled: !prev.enabled }))
                    }
                    className={`px-3 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                      centralHeating.enabled
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {centralHeating.enabled ? 'Zusatzheizung AKTIV' : 'Zusatzheizung AUS'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 text-xs">
                <div>
                  <label className="text-slate-700 font-medium block mb-1">
                    Übertragene WT-Leistung (kW)
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="200"
                      step="1"
                      disabled={!centralHeating.enabled}
                      value={centralHeating.powerKw}
                      onChange={(e) =>
                        setCentralHeating((prev) => ({
                          ...prev,
                          powerKw: Math.max(0, Number(e.target.value)),
                        }))
                      }
                      className="w-full px-2.5 py-1.5 rounded border border-blue-300 font-mono bg-white disabled:bg-slate-100"
                    />
                    <span className="text-slate-500">kW</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Planungs-Nennwert: 136 kW
                  </span>
                </div>

                <div>
                  <label className="text-slate-700 font-medium block mb-1">
                    Primär-Vorlauf (Planwert)
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="50"
                      max="90"
                      step="1"
                      disabled={!centralHeating.enabled}
                      value={centralHeating.flowTempC}
                      onChange={(e) =>
                        setCentralHeating((prev) => ({
                          ...prev,
                          flowTempC: Number(e.target.value),
                        }))
                      }
                      className="w-full px-2.5 py-1.5 rounded border border-blue-300 font-mono bg-white"
                    />
                    <span className="text-slate-500">°C</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Planwert: 70,0 °C
                  </span>
                </div>

                <div>
                  <label className="text-slate-700 font-medium block mb-1">
                    Primär-Rücklauf (Planwert)
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="30"
                      max="70"
                      step="1"
                      disabled={!centralHeating.enabled}
                      value={centralHeating.returnTempC}
                      onChange={(e) =>
                        setCentralHeating((prev) => ({
                          ...prev,
                          returnTempC: Number(e.target.value),
                        }))
                      }
                      className="w-full px-2.5 py-1.5 rounded border border-blue-300 font-mono bg-white"
                    />
                    <span className="text-slate-500">°C</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Planwert: 55,0 °C
                  </span>
                </div>

                <div>
                  <label className="text-slate-700 font-medium block mb-1">
                    Volumenstrom & Anschluss
                  </label>
                  <div className="px-2.5 py-1.5 rounded border border-blue-200 bg-white font-mono text-slate-800">
                    7,8 m³/h • DN40
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Planungsunterlagen
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: BUFFER STORAGE (3-STUFEN-MODELL) */}
        {activeTab === 'storage' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Pufferspeicher-Anlage (3 Speicher à 2.000 Liter = 6.000 Liter Gesamtvolumen)
                </h3>
                <p className="text-xs text-slate-500">
                  Transparente Berechnung der nutzbaren Wärmeenergie über ein 3-Stufen-Modell
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-cyan-100 text-cyan-800 border border-cyan-300">
                {metrics.storageCalculationModeLabel}
              </span>
            </div>

            {/* 3-Stufen-Auswahl Modus */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-300 space-y-3">
              <label className="text-xs font-bold text-slate-900 block">
                Berechnungsmodell für die nutzbare Speicherenergie:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setBuffer((prev) => ({ ...prev, storageCalcMode: 'fully_mixed' }))}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                    (buffer.storageCalcMode || 'manual_fraction') === 'fully_mixed'
                      ? 'bg-white border-cyan-600 shadow-xs ring-2 ring-cyan-500/20'
                      : 'bg-white/60 border-slate-200 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-slate-900">Stufe 1: Mischtemperatur</span>
                    {(buffer.storageCalcMode || 'manual_fraction') === 'fully_mixed' && (
                      <span className="w-2 h-2 rounded-full bg-cyan-600" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 leading-snug">
                    Einfaches, defensives Modell ohne Schichtung. Berechnet mittlere Temperatur über (T_oben + T_unten)/2.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setBuffer((prev) => ({ ...prev, storageCalcMode: 'manual_fraction' }))}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                    (buffer.storageCalcMode || 'manual_fraction') === 'manual_fraction'
                      ? 'bg-white border-cyan-600 shadow-xs ring-2 ring-cyan-500/20'
                      : 'bg-white/60 border-slate-200 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-slate-900">Stufe 2: Heißwasseranteil</span>
                    {(buffer.storageCalcMode || 'manual_fraction') === 'manual_fraction' && (
                      <span className="w-2 h-2 rounded-full bg-cyan-600" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 leading-snug">
                    Simulationsannahme (Schieberegler 20–90%). Standard 60% Heißwasserschicht bei Nenntemperatur.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setBuffer((prev) => ({ ...prev, storageCalcMode: 'multi_sensor' }))}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                    buffer.storageCalcMode === 'multi_sensor'
                      ? 'bg-white border-cyan-600 shadow-xs ring-2 ring-cyan-500/20'
                      : 'bg-white/60 border-slate-200 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-slate-900">Stufe 3: 3-Sensor-Modell</span>
                    {buffer.storageCalcMode === 'multi_sensor' && (
                      <span className="w-2 h-2 rounded-full bg-cyan-600" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 leading-snug">
                    Reale Fühlerwerte (Oben / Mitte / Unten) aus Gebäudeleittechnik oder Vor-Ort-Messung.
                  </p>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Dynamic Parameter adjustment based on selected mode */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                <h4 className="font-bold text-slate-900">
                  {buffer.storageCalcMode === 'multi_sensor'
                    ? '3-Sensor Temperaturmessung'
                    : 'Puffertemperaturen'}
                </h4>

                <div>
                  <div className="flex justify-between text-slate-700 mb-1">
                    <span>Speicher-Kopftemperatur (T_oben)</span>
                    <span className="font-bold font-mono text-red-600">{buffer.topTempC} °C</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="75"
                    step="0.5"
                    value={buffer.topTempC}
                    onChange={(e) =>
                      setBuffer((prev) => ({
                        ...prev,
                        topTempC: Number(e.target.value),
                        sensorTopTempC: Number(e.target.value),
                      }))
                    }
                    className="w-full accent-red-600 h-1.5 bg-slate-200 rounded"
                  />
                  <span className="text-[10px] text-slate-400">
                    Soll für FWS-Primärvorlauf (mind. 60–65°C)
                  </span>
                </div>

                {buffer.storageCalcMode === 'multi_sensor' && (
                  <div>
                    <div className="flex justify-between text-slate-700 mb-1">
                      <span>Mittlerer Sensor (T_mitte)</span>
                      <span className="font-bold font-mono text-amber-600">
                        {buffer.sensorMidTempC ?? 48.0} °C
                      </span>
                    </div>
                    <input
                      type="range"
                      min="30"
                      max="65"
                      step="0.5"
                      value={buffer.sensorMidTempC ?? 48.0}
                      onChange={(e) =>
                        setBuffer((prev) => ({
                          ...prev,
                          sensorMidTempC: Number(e.target.value),
                        }))
                      }
                      className="w-full accent-amber-500 h-1.5 bg-slate-200 rounded"
                    />
                    <span className="text-[10px] text-slate-400">
                      Trennschicht / Umschaltpunkt 3-Wege-Ventil
                    </span>
                  </div>
                )}

                <div>
                  <div className="flex justify-between text-slate-700 mb-1">
                    <span>Speicher-Fußtemperatur (T_unten)</span>
                    <span className="font-bold font-mono text-blue-600">{buffer.bottomTempC} °C</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="50"
                    step="0.5"
                    value={buffer.bottomTempC}
                    onChange={(e) =>
                      setBuffer((prev) => ({
                        ...prev,
                        bottomTempC: Number(e.target.value),
                        sensorBottomTempC: Number(e.target.value),
                      }))
                    }
                    className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded"
                  />
                  <span className="text-[10px] text-slate-400">
                    Kühler Fußbereich sichert hohen WP-COP
                  </span>
                </div>

                {/* Slider for manual_fraction */}
                {(buffer.storageCalcMode || 'manual_fraction') === 'manual_fraction' && (
                  <div className="pt-2 border-t border-slate-200">
                    <div className="flex justify-between text-slate-700 mb-1">
                      <span className="font-semibold text-cyan-900">
                        Heißwasser-Nutzanteil (Annahme)
                      </span>
                      <span className="font-bold font-mono text-cyan-700">
                        {Math.round((buffer.hotLayerFraction ?? 0.6) * 100)} %
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="0.9"
                      step="0.05"
                      value={buffer.hotLayerFraction ?? 0.6}
                      onChange={(e) =>
                        setBuffer((prev) => ({
                          ...prev,
                          hotLayerFraction: Number(e.target.value),
                        }))
                      }
                      className="w-full accent-cyan-600 h-1.5 bg-slate-200 rounded"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                      <span>20% (Konservativ)</span>
                      <span>60% (Standard)</span>
                      <span>90% (Voll)</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Target parameters and boundaries */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                <h4 className="font-bold text-slate-900">Zielparameter & Schwellen</h4>

                <div>
                  <label className="font-medium text-slate-700 block mb-1">
                    Zielbeladungstemperatur (°C)
                  </label>
                  <input
                    type="number"
                    min="55"
                    max="75"
                    step="1"
                    value={buffer.targetChargingTempC}
                    onChange={(e) =>
                      setBuffer((prev) => ({
                        ...prev,
                        targetChargingTempC: Number(e.target.value),
                      }))
                    }
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 font-mono bg-white"
                  />
                </div>

                <div>
                  <label className="font-medium text-slate-700 block mb-1">
                    Minimale Nutztemperatur FWS (°C)
                  </label>
                  <input
                    type="number"
                    min="45"
                    max="60"
                    step="1"
                    value={buffer.minUsableTempC}
                    onChange={(e) =>
                      setBuffer((prev) => ({
                        ...prev,
                        minUsableTempC: Number(e.target.value),
                      }))
                    }
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 font-mono bg-white"
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    FWS benötigt mind. 60°C TWW + Wärmetauscher-Grädigkeit
                  </span>
                </div>

                <div className="p-2.5 rounded bg-white border border-slate-200 text-[11px] space-y-1">
                  <div className="font-semibold text-slate-800">Modell-Erklärung:</div>
                  <p className="text-slate-600 leading-snug">
                    {metrics.storageCalculationExplanation}
                  </p>
                </div>
              </div>

              {/* Storage Energetics KPI card with both Usable Energy and Full Enthalpy */}
              <div className="p-4 rounded-xl bg-cyan-50/60 border border-cyan-200 space-y-2.5 text-xs">
                <h4 className="font-bold text-cyan-950">Speicher-Berechnungsergebnis</h4>
                <div className="flex justify-between text-slate-700">
                  <span>Gesamtvolumen:</span>
                  <span className="font-bold font-mono">6.000 Liter (6,0 m³)</span>
                </div>
                <div className="flex justify-between text-slate-700 border-b border-cyan-200 pb-1.5">
                  <span className="font-semibold text-cyan-950">
                    Nutzbare Wärmeenergie ({metrics.storageCalculationModeLabel}):
                  </span>
                  <span className="font-bold font-mono text-cyan-800 text-sm">
                    {metrics.totalStoredEnergyKwh} kWh
                  </span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span className="text-slate-600">Gesamter Wärmeinhalt über Rücklauf:</span>
                  <span className="font-bold font-mono text-slate-800">
                    {metrics.storedEnergyFullDeltaKwh} kWh
                  </span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Ladezustand (SoC):</span>
                  <span className="font-bold font-mono text-cyan-800">
                    {metrics.storageStateOfChargePercent} %
                  </span>
                </div>
                <div className="flex justify-between text-slate-700 border-t border-cyan-200 pt-2">
                  <span>Wiederaufheizzeit:</span>
                  <span className="font-bold font-mono text-slate-900">
                    {metrics.storageReheatTimeHours} Stunden
                  </span>
                </div>
                <p className="text-[10px] text-cyan-900 mt-1">
                  Bei {metrics.totalHeatGenerationPowerKw} kW Gesamterzeugung.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: FRESH WATER STATIONS (4x FWS) */}
        {activeTab === 'fws' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">
                    Frischwasserstationen (4x Danfoss FWS 130 kW in Kaskadenschaltung)
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                    Typenschild 70/25°C • Prüfpunkt 65°C
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Nennleistung nach Typenschild: 130 kW bzw. 37,3 l/min je Station bei 70/25 → 10/60 °C (Kaskade: 149,2 l/min).
                </p>
              </div>
              <div className="text-right text-xs">
                <span className="text-slate-500">Auslastung: </span>
                <strong className={`font-mono text-sm ${metrics.fwsCapacityUtilizationPercent > 100 ? 'text-rose-600' : 'text-emerald-700'}`}>
                  {metrics.fwsCapacityUtilizationPercent} %
                </strong>
              </div>
            </div>

            {/* Thermal margin / Operating rating notice banner */}
            <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
              metrics.thermalMarginStatus === 'CRITICAL'
                ? 'bg-rose-50 border-rose-300 text-rose-900'
                : metrics.thermalMarginStatus === 'TIGHT'
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : 'bg-emerald-50 border-emerald-300 text-emerald-900'
            }`}>
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">
                <strong className="block font-semibold">
                  Thermischer Betriebsstatus & Übertragungsleistung:
                </strong>
                <p className="mt-0.5 text-[11px] leading-relaxed">
                  {metrics.thermalMarginNotice}
                </p>
                <div className="mt-1 pt-1 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                  <span>{metrics.fwsOperatingNotice}</span>
                  <span className="font-semibold">Auslegungs-Klassifizierung: {metrics.fwsOperatingRating}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4 text-xs">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-semibold text-slate-800">
                      Aktive Frischwasserstationen in Kaskade
                    </label>
                    <span className="font-bold text-teal-700 font-mono">
                      {fws.activeStations} von 4 Stationen
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="4"
                    step="1"
                    value={fws.activeStations}
                    onChange={(e) =>
                      setFws((prev) => ({ ...prev, activeStations: Number(e.target.value) }))
                    }
                    className="w-full accent-teal-600 h-2 bg-slate-200 rounded cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>1 FWS (37,3 l/min Nenn)</span>
                    <span>2 FWS (74,6 l/min)</span>
                    <span>3 FWS (111,9 l/min)</span>
                    <span>4 FWS (149,2 l/min)</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="font-medium text-slate-700 block mb-1">
                      Nennleistung je FWS (Typenschild)
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="20"
                        max="100"
                        step="0.1"
                        value={fws.ratedCapacityPerStationLmin}
                        onChange={(e) =>
                          setFws((prev) => ({
                            ...prev,
                            ratedCapacityPerStationLmin: Number(e.target.value),
                          }))
                        }
                        className="w-full px-2.5 py-1.5 rounded border border-slate-300 font-mono bg-white"
                      />
                      <span className="text-slate-500">l/min</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Typenschild: 37,3 l/min (130 kW)
                    </span>
                  </div>

                  <div>
                    <label className="font-medium text-slate-700 block mb-1">
                      Kaltwasser-Eintritt (°C)
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="5"
                        max="20"
                        step="1"
                        value={fws.coldWaterInletTempC}
                        onChange={(e) =>
                          setFws((prev) => ({
                            ...prev,
                            coldWaterInletTempC: Number(e.target.value),
                          }))
                        }
                        className="w-full px-2.5 py-1.5 rounded border border-slate-300 font-mono bg-white"
                      />
                      <span className="text-slate-500">°C</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Temperatures & Hygiene Target */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                <h4 className="font-bold text-slate-900">Temperaturen & DVGW-W551-Konformität</h4>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-slate-700">
                      Warmwasser-Austrittstemperatur (Soll ≥ 60°C)
                    </span>
                    <span
                      className={`font-mono font-bold ${
                        fws.hotWaterOutletTempC >= 60 ? 'text-emerald-700' : 'text-rose-600'
                      }`}
                    >
                      {fws.hotWaterOutletTempC} °C
                    </span>
                  </div>
                  <input
                    type="range"
                    min="45"
                    max="70"
                    step="0.5"
                    value={fws.hotWaterOutletTempC}
                    onChange={(e) =>
                      setFws((prev) => ({
                        ...prev,
                        hotWaterOutletTempC: Number(e.target.value),
                      }))
                    }
                    className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded"
                  />
                  {fws.hotWaterOutletTempC < 60 && (
                    <span className="text-[10px] text-rose-600 font-semibold block mt-0.5">
                      Achtung: DVGW W 551 verlangt bei Großanlagen mindestens 60°C Warmwasseraustritt!
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="font-medium text-slate-700 block mb-1">
                      Primär-Vorlauf (°C)
                    </label>
                    <input
                      type="number"
                      min="50"
                      max="80"
                      step="1"
                      value={fws.primaryFlowTempC}
                      onChange={(e) =>
                        setFws((prev) => ({
                          ...prev,
                          primaryFlowTempC: Number(e.target.value),
                        }))
                      }
                      className="w-full px-2.5 py-1.5 rounded border border-slate-300 font-mono bg-white"
                    />
                    <span className="text-[10px] text-amber-700 font-medium block mt-0.5">
                      Prüfpunkt: 65°C Primär
                    </span>
                  </div>

                  <div>
                    <label className="font-medium text-slate-700 block mb-1">
                      Primär-Rücklauf (°C)
                    </label>
                    <input
                      type="number"
                      min="20"
                      max="45"
                      step="1"
                      value={fws.primaryReturnTempC}
                      onChange={(e) =>
                        setFws((prev) => ({
                          ...prev,
                          primaryReturnTempC: Number(e.target.value),
                        }))
                      }
                      className="w-full px-2.5 py-1.5 rounded border border-slate-300 font-mono bg-white"
                    />
                  </div>
                </div>

                <div className="p-2 rounded bg-teal-50 border border-teal-200 text-teal-900 text-[11px] mt-2 space-y-1">
                  <div className="flex justify-between">
                    <span>Erforderlicher Heizwasservolumenstrom (Primär):</span>
                    <span className="font-bold font-mono">
                      {metrics.requiredPrimaryFlowLh.toLocaleString()} l/h
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px] text-teal-800 pt-1 border-t border-teal-200/60">
                    <span>3-Wege-Ventil Puffer 3:</span>
                    <span className="font-semibold">
                      {metrics.fwsReturnValvePosition === 'BOTTOM_STRAT' ? '⬇ Fußzone (RL < 30°C)' : '➡ Mittelzone (RL ≥ 30°C)'}
                    </span>
                  </div>
                </div>

                {/* Trinkwasserzähler (Zulaufleitung FWS) */}
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 space-y-2 mt-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-900 text-xs flex items-center gap-1.5">
                      <Droplets className="w-3.5 h-3.5 text-blue-600" />
                      Trinkwasserzähler (Zulauf FWS)
                    </span>
                    {metrics.waterMeterDeltaM3 !== undefined ? (
                      <span className="font-bold font-mono text-xs text-blue-700">
                        Δ {metrics.waterMeterDeltaM3} m³ ({metrics.waterMeterThermalEnergyKwh} kWh)
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500 italic">Noch kein Zählerstand erfasst</span>
                    )}
                  </div>
                  <p className="text-[11px] text-blue-800 leading-snug">
                    {metrics.waterMeterEnergyNote}
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-700 block mb-0.5">
                        Aktueller Zählerstand (m³)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={fws.waterMeterReadingM3 ?? ''}
                        onChange={(e) =>
                          setFws((prev) => ({
                            ...prev,
                            waterMeterReadingM3: e.target.value === '' ? undefined : Number(e.target.value),
                            waterMeterIsSample: false,
                          }))
                        }
                        placeholder="z.B. 1428.65"
                        className="w-full px-2 py-1 text-xs rounded border border-blue-300 font-mono bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-700 block mb-0.5">
                        Vorheriger Stand (m³)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={fws.waterMeterLastReadingM3 ?? ''}
                        onChange={(e) =>
                          setFws((prev) => ({
                            ...prev,
                            waterMeterLastReadingM3: e.target.value === '' ? undefined : Number(e.target.value),
                            waterMeterIsSample: false,
                          }))
                        }
                        placeholder="z.B. 1420.20"
                        className="w-full px-2 py-1 text-xs rounded border border-blue-300 font-mono bg-white"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1 text-[10px]">
                    <button
                      type="button"
                      onClick={() =>
                        setFws((prev) => ({
                          ...prev,
                          waterMeterReadingM3: 1428.65,
                          waterMeterLastReadingM3: 1420.20,
                          waterMeterIsSample: true,
                        }))
                      }
                      className="text-blue-700 hover:text-blue-900 underline cursor-pointer"
                    >
                      Muster-Zählerstand laden (Demo)
                    </button>
                    {(fws.waterMeterReadingM3 !== undefined || fws.waterMeterLastReadingM3 !== undefined) && (
                      <button
                        type="button"
                        onClick={() =>
                          setFws((prev) => ({
                            ...prev,
                            waterMeterReadingM3: undefined,
                            waterMeterLastReadingM3: undefined,
                            waterMeterIsSample: false,
                          }))
                        }
                        className="text-slate-500 hover:text-slate-700 underline cursor-pointer"
                      >
                        Zählerstand leeren
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: CIRCULATION & HYGIENE */}
        {activeTab === 'circulation' && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Trinkwasserhygiene & Zirkulationssystem (DIN 1988-200 & DVGW W 551)
              </h3>
              <p className="text-xs text-slate-500">
                Einhaltung der 55°C Rücklauftemperatur, 5 K Maximalspreizung und 3-Liter-Regel
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Zirkulationskreislauf</span>
                  <button
                    type="button"
                    onClick={() =>
                      setCirculation((prev) => ({ ...prev, enabled: !prev.enabled }))
                    }
                    className={`px-3 py-1 rounded text-xs font-semibold cursor-pointer ${
                      circulation.enabled
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-300 text-slate-700'
                    }`}
                  >
                    {circulation.enabled ? 'Zirkulation EIN' : 'Zirkulation AUS'}
                  </button>
                </div>

                <div>
                  <div className="flex justify-between text-slate-700 mb-1">
                    <span>Gesamte Rohrlänge Zirkulation</span>
                    <span className="font-mono font-bold">{circulation.pipeLengthMeters} Meter</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="500"
                    step="10"
                    value={circulation.pipeLengthMeters}
                    onChange={(e) =>
                      setCirculation((prev) => ({
                        ...prev,
                        pipeLengthMeters: Number(e.target.value),
                      }))
                    }
                    className="w-full accent-rose-600 h-1.5 bg-slate-200 rounded"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>50 m</span>
                    <span>220 m (Standard)</span>
                    <span>500 m</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="font-medium text-slate-700 block mb-1">
                      Pumpe Fördervolumen
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="100"
                        max="2000"
                        step="50"
                        value={circulation.pumpFlowRateLh}
                        onChange={(e) =>
                          setCirculation((prev) => ({
                            ...prev,
                            pumpFlowRateLh: Number(e.target.value),
                          }))
                        }
                        className="w-full px-2.5 py-1.5 rounded border border-slate-300 font-mono bg-white"
                      />
                      <span className="text-slate-500">l/h</span>
                    </div>
                  </div>

                  <div>
                    <label className="font-medium text-slate-700 block mb-1">
                      Rohrverlust (W/m)
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="5"
                        max="30"
                        step="1"
                        value={circulation.specificLossWpm}
                        onChange={(e) =>
                          setCirculation((prev) => ({
                            ...prev,
                            specificLossWpm: Number(e.target.value),
                          }))
                        }
                        className="w-full px-2.5 py-1.5 rounded border border-slate-300 font-mono bg-white"
                      />
                      <span className="text-slate-500">W/m</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Return Temp & 3-Liter-Rule */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4 text-xs">
                <div>
                  <div className="flex justify-between text-slate-700 mb-1">
                    <span className="font-semibold">
                      Zirkulations-Rücklauftemperatur (Soll ≥ 55°C)
                    </span>
                    <span
                      className={`font-mono font-bold ${
                        circulation.returnTempC >= 55 ? 'text-emerald-700' : 'text-rose-600'
                      }`}
                    >
                      {circulation.returnTempC} °C
                    </span>
                  </div>
                  <input
                    type="range"
                    min="45"
                    max="60"
                    step="0.5"
                    value={circulation.returnTempC}
                    onChange={(e) =>
                      setCirculation((prev) => ({
                        ...prev,
                        returnTempC: Number(e.target.value),
                      }))
                    }
                    className="w-full accent-rose-600 h-1.5 bg-slate-200 rounded"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                    <span>45°C (Kritisch!)</span>
                    <span>55°C (DVGW Mindestwert)</span>
                    <span>60°C</span>
                  </div>
                </div>

                {/* 3-Liter Rule Check */}
                <div className="pt-2 border-t border-slate-200">
                  <label className="font-semibold text-slate-800 block mb-1">
                    Volumen der Stichleitung zur entferntesten Zapfstelle (3-Liter-Regel)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0.5"
                      max="6.0"
                      step="0.1"
                      value={circulation.maxTapDistancePipeVolumeLitres}
                      onChange={(e) =>
                        setCirculation((prev) => ({
                          ...prev,
                          maxTapDistancePipeVolumeLitres: Number(e.target.value),
                        }))
                      }
                      className="w-28 px-2.5 py-1.5 rounded border border-slate-300 font-mono bg-white"
                    />
                    <span className="text-slate-500">Liter</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        circulation.maxTapDistancePipeVolumeLitres <= 3.0
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {circulation.maxTapDistancePipeVolumeLitres <= 3.0
                        ? '≤ 3 L (Normgerecht)'
                        : '> 3 L (Unzulässig ohne Zirkulationsanbindung!)'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Gemäß DVGW W 551 müssen alle Leitungsabschnitte mit mehr als 3 Litern Inhalt in den Zirkulationskreislauf einbezogen werden.
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-950 text-[11px] space-y-1">
                  <div className="flex justify-between">
                    <span>Errechneter Zirkulations-Wärmeverlust:</span>
                    <span className="font-mono font-bold">{metrics.circulationLossKw} kW</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Empfohlener Mindestpumpenfluss (für ≤ 5 K):</span>
                    <span className="font-mono font-bold">
                      {metrics.circulationPumpMinFlowLh} l/h
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
