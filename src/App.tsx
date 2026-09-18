import React, { useState, useMemo } from 'react';
import {
  HeatPumpConfig,
  CentralHeatingConfig,
  BufferStorageConfig,
  FreshWaterStationConfig,
  SanitaryConsumerConfig,
  CirculationConfig,
  TechnicianInspection,
} from './types';
import {
  calculateSystemMetrics,
  DEFAULT_HEAT_PUMPS,
  DEFAULT_CENTRAL_HEATING,
  DEFAULT_BUFFER_STORAGE,
  DEFAULT_FWS,
  DEFAULT_SANITARY,
  DEFAULT_CIRCULATION,
  DEFAULT_INSPECTION,
} from './utils/calculations';
import { Header } from './components/Header';
import { KeyMetricsGrid } from './components/KeyMetricsGrid';
import { SystemOverviewSchema } from './components/SystemOverviewSchema';
import { ParameterControls } from './components/ParameterControls';
import { OperatingStateAnalysis } from './components/OperatingStateAnalysis';
import { PlantComponentsInfo } from './components/PlantComponentsInfo';
import { NormComplianceVisualizer } from './components/NormComplianceVisualizer';
import { ScenarioSimulator } from './components/ScenarioSimulator';
import { OperatingCostModule } from './components/OperatingCostModule';
import { FieldInspectionChecklist } from './components/FieldInspectionChecklist';
import { PdfExportModal } from './components/PdfExportModal';

export default function App() {
  const [heatPumps, setHeatPumps] = useState<HeatPumpConfig[]>(DEFAULT_HEAT_PUMPS);
  const [centralHeating, setCentralHeating] = useState<CentralHeatingConfig>(DEFAULT_CENTRAL_HEATING);
  const [buffer, setBuffer] = useState<BufferStorageConfig>(DEFAULT_BUFFER_STORAGE);
  const [fws, setFws] = useState<FreshWaterStationConfig>(DEFAULT_FWS);
  const [sanitary, setSanitary] = useState<SanitaryConsumerConfig>(DEFAULT_SANITARY);
  const [circulation, setCirculation] = useState<CirculationConfig>(DEFAULT_CIRCULATION);
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState<boolean>(false);

  const [inspection, setInspection] = useState<TechnicianInspection>({
    ...DEFAULT_INSPECTION,
    inspectionDate: new Date().toISOString().split('T')[0],
  });

  // Calculate live engineering metrics
  const metrics = useMemo(() => {
    return calculateSystemMetrics(
      heatPumps,
      centralHeating,
      buffer,
      fws,
      sanitary,
      circulation
    );
  }, [heatPumps, centralHeating, buffer, fws, sanitary, circulation]);

  // Scenario Switcher
  const handleApplyScenario = (scenarioKey: string) => {
    setActiveScenario(scenarioKey);

    switch (scenarioKey) {
      case 'PEAK_SPORT':
        // Extremlast Sport: 80% Duschen (40 von 50), 50% WT (25 von 50)
        setSanitary((prev) => ({
          ...prev,
          activeShowersCount: 40,
          activeWashbasinsCount: 25,
          showerSimultaneityPercent: 80,
          washbasinSimultaneityPercent: 50,
        }));
        setHeatPumps((prev) => prev.map((wp) => ({ ...wp, enabled: true })));
        setCentralHeating((prev) => ({ ...prev, enabled: true, powerKw: 136 }));
        setFws((prev) => ({ ...prev, activeStations: 4, hotWaterOutletTempC: 60 }));
        setBuffer((prev) => ({ ...prev, topTempC: 65, bottomTempC: 32 }));
        break;

      case 'STANDARD_COMMERCIAL':
        // Normaler Duschbetrieb: 30% Duschen (15 von 50), 20% WT (10 von 50)
        setSanitary((prev) => ({
          ...prev,
          activeShowersCount: 15,
          activeWashbasinsCount: 10,
          showerSimultaneityPercent: 30,
          washbasinSimultaneityPercent: 20,
        }));
        setHeatPumps((prev) =>
          prev.map((wp, idx) => ({ ...wp, enabled: idx < 2 }))
        ); // WP 1 + 2 aktiv
        setCentralHeating((prev) => ({ ...prev, enabled: false }));
        setFws((prev) => ({ ...prev, activeStations: 3, hotWaterOutletTempC: 60 }));
        setBuffer((prev) => ({ ...prev, topTempC: 65, bottomTempC: 28 }));
        break;

      case 'LOW_NIGHT':
        // Nachtbetrieb: Keine Duschzapfung, nur Zirkulationsverlust
        setSanitary((prev) => ({
          ...prev,
          activeShowersCount: 0,
          activeWashbasinsCount: 0,
          showerSimultaneityPercent: 0,
          washbasinSimultaneityPercent: 0,
        }));
        setHeatPumps((prev) =>
          prev.map((wp, idx) => ({ ...wp, enabled: idx === 0 }))
        ); // Nur WP 1 Grundlast
        setCentralHeating((prev) => ({ ...prev, enabled: false }));
        setFws((prev) => ({ ...prev, activeStations: 1, hotWaterOutletTempC: 60 }));
        setBuffer((prev) => ({ ...prev, topTempC: 64, bottomTempC: 26 }));
        break;

      case 'WP_N_MINUS_1':
        // N-1 Redundanz: WP 1 defekt/ausgefallen, 136 kW Zentralheizung puffert voll ab
        setSanitary((prev) => ({
          ...prev,
          activeShowersCount: 30,
          activeWashbasinsCount: 20,
          showerSimultaneityPercent: 60,
          washbasinSimultaneityPercent: 40,
        }));
        setHeatPumps((prev) =>
          prev.map((wp) => (wp.id === 'wp-1' ? { ...wp, enabled: false } : { ...wp, enabled: true }))
        );
        setCentralHeating((prev) => ({ ...prev, enabled: true, powerKw: 136 }));
        setFws((prev) => ({ ...prev, activeStations: 4, hotWaterOutletTempC: 60 }));
        break;

      case 'THERMAL_DISINFECTION':
        // Thermische Desinfektion nach DVGW W 551: 70°C Speichertemperatur
        setBuffer((prev) => ({
          ...prev,
          topTempC: 70,
          targetChargingTempC: 70,
        }));
        setFws((prev) => ({
          ...prev,
          hotWaterOutletTempC: 70,
          primaryFlowTempC: 72,
        }));
        setCirculation((prev) => ({
          ...prev,
          flowTempC: 70,
          returnTempC: 66,
        }));
        setHeatPumps((prev) => prev.map((wp) => ({ ...wp, enabled: true })));
        setCentralHeating((prev) => ({ ...prev, enabled: true, powerKw: 136 }));
        break;
    }
  };

  const handleResetDefaults = () => {
    setActiveScenario(null);
    setHeatPumps(DEFAULT_HEAT_PUMPS);
    setCentralHeating(DEFAULT_CENTRAL_HEATING);
    setBuffer(DEFAULT_BUFFER_STORAGE);
    setFws(DEFAULT_FWS);
    setSanitary(DEFAULT_SANITARY);
    setCirculation(DEFAULT_CIRCULATION);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans antialiased">
      {/* Top App Header with Facility Info & Global Actions */}
      <Header
        metrics={metrics}
        onOpenPdfModal={() => setIsPdfModalOpen(true)}
        onResetDefaults={handleResetDefaults}
      />

      {/* Main App Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-6">
        {/* Row 1: KPI Summary Bar mit dynamischer COP-Anzeige & Monteur-Kennlinie */}
        <KeyMetricsGrid
          metrics={metrics}
          heatPumps={heatPumps}
          setHeatPumps={setHeatPumps}
          buffer={buffer}
        />

        {/* Row 2: Hydraulic Plant Diagram (WP, 3x2000L Puffer, 4x FWS, 10 Duschbereiche, Zirkulation) */}
        <SystemOverviewSchema
          heatPumps={heatPumps}
          centralHeating={centralHeating}
          buffer={buffer}
          fws={fws}
          sanitary={sanitary}
          circulation={circulation}
          metrics={metrics}
        />

        {/* Row 3: Operating State Analysis & Free Consumer Input */}
        <OperatingStateAnalysis
          heatPumps={heatPumps}
          setHeatPumps={setHeatPumps}
          centralHeating={centralHeating}
          setCentralHeating={setCentralHeating}
          buffer={buffer}
          fws={fws}
          sanitary={sanitary}
          setSanitary={setSanitary}
          metrics={metrics}
        />

        {/* Row 4: Operating Cost & Economic Analysis based on COP, current load, and electricity price */}
        <OperatingCostModule metrics={metrics} />

        {/* Row 5: Component Information & Technical Documentation */}
        <PlantComponentsInfo
          heatPumps={heatPumps}
          centralHeating={centralHeating}
          buffer={buffer}
          fws={fws}
          circulation={circulation}
          metrics={metrics}
        />

        {/* Row 5: Scenario Quick-Selector / Stress Test */}
        <ScenarioSimulator
          onApplyScenario={handleApplyScenario}
          activeScenario={activeScenario}
        />

        {/* Row 6: Detailed Parameter & Component Controls */}
        <ParameterControls
          heatPumps={heatPumps}
          setHeatPumps={setHeatPumps}
          centralHeating={centralHeating}
          setCentralHeating={setCentralHeating}
          buffer={buffer}
          setBuffer={setBuffer}
          fws={fws}
          setFws={setFws}
          sanitary={sanitary}
          setSanitary={setSanitary}
          circulation={circulation}
          setCirculation={setCirculation}
          metrics={metrics}
        />

        {/* Row 7: Automated DIN & DVGW Norm Compliance Visualizer */}
        <NormComplianceVisualizer metrics={metrics} />

        {/* Row 8: On-site Technician Checklist & Field Diagnostics */}
        <FieldInspectionChecklist metrics={metrics} />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 mt-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Warmwasser-Anlagenanalyse & Prüftool für Monteure • DIN 1988, DVGW W 551, DIN 4708, VDI 6023
          </span>
          <span className="text-slate-400">
            3x Wärmepumpen • 6.000 L Puffervorrat • 4x FWS • 10 Duschbereiche
          </span>
        </div>
      </footer>

      {/* PDF Export & Inspection Protocol Modal */}
      <PdfExportModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        heatPumps={heatPumps}
        centralHeating={centralHeating}
        buffer={buffer}
        fws={fws}
        sanitary={sanitary}
        circulation={circulation}
        metrics={metrics}
        inspection={inspection}
        setInspection={setInspection}
      />
    </div>
  );
}
