import React, { useState } from 'react';
import {
  Zap,
  Clock,
  Droplets,
  Database,
  Thermometer,
  Percent,
  TrendingUp,
  Activity,
  ChevronDown,
  ChevronUp,
  Info,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Sliders,
} from 'lucide-react';
import {
  SystemCalculations,
  HeatPumpConfig,
  BufferStorageConfig,
} from '../types';

interface KeyMetricsGridProps {
  metrics: SystemCalculations;
  heatPumps?: HeatPumpConfig[];
  setHeatPumps?: React.Dispatch<React.SetStateAction<HeatPumpConfig[]>>;
  buffer?: BufferStorageConfig;
}

export const KeyMetricsGrid: React.FC<KeyMetricsGridProps> = ({
  metrics,
  heatPumps,
  setHeatPumps,
  buffer,
}) => {
  const [showCopDetails, setShowCopDetails] = useState(false);
  const [activeCurveTab, setActiveCurveTab] = useState<'source' | 'flow'>('source');

  const { copAnalysis } = metrics;

  // Effizienz-Farben & Badges
  const getStatusTheme = (status: 'OPTIMAL' | 'GOOD' | 'FAIR' | 'CRITICAL') => {
    switch (status) {
      case 'OPTIMAL':
        return {
          badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          dot: 'bg-emerald-500',
          text: 'text-emerald-700',
          bg: 'bg-emerald-50/50 border-emerald-200',
        };
      case 'GOOD':
        return {
          badge: 'bg-blue-100 text-blue-800 border-blue-300',
          dot: 'bg-blue-500',
          text: 'text-blue-700',
          bg: 'bg-blue-50/50 border-blue-200',
        };
      case 'FAIR':
        return {
          badge: 'bg-amber-100 text-amber-800 border-amber-300',
          dot: 'bg-amber-500',
          text: 'text-amber-700',
          bg: 'bg-amber-50/50 border-amber-200',
        };
      case 'CRITICAL':
        return {
          badge: 'bg-rose-100 text-rose-800 border-rose-300',
          dot: 'bg-rose-500',
          text: 'text-rose-700',
          bg: 'bg-rose-50/50 border-rose-200',
        };
    }
  };

  const statusTheme = getStatusTheme(copAnalysis.efficiencyStatus);

  // Mini-Gauge Prozentposition für den COP-Balken (Bereich 1.8 bis 5.0)
  const copMin = 1.8;
  const copMax = 5.0;
  const gaugePercent = Math.max(
    0,
    Math.min(100, ((metrics.systemCop - copMin) / (copMax - copMin)) * 100)
  );

  // SVG Chart Maße
  const chartWidth = 560;
  const chartHeight = 220;
  const padding = { top: 25, right: 30, bottom: 35, left: 45 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Y-Skala für COP (1.5 bis 5.0)
  const yMin = 1.5;
  const yMax = 5.0;
  const getY = (cop: number) => {
    const clamped = Math.max(yMin, Math.min(yMax, cop));
    return padding.top + innerHeight - ((clamped - yMin) / (yMax - yMin)) * innerHeight;
  };

  // Quellentemperatur-Kurve (-10°C bis +20°C)
  const xMinSource = -10;
  const xMaxSource = 20;
  const getXSource = (t: number) => {
    return (
      padding.left +
      ((t - xMinSource) / (xMaxSource - xMinSource)) * innerWidth
    );
  };

  // Vorlauftemperatur-Kurve (45°C bis 70°C)
  const xMinFlow = 45;
  const xMaxFlow = 70;
  const getXFlow = (t: number) => {
    return padding.left + ((t - xMinFlow) / (xMaxFlow - xMinFlow)) * innerWidth;
  };

  // SVG-Pfade generieren
  const sourcePoints = copAnalysis.sourceTempCurve.map((pt) => ({
    x: getXSource(pt.sourceTemp),
    y: getY(pt.cop),
    ...pt,
  }));

  const sourcePathD = sourcePoints.reduce(
    (acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`),
    ''
  );

  const flowPoints = copAnalysis.flowTempCurve.map((pt) => ({
    x: getXFlow(pt.flowTemp),
    y: getY(pt.cop),
    ...pt,
  }));

  const flowPathD = flowPoints.reduce(
    (acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`),
    ''
  );

  // Aktueller Arbeitspunkt Koordinaten
  const currentSourceX = getXSource(copAnalysis.avgSourceTempC);
  const currentFlowX = getXFlow(copAnalysis.avgFlowTempC);
  const currentY = getY(metrics.systemCop);

  // Schnelle Test-Handler für Monteure
  const handleQuickSourceChange = (newTemp: number) => {
    if (!setHeatPumps) return;
    setHeatPumps((prev) =>
      prev.map((wp) => ({
        ...wp,
        sourceTempC: newTemp,
      }))
    );
  };

  const handleQuickFlowChange = (newTemp: number) => {
    if (!setHeatPumps) return;
    setHeatPumps((prev) =>
      prev.map((wp) => ({
        ...wp,
        flowTempC: newTemp,
      }))
    );
  };

  return (
    <div className="space-y-3">
      {/* VETO BANNER: Physikalische Versorgbarkeit (Grädigkeit / Puffer-Untertemperatur / FWS-Überlast) */}
      {!metrics.isThermalSupplyFeasible && (
        <div className="p-4 rounded-xl bg-rose-50 border-2 border-rose-300 text-rose-950 flex items-start gap-3 shadow-xs animate-fade-in">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <h4 className="font-bold text-rose-900 text-sm">
              Thermische Versorgungszusage physikalisch nicht erfüllbar!
            </h4>
            <p className="text-rose-800 leading-relaxed font-medium">
              {metrics.supplyInfeasibilityReason}
            </p>
            <p className="text-[11px] text-rose-700">
              Versorgungsdauer wird physikalisch korrekt mit <strong>0 Minuten</strong> ausgewiesen. Erhöhen Sie die Puffertemperatur (mind. TWW-Soll + 4 K Grädigkeit) oder schalten Sie zusätzliche FWS zu.
            </p>
          </div>
        </div>
      )}

      {/* 6-Grid Haupt-KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* 1. Gesamte Wärmeleistung & Dynamischer COP */}
        <div
          id="kpi-generation-power"
          className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs hover:border-slate-300 transition flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Heizleistung & COP
              </span>
              <Zap className="w-4 h-4 text-amber-500" />
            </div>

            <div className="flex items-baseline justify-between">
              <div className="text-xl sm:text-2xl font-bold text-slate-900">
                {metrics.totalHeatGenerationPowerKw}{' '}
                <span className="text-sm font-medium text-slate-500">kW</span>
              </div>
              <button
                type="button"
                onClick={() => setShowCopDetails(!showCopDetails)}
                title="Klicken für dynamischen COP-Verlauf und Monteur-Diagnose"
                className={`inline-flex items-center gap-1 font-bold text-xs px-2 py-0.5 rounded-full border cursor-pointer transition shadow-2xs ${statusTheme.badge}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${statusTheme.dot}`} />
                COP {metrics.systemCop}
              </button>
            </div>

            {/* Dynamischer COP Mini-Pegelbalken für Sofortbewertung */}
            <div className="mt-2.5">
              <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium mb-1">
                <span>Effizienz-Pegel</span>
                <span className={`font-semibold ${statusTheme.text}`}>
                  {copAnalysis.efficiencyStatus === 'OPTIMAL'
                    ? 'Optimal'
                    : copAnalysis.efficiencyStatus === 'GOOD'
                    ? 'Gut'
                    : copAnalysis.efficiencyStatus === 'FAIR'
                    ? 'Erhöht'
                    : 'Kritisch'}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden relative border border-slate-200">
                {/* Farbige Effizienz-Segmente im Hintergrund */}
                <div className="absolute inset-0 flex">
                  <div className="w-[22%] bg-rose-400 opacity-60" title="Kritisch (< 2.3)" />
                  <div className="w-[17%] bg-amber-400 opacity-60" title="Erhöhter Strombedarf (2.3 - 2.85)" />
                  <div className="w-[14%] bg-blue-400 opacity-60" title="Gut (2.85 - 3.3)" />
                  <div className="flex-1 bg-emerald-500 opacity-70" title="Optimal (>= 3.3)" />
                </div>
                {/* Dynamischer Zeiger */}
                <div
                  className="absolute top-0 bottom-0 w-1.5 bg-slate-950 -ml-0.75 shadow-xs transition-all duration-300"
                  style={{ left: `${gaugePercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] text-slate-500 mt-0.5 font-mono">
                <span>1.8</span>
                <span>2.5</span>
                <span>3.4</span>
                <span>5.0</span>
              </div>
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-600 truncate" title={`ΔT ${copAnalysis.tempLiftK} K (${copAnalysis.avgSourceTempC}°C → ${copAnalysis.avgFlowTempC}°C)`}>
              ΔT {copAnalysis.tempLiftK} K Hub
            </span>
            <button
              type="button"
              onClick={() => setShowCopDetails(!showCopDetails)}
              className="font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-0.5 cursor-pointer"
            >
              <span>{showCopDetails ? 'Schließen' : 'Kennlinie'}</span>
              {showCopDetails ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>
          </div>
        </div>

        {/* 2. Speichervorrat & Nutzenergie */}
        <div
          id="kpi-stored-energy"
          className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs hover:border-slate-300 transition flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Nutzenergie
              </span>
              <Database className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900">
              {metrics.totalStoredEnergyKwh}{' '}
              <span className="text-sm font-medium text-slate-500">kWh</span>
            </div>
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-600">
            <span>6.000 L Speicher</span>
            <span className="font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
              {metrics.storageStateOfChargePercent}% voll
            </span>
          </div>
        </div>

        {/* 3. Versorgungsdauer (Autonomie) */}
        <div
          id="kpi-autonomy-duration"
          className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs hover:border-slate-300 transition flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Puffer-Reserve
              </span>
              <Clock className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900">
              {metrics.autonomyStorageOnlyMinutes > 240
                ? '> 4 Std.'
                : `${metrics.autonomyStorageOnlyMinutes} min`}
            </div>
          </div>
          <div className="mt-1 text-[11px] text-slate-600">
            {metrics.autonomyWithGenerationMinutes > 500 ? (
              <span className="text-emerald-600 font-medium">Dauerbetrieb möglich</span>
            ) : (
              <span>Mit Erzeuger: {metrics.autonomyWithGenerationMinutes} min</span>
            )}
          </div>
        </div>

        {/* 4. Spitzen-Warmwasserzapfung */}
        <div
          id="kpi-peak-dhw-demand"
          className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs hover:border-slate-300 transition flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Warmwasser 60°C
              </span>
              <Droplets className="w-4 h-4 text-cyan-500" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900">
              {metrics.peakHotWaterFlowLmin}{' '}
              <span className="text-sm font-medium text-slate-500">l/min</span>
            </div>
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-600">
            <span>{metrics.peakThermalDemandKw} kW Last</span>
            <span>{metrics.peakHotWaterFlowM3h} m³/h</span>
          </div>
        </div>

        {/* 5. FWS-Kaskadenauslastung */}
        <div
          id="kpi-fws-utilization"
          className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs hover:border-slate-300 transition flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">
                FWS Auslastung
              </span>
              <Percent className="w-4 h-4 text-teal-500" />
            </div>
            <div
              className={`text-xl sm:text-2xl font-bold ${
                metrics.fwsCapacityUtilizationPercent > 100
                  ? 'text-rose-600'
                  : metrics.fwsCapacityUtilizationPercent > 85
                  ? 'text-amber-600'
                  : 'text-slate-900'
              }`}
            >
              {metrics.fwsCapacityUtilizationPercent}%
            </div>
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-600">
            <span>Max: {metrics.fwsTotalCapacityLmin} l/min</span>
            <span
              className={`font-semibold px-1.5 py-0.5 rounded ${
                metrics.fwsSufficient
                  ? 'text-emerald-700 bg-emerald-50'
                  : 'text-rose-700 bg-rose-50'
              }`}
            >
              {metrics.fwsSufficient ? 'Ausreichend' : 'Überlast!'}
            </span>
          </div>
        </div>

        {/* 6. Zirkulation Delta T (DVGW W 551) */}
        <div
          id="kpi-circulation-hygiene"
          className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs hover:border-slate-300 transition flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Zirkulation ΔT
              </span>
              <Thermometer className="w-4 h-4 text-rose-500" />
            </div>
            <div
              className={`text-xl sm:text-2xl font-bold ${
                metrics.circulationTempDropK > 5.0 ? 'text-rose-600' : 'text-slate-900'
              }`}
            >
              {metrics.circulationTempDropK}{' '}
              <span className="text-sm font-medium text-slate-500">K</span>
            </div>
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-600">
            <span>Norm: ≤ 5,0 K</span>
            <span
              className={`font-semibold px-1.5 py-0.5 rounded ${
                metrics.circulationTempDropK <= 5.0
                  ? 'text-emerald-700 bg-emerald-50'
                  : 'text-rose-700 bg-rose-50'
              }`}
            >
              {metrics.circulationTempDropK <= 5.0 ? 'DVGW OK' : 'Zu hoch!'}
            </span>
          </div>
        </div>
      </div>

      {/* Dynamisches Monteur-Diagnosepanel: COP-Kennlinienverlauf & Effizienzbewertung */}
      {showCopDetails && (
        <div
          id="kpi-cop-detail-panel"
          className="bg-white rounded-2xl p-4 sm:p-5 border border-blue-200 shadow-sm transition-all"
        >
          {/* Header des Diagnosepanels */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  Wärmepumpen COP-Kennlinie & Effizienz-Verlauf
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${statusTheme.badge}`}>
                    {copAnalysis.efficiencyLabel}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Dynamische Leistungszahl (COP) in Abhängigkeit von Quell- ({copAnalysis.avgSourceTempC}°C) und Speichervorlauftemperatur ({copAnalysis.avgFlowTempC}°C)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">Diagramm-Ansicht:</span>
              <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5">
                <button
                  type="button"
                  onClick={() => setActiveCurveTab('source')}
                  className={`px-2.5 py-1 rounded-md font-semibold text-xs transition cursor-pointer ${
                    activeCurveTab === 'source'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  f(Quellentemperatur)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCurveTab('flow')}
                  className={`px-2.5 py-1 rounded-md font-semibold text-xs transition cursor-pointer ${
                    activeCurveTab === 'flow'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  f(Speichervorlauf)
                </button>
              </div>
            </div>
          </div>

          {/* Hauptbereich: Graph + Kennzahlen + Monteur-Bewertung */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-4">
            {/* Linke Spalte: SVG Kennlinien-Diagramm */}
            <div className="lg:col-span-7 bg-slate-50/70 rounded-xl p-3.5 border border-slate-200 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                  <Activity className="w-4 h-4 text-blue-600" />
                  <span>
                    {activeCurveTab === 'source'
                      ? `COP-Kennlinie über Quellentemperatur (-10°C bis +20°C bei VL ${copAnalysis.avgFlowTempC}°C)`
                      : `COP-Kennlinie über Puffervorlauf (45°C bis 70°C bei Quelle ${copAnalysis.avgSourceTempC}°C)`}
                  </span>
                </div>

                {/* Legende für Effizienzzonen */}
                <div className="hidden sm:flex items-center gap-2 text-[10px] text-slate-600">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 rounded-xs bg-emerald-500" /> Optimal (≥3.3)
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 rounded-xs bg-blue-500" /> Gut (2.85-3.3)
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 rounded-xs bg-amber-500" /> Erhöht (&lt;2.85)
                  </span>
                </div>
              </div>

              {/* SVG Responsive Container */}
              <div className="w-full overflow-x-auto">
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  className="w-full h-48 sm:h-56 select-none"
                >
                  <defs>
                    {/* Gradienten für Effizienzzonen */}
                    <linearGradient id="copCurveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                  </defs>

                  {/* Effizienzzonen (Hintergrundbänder) */}
                  {/* Zone 1: Optimal (COP >= 3.3 bis 5.0) */}
                  <rect
                    x={padding.left}
                    y={getY(5.0)}
                    width={innerWidth}
                    height={getY(3.3) - getY(5.0)}
                    fill="#10b981"
                    fillOpacity="0.08"
                  />
                  {/* Zone 2: Gut (COP 2.85 bis 3.3) */}
                  <rect
                    x={padding.left}
                    y={getY(3.3)}
                    width={innerWidth}
                    height={getY(2.85) - getY(3.3)}
                    fill="#3b82f6"
                    fillOpacity="0.08"
                  />
                  {/* Zone 3: Erhöhter Strombedarf (COP 2.3 bis 2.85) */}
                  <rect
                    x={padding.left}
                    y={getY(2.85)}
                    width={innerWidth}
                    height={getY(2.3) - getY(2.85)}
                    fill="#f59e0b"
                    fillOpacity="0.08"
                  />
                  {/* Zone 4: Kritisch (COP 1.5 bis 2.3) */}
                  <rect
                    x={padding.left}
                    y={getY(2.3)}
                    width={innerWidth}
                    height={getY(1.5) - getY(2.3)}
                    fill="#f43f5e"
                    fillOpacity="0.08"
                  />

                  {/* Horizontale Gitterlinien & Y-Achsenbeschriftung */}
                  {[2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0].map((val) => {
                    const y = getY(val);
                    return (
                      <g key={val}>
                        <line
                          x1={padding.left}
                          y1={y}
                          x2={padding.left + innerWidth}
                          y2={y}
                          stroke="#cbd5e1"
                          strokeDasharray="3 3"
                          strokeWidth="1"
                        />
                        <text
                          x={padding.left - 8}
                          y={y + 3}
                          textAnchor="end"
                          fontSize="9"
                          fill="#64748b"
                          fontFamily="monospace"
                        >
                          {val.toFixed(1)}
                        </text>
                      </g>
                    );
                  })}

                  {/* X-Achsenbeschriftung je nach Tab */}
                  {activeCurveTab === 'source' ? (
                    <>
                      {[-10, -5, 0, 5, 10, 15, 20].map((t) => {
                        const x = getXSource(t);
                        return (
                          <g key={t}>
                            <line
                              x1={x}
                              y1={padding.top + innerHeight}
                              x2={x}
                              y2={padding.top + innerHeight + 4}
                              stroke="#94a3b8"
                              strokeWidth="1"
                            />
                            <text
                              x={x}
                              y={padding.top + innerHeight + 16}
                              textAnchor="middle"
                              fontSize="9"
                              fill="#64748b"
                              fontFamily="monospace"
                            >
                              {t > 0 ? `+${t}` : t}°C
                            </text>
                          </g>
                        );
                      })}
                      <text
                        x={padding.left + innerWidth / 2}
                        y={chartHeight - 4}
                        textAnchor="middle"
                        fontSize="10"
                        fontWeight="600"
                        fill="#475569"
                      >
                        Quellentemperatur (°C)
                      </text>
                    </>
                  ) : (
                    <>
                      {[45, 50, 55, 60, 65, 70].map((t) => {
                        const x = getXFlow(t);
                        return (
                          <g key={t}>
                            <line
                              x1={x}
                              y1={padding.top + innerHeight}
                              x2={x}
                              y2={padding.top + innerHeight + 4}
                              stroke="#94a3b8"
                              strokeWidth="1"
                            />
                            <text
                              x={x}
                              y={padding.top + innerHeight + 16}
                              textAnchor="middle"
                              fontSize="9"
                              fill="#64748b"
                              fontFamily="monospace"
                            >
                              {t}°C
                            </text>
                          </g>
                        );
                      })}
                      <text
                        x={padding.left + innerWidth / 2}
                        y={chartHeight - 4}
                        textAnchor="middle"
                        fontSize="10"
                        fontWeight="600"
                        fill="#475569"
                      >
                        Puffervorlauf-Sollwert (°C)
                      </text>
                    </>
                  )}

                  {/* Y-Achsentitel */}
                  <text
                    x={-((padding.top + innerHeight) / 2)}
                    y={14}
                    transform="rotate(-90)"
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="600"
                    fill="#475569"
                  >
                    COP (Leistungszahl)
                  </text>

                  {/* Kennlinie rendern */}
                  <path
                    d={activeCurveTab === 'source' ? sourcePathD : flowPathD}
                    fill="none"
                    stroke="url(#copCurveGrad)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Datenpunkte auf der Kurve */}
                  {(activeCurveTab === 'source' ? sourcePoints : flowPoints).map((pt, idx) => (
                    <circle
                      key={idx}
                      cx={pt.x}
                      cy={pt.y}
                      r="3.5"
                      fill="#ffffff"
                      stroke="#2563eb"
                      strokeWidth="2"
                    />
                  ))}

                  {/* Aktueller Arbeitspunkt (Pulsierender Punkt mit Marker) */}
                  <g>
                    <line
                      x1={activeCurveTab === 'source' ? currentSourceX : currentFlowX}
                      y1={padding.top}
                      x2={activeCurveTab === 'source' ? currentSourceX : currentFlowX}
                      y2={padding.top + innerHeight}
                      stroke="#2563eb"
                      strokeWidth="1.5"
                      strokeDasharray="4 2"
                    />
                    <line
                      x1={padding.left}
                      y1={currentY}
                      x2={padding.left + innerWidth}
                      y2={currentY}
                      stroke="#2563eb"
                      strokeWidth="1.5"
                      strokeDasharray="4 2"
                    />

                    {/* Impuls-Aura */}
                    <circle
                      cx={activeCurveTab === 'source' ? currentSourceX : currentFlowX}
                      cy={currentY}
                      r="9"
                      fill="#3b82f6"
                      fillOpacity="0.25"
                      className="animate-ping"
                    />
                    {/* Kern-Marker */}
                    <circle
                      cx={activeCurveTab === 'source' ? currentSourceX : currentFlowX}
                      cy={currentY}
                      r="5.5"
                      fill="#1d4ed8"
                      stroke="#ffffff"
                      strokeWidth="2"
                    />

                    {/* Infobox am Arbeitspunkt */}
                    <rect
                      x={Math.min(chartWidth - 140, Math.max(padding.left + 5, (activeCurveTab === 'source' ? currentSourceX : currentFlowX) - 60))}
                      y={Math.max(padding.top + 2, currentY - 26)}
                      width="120"
                      height="20"
                      rx="4"
                      fill="#0f172a"
                      fillOpacity="0.9"
                    />
                    <text
                      x={Math.min(chartWidth - 140, Math.max(padding.left + 5, (activeCurveTab === 'source' ? currentSourceX : currentFlowX) - 60)) + 60}
                      y={Math.max(padding.top + 2, currentY - 26) + 14}
                      textAnchor="middle"
                      fontSize="9.5"
                      fontWeight="bold"
                      fill="#ffffff"
                      fontFamily="monospace"
                    >
                      Aktuell: COP {metrics.systemCop}
                    </text>
                  </g>
                </svg>
              </div>

              {/* Schnelltest-Schieberegler für Monteure */}
              {setHeatPumps && (
                <div className="mt-3 pt-3 border-t border-slate-200 text-xs">
                  <div className="flex items-center justify-between text-slate-700 font-semibold mb-1.5">
                    <span className="flex items-center gap-1">
                      <Sliders className="w-3.5 h-3.5 text-blue-600" />
                      Monteur-Schnelltest: Parameter variieren
                    </span>
                    <span className="text-[11px] font-normal text-slate-500">
                      Live-Verschiebung des Arbeitspunkts
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="flex justify-between text-[11px] text-slate-600 mb-0.5">
                        <span>Quellentemperatur T_Quelle</span>
                        <span className="font-mono font-bold text-slate-900">
                          {copAnalysis.avgSourceTempC}°C
                        </span>
                      </div>
                      <input
                        type="range"
                        min="-10"
                        max="20"
                        step="1"
                        value={copAnalysis.avgSourceTempC}
                        onChange={(e) => handleQuickSourceChange(Number(e.target.value))}
                        className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                      />
                      <div className="flex justify-between text-[9px] text-slate-600 font-mono mt-0.5">
                        <span>-10°C (Frost)</span>
                        <span>+7°C (Nenn)</span>
                        <span>+20°C (Sommer)</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] text-slate-600 mb-0.5">
                        <span>Puffervorlauf T_VL</span>
                        <span className="font-mono font-bold text-slate-900">
                          {copAnalysis.avgFlowTempC}°C
                        </span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="70"
                        step="1"
                        value={copAnalysis.avgFlowTempC}
                        onChange={(e) => handleQuickFlowChange(Number(e.target.value))}
                        className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                      />
                      <div className="flex justify-between text-[9px] text-slate-600 font-mono mt-0.5">
                        <span>50°C (Heizung)</span>
                        <span>65°C (DVGW 60°C)</span>
                        <span>70°C (Desinf.)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Rechte Spalte: Thermodynamische Kennzahlen & Monteur-Diagnose */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-3">
              {/* Thermodynamische Sensorwerte & Hub */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <span className="font-bold text-slate-900 block mb-2">
                  Thermodynamischer Arbeitspunkt
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded-lg bg-white border border-slate-200">
                    <span className="text-slate-500 block">Quellentemperatur</span>
                    <span className="text-sm font-bold font-mono text-slate-900">
                      {copAnalysis.avgSourceTempC} °C
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-slate-200">
                    <span className="text-slate-500 block">Puffer-Vorlauf (oben)</span>
                    <span className="text-sm font-bold font-mono text-slate-900">
                      {copAnalysis.avgFlowTempC} °C
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-slate-200">
                    <span className="text-slate-500 block">Puffer-Rücklauf (unten)</span>
                    <span className={`text-sm font-bold font-mono ${
                      copAnalysis.bufferBottomTempC <= 30 ? 'text-emerald-700' : 'text-amber-700'
                    }`}>
                      {copAnalysis.bufferBottomTempC} °C
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-slate-200">
                    <span className="text-slate-500 block">Temperaturhub ΔT</span>
                    <span className="text-sm font-bold font-mono text-blue-700">
                      {copAnalysis.tempLiftK} K
                    </span>
                  </div>
                </div>

                {/* Carnot-Gütegrad */}
                <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
                  <span className="text-slate-600">Carnot-Gütegrad (η_C):</span>
                  <span className="font-bold text-slate-900 font-mono">
                    {copAnalysis.carnotEfficiencyPercent} %{' '}
                    <span className="font-normal text-slate-500">(COP_Carnot: {copAnalysis.carnotCop})</span>
                  </span>
                </div>
              </div>

              {/* Monteur-Bewertung & Erklärung */}
              <div className={`p-3.5 rounded-xl border text-xs ${statusTheme.bg}`}>
                <div className="flex items-start gap-2">
                  {copAnalysis.efficiencyStatus === 'OPTIMAL' || copAnalysis.efficiencyStatus === 'GOOD' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <strong className="block font-semibold text-slate-900">
                      Fachliche Monteur-Einschätzung:
                    </strong>
                    <p className="mt-0.5 text-[11px] text-slate-700 leading-relaxed">
                      {copAnalysis.efficiencyDescription}
                    </p>
                  </div>
                </div>
              </div>

              {/* Monteur-Praxistipps zur Wirkungsgradoptimierung */}
              <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200 text-xs">
                <span className="font-bold text-blue-950 flex items-center gap-1.5 mb-1.5">
                  <Info className="w-3.5 h-3.5 text-blue-700" />
                  Praxis-Checkliste für den Wartungsmonteur:
                </span>
                <ul className="space-y-1.5 text-[11px] text-slate-700">
                  {copAnalysis.monteurTips.map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-blue-600 font-bold">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Hinweis zum 136 kW Wärmetauscher */}
              <div className="p-3 rounded-xl bg-orange-50/70 border border-orange-200 text-xs text-orange-950 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-600 shrink-0" />
                  <span className="text-[11px]">
                    Alternative / Zusatzbeladung mit 136 kW Plattenwärmetauscher verfügbar
                  </span>
                </div>
                <span className="font-semibold text-[11px] text-orange-800 shrink-0 ml-2">
                  {metrics.centralHeatingPowerKw > 0 ? `${metrics.centralHeatingPowerKw} kW aktiv` : 'Standby'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
