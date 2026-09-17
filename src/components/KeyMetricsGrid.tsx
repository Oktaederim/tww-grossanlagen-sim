import React from 'react';
import {
  Flame,
  Zap,
  Activity,
  Waves,
  Clock,
  BatteryCharging,
  Layers,
  Thermometer,
  ShieldCheck,
  AlertTriangle,
  RotateCw,
  Info,
} from 'lucide-react';
import { SystemCalculations } from '../types';

interface KeyMetricsGridProps {
  metrics: SystemCalculations;
}

export const KeyMetricsGrid: React.FC<KeyMetricsGridProps> = ({ metrics }) => {
  return (
    <div className="space-y-4">
      {/* Physikalische VETO-Warnung (falls Vorlauf zu gering oder Kaskade überlastet) */}
      {!metrics.isThermalSupplyFeasible && (
        <div className="bg-rose-50 border-2 border-rose-500 rounded-xl p-4 shadow-sm text-rose-950 animate-pulse">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-rose-900 text-sm uppercase tracking-wider flex items-center gap-2">
                Physikalisches VETO: Keine stabile Warmwasserversorgung möglich!
              </h4>
              <p className="text-xs text-rose-800 mt-1 font-medium leading-relaxed">
                {metrics.supplyInfeasibilityReason}
              </p>
              <div className="mt-2 text-[11px] text-rose-700 bg-rose-100/80 px-2.5 py-1 rounded inline-block font-mono">
                DIN EN 12831-3 / VDI 2072: Wärmeübertrager benötigt Speichervorlauf ≥ TWW-Soll + Grädigkeit (mind. 4 K).
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {/* 1. Gesamte Erzeugung */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Wärmeerzeugung</span>
            <Flame className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-xl font-bold text-slate-900">
            {metrics.totalHeatGenerationPowerKw}{' '}
            <span className="text-xs font-normal text-slate-500">kW</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>WP: {metrics.totalWpThermalPowerKw} kW</span>
            <span>WT: {metrics.centralHeatingPowerKw} kW</span>
          </div>
        </div>

        {/* 2. COP & Effizienz */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">WP-System-COP</span>
            <Activity className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-slate-900 flex items-baseline gap-1.5">
            <span>{metrics.systemCop.toFixed(2)}</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-semibold border ${metrics.copAnalysis.efficiencyBadgeClass}`}
            >
              {metrics.copAnalysis.efficiencyLabel}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 truncate" title={metrics.copAnalysis.efficiencyDescription}>
            P_el: {metrics.totalWpElectricalPowerKw} kW (Lift: {metrics.copAnalysis.tempLiftK} K)
          </div>
        </div>

        {/* 3. Spitzenlast FWS (60°C) */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">TWW Spitzenlast (60°C)</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-slate-900">
            {metrics.peakThermalDemandKw}{' '}
            <span className="text-xs font-normal text-slate-500">kW</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>{metrics.peakHotWaterFlowLmin} l/min</span>
            <span>({metrics.peakHotWaterFlowM3h} m³/h)</span>
          </div>
        </div>

        {/* 4. FWS Kaskaden-Auslastung */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">FWS Auslastung</span>
            <Waves
              className={`w-4 h-4 ${
                metrics.fwsCapacityUtilizationPercent > 100
                  ? 'text-rose-500'
                  : metrics.fwsCapacityUtilizationPercent > 80
                  ? 'text-amber-500'
                  : 'text-blue-500'
              }`}
            />
          </div>
          <div className="text-xl font-bold text-slate-900 flex items-baseline gap-1.5">
            <span>{metrics.fwsCapacityUtilizationPercent}%</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                metrics.fwsSufficient
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-rose-50 text-rose-700'
              }`}
            >
              {metrics.fwsSufficient ? 'Ausreichend' : 'Überlast!'}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Kapazität: {metrics.fwsTotalCapacityLmin} l/min
          </div>
        </div>

        {/* 5. Speicher-Energieinhalt */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Pufferenergie (6.000 L)</span>
            <BatteryCharging className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="text-xl font-bold text-slate-900">
            {metrics.totalStoredEnergyKwh}{' '}
            <span className="text-xs font-normal text-slate-500">kWh</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>ΔT: {metrics.effectiveTemperatureDifferenceK} K</span>
            <span className="font-semibold text-cyan-700">
              {metrics.storageStateOfChargePercent}% Ladezustand
            </span>
          </div>
        </div>

        {/* 6. Autonomie / Versorgungsdauer */}
        <div
          className={`border rounded-xl p-3.5 shadow-sm transition-colors ${
            !metrics.isThermalSupplyFeasible
              ? 'bg-rose-50 border-rose-300'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Versorgungsdauer</span>
            <Clock
              className={`w-4 h-4 ${
                !metrics.isThermalSupplyFeasible
                  ? 'text-rose-600'
                  : metrics.autonomyStorageOnlyMinutes < 15
                  ? 'text-amber-500'
                  : 'text-indigo-500'
              }`}
            />
          </div>
          <div className="text-xl font-bold text-slate-900">
            {!metrics.isThermalSupplyFeasible ? (
              <span className="text-rose-600">0 min</span>
            ) : (
              <>
                {metrics.autonomyStorageOnlyMinutes}{' '}
                <span className="text-xs font-normal text-slate-500">min (Puffer)</span>
              </>
            )}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {!metrics.isThermalSupplyFeasible ? (
              <span className="text-rose-600 font-semibold">Veto aktiv</span>
            ) : metrics.autonomyWithGenerationMinutes > 500 ? (
              <span className="text-emerald-600 font-medium">Dauerbetrieb gesichert</span>
            ) : (
              <span>Mit Erzeugung: {metrics.autonomyWithGenerationMinutes} min</span>
            )}
          </div>
        </div>
      </div>

      {/* Sub-Banner: Reale Hydraulik & Ventilschaltung & Zähler */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-700">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-600 flex-shrink-0" />
          <span>
            <strong>3-Wege-Umschaltung FWS-Rücklauf:</strong>{' '}
            <span className="font-semibold text-slate-900">
              {metrics.fwsReturnValvePosition === 'BOTTOM_STRAT'
                ? 'Schichtung Puffer 3 UNTEN (<30°C)'
                : 'Schichtung Puffer 3 MITTE (≥30°C)'}
            </span>{' '}
            – {metrics.fwsReturnValveReason}
          </span>
        </div>

        {metrics.waterMeterDeltaM3 !== undefined && (
          <div className="flex items-center gap-2 bg-blue-50 text-blue-900 px-2.5 py-1 rounded-md border border-blue-200">
            <Info className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
            <span>
              <strong>Trinkwasserzähler Zulauf:</strong> Δ {metrics.waterMeterDeltaM3} m³ (
              {metrics.waterMeterThermalEnergyKwh} kWh Nutzwärme)
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
