import React, { useState, useMemo } from 'react';
import {
  Coins,
  Zap,
  TrendingDown,
  Clock,
  Droplets,
  PiggyBank,
  Sliders,
  Flame,
  Info,
  ChevronDown,
  ChevronUp,
  Activity,
  Calculator,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { SystemCalculations, OperatingCostConfig } from '../types';
import {
  calculateOperatingCosts,
  DEFAULT_OPERATING_COST_CONFIG,
} from '../utils/costCalculations';

interface OperatingCostModuleProps {
  metrics: SystemCalculations;
}

export const OperatingCostModule: React.FC<OperatingCostModuleProps> = ({
  metrics,
}) => {
  const [costConfig, setCostConfig] = useState<OperatingCostConfig>(
    DEFAULT_OPERATING_COST_CONFIG
  );
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [activeChartTab, setActiveChartTab] = useState<'copCurve' | 'comparison' | 'breakdown'>(
    'copCurve'
  );

  // Live berechnete Betriebskosten
  const costs = useMemo(() => {
    return calculateOperatingCosts(metrics, costConfig);
  }, [metrics, costConfig]);

  // Tarif-Presets
  const handleApplyPreset = (price: number) => {
    setCostConfig((prev) => ({
      ...prev,
      electricityPricePerKwh: price,
    }));
  };

  // SVG Chart Maße
  const chartWidth = 580;
  const chartHeight = 220;
  const padding = { top: 25, right: 35, bottom: 35, left: 55 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Y-Skala für spezifische Wärmekosten (0 bis 25 ct/kWh_th)
  const yMinCost = 0;
  const yMaxCost = Math.max(22, Math.ceil(costConfig.electricityPricePerKwh * 100 * 0.7));
  const getYCost = (val: number) => {
    const clamped = Math.max(yMinCost, Math.min(yMaxCost, val));
    return padding.top + innerHeight - ((clamped - yMinCost) / (yMaxCost - yMinCost)) * innerHeight;
  };

  // X-Skala für COP (1.8 bis 5.0)
  const xMinCop = 1.8;
  const xMaxCop = 5.0;
  const getXCop = (cop: number) => {
    const clamped = Math.max(xMinCop, Math.min(xMaxCop, cop));
    return padding.left + ((clamped - xMinCop) / (xMaxCop - xMinCop)) * innerWidth;
  };

  // COP Kurvenpunkte berechnen
  const curvePoints = costs.copCostCurve.map((pt) => ({
    x: getXCop(pt.cop),
    y: getYCost(pt.heatCostCentPerKwhTh),
    ...pt,
  }));

  const curvePathD = curvePoints.reduce(
    (acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`),
    ''
  );

  // Aktueller Arbeitspunkt Koordinaten
  const currentCopX = getXCop(costs.currentCop);
  const currentCostY = getYCost(costs.heatCostPerKwhThCent);

  return (
    <div
      id="operating-cost-module"
      className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition"
    >
      {/* Modul Header */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold tracking-tight text-white">
                Betriebskosten & Wirtschaftlichkeit
              </h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                COP-Dynamik aktiv
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Echtzeit-Berechnung der Energiekosten basierend auf COP-Kennlinie ({costs.currentCop}), thermischer Last ({costs.actualThermalDemandKw} kW) und variablem Strompreis
            </p>
          </div>
        </div>

        {/* Live-Status Badges */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <div className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/15 text-xs text-slate-200 flex items-center gap-2">
            <span className="text-slate-400">Therm. Last:</span>
            <span className="font-mono font-bold text-amber-300">
              {costs.actualThermalDemandKw} kW
            </span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/15 text-xs text-slate-200 flex items-center gap-2">
            <span className="text-slate-400">COP:</span>
            <span className="font-mono font-bold text-emerald-300">
              {costs.currentCop}
            </span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-xs text-amber-200 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-mono font-bold">
              {costs.heatCostPerKwhThCent} ct/kWh
            </span>
            <span className="text-[10px] text-amber-300/80">th</span>
          </div>
        </div>
      </div>

      {/* Parameter-Steuerungsleiste: Editierbarer Strompreis & Vergleichspreise */}
      <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Haupt-Eingabe: Strompreis in Cent / € pro kWh */}
          <div className="md:col-span-6 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="electricity-price-slider"
                className="text-xs font-bold text-slate-800 flex items-center gap-1.5"
              >
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Wärmepumpen-Strompreis:</span>
              </label>
              <div className="flex items-center gap-1">
                <input
                  id="electricity-price-number"
                  type="number"
                  step="0.01"
                  min="0.05"
                  max="0.80"
                  value={costConfig.electricityPricePerKwh}
                  onChange={(e) =>
                    setCostConfig((prev) => ({
                      ...prev,
                      electricityPricePerKwh: Math.max(0.01, Number(e.target.value)),
                    }))
                  }
                  className="w-20 px-2 py-1 text-right font-mono font-bold text-sm bg-slate-50 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
                <span className="text-xs font-bold text-slate-700">€/kWh</span>
                <span className="text-xs text-slate-500">
                  ({Math.round(costConfig.electricityPricePerKwh * 100)} ct)
                </span>
              </div>
            </div>

            {/* Slider für intuitive Verstellung */}
            <input
              id="electricity-price-slider"
              type="range"
              min="0.10"
              max="0.60"
              step="0.01"
              value={costConfig.electricityPricePerKwh}
              onChange={(e) =>
                setCostConfig((prev) => ({
                  ...prev,
                  electricityPricePerKwh: Number(e.target.value),
                }))
              }
              className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
            />

            {/* Tarif-Vorauswahl-Buttons */}
            <div className="flex items-center justify-between gap-1.5 mt-2.5 pt-2 border-t border-slate-100 text-[11px]">
              <span className="text-slate-500">Tarif-Presets:</span>
              <div className="flex items-center gap-1 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleApplyPreset(0.24)}
                  className={`px-2 py-0.5 rounded font-medium transition cursor-pointer ${
                    costConfig.electricityPricePerKwh === 0.24
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                  title="Wärmepumpen-Sondertarif nach §14a EnWG"
                >
                  WP-Tarif (24 ct)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset(0.32)}
                  className={`px-2 py-0.5 rounded font-medium transition cursor-pointer ${
                    costConfig.electricityPricePerKwh === 0.32
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                  title="Gewerbestrom / Standardvertrag"
                >
                  Gewerbe (32 ct)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset(0.42)}
                  className={`px-2 py-0.5 rounded font-medium transition cursor-pointer ${
                    costConfig.electricityPricePerKwh === 0.42
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                  title="Grundversorgung / Spitzenlast"
                >
                  Basis (42 ct)
                </button>
              </div>
            </div>
          </div>

          {/* Schnellübersicht: Stündliche Ersparnis & spezifische Kosten */}
          <div className="md:col-span-6 grid grid-cols-2 gap-3">
            <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200 flex flex-col justify-between">
              <div className="flex items-center justify-between text-emerald-800 text-xs font-semibold">
                <span>Ersparnis vs. Heizstab</span>
                <TrendingDown className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-xl font-bold text-emerald-950 mt-1">
                {costs.hourlySavingsVsDirectElectricEur}{' '}
                <span className="text-xs font-medium text-emerald-700">€/h</span>
              </div>
              <p className="text-[10px] text-emerald-700 mt-1">
                WP nutzt Umweltwärme (Faktor {costs.currentCop})
              </p>
            </div>

            <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-200 flex flex-col justify-between">
              <div className="flex items-center justify-between text-blue-800 text-xs font-semibold">
                <span>Wärmekosten</span>
                <Coins className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-xl font-bold text-blue-950 mt-1">
                {costs.heatCostPerKwhThCent}{' '}
                <span className="text-xs font-medium text-blue-700">ct/kWh_th</span>
              </div>
              <p className="text-[10px] text-blue-700 mt-1">
                Vergleich Zentralh.: {costs.heatCostCentralHeatingCent} ct/kWh
              </p>
            </div>
          </div>
        </div>

        {/* Ausklappbare erweiterte Betriebsparameter */}
        <div className="mt-3 pt-2">
          <button
            type="button"
            onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer transition"
          >
            <Sliders className="w-3.5 h-3.5 text-blue-600" />
            <span>
              {showAdvancedSettings
                ? 'Erweiterte Betriebsparameter ausblenden'
                : 'Erweiterte Parameter (Vergleichspreis, Duschzeiten, Betriebstage)'}
            </span>
            {showAdvancedSettings ? (
              <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            )}
          </button>

          {showAdvancedSettings && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 pt-3 border-t border-slate-200">
              <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs">
                <label className="block text-slate-700 font-semibold mb-1">
                  Vergleichspreis Zentralheizung / WT:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0.04"
                    max="0.30"
                    value={costConfig.comparisonHeatingPricePerKwh}
                    onChange={(e) =>
                      setCostConfig((prev) => ({
                        ...prev,
                        comparisonHeatingPricePerKwh: Math.max(0.01, Number(e.target.value)),
                      }))
                    }
                    className="w-24 px-2 py-1 font-mono text-xs border border-slate-300 rounded"
                  />
                  <span className="text-slate-600">€/kWh</span>
                </div>
                <span className="text-[10px] text-slate-600 block mt-1">
                  136 kW Plattenwärmetauscher / Gas / Fernwärme
                </span>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs">
                <label className="block text-slate-700 font-semibold mb-1">
                  Volllast-Duschzeit pro Tag:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="18"
                    value={costConfig.dailyHighLoadHours}
                    onChange={(e) =>
                      setCostConfig((prev) => ({
                        ...prev,
                        dailyHighLoadHours: Math.max(1, Math.min(24, Number(e.target.value))),
                      }))
                    }
                    className="w-24 px-2 py-1 font-mono text-xs border border-slate-300 rounded"
                  />
                  <span className="text-slate-600">Stunden/Tag</span>
                </div>
                <span className="text-[10px] text-slate-600 block mt-1">
                  Rest: 24h Zirkulation & Bereitschaft
                </span>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs">
                <label className="block text-slate-700 font-semibold mb-1">
                  Betriebstage pro Jahr:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="50"
                    max="365"
                    value={costConfig.operatingDaysPerYear}
                    onChange={(e) =>
                      setCostConfig((prev) => ({
                        ...prev,
                        operatingDaysPerYear: Math.max(1, Math.min(365, Number(e.target.value))),
                      }))
                    }
                    className="w-24 px-2 py-1 font-mono text-xs border border-slate-300 rounded"
                  />
                  <span className="text-slate-600">Tage/Jahr</span>
                </div>
                <span className="text-[10px] text-slate-600 block mt-1">
                  z.B. 310 Tage für Sportanlagen & Gewerbe
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4-KPI Kachel-Raster: Kostenübersicht */}
      <div className="p-4 sm:p-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {/* 1. Stündliche Betriebskosten bei aktueller Last */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Kosten / Stunde
              </span>
              <Clock className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-slate-900">
                {costs.thermalDemandCostPerHourEur}{' '}
                <span className="text-xs font-medium text-slate-500">€/h</span>
              </div>
              <div className="mt-1 text-[11px] text-slate-600">
                Bei {costs.actualThermalDemandKw} kW Last ({costs.activeWpElectricPowerKw} kW_el)
              </div>
            </div>
          </div>

          {/* 2. Kosten pro Einzeldusche & Duschsitzung */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Kosten pro Dusche
              </span>
              <Droplets className="w-4 h-4 text-cyan-500" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-slate-900">
                {(costs.costPerSingleShowerEur * 100).toFixed(1)}{' '}
                <span className="text-xs font-medium text-slate-500">ct / Dusche</span>
              </div>
              <div className="mt-1 text-[11px] text-slate-600">
                Sitzung ({metrics.activeShowersCount} Plätze): {costs.costPerShowerSessionEur.toFixed(2)} €
              </div>
            </div>
          </div>

          {/* 3. Prognostizierte Tageskosten */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Kosten pro Tag
              </span>
              <Calculator className="w-4 h-4 text-indigo-500" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-slate-900">
                {costs.dailyCostWpEur}{' '}
                <span className="text-xs font-medium text-slate-500">€/Tag</span>
              </div>
              <div className="mt-1 text-[11px] text-slate-600">
                {costConfig.dailyHighLoadHours}h Last + 24h Zirkulation
              </div>
            </div>
          </div>

          {/* 4. Prognostizierte Jahreskosten & Ersparnis */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Jahreskosten (WP)
              </span>
              <PiggyBank className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-emerald-700">
                {costs.annualCostWpEur.toLocaleString('de-DE')}{' '}
                <span className="text-xs font-medium text-emerald-600">€/a</span>
              </div>
              <div className="mt-1 text-[11px] text-emerald-800 font-semibold">
                Spart {costs.annualSavingsVsDirectElectricEur.toLocaleString('de-DE')} €/a ggü. Heizstab
              </div>
            </div>
          </div>
        </div>

        {/* Tab-Leiste für Diagramm-Auswahl */}
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Wirtschaftlichkeits-Diagramme & COP-Sensitivität
            </h3>
          </div>

          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setActiveChartTab('copCurve')}
              className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
                activeChartTab === 'copCurve'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              COP-Kostenverlauf f(COP)
            </button>
            <button
              type="button"
              onClick={() => setActiveChartTab('comparison')}
              className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
                activeChartTab === 'comparison'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Systemvergleich (WP vs. WT vs. Heizstab)
            </button>
            <button
              type="button"
              onClick={() => setActiveChartTab('breakdown')}
              className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
                activeChartTab === 'breakdown'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Last- & Kostenaufteilung
            </button>
          </div>
        </div>

        {/* Diagramm-Bereich */}
        <div className="mt-4">
          {/* TAB 1: COP-Kostenkurve (Sensitivität der Wärmekosten über den COP) */}
          {activeChartTab === 'copCurve' && (
            <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div className="text-xs text-slate-700">
                  <span className="font-bold text-slate-900">
                    Spezifische Wärmegestehungskosten über dem COP
                  </span>
                  <span className="block text-slate-500 text-[11px] mt-0.5">
                    Zeigt die Wärmekosten in ct/kWh_th bei {costConfig.electricityPricePerKwh} €/kWh Strompreis (Formel: Strompreis / COP)
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1 text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                    Wärmekosten (ct/kWh_th)
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-emerald-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                    Aktuell: COP {costs.currentCop} ({costs.heatCostPerKwhThCent} ct)
                  </span>
                </div>
              </div>

              {/* SVG Responsive Graph */}
              <div className="w-full overflow-x-auto">
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  className="w-full h-48 sm:h-56 select-none"
                >
                  <defs>
                    <linearGradient id="costGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#ef4444" />
                      <stop offset="50%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                  </defs>

                  {/* Horizontale Hilfslinien */}
                  {[0, 5, 10, 15, 20].map((val) => {
                    const y = getYCost(val);
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
                          fontSize="9.5"
                          fill="#64748b"
                          fontFamily="monospace"
                        >
                          {val} ct
                        </text>
                      </g>
                    );
                  })}

                  {/* Vergleichslinie Zentralheizung (12 ct/kWh) */}
                  <line
                    x1={padding.left}
                    y1={getYCost(costConfig.comparisonHeatingPricePerKwh * 100)}
                    x2={padding.left + innerWidth}
                    y2={getYCost(costConfig.comparisonHeatingPricePerKwh * 100)}
                    stroke="#f97316"
                    strokeWidth="1.5"
                    strokeDasharray="4 2"
                  />
                  <text
                    x={padding.left + innerWidth - 5}
                    y={getYCost(costConfig.comparisonHeatingPricePerKwh * 100) - 4}
                    textAnchor="end"
                    fontSize="9"
                    fontWeight="bold"
                    fill="#c2410c"
                  >
                    Vergleich Zentralh.: {(costConfig.comparisonHeatingPricePerKwh * 100).toFixed(0)} ct/kWh
                  </text>

                  {/* X-Achsen Beschriftung (COP 2.0 bis 5.0) */}
                  {[2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0].map((copVal) => {
                    const x = getXCop(copVal);
                    return (
                      <g key={copVal}>
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
                          fontSize="9.5"
                          fill="#64748b"
                          fontFamily="monospace"
                        >
                          {copVal.toFixed(1)}
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
                    Leistungszahl (COP)
                  </text>

                  {/* Y-Achsentitel */}
                  <text
                    x={-((padding.top + innerHeight) / 2)}
                    y={16}
                    transform="rotate(-90)"
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="600"
                    fill="#475569"
                  >
                    Wärmekosten (ct / kWh_th)
                  </text>

                  {/* Kennlinie rendern */}
                  <path
                    d={curvePathD}
                    fill="none"
                    stroke="url(#costGrad)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Datenpunkte auf der Kurve */}
                  {curvePoints.map((pt, idx) => (
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

                  {/* Aktueller Arbeitspunkt (Pulsierender Punkt) */}
                  <g>
                    <line
                      x1={currentCopX}
                      y1={padding.top}
                      x2={currentCopX}
                      y2={padding.top + innerHeight}
                      stroke="#10b981"
                      strokeWidth="1.5"
                      strokeDasharray="4 2"
                    />
                    <line
                      x1={padding.left}
                      y1={currentCostY}
                      x2={padding.left + innerWidth}
                      y2={currentCostY}
                      stroke="#10b981"
                      strokeWidth="1.5"
                      strokeDasharray="4 2"
                    />

                    {/* Impuls-Aura */}
                    <circle
                      cx={currentCopX}
                      cy={currentCostY}
                      r="9"
                      fill="#10b981"
                      fillOpacity="0.3"
                      className="animate-ping"
                    />
                    {/* Kern-Marker */}
                    <circle
                      cx={currentCopX}
                      cy={currentCostY}
                      r="5.5"
                      fill="#059669"
                      stroke="#ffffff"
                      strokeWidth="2"
                    />

                    {/* Infobox am Punkt */}
                    <rect
                      x={Math.min(chartWidth - 145, Math.max(padding.left + 5, currentCopX - 65))}
                      y={Math.max(padding.top + 2, currentCostY - 26)}
                      width="130"
                      height="20"
                      rx="4"
                      fill="#0f172a"
                      fillOpacity="0.9"
                    />
                    <text
                      x={Math.min(chartWidth - 145, Math.max(padding.left + 5, currentCopX - 65)) + 65}
                      y={Math.max(padding.top + 2, currentCostY - 26) + 14}
                      textAnchor="middle"
                      fontSize="9.5"
                      fontWeight="bold"
                      fill="#ffffff"
                      fontFamily="monospace"
                    >
                      COP {costs.currentCop} → {costs.heatCostPerKwhThCent} ct/kWh
                    </text>
                  </g>
                </svg>
              </div>

              {/* Erklärung zur Sensitivität */}
              <div className="mt-2 text-xs text-slate-600 flex items-center gap-2 bg-white p-2.5 rounded-lg border border-slate-200">
                <Info className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  <strong>COP-Hebelwirkung:</strong> Steigt der COP von 2,4 auf 3,4, sinken die reinen Wärmekosten von{' '}
                  <span className="font-semibold text-rose-700">
                    {(costConfig.electricityPricePerKwh / 2.4 * 100).toFixed(1)} ct/kWh
                  </span>{' '}
                  auf{' '}
                  <span className="font-semibold text-emerald-700">
                    {(costConfig.electricityPricePerKwh / 3.4 * 100).toFixed(1)} ct/kWh
                  </span>{' '}
                  (rund 30% weniger Energiekosten!).
                </span>
              </div>
            </div>
          )}

          {/* TAB 2: Systemvergleich (Wärmepumpe vs. Zentralheizung vs. Direktheizstab) */}
          {activeChartTab === 'comparison' && (
            <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200 space-y-4">
              <div className="text-xs text-slate-700">
                <span className="font-bold text-slate-900">
                  Vergleich der Energiekosten zur Deckung der aktuellen Last ({costs.actualThermalDemandKw} kW)
                </span>
                <span className="block text-slate-500 text-[11px] mt-0.5">
                  Gegenüberstellung: 3x Wärmepumpen (COP {costs.currentCop}) vs. 136 kW Plattenwärmetauscher ({costConfig.comparisonHeatingPricePerKwh} €/kWh) vs. Direktheizstab (COP 1.0)
                </span>
              </div>

              {/* 3 Vergleichs-Balken */}
              <div className="space-y-3">
                {/* 1. Wärmepumpe (Hocheffizient) */}
                <div className="bg-white p-3 rounded-xl border border-emerald-200 shadow-2xs">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      3x Wärmepumpen (COP {costs.currentCop})
                    </span>
                    <span className="font-mono font-bold text-emerald-700">
                      {costs.thermalDemandCostPerHourEur} €/h • {costs.heatCostPerKwhThCent} ct/kWh_th
                    </span>
                  </div>
                  <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden flex border border-slate-200">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          100,
                          (costs.thermalDemandCostPerHourEur / Math.max(1, costs.directElectricCostPerHourEur)) * 100
                        )}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-emerald-700 mt-1">
                    <span>Niedrigste Betriebskosten durch Umweltwärme</span>
                    <span className="font-semibold">
                      Jahreskosten: {costs.annualCostWpEur.toLocaleString('de-DE')} €/a
                    </span>
                  </div>
                </div>

                {/* 2. Zentralheizung / Plattenwärmetauscher */}
                <div className="bg-white p-3 rounded-xl border border-orange-200 shadow-2xs">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-orange-950 flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-orange-500" />
                      136 kW Plattenwärmetauscher (Fernwärme / Gas)
                    </span>
                    <span className="font-mono font-bold text-orange-800">
                      {costs.centralHeatingCostPerHourEur} €/h • {costs.heatCostCentralHeatingCent} ct/kWh_th
                    </span>
                  </div>
                  <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden flex border border-slate-200">
                    <div
                      className="bg-orange-400 h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          100,
                          (costs.centralHeatingCostPerHourEur / Math.max(1, costs.directElectricCostPerHourEur)) * 100
                        )}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-orange-800 mt-1">
                    <span>
                      {costs.hourlySavingsVsCentralHeatingEur > 0
                        ? `WP ist ${costs.hourlySavingsVsCentralHeatingEur} €/h günstiger als WT`
                        : `WT ist aktuell günstiger als WP`}
                    </span>
                    <span className="font-semibold">
                      Jahreskosten: {costs.annualCostCentralHeatingEur.toLocaleString('de-DE')} €/a
                    </span>
                  </div>
                </div>

                {/* 3. Direktheizstab / Durchlauferhitzer (COP 1.0) */}
                <div className="bg-white p-3 rounded-xl border border-rose-200 shadow-2xs">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-rose-950 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      Direktheizstab / Durchlauferhitzer (COP 1,0)
                    </span>
                    <span className="font-mono font-bold text-rose-800">
                      {costs.directElectricCostPerHourEur} €/h • {costs.heatCostDirectElectricCent} ct/kWh_th
                    </span>
                  </div>
                  <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden flex border border-slate-200">
                    <div
                      className="bg-rose-500 h-full rounded-full transition-all duration-500"
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-rose-800 mt-1">
                    <span>Reine Stromdirektheizung ohne thermodynamischen Wärmepumpen-Gewinn</span>
                    <span className="font-semibold">
                      Jahreskosten: {costs.annualCostDirectElectricEur.toLocaleString('de-DE')} €/a
                    </span>
                  </div>
                </div>
              </div>

              {/* Ersparnis-Banner */}
              <div className="p-3 bg-emerald-100/70 border border-emerald-300 rounded-xl flex items-center justify-between text-xs text-emerald-900">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>
                    <strong>Wirtschaftlicher Vorteil der Wärmepumpe:</strong> Durch den hohen System-COP von {costs.currentCop} spart die Anlage jährlich ca.{' '}
                    <strong>{costs.annualSavingsVsDirectElectricEur.toLocaleString('de-DE')} €</strong> gegenüber reiner Stromdirektheizung.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Last- & Kostenaufteilung (Duschzapfung vs. Zirkulation) */}
          {activeChartTab === 'breakdown' && (
            <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200 space-y-4">
              <div className="text-xs text-slate-700">
                <span className="font-bold text-slate-900">
                  Aufteilung der aktuellen thermischen Last & Betriebskosten
                </span>
                <span className="block text-slate-500 text-[11px] mt-0.5">
                  Verteilung zwischen Warmwasser-Zapfung (Duschpaneele & Waschtische) und permanentem Zirkulationswärmeverlust nach DVGW W 551
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Dusch-Zapfung */}
                <div className="bg-white p-3.5 rounded-xl border border-cyan-200">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-cyan-950 flex items-center gap-1.5">
                      <Droplets className="w-4 h-4 text-cyan-600" />
                      Warmwasser-Zapflast (Nutzwärme)
                    </span>
                    <span className="font-mono font-bold text-cyan-700">
                      {costs.costShareShowersPerHourEur} €/h
                    </span>
                  </div>
                  <div className="text-lg font-bold text-slate-900 mt-2">
                    {metrics.peakThermalDemandKw} kW{' '}
                    <span className="text-xs font-normal text-slate-500">
                      ({costs.actualThermalDemandKw > 0 ? Math.round((metrics.peakThermalDemandKw / costs.actualThermalDemandKw) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 mt-1">
                    {metrics.activeShowersCount} Duschplätze & {metrics.activeWashbasinsCount} Waschtische aktiv
                  </div>
                  <div className="mt-2 text-[10px] text-cyan-700 bg-cyan-50 p-1.5 rounded">
                    Wird nur während tatsächlicher Dusch-Nutzung benötigt
                  </div>
                </div>

                {/* Zirkulation */}
                <div className="bg-white p-3.5 rounded-xl border border-rose-200">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-rose-950 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-rose-600" />
                      Zirkulationsverluste (Hygiene)
                    </span>
                    <span className="font-mono font-bold text-rose-700">
                      {costs.costShareCirculationPerHourEur} €/h
                    </span>
                  </div>
                  <div className="text-lg font-bold text-slate-900 mt-2">
                    {metrics.circulationLossKw} kW{' '}
                    <span className="text-xs font-normal text-slate-500">
                      ({costs.actualThermalDemandKw > 0 ? Math.round((metrics.circulationLossKw / costs.actualThermalDemandKw) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 mt-1">
                    Fällt 24h täglich an zur Einhaltung der DVGW W 551 (Delta T ≤ 5 K)
                  </div>
                  <div className="mt-2 text-[10px] text-rose-700 bg-rose-50 p-1.5 rounded">
                    Tagesverlust: {(metrics.circulationLossKw * 24 / costs.currentCop * costConfig.electricityPricePerKwh).toFixed(2)} €/Tag
                  </div>
                </div>
              </div>

              {/* Zusätzliche Monteur-Hinweise zur Zirkulationsoptimierung */}
              <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-blue-600" />
                  SHK-Monteur Praxishinweis zur Zirkulation:
                </div>
                <p className="text-[11px] leading-relaxed">
                  Da die Zirkulation 24 Stunden durchläuft, summieren sich selbst kleine Verluste: Jedes eingesparte Kilowatt Zirkulationsverlust (durch Rohrdämmung nach GEG oder hydraulischen Abgleich) spart bei aktuellen Strompreisen rund{' '}
                  <strong>
                    {Math.round((24 / costs.currentCop) * costConfig.electricityPricePerKwh * 365)} € pro Jahr
                  </strong>{' '}
                  an Stromkosten!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
