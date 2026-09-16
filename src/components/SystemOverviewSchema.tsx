import React, { useState } from 'react';
import {
  Zap,
  Flame,
  Droplets,
  Layers,
  ArrowRight,
  Info,
  CheckCircle2,
  AlertTriangle,
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

interface SystemOverviewSchemaProps {
  heatPumps: HeatPumpConfig[];
  centralHeating: CentralHeatingConfig;
  buffer: BufferStorageConfig;
  fws: FreshWaterStationConfig;
  sanitary: SanitaryConsumerConfig;
  circulation: CirculationConfig;
  metrics: SystemCalculations;
}

export const SystemOverviewSchema: React.FC<SystemOverviewSchemaProps> = ({
  heatPumps,
  centralHeating,
  buffer,
  fws,
  sanitary,
  circulation,
  metrics,
}) => {
  const [selectedElement, setSelectedElement] = useState<string | null>(null);

  return (
    <div
      id="system-overview-schema"
      className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-6 overflow-hidden"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" />
            Interaktives Hydraulikschema der Groß-Warmwasseranlage
          </h2>
          <p className="text-xs text-slate-500">
            Dynamische Visualisierung von Wärmeerzeugung, 6.000 L Pufferspeichern, 4er-FWS-Kaskade, 10 Duschbereichen und Zirkulation
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <span className="w-3 h-1.5 bg-red-500 rounded-sm" />
            <span>Vorlauf 60-65°C</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-1.5 bg-violet-500 rounded-sm" />
            <span>Zirkulation ≥55°C</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-1.5 bg-blue-500 rounded-sm" />
            <span>Kaltwasser 10°C / Rücklauf</span>
          </div>
        </div>
      </div>

      {/* Hydraulic Diagram Container */}
      <div className="relative bg-slate-950 rounded-xl p-4 sm:p-6 text-slate-100 border border-slate-800 overflow-x-auto min-w-[760px]">
        {/* Top Connecting Header Track */}
        <div className="grid grid-cols-12 gap-3 items-center">
          
          {/* SECTION 1: HEAT GENERATION (Col 1-3) */}
          <div className="col-span-3 space-y-3">
            <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between pb-1 border-b border-slate-800">
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Erzeuger
              </span>
              <span className="text-[11px] text-amber-400 font-mono">
                {metrics.totalHeatGenerationPowerKw} kW
              </span>
            </div>

            {/* Heat Pumps 1-3 */}
            <div className="space-y-2">
              {heatPumps.map((wp, idx) => (
                <div
                  key={wp.id}
                  onClick={() => setSelectedElement(selectedElement === wp.id ? null : wp.id)}
                  className={`p-2.5 rounded-lg border text-xs cursor-pointer transition ${
                    wp.enabled
                      ? 'bg-slate-900 border-emerald-500/50 hover:border-emerald-400'
                      : 'bg-slate-900/40 border-slate-800 opacity-60'
                  } ${selectedElement === wp.id ? 'ring-2 ring-blue-500' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">
                      WP {idx + 1} ({wp.thermalPowerKw} kW)
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                        wp.enabled
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {wp.enabled ? 'AKTIV' : 'AUS'}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Pel: {wp.electricalPowerKw} kW</span>
                    <span className="text-blue-400 font-medium">
                      COP {(wp.thermalPowerKw / wp.electricalPowerKw).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}

              {/* Central Heating Heat Exchanger */}
              <div
                onClick={() => setSelectedElement(selectedElement === 'central-he' ? null : 'central-he')}
                className={`p-2.5 rounded-lg border text-xs cursor-pointer transition ${
                  centralHeating.enabled
                    ? 'bg-slate-900 border-orange-500/50 hover:border-orange-400'
                    : 'bg-slate-900/40 border-slate-800 opacity-60'
                } ${selectedElement === 'central-he' ? 'ring-2 ring-blue-500' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200 flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-orange-400" />
                    Zentralheizung WT
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                      centralHeating.enabled
                        ? 'bg-orange-950 text-orange-300 border border-orange-800'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {centralHeating.enabled ? 'ONLINE' : 'STANDBY'}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Platten-WT</span>
                  <span className="text-orange-400 font-medium font-mono">
                    {centralHeating.powerKw} kW ({centralHeating.flowTempC}°C)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* FLOW ARROW 1 -> 2 */}
          <div className="col-span-1 flex flex-col items-center justify-center space-y-2">
            <div className="h-0.5 w-full bg-gradient-to-r from-red-600 to-red-500 relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[9px] text-red-300 font-mono">
                VL 65°C
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-red-400" />
            <div className="h-0.5 w-full bg-gradient-to-r from-blue-600 to-blue-500 relative">
              <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-[9px] text-blue-300 font-mono">
                RL 30°C
              </span>
            </div>
          </div>

          {/* SECTION 2: 3x 2000L PUFFERSPEICHER (Col 5-6) */}
          <div className="col-span-3 space-y-3">
            <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between pb-1 border-b border-slate-800">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                3x 2.000 L Puffer
              </span>
              <span className="text-[11px] text-cyan-400 font-mono">
                6.000 L
              </span>
            </div>

            {/* 3 Tank Visuals in Parallel */}
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((tankNum) => (
                <div
                  key={tankNum}
                  onClick={() => setSelectedElement(selectedElement === `tank-${tankNum}` ? null : `tank-${tankNum}`)}
                  className={`bg-slate-900 rounded-lg p-2 border border-slate-700 flex flex-col items-center cursor-pointer hover:border-cyan-400 transition ${
                    selectedElement === `tank-${tankNum}` ? 'ring-2 ring-cyan-400' : ''
                  }`}
                >
                  <span className="text-[10px] font-semibold text-slate-300 mb-1">
                    PS {tankNum}
                  </span>
                  {/* Storage Tank Cylinder Visual */}
                  <div className="w-10 h-24 rounded-md border border-slate-600 relative overflow-hidden bg-slate-950 flex flex-col justify-between p-0.5">
                    {/* Stratification Gradient */}
                    <div
                      className="absolute inset-0 bg-gradient-to-b from-red-600 via-amber-600 to-blue-700 opacity-80"
                      style={{
                        height: `${metrics.storageStateOfChargePercent}%`,
                        top: `${100 - metrics.storageStateOfChargePercent}%`,
                      }}
                    />
                    {/* Top Temperature */}
                    <span className="relative z-10 text-[9px] font-mono text-white bg-slate-900/80 px-0.5 rounded text-center">
                      {buffer.topTempC}°C
                    </span>
                    {/* Mid Sensor */}
                    <div className="relative z-10 w-1.5 h-1.5 rounded-full bg-amber-400 mx-auto" />
                    {/* Bottom Temperature */}
                    <span className="relative z-10 text-[9px] font-mono text-white bg-slate-900/80 px-0.5 rounded text-center">
                      {buffer.bottomTempC}°C
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-400 mt-1">2.000 L</span>
                </div>
              ))}
            </div>

            {/* Storage Battery KPI */}
            <div className="bg-slate-900/90 rounded-md p-2 border border-slate-800 text-[11px] flex justify-between items-center">
              <div>
                <span className="text-slate-400">Speicherenergie:</span>{' '}
                <span className="font-bold text-cyan-300">{metrics.totalStoredEnergyKwh} kWh</span>
              </div>
              <div>
                <span className="text-slate-400">Ladezeit:</span>{' '}
                <span className="font-bold text-amber-300">{metrics.storageReheatTimeHours} h</span>
              </div>
            </div>
          </div>

          {/* FLOW ARROW 2 -> 3 */}
          <div className="col-span-1 flex flex-col items-center justify-center space-y-2">
            <div className="h-0.5 w-full bg-gradient-to-r from-red-500 to-red-600 relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[9px] text-red-300 font-mono">
                {fws.primaryFlowTempC}°C
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-red-400" />
            <div className="h-0.5 w-full bg-gradient-to-r from-blue-500 to-blue-600 relative">
              <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-[9px] text-blue-300 font-mono">
                {fws.primaryReturnTempC}°C
              </span>
            </div>
          </div>

          {/* SECTION 3: 4x FRISCHWASSERSTATIONEN (Col 8-9) */}
          <div className="col-span-2 space-y-3">
            <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between pb-1 border-b border-slate-800">
              <span className="flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-blue-400" />
                4x FWS Kaskade
              </span>
              <span
                className={`text-[10px] font-mono px-1 rounded ${
                  metrics.fwsSufficient ? 'text-emerald-400 bg-emerald-950' : 'text-rose-400 bg-rose-950'
                }`}
              >
                {metrics.fwsCapacityUtilizationPercent}% Last
              </span>
            </div>

            {/* 4 FWS Units */}
            <div className="grid grid-cols-2 gap-1.5">
              {[1, 2, 3, 4].map((fwsId) => {
                const isActive = fwsId <= fws.activeStations;
                return (
                  <div
                    key={fwsId}
                    onClick={() => setSelectedElement(selectedElement === `fws-${fwsId}` ? null : `fws-${fwsId}`)}
                    className={`p-1.5 rounded border text-center cursor-pointer transition ${
                      isActive
                        ? 'bg-slate-900 border-blue-500/60 hover:border-blue-400'
                        : 'bg-slate-900/30 border-slate-800 opacity-50'
                    } ${selectedElement === `fws-${fwsId}` ? 'ring-2 ring-blue-400' : ''}`}
                  >
                    <span className="text-[10px] font-semibold text-slate-200 block">
                      FWS {fwsId}
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono block">
                      {fws.ratedCapacityPerStationLmin} l/min
                    </span>
                    <span
                      className={`text-[8px] font-bold block mt-0.5 ${
                        isActive ? 'text-emerald-400' : 'text-slate-500'
                      }`}
                    >
                      {isActive ? 'BETRIEB' : 'STANDBY'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Outlet Warm Water Tag */}
            <div className="bg-slate-900/90 rounded-md p-1.5 border border-slate-800 text-[10px] text-center">
              <span className="text-slate-400">Warmwasser-Abgang:</span>{' '}
              <span
                className={`font-bold font-mono ${
                  fws.hotWaterOutletTempC >= 60 ? 'text-emerald-300' : 'text-rose-300'
                }`}
              >
                {fws.hotWaterOutletTempC}°C
              </span>
            </div>
          </div>

          {/* SECTION 4: 10 DUSCHBEREICHE (Col 10-12) */}
          <div className="col-span-2 space-y-3">
            <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between pb-1 border-b border-slate-800">
              <span>10 Duschbereiche</span>
              <span className="text-[11px] text-emerald-400 font-mono">
                {metrics.activeShowersCount}/50 Duschen
              </span>
            </div>

            {/* Duschbereiche Grid 5x2 */}
            <div className="bg-slate-900 rounded-lg p-2 border border-slate-800 space-y-1.5">
              <div className="grid grid-cols-5 gap-1">
                {[...Array(10)].map((_, i) => (
                  <div
                    key={i}
                    className="p-1 rounded bg-slate-950 border border-slate-800 text-center"
                    title={`Duschbereich ${i + 1}: 5 Duschpaneele + 5 Waschtische`}
                  >
                    <span className="text-[9px] font-mono text-slate-300 block">
                      Z{i + 1}
                    </span>
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mx-auto mt-0.5" />
                  </div>
                ))}
              </div>

              <div className="text-[10px] text-slate-300 flex justify-between border-t border-slate-800 pt-1">
                <span>Ist-Zapfung:</span>
                <span className="font-bold text-white font-mono">
                  {metrics.peakHotWaterFlowLmin} l/min (60°C)
                </span>
              </div>
            </div>

            {/* Zirkulationsleitung Rückführung */}
            <div className="p-2 rounded-lg bg-slate-900 border border-violet-700/60 text-[10px]">
              <div className="flex items-center justify-between text-violet-300 font-semibold">
                <span>Zirkulation (PWH-C)</span>
                <span className="font-mono">{circulation.pumpFlowRateLh} l/h</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-slate-300">
                <span>Rücklauf: {circulation.returnTempC}°C</span>
                <span
                  className={`font-bold ${
                    metrics.circulationTempDropK <= 5.0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  ΔT: {metrics.circulationTempDropK} K
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Selected Element Detail Inspector Card */}
        {selectedElement && (
          <div className="mt-4 p-3 rounded-lg bg-slate-900/90 border border-blue-500/40 text-xs flex items-start gap-3 animate-fade-in">
            <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold text-slate-100 flex items-center gap-2">
                <span>Komponenten-Diagnose:</span>
                <span className="text-blue-400 font-mono">{selectedElement.toUpperCase()}</span>
              </div>
              <p className="text-slate-300 mt-0.5">
                {selectedElement.startsWith('wp') &&
                  'Wärmepumpe zur Grund- bzw. Spitzenlastabdeckung. Speist über modulierende Ladepumpe in die 3 Pufferspeicher ein.'}
                {selectedElement === 'central-he' &&
                  '136 kW Plattenwärmetauscher der zentralen Heizung. Dient zur alternativen Pufferladung (Notbetrieb / WP-Ausfall) oder als hocheffizienter Spitzenlast-Booster zur schnellen Nachladung der 6.000 L Pufferspeicher bei starkem Duschbetrieb.'}
                {selectedElement.startsWith('tank') &&
                  'Pufferspeicher mit 2.000 Litern Volumen. Ausgelegt auf Schichtungsladung mit Einströmdämpfung zur optimalen FWS-Rücklaufauskühlung.'}
                {selectedElement.startsWith('fws') &&
                  'Frischwasserstation mit mikroprozessorgesteuerter Pumpe und kupferverlötetem Edelstahl-Plattenwärmetauscher zur hygienischen Warmwasserbereitung im Durchflussprinzip.'}
              </p>
            </div>
            <button
              onClick={() => setSelectedElement(null)}
              className="text-slate-400 hover:text-white text-xs px-2 py-0.5 rounded bg-slate-800"
            >
              Schließen
            </button>
          </div>
        )}
      </div>

      {/* Technician Hygiene Alert Footnote */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 bg-slate-50 rounded-lg p-2.5 border border-slate-200">
        <div className="flex items-center gap-2">
          {metrics.normCompliance.w551OutletTemp.status === 'OK' &&
          metrics.normCompliance.w551ReturnTemp.status === 'OK' &&
          metrics.normCompliance.w551TempDrop.status === 'OK' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          )}
          <span>
            <strong>Trinkwasserhygiene (DVGW W 551):</strong> Erzeugeraustritt {fws.hotWaterOutletTempC}°C (Soll ≥60°C) | Zirkulationsrücklauf {circulation.returnTempC}°C (Soll ≥55°C) | Spreizung {metrics.circulationTempDropK} K (Soll ≤5 K)
          </span>
        </div>
        <span className="font-mono text-slate-500">DIN 1988-200 / 300</span>
      </div>
    </div>
  );
};
