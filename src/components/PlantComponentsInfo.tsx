import React, { useState } from 'react';
import {
  Zap,
  Flame,
  Layers,
  Droplets,
  ShieldCheck,
  Info,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import {
  HeatPumpConfig,
  CentralHeatingConfig,
  BufferStorageConfig,
  FreshWaterStationConfig,
  CirculationConfig,
  SystemCalculations,
} from '../types';

interface PlantComponentsInfoProps {
  heatPumps: HeatPumpConfig[];
  centralHeating: CentralHeatingConfig;
  buffer: BufferStorageConfig;
  fws: FreshWaterStationConfig;
  circulation: CirculationConfig;
  metrics: SystemCalculations;
}

type ComponentTab = 'wp' | 'wt' | 'buffer' | 'fws' | 'circulation';

export const PlantComponentsInfo: React.FC<PlantComponentsInfoProps> = ({
  heatPumps,
  centralHeating,
  buffer,
  fws,
  circulation,
  metrics,
}) => {
  const [activeTab, setActiveTab] = useState<ComponentTab>('wp');

  return (
    <div
      id="plant-components-info-card"
      className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden"
    >
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">
              <BookOpen className="w-4 h-4" />
              <span>Anlagen-Kompendium & Fachdokumentation für Monteure</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white">
              Informationsteil zu den Anlagenbestandteilen
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Technische Leistungsdaten, Betriebsmodi, Richtwerte und fachliche Erläuterungen zur Funktion vor Ort
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-mono text-cyan-300">
            <span>Gesamt-Erzeugerleistung:</span>
            <strong className="text-white">{metrics.totalHeatGenerationPowerKw} kW</strong>
          </div>
        </div>

        {/* Tab Pills */}
        <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-1 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('wp')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition whitespace-nowrap cursor-pointer ${
              activeTab === 'wp'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>3x Wärmepumpen (120 kW th)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('wt')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition whitespace-nowrap cursor-pointer ${
              activeTab === 'wt'
                ? 'bg-orange-500 text-slate-950 font-bold shadow-xs'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>136 kW Wärmetauscher (70/55°C)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('buffer')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition whitespace-nowrap cursor-pointer ${
              activeTab === 'buffer'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>3x 2.000 L Pufferspeicher (6.000 L)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('fws')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition whitespace-nowrap cursor-pointer ${
              activeTab === 'fws'
                ? 'bg-blue-500 text-slate-950 font-bold shadow-xs'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700'
            }`}
          >
            <Droplets className="w-3.5 h-3.5" />
            <span>4x Frischwasserstationen (149,2 l/min)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('circulation')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition whitespace-nowrap cursor-pointer ${
              activeTab === 'circulation'
                ? 'bg-rose-500 text-slate-950 font-bold shadow-xs'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Zirkulation & Hygiene (W 551)</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="p-4 sm:p-6 text-slate-700 text-xs">
        {/* TAB 1: WÄRMEPUMPEN */}
        {activeTab === 'wp' && (
          <div className="space-y-5 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  Wärmepumpen-Kaskade (3x Mitsubishi QAHV-N560YA-HPB à 40,0 kW th = 120,0 kW)
                </h3>
                <p className="text-slate-500 mt-0.5">
                  3x Wärmepumpen laut Projektunterlagen vorhanden (Typengleichheit aller 3 QAHV-Geräte bei Vor-Ort-Aufnahme noch abschließend zu dokumentieren). Referenzdaten: 40,0 kW th, 10,97 kW el, COP 3,65 bei A7/W9→65°C.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200 font-semibold font-mono">
                  Aktiver System-COP: {metrics.systemCop}
                </span>
                <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-800 font-mono">
                  {heatPumps.filter((w) => w.enabled).length} von 3 WP aktiv ({metrics.totalWpThermalPowerKw} kW)
                </span>
              </div>
            </div>

            {/* Technical Specs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[11px] text-slate-500 font-medium block">Thermische Nennleistung</span>
                <span className="text-base font-bold text-slate-900 font-mono">3x 40,0 kW</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">120,0 kW bei Volllast aller 3 WP</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[11px] text-slate-500 font-medium block">Elektrische Leistungsaufnahme</span>
                <span className="text-base font-bold text-slate-900 font-mono">3x 10,97 kW</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Pel gesamt: 32,9 kW bei A7/65°C</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[11px] text-slate-500 font-medium block">Auslegungs-Vorlauftemperatur</span>
                <span className="text-base font-bold text-amber-600 font-mono">65,0 °C</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">CO2-Hochtemperatur-Transkritisch</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[11px] text-slate-500 font-medium block">Optimaler Rücklauf (WP-Eintritt)</span>
                <span className="text-base font-bold text-emerald-600 font-mono">≤ 30,0 °C</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Typenschild-Referenz W9→65°C</span>
              </div>
            </div>

            {/* Operating States Table */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-slate-100 px-3 py-2 font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                Wichtige Betriebszustände der Wärmepumpen
              </div>
              <div className="divide-y divide-slate-200">
                <div className="p-3 grid grid-cols-1 md:grid-cols-4 gap-2 items-center hover:bg-slate-50">
                  <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Grundlast (WP 1)
                  </div>
                  <div className="text-slate-600">40 kW th | Pel: 11,0 kW</div>
                  <div className="md:col-span-2 text-slate-600">
                    Deckung der Zirkulationsverluste (ca. 2,6 kW) und kontinuierliche Nachladung bei Schwachlast.
                  </div>
                </div>

                <div className="p-3 grid grid-cols-1 md:grid-cols-4 gap-2 items-center hover:bg-slate-50">
                  <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    Mittellast (WP 1 + WP 2)
                  </div>
                  <div className="text-slate-600">80 kW th | Pel: 21,9 kW</div>
                  <div className="md:col-span-2 text-slate-600">
                    Normaler Tagesduschbetrieb (z.B. bis zu 15–20 aktive Duschpaneele parallel).
                  </div>
                </div>

                <div className="p-3 grid grid-cols-1 md:grid-cols-4 gap-2 items-center hover:bg-slate-50">
                  <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Volllast (WP 1 + 2 + 3)
                  </div>
                  <div className="text-slate-600">120 kW th | Pel: 32,9 kW</div>
                  <div className="md:col-span-2 text-slate-600">
                    Starker Duschbetrieb oder zügiges Wiederaufheizen der 6.000 L Pufferspeicher nach Trainingsende.
                  </div>
                </div>

                <div className="p-3 grid grid-cols-1 md:grid-cols-4 gap-2 items-center hover:bg-slate-50">
                  <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    N-1 Redundanz (1 WP gestört)
                  </div>
                  <div className="text-slate-600">80 kW th (Restleistung)</div>
                  <div className="md:col-span-2 text-slate-600">
                    Automatisches Zuschalten des 136 kW Wärmetauschers verhindert Komforteinbrüche bei Ausfall einer WP.
                  </div>
                </div>
              </div>
            </div>

            {/* Technician Field Notes */}
            <div className="p-3.5 rounded-lg bg-amber-50/70 border border-amber-200 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-950 font-semibold block">
                  Praxishinweis für den Monteur vor Ort:
                </strong>
                <p className="text-amber-900 mt-0.5 leading-relaxed">
                  Die Wärmepumpen sind hydraulisch parallel in die 3 Pufferspeicher eingebunden. Für einen optimalen COP (Jahresarbeitszahl)
                  ist entscheidend, dass der Speicher-Fußbereich durch die Frischwasserstationen kalt bleibt (unter 30°C). Steigt der Rücklauf
                  über 45°C an, sinkt der COP signifikant von ~3,65 auf unter 2,5. Prüfen Sie daher bei Wartungsterminen immer die
                  Spreizung und Rücklauftemperatur an den FWS-Sekundärseiten.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: 136 KW WÄRMETAUSCHER */}
        {activeTab === 'wt' && (
          <div className="space-y-5 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-600" />
                  136 kW Plattenwärmetauscher (Planungsstand 70/55 °C)
                </h3>
                <p className="text-slate-500 mt-0.5">
                  Planungsunterlagen: 70/55 °C, 7,8 m³/h Heizwasser, DN40 (nicht mit 75/50 °C rechnen!).
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded text-xs font-semibold font-mono ${
                    centralHeating.enabled
                      ? 'bg-orange-100 text-orange-800 border border-orange-300'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  Status: {centralHeating.enabled ? 'AKTIVGESCHALTET' : 'STANDBY / BEREIT'}
                </span>
                <span className="font-mono font-bold text-orange-600 text-sm">
                  {centralHeating.powerKw} kW
                </span>
              </div>
            </div>

            {/* Function & Role Explanation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-orange-50/60 border border-orange-200 space-y-2">
                <div className="flex items-center gap-2 text-orange-950 font-bold">
                  <Flame className="w-4 h-4 text-orange-600" />
                  <span>Funktion 1: Zusätzliche Spitzenlastheizung (Peak-Shaving)</span>
                </div>
                <p className="text-slate-700 leading-relaxed">
                  Wenn bei Großveranstaltungen, Wettkämpfen oder Schichtende alle 50 Duschpaneele zeitgleich genutzt werden,
                  liegt der Warmwasser-Spitzenbedarf bei über <strong>180–200 kW</strong>. Zusammen mit den Wärmepumpen (120 kW)
                  stellt der 136 kW Wärmetauscher eine <strong>kombinierte Gesamt-Heizleistung von 256 kW</strong> bereit.
                  Dadurch wird ein Auskühlen der 6.000 L Pufferspeicher selbst bei Dauerbetrieb zuverlässig verhindert.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 space-y-2">
                <div className="flex items-center gap-2 text-blue-950 font-bold">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>Funktion 2: Alternative Vollheizung (100% Not- & Wartungsredundanz)</span>
                </div>
                <p className="text-slate-700 leading-relaxed">
                  Bei Ausfall oder Wartung der Wärmepumpen, während EVU-Sperrzeiten oder bei extrem tiefen Außentemperaturen
                  übernimmt der 136 kW Wärmetauscher autark die Pufferladung. Mit 136 kW Nennleistung können 6.000 Liter
                  Puffervolumen in rechnerisch <strong>{metrics.fullStorageRechargeHoursNominalWt} Stunden</strong> von 55°C auf 65°C
                  aufgeheizt werden.
                </p>
              </div>
            </div>

            {/* Key Technical Specs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[11px] text-slate-500 font-medium block">Nenn-Übertragungsleistung</span>
                <span className="text-base font-bold text-slate-900 font-mono">136,0 kW</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Kompakter Edelstahl-Plattenwärmetauscher</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[11px] text-slate-500 font-medium block">Heizungs-Vorlauf (Planwert)</span>
                <span className="text-base font-bold text-orange-600 font-mono">70,0 °C</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Planungsunterlagen: 70/55 °C</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[11px] text-slate-500 font-medium block">Heizungs-Rücklauf (Planwert)</span>
                <span className="text-base font-bold text-slate-900 font-mono">55,0 °C</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Volumenstrom 7,8 m³/h • DN40</span>
              </div>
            </div>

            {/* Performance Comparison Box */}
            <div className="p-3.5 rounded-lg bg-slate-900 text-white border border-slate-800 space-y-2">
              <span className="font-bold text-xs text-orange-400 block">
                Vergleich der Nachladezeiten für 1 Duschgang ({metrics.activeShowersCount} aktive Duschen):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-slate-800 p-2.5 rounded border border-slate-700">
                  <span className="text-slate-400 block text-[10px]">
                    {metrics.totalWpThermalPowerKw > 0
                      ? `Aktive WP (${metrics.totalWpThermalPowerKw.toFixed(0)} kW)`
                      : 'WP (nicht aktiv)'}
                  </span>
                  <span className="text-base font-bold text-white font-mono">
                    {metrics.showerSessionRechargeTimeWpMinutes !== undefined
                      ? `${metrics.showerSessionRechargeTimeWpMinutes} Min.`
                      : '–'}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Nenn (3x 40 kW = 120 kW): {metrics.showerSessionRechargeTimeNominal3WpMinutes} Min.
                  </span>
                </div>

                <div className="bg-slate-800 p-2.5 rounded border border-slate-700">
                  <span className="text-slate-400 block text-[10px]">
                    {metrics.centralHeatingPowerKw > 0
                      ? `WT aktiv (${metrics.centralHeatingPowerKw} kW)`
                      : 'WT (Standby)'}
                  </span>
                  <span className="text-base font-bold text-orange-300 font-mono">
                    {metrics.showerSessionRechargeTimeWtMinutes !== undefined
                      ? `${metrics.showerSessionRechargeTimeWtMinutes} Min.`
                      : '–'}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Nenn (136 kW): {metrics.showerSessionRechargeTimeNominalWtMinutes} Min.
                  </span>
                </div>

                <div className="bg-slate-800 p-2.5 rounded border border-orange-500/50">
                  <span className="text-orange-400 block text-[10px]">Aktive Erzeuger</span>
                  <span className="text-base font-bold text-emerald-400 font-mono">
                    {metrics.showerSessionRechargeTimeCombinedMinutes !== undefined
                      ? `${metrics.showerSessionRechargeTimeCombinedMinutes} Min.`
                      : '–'}
                  </span>
                  <span className="text-[10px] text-emerald-300 block mt-0.5">
                    Nenn (WP+WT 256 kW): {metrics.showerSessionRechargeTimeNominalCombinedMinutes} Min.
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: 3x PUFFERSPEICHER */}
        {activeTab === 'buffer' && (
          <div className="space-y-5 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-600" />
                  Pufferspeicher-Anlage (3 Speicher à 2.000 Liter = 6.000 Liter Gesamtvolumen)
                </h3>
                <p className="text-slate-500 mt-0.5">
                  Schichtungskonzept, thermische Kapazität und Entkoppelung von Erzeugung und Spitzenbedarf
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded bg-cyan-50 text-cyan-800 border border-cyan-200 font-semibold font-mono">
                  Ladezustand (SoC): {metrics.storageStateOfChargePercent}%
                </span>
                <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-800 font-mono">
                  Nutzbarer Wärmeinhalt: {metrics.totalStoredEnergyKwh} kWh
                </span>
              </div>
            </div>

            {/* Stratification Explanation */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="text-red-700 font-bold flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
                  Kopfzone (Oben, {buffer.topTempC}°C)
                </span>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Dient als primäres Heizwasservolumen für die 4 Frischwasserstationen. Muss zur Einhaltung der 60°C
                  Trinkwasser-Austrittstemperatur stets auf mindestens 62–65°C gehalten werden.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="text-amber-700 font-bold flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  Mittelzone (Schichtgrenze)
                </span>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Trennzone zwischen Ladevorrat und ausgekühltem Rücklauf. Beruhigungslanzen verhindern Verwirbelungen
                  beim Umpumpen durch die FWS-Ladepumpen.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="text-blue-700 font-bold flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  Fußzone (Unten, {buffer.bottomTempC}°C)
                </span>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Nimmt den stark abgekühlten FWS-Primärrücklauf (25–30°C) auf. Speist direkt in den Verdampferkreis
                  der Wärmepumpen ein, was deren Verdichterwirkungsgrad maximiert.
                </p>
              </div>
            </div>

            {/* Storage Energetics KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[11px] text-slate-500 font-medium block">Nutzbarer Duschvorrat (kWh)</span>
                <span className="text-base font-bold text-slate-900 font-mono">{metrics.totalStoredEnergyKwh} kWh</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Oberhalb von 55°C Mindesttemperatur</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[11px] text-slate-500 font-medium block">Reine Puffer-Autonomie</span>
                <span className="text-base font-bold text-cyan-600 font-mono">
                  {metrics.autonomyStorageOnlyMinutes} Minuten
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Ohne jegliche Erzeugung bei aktuellen Duschen
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[11px] text-slate-500 font-medium block">Vollladezeit Nenn 3x WP</span>
                <span className="text-base font-bold text-slate-900 font-mono">
                  {metrics.fullStorageRechargeHoursNominal3Wp} h
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Von 55°C auf 65°C bei 120 kW Nennleistung{metrics.fullStorageRechargeHoursWp !== undefined ? ` (aktiv: ${metrics.fullStorageRechargeHoursWp} h)` : ''}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[11px] text-slate-500 font-medium block">Vollladezeit Nenn Kombi</span>
                <span className="text-base font-bold text-emerald-600 font-mono">
                  {metrics.fullStorageRechargeHoursNominalCombined} h
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  WP + 136 kW WT (256 kW Nenn){metrics.fullStorageRechargeHoursCombined !== undefined ? ` (aktiv: ${metrics.fullStorageRechargeHoursCombined} h)` : ''}
                </span>
              </div>
            </div>

            {/* Why Heating Water in Buffer is Hygienic */}
            <div className="p-3.5 rounded-lg bg-cyan-50/70 border border-cyan-200 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-cyan-700 shrink-0 mt-0.5" />
              <div>
                <strong className="text-cyan-950 font-semibold block">
                  Fachliche Erläuterung zum Trinkwasserschutz:
                </strong>
                <p className="text-cyan-900 mt-0.5 leading-relaxed">
                  In den 3 Pufferspeichern (6.000 Liter) befindet sich <strong>kein Trinkwasser</strong>, sondern ausschließlich
                  Heizungswasser (Kreislaufwasser). Dadurch besteht im gesamten Großspeichervolumen <strong>keinerlei Gefahr
                  einer Legionellenvermehrung</strong> im Trinkwassersinne. Die Trinkwassererwärmung erfolgt erst bedarfsgerecht
                  im Durchflussverfahren über die 4 Frischwasserstationen.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: FRISCHWASSERSTATIONEN */}
        {activeTab === 'fws' && (
          <div className="space-y-5 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-blue-600" />
                  Frischwasserstationen-Kaskade (4 Stationen à 130 kW / 37,3 l/min = 149,2 l/min Gesamtleistung)
                </h3>
                <p className="text-slate-500 mt-0.5">
                  Nennkapazität bei 70/25°C primär nach Datenblatt. Bei 65°C Puffer-Vorlauf greift die thermische Pinch-Einschränkung.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-1 rounded font-mono font-semibold text-xs ${
                    metrics.fwsSufficient
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                      : 'bg-rose-50 text-rose-700 border border-rose-300'
                  }`}
                >
                  Auslastung: {metrics.fwsCapacityUtilizationPercent}% ({metrics.fwsTotalCapacityLmin} l/min Kapazität)
                </span>
              </div>
            </div>

            {/* FWS Principles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 space-y-2">
                <h4 className="font-bold text-blue-950 flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-blue-600" />
                  Trinkwasserhygiene im Durchflussprinzip
                </h4>
                <p className="text-slate-700 leading-relaxed">
                  Die Frischwasserstationen erwärmen kaltes Trinkwasser (10°C) sekundengenau und bedarfsabhängig
                  auf <strong>60°C Erzeugeraustrittstemperatur</strong>. Das im Plattenwärmetauscher vorgehaltene
                  Trinkwasservolumen beträgt weniger als 5 Liter pro Station. Dadurch gibt es keine hygienisch bedenklichen
                  Stagnationsbereiche und die Vorgaben nach <strong>DVGW W 551</strong> werden sicher erfüllt.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-900 flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-slate-600" />
                  Modulierende Kaskaden- & Rotationsregelung
                </h4>
                <p className="text-slate-700 leading-relaxed">
                  Die 4 Stationen werden über integrierte Vortex-Durchflusssensoren geschaltet:
                  Bei geringem Bedarf (1–5 Duschen) arbeitet nur Station 1. Steigt der Durchfluss über 30 l/min,
                  schaltet Station 2 modulierend hinzu, gefolgt von 3 und 4 bei Volllast. Um Betriebsstunden
                  gleichmäßig zu verteilen, wechselt der Regler alle 24–48 Betriebsstunden die Führungsstation.
                </p>
              </div>
            </div>

            {/* Performance Indicators */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[11px] text-slate-500 font-medium block">Warmwasser-Nennkapazität</span>
                <span className="text-base font-bold text-slate-900 font-mono">149,2 l/min (8,95 m³/h)</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">4x 37,3 l/min (130 kW bei 70/25°C)</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[11px] text-slate-500 font-medium block">Primär-Rücklauftemperatur</span>
                <span className="text-base font-bold text-emerald-600 font-mono">25,0 - 28,0 °C</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Exzellente Auskühlung für die WP</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[11px] text-slate-500 font-medium block">Erforderlicher Heizwasservolumenstrom</span>
                <span className="text-base font-bold text-slate-900 font-mono">{metrics.requiredPrimaryFlowLh} l/h</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Primärpumpe modulierend</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: ZIRKULATION & HYGIENE */}
        {activeTab === 'circulation' && (
          <div className="space-y-5 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-rose-600" />
                  Zirkulationssystem & Trinkwasserhygiene (DVGW W 551 & DIN 1988-200)
                </h3>
                <p className="text-slate-500 mt-0.5">
                  Temperaturhaltung, hydraulischer Abgleich und Legionellenprävention im Rohrnetz
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-1 rounded font-mono font-semibold text-xs ${
                    metrics.normCompliance.w551ReturnTemp.status === 'OK' &&
                    metrics.normCompliance.w551TempDrop.status === 'OK'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                      : 'bg-amber-50 text-amber-700 border border-amber-300'
                  }`}
                >
                  Rücklauf: {circulation.returnTempC}°C (Spreizung: {metrics.circulationTempDropK} K)
                </span>
              </div>
            </div>

            {/* Norm Requirements Table */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-slate-100 px-3 py-2 font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                Geltende Grenzwerte nach DVGW W 551 & DIN 1988-200
              </div>
              <div className="divide-y divide-slate-200">
                <div className="p-3 grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
                  <div>
                    <span className="font-bold text-slate-900 block">Erzeugeraustritt (PWH)</span>
                    <span className="text-[10px] text-slate-500">Am Ausgang der FWS-Kaskade</span>
                  </div>
                  <div className="font-mono font-bold text-emerald-600">Soll: ≥ 60,0 °C</div>
                  <div className="text-slate-600">
                    Aktueller Istwert: <strong className="font-mono">{fws.hotWaterOutletTempC} °C</strong> (Normkonform)
                  </div>
                </div>

                <div className="p-3 grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
                  <div>
                    <span className="font-bold text-slate-900 block">Zirkulationsrücklauf (PWH-C)</span>
                    <span className="text-[10px] text-slate-500">Vor Eintritt in Speicher/FWS</span>
                  </div>
                  <div className="font-mono font-bold text-emerald-600">Soll: ≥ 55,0 °C</div>
                  <div className="text-slate-600">
                    Aktueller Istwert: <strong className="font-mono">{circulation.returnTempC} °C</strong>
                  </div>
                </div>

                <div className="p-3 grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
                  <div>
                    <span className="font-bold text-slate-900 block">Maximaler Temperaturabfall (ΔT)</span>
                    <span className="text-[10px] text-slate-500">Vorgabe DVGW W 551 Abs. 5</span>
                  </div>
                  <div className="font-mono font-bold text-emerald-600">Soll: ≤ 5,0 K</div>
                  <div className="text-slate-600">
                    Aktuelle Spreizung: <strong className="font-mono">{metrics.circulationTempDropK} K</strong>
                  </div>
                </div>

                <div className="p-3 grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
                  <div>
                    <span className="font-bold text-slate-900 block">3-Liter-Regel (Stichleitungen)</span>
                    <span className="text-[10px] text-slate-500">DIN 1988-200 / VDI 6023</span>
                  </div>
                  <div className="font-mono font-bold text-emerald-600">Soll: ≤ 3,0 Liter Leitungsvolumen</div>
                  <div className="text-slate-600">
                    Längste Stichleitung: <strong className="font-mono">{circulation.maxTapDistancePipeVolumeLitres} L</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Practical Advice for Technicians */}
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
              <strong className="text-slate-900 font-semibold block">
                Hinweis zum hydraulischen Abgleich der 10 Duschbereiche:
              </strong>
              <p className="text-slate-600 leading-relaxed">
                Jeder der 10 Duschbereiche verfügt über ein statisches oder dynamisches Zirkulations-Regulierventil
                (z.B. thermostatisches Abgleichventil). Der Monteur muss sicherstellen, dass in jedem Strang mindestens 55°C
                im Rücklauf anliegen. Fällt ein Strang unter 53°C ab, muss das Regulierventil nachjustiert oder auf
                Verkalkung überprüft werden.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
