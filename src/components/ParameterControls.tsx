import React, { useState } from 'react';
import {
  Flame,
  Activity,
  Layers,
  Waves,
  Users,
  RotateCcw,
  Plus,
  Trash2,
  HelpCircle,
  Thermometer,
  Gauge,
  Sliders,
} from 'lucide-react';
import {
  HeatPumpConfig,
  CentralHeatingConfig,
  BufferStorageConfig,
  FreshWaterStationConfig,
  SanitaryConsumerConfig,
  CirculationConfig,
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
  onResetToDefaults: () => void;
}

type TabType = 'ERZEUGUNG' | 'PUFFER' | 'FWS' | 'VERBRAUCHER' | 'ZIRKULATION';

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
  onResetToDefaults,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('ERZEUGUNG');

  const updateHeatPump = (index: number, field: keyof HeatPumpConfig, val: any) => {
    setHeatPumps((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 bg-slate-50/75 overflow-x-auto">
        <button
          onClick={() => setActiveTab('ERZEUGUNG')}
          className={`px-4 py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'ERZEUGUNG'
              ? 'border-indigo-600 text-indigo-700 bg-white'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Flame className="w-4 h-4 text-orange-500" />
          1. Wärmeerzeugung (WP + WT)
        </button>

        <button
          onClick={() => setActiveTab('PUFFER')}
          className={`px-4 py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'PUFFER'
              ? 'border-indigo-600 text-indigo-700 bg-white'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4 text-indigo-500" />
          2. Pufferspeicher (3x 2.000 L)
        </button>

        <button
          onClick={() => setActiveTab('FWS')}
          className={`px-4 py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'FWS'
              ? 'border-indigo-600 text-indigo-700 bg-white'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Waves className="w-4 h-4 text-cyan-500" />
          3. Frischwasser (Kaskade & Zähler)
        </button>

        <button
          onClick={() => setActiveTab('VERBRAUCHER')}
          className={`px-4 py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'VERBRAUCHER'
              ? 'border-indigo-600 text-indigo-700 bg-white'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4 text-emerald-500" />
          4. Sanitär (Duschen & Zonen)
        </button>

        <button
          onClick={() => setActiveTab('ZIRKULATION')}
          className={`px-4 py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'ZIRKULATION'
              ? 'border-indigo-600 text-indigo-700 bg-white'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <RotateCcw className="w-4 h-4 text-amber-500" />
          5. Zirkulation (W 551)
        </button>

        <div className="ml-auto flex items-center px-3">
          <button
            onClick={onResetToDefaults}
            className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded transition-colors"
            title="Auf Werkseinstellung des Sportzentrums zurücksetzen"
          >
            <RotateCcw className="w-3 h-3" />
            Standardwerte
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      <div className="p-4">
        {/* TAB 1: ERZEUGUNG */}
        {activeTab === 'ERZEUGUNG' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {heatPumps.map((wp, idx) => (
                <div
                  key={wp.id}
                  className={`border rounded-xl p-3.5 transition-colors ${
                    wp.enabled ? 'bg-slate-50/70 border-slate-200' : 'bg-slate-100/60 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={wp.enabled}
                        onChange={(e) => updateHeatPump(idx, 'enabled', e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                      />
                      {wp.name}
                    </label>
                    <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono">
                      Stufe {idx + 1}
                    </span>
                  </div>

                  <div className="space-y-2 mt-2">
                    <div>
                      <div className="flex justify-between text-[11px] text-slate-600 mb-0.5">
                        <span>Thermische Leistung:</span>
                        <span className="font-semibold text-slate-900">{wp.thermalPowerKw} kW</span>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="80"
                        step="1"
                        value={wp.thermalPowerKw}
                        disabled={!wp.enabled}
                        onChange={(e) => updateHeatPump(idx, 'thermalPowerKw', Number(e.target.value))}
                        className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] text-slate-600 mb-0.5">
                        <span>Vorlauftemperatur:</span>
                        <span className="font-semibold text-slate-900">{wp.flowTempC}°C</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="70"
                        step="1"
                        value={wp.flowTempC}
                        disabled={!wp.enabled}
                        onChange={(e) => updateHeatPump(idx, 'flowTempC', Number(e.target.value))}
                        className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] text-slate-600 mb-0.5">
                        <span>Quellentemperatur (Außenluft):</span>
                        <span className="font-semibold text-slate-900">{wp.sourceTempC ?? 7}°C</span>
                      </div>
                      <input
                        type="range"
                        min="-15"
                        max="25"
                        step="1"
                        value={wp.sourceTempC ?? 7}
                        disabled={!wp.enabled}
                        onChange={(e) => updateHeatPump(idx, 'sourceTempC', Number(e.target.value))}
                        className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Zentralheizung / Plattenwärmetauscher */}
            <div className="border border-amber-200 bg-amber-50/40 rounded-xl p-3.5">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-amber-900 flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={centralHeating.enabled}
                    onChange={(e) => setCentralHeating((prev) => ({ ...prev, enabled: e.target.checked }))}
                    className="rounded border-amber-300 text-amber-600 focus:ring-amber-500 w-3.5 h-3.5"
                  />
                  Zentralheizung / Wärmetauscher (Fernwärme oder Kessel)
                </label>
                <span className="text-[11px] text-amber-800 font-semibold">
                  {centralHeating.enabled ? `${centralHeating.powerKw} kW aktiv` : 'Deaktiviert'}
                </span>
              </div>
              <p className="text-[11px] text-amber-700/90 mb-3">{centralHeating.description}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between text-[11px] text-slate-700 mb-0.5">
                    <span>Leistung Wärmeübertrager:</span>
                    <span className="font-semibold">{centralHeating.powerKw} kW</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="300"
                    step="5"
                    value={centralHeating.powerKw}
                    disabled={!centralHeating.enabled}
                    onChange={(e) =>
                      setCentralHeating((prev) => ({ ...prev, powerKw: Number(e.target.value) }))
                    }
                    className="w-full accent-amber-600 h-1.5 bg-amber-200 rounded-lg"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-700 mb-0.5">
                    <span>Vorlauftemperatur Kessel/WT:</span>
                    <span className="font-semibold">{centralHeating.flowTempC}°C</span>
                  </div>
                  <input
                    type="range"
                    min="60"
                    max="85"
                    step="1"
                    value={centralHeating.flowTempC}
                    disabled={!centralHeating.enabled}
                    onChange={(e) =>
                      setCentralHeating((prev) => ({ ...prev, flowTempC: Number(e.target.value) }))
                    }
                    className="w-full accent-amber-600 h-1.5 bg-amber-200 rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PUFFER */}
        {activeTab === 'PUFFER' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <div className="text-xs font-bold text-slate-800 mb-2 flex items-center justify-between">
                  <span>Speichervolumen & Kaskade</span>
                  <Layers className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                      <span>Anzahl Speicher:</span>
                      <span className="font-semibold text-slate-900">{buffer.count} Behälter</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="6"
                      step="1"
                      value={buffer.count}
                      onChange={(e) => setBuffer((p) => ({ ...p, count: Number(e.target.value) }))}
                      className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                      <span>Volumen je Speicher:</span>
                      <span className="font-semibold text-slate-900">{buffer.volumePerTankLiters} L</span>
                    </div>
                    <input
                      type="range"
                      min="500"
                      max="4000"
                      step="100"
                      value={buffer.volumePerTankLiters}
                      onChange={(e) =>
                        setBuffer((p) => ({ ...p, volumePerTankLiters: Number(e.target.value) }))
                      }
                      className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg"
                    />
                  </div>
                  <div className="pt-1 text-[11px] font-semibold text-indigo-900">
                    Gesamter Puffervorrat: {buffer.count * buffer.volumePerTankLiters} Liter
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <div className="text-xs font-bold text-slate-800 mb-2 flex items-center justify-between">
                  <span>Puffertemperatur OBEN (Zone 1)</span>
                  <Thermometer className="w-4 h-4 text-rose-500" />
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                      <span>Vorlauf zu den FWS:</span>
                      <span className="font-semibold text-slate-900">{buffer.topTempC}°C</span>
                    </div>
                    <input
                      type="range"
                      min="45"
                      max="75"
                      step="1"
                      value={buffer.topTempC}
                      onChange={(e) => setBuffer((p) => ({ ...p, topTempC: Number(e.target.value) }))}
                      className="w-full accent-rose-600 h-1.5 bg-slate-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                      <span>Ziel-Ladetemperatur (Soll):</span>
                      <span className="font-semibold text-slate-900">{buffer.targetChargingTempC}°C</span>
                    </div>
                    <input
                      type="range"
                      min="55"
                      max="75"
                      step="1"
                      value={buffer.targetChargingTempC}
                      onChange={(e) =>
                        setBuffer((p) => ({ ...p, targetChargingTempC: Number(e.target.value) }))
                      }
                      className="w-full accent-rose-600 h-1.5 bg-slate-200 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <div className="text-xs font-bold text-slate-800 mb-2 flex items-center justify-between">
                  <span>Puffertemperatur UNTEN (Zone 3)</span>
                  <Thermometer className="w-4 h-4 text-blue-500" />
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                      <span>Rücklauf zu den WPs:</span>
                      <span className="font-semibold text-slate-900">{buffer.bottomTempC}°C</span>
                    </div>
                    <input
                      type="range"
                      min="15"
                      max="50"
                      step="1"
                      value={buffer.bottomTempC}
                      onChange={(e) => setBuffer((p) => ({ ...p, bottomTempC: Number(e.target.value) }))}
                      className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Empfehlung: Kaltwasserzulauf kühlt FWS-Rücklauf idealerweise auf &lt;30°C aus,
                    was in Zone 3 von Puffer 3 geschichtet wird und den WP-COP maximiert.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: FWS & WASSERZÄHLER */}
        {activeTab === 'FWS' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <div className="text-xs font-bold text-slate-800 mb-2">FWS-Kaskade (Stationen)</div>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                      <span>Aktive Stationen:</span>
                      <span className="font-semibold text-slate-900">{fws.activeStations} von 4</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="4"
                      step="1"
                      value={fws.activeStations}
                      onChange={(e) => setFws((p) => ({ ...p, activeStations: Number(e.target.value) }))}
                      className="w-full accent-cyan-600 h-1.5 bg-slate-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                      <span>Kapazität je Station:</span>
                      <span className="font-semibold text-slate-900">{fws.maxCapacityPerStationLmin} l/min</span>
                    </div>
                    <input
                      type="range"
                      min="40"
                      max="120"
                      step="5"
                      value={fws.maxCapacityPerStationLmin}
                      onChange={(e) =>
                        setFws((p) => ({ ...p, maxCapacityPerStationLmin: Number(e.target.value) }))
                      }
                      className="w-full accent-cyan-600 h-1.5 bg-slate-200 rounded-lg"
                    />
                  </div>
                  <div className="text-[11px] font-semibold text-cyan-900">
                    Kaskadenkapazität gesamt: {fws.activeStations * fws.maxCapacityPerStationLmin} l/min
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <div className="text-xs font-bold text-slate-800 mb-2">Temperaturen & Grädigkeit</div>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                      <span>TWW-Austrittstemperatur (Soll):</span>
                      <span className="font-semibold text-slate-900">{fws.hotWaterOutletTempC}°C</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="65"
                      step="0.5"
                      value={fws.hotWaterOutletTempC}
                      onChange={(e) =>
                        setFws((p) => ({ ...p, hotWaterOutletTempC: Number(e.target.value) }))
                      }
                      className="w-full accent-cyan-600 h-1.5 bg-slate-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                      <span>WT-Grädigkeit (Pinch Point):</span>
                      <span className="font-semibold text-slate-900">{fws.designPinchPointK ?? 4} K</span>
                    </div>
                    <input
                      type="range"
                      min="2"
                      max="10"
                      step="0.5"
                      value={fws.designPinchPointK ?? 4}
                      onChange={(e) =>
                        setFws((p) => ({ ...p, designPinchPointK: Number(e.target.value) }))
                      }
                      className="w-full accent-cyan-600 h-1.5 bg-slate-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                      <span>Kaltwasser Eintritt (PWW):</span>
                      <span className="font-semibold text-slate-900">{fws.coldWaterInletTempC}°C</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="20"
                      step="1"
                      value={fws.coldWaterInletTempC}
                      onChange={(e) =>
                        setFws((p) => ({ ...p, coldWaterInletTempC: Number(e.target.value) }))
                      }
                      className="w-full accent-cyan-600 h-1.5 bg-slate-200 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Trinkwasserzähler (Zulauf FWS) */}
              <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-3.5">
                <div className="text-xs font-bold text-blue-900 mb-2 flex items-center justify-between">
                  <span>Trinkwasserzähler (Zulauf FWS)</span>
                  <Gauge className="w-4 h-4 text-blue-600" />
                </div>
                <div className="space-y-2">
                  <div>
                    <label className="text-[11px] text-slate-600 block mb-0.5">
                      Aktueller Zählerstand (m³):
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={fws.waterMeterReadingM3 ?? ''}
                      onChange={(e) =>
                        setFws((p) => ({
                          ...p,
                          waterMeterReadingM3: e.target.value === '' ? undefined : Number(e.target.value),
                        }))
                      }
                      placeholder="z.B. 1428.65"
                      className="w-full border border-slate-300 rounded px-2.5 py-1 text-xs text-slate-800 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-600 block mb-0.5">
                      Letzter Zählerstand / Vorwert (m³):
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={fws.waterMeterLastReadingM3 ?? ''}
                      onChange={(e) =>
                        setFws((p) => ({
                          ...p,
                          waterMeterLastReadingM3: e.target.value === '' ? undefined : Number(e.target.value),
                        }))
                      }
                      placeholder="z.B. 1420.20"
                      className="w-full border border-slate-300 rounded px-2.5 py-1 text-xs text-slate-800 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <p className="text-[10px] text-blue-800/80 leading-normal pt-1">
                    Erfasst die entnommene Kaltwassermenge zur Erwärmung an den FWS für den
                    Wärmemengennachweis nach DIN EN 12831-3.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: VERBRAUCHER */}
        {activeTab === 'VERBRAUCHER' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Duschanlagen */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <div className="text-xs font-bold text-slate-800 mb-2 flex items-center justify-between">
                  <span>Duschbereich (10 Kabinenzonen / 50 Duschen)</span>
                  <Users className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                      <span>Gleichzeitig aktive Duschen:</span>
                      <span className="font-semibold text-slate-900">
                        {sanitary.activeShowersCount} von {sanitary.showersCount}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      step="1"
                      value={sanitary.activeShowersCount}
                      onChange={(e) =>
                        setSanitary((p) => ({ ...p, activeShowersCount: Number(e.target.value) }))
                      }
                      className="w-full accent-emerald-600 h-1.5 bg-slate-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                      <span>Durchfluss je Duschkopf:</span>
                      <span className="font-semibold text-slate-900">{sanitary.showerFlowRateLmin} l/min</span>
                    </div>
                    <input
                      type="range"
                      min="6"
                      max="15"
                      step="0.5"
                      value={sanitary.showerFlowRateLmin}
                      onChange={(e) =>
                        setSanitary((p) => ({ ...p, showerFlowRateLmin: Number(e.target.value) }))
                      }
                      className="w-full accent-emerald-600 h-1.5 bg-slate-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                      <span>Duschtemperatur (Mischwasser):</span>
                      <span className="font-semibold text-slate-900">{sanitary.showerMixedTempC}°C</span>
                    </div>
                    <input
                      type="range"
                      min="35"
                      max="43"
                      step="0.5"
                      value={sanitary.showerMixedTempC}
                      onChange={(e) =>
                        setSanitary((p) => ({ ...p, showerMixedTempC: Number(e.target.value) }))
                      }
                      className="w-full accent-emerald-600 h-1.5 bg-slate-200 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Waschtischanlagen */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <div className="text-xs font-bold text-slate-800 mb-2 flex items-center justify-between">
                  <span>Waschtischanlagen (50 Waschtische)</span>
                  <Sliders className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                      <span>Gleichzeitig aktive Waschtische:</span>
                      <span className="font-semibold text-slate-900">
                        {sanitary.activeWashbasinsCount} von {sanitary.washbasinsCount}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      step="1"
                      value={sanitary.activeWashbasinsCount}
                      onChange={(e) =>
                        setSanitary((p) => ({ ...p, activeWashbasinsCount: Number(e.target.value) }))
                      }
                      className="w-full accent-emerald-600 h-1.5 bg-slate-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                      <span>Durchfluss Waschtisch:</span>
                      <span className="font-semibold text-slate-900">
                        {sanitary.washbasinFlowRateLmin} l/min
                      </span>
                    </div>
                    <input
                      type="range"
                      min="3"
                      max="10"
                      step="0.5"
                      value={sanitary.washbasinFlowRateLmin}
                      onChange={(e) =>
                        setSanitary((p) => ({ ...p, washbasinFlowRateLmin: Number(e.target.value) }))
                      }
                      className="w-full accent-emerald-600 h-1.5 bg-slate-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                      <span>Mischtemperatur Waschtisch:</span>
                      <span className="font-semibold text-slate-900">{sanitary.washbasinMixedTempC}°C</span>
                    </div>
                    <input
                      type="range"
                      min="35"
                      max="42"
                      step="0.5"
                      value={sanitary.washbasinMixedTempC}
                      onChange={(e) =>
                        setSanitary((p) => ({ ...p, washbasinMixedTempC: Number(e.target.value) }))
                      }
                      className="w-full accent-emerald-600 h-1.5 bg-slate-200 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: ZIRKULATION */}
        {activeTab === 'ZIRKULATION' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <div className="text-xs font-bold text-slate-800 mb-2">Rohrnetz & Dämmung</div>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                      <span>Gesamtlänge Zirkulation:</span>
                      <span className="font-semibold text-slate-900">{circulation.pipeLengthMeters} m</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="400"
                      step="10"
                      value={circulation.pipeLengthMeters}
                      onChange={(e) =>
                        setCirculation((p) => ({ ...p, pipeLengthMeters: Number(e.target.value) }))
                      }
                      className="w-full accent-amber-600 h-1.5 bg-slate-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                      <span>Spezifischer Verlust (Dämmung):</span>
                      <span className="font-semibold text-slate-900">{circulation.specificHeatLossWpm} W/m</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="25"
                      step="0.5"
                      value={circulation.specificHeatLossWpm}
                      onChange={(e) =>
                        setCirculation((p) => ({ ...p, specificHeatLossWpm: Number(e.target.value) }))
                      }
                      className="w-full accent-amber-600 h-1.5 bg-slate-200 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <div className="text-xs font-bold text-slate-800 mb-2">Zirkulationspumpe & Rücklauf</div>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                      <span>Pumpenvolumenstrom:</span>
                      <span className="font-semibold text-slate-900">{circulation.pumpFlowRateLh} l/h</span>
                    </div>
                    <input
                      type="range"
                      min="200"
                      max="1500"
                      step="50"
                      value={circulation.pumpFlowRateLh}
                      onChange={(e) =>
                        setCirculation((p) => ({ ...p, pumpFlowRateLh: Number(e.target.value) }))
                      }
                      className="w-full accent-amber-600 h-1.5 bg-slate-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                      <span>Rücklauftemperatur Netz:</span>
                      <span className="font-semibold text-slate-900">{circulation.returnTempC}°C</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="60"
                      step="0.5"
                      value={circulation.returnTempC}
                      onChange={(e) =>
                        setCirculation((p) => ({ ...p, returnTempC: Number(e.target.value) }))
                      }
                      className="w-full accent-amber-600 h-1.5 bg-slate-200 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <div className="text-xs font-bold text-slate-800 mb-2">3-Liter-Regel (DIN 1988)</div>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                      <span>Max. Stichleitungsinhalt:</span>
                      <span className="font-semibold text-slate-900">
                        {circulation.maxTapDistancePipeVolumeLitres} Liter
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="5.0"
                      step="0.1"
                      value={circulation.maxTapDistancePipeVolumeLitres}
                      onChange={(e) =>
                        setCirculation((p) => ({
                          ...p,
                          maxTapDistancePipeVolumeLitres: Number(e.target.value),
                        }))
                      }
                      className="w-full accent-amber-600 h-1.5 bg-slate-200 rounded-lg"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Nach DVGW W 551 und DIN 1988-200 darf der Wasserinhalt zwischen Zirkulationsabzweig
                    und jeder Entnahmearmatur maximal 3,0 Liter betragen.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
