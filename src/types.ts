export interface HeatPumpConfig {
  id: string;
  name: string;
  enabled: boolean;
  thermalPowerKw: number; // Thermische Heizleistung (kW)
  electricalPowerKw: number; // Elektrische Leistungsaufnahme (kW)
  sourceTempC: number; // z.B. Außenluft oder Sole (°C)
  flowTempC: number; // Vorlauftemperatur (°C)
  manualCop?: number;
}

export interface CentralHeatingConfig {
  enabled: boolean;
  powerKw: number; // Leistung über Plattenwärmetauscher (kW)
  flowTempC: number; // Vorlauftemperatur Zentralheizung (°C)
  returnTempC: number; // Rücklauftemperatur Zentralheizung (°C)
}

export interface BufferStorageConfig {
  count: number; // 3 Pufferspeicher
  volumePerTankLiters: number; // 2000 L
  totalVolumeLiters: number; // 6000 L
  topTempC: number; // Obere Speichertemperatur (°C) - z.B. 65°C
  bottomTempC: number; // Untere Speichertemperatur (°C) - z.B. 30°C
  targetChargingTempC: number; // Solltemperatur Beladung (°C) - z.B. 65°C
  minUsableTempC: number; // Mindestnutztemperatur für FWS (°C) - z.B. 55°C
  ambientTempC: number; // Aufstellraumtemperatur (°C) - z.B. 18°C
  insulationLossKwh24h: number; // Speicherverluste (kWh/24h)
}

export interface FreshWaterStationConfig {
  count: number; // 4 FWS
  ratedCapacityPerStationLmin: number; // z.B. 45-60 l/min bei 60°C WW
  primaryFlowTempC: number; // Heizungswasser Vorlauf (°C)
  primaryReturnTempC: number; // Heizungswasser Rücklauf (°C)
  coldWaterInletTempC: number; // Kaltwasserzulauf (°C) - ca. 10°C
  hotWaterOutletTempC: number; // Warmwasseraustritt (°C) - Norm: >= 60°C
  activeStations: number; // Wie viele FWS aktuell in Betrieb sind (1-4)
}

export interface SanitaryConsumerConfig {
  showerAreasCount: number; // 10 Duschbereiche
  panelsPerArea: number; // 5 Duschpaneele pro Bereich
  washbasinsPerArea: number; // 5 Waschtische pro Bereich
  totalShowerPanels: number; // 50 Duschpaneele
  totalWashbasins: number; // 50 Waschtische
  
  showerPanelFlowLmin: number; // Mischwasser z.B. 10 l/min bei 38°C
  washbasinFlowLmin: number; // Mischwasser z.B. 5 l/min bei 38°C
  showerMixedTempC: number; // z.B. 38°C
  washbasinMixedTempC: number; // z.B. 38°C
  
  showerSimultaneityPercent: number; // Gleichzeitigkeit Duschen (0 - 100%)
  washbasinSimultaneityPercent: number; // Gleichzeitigkeit Waschtische (0 - 100%)
  activeShowersCount: number; // Frei eingebbare Anzahl aktiver Duschen (0-50)
  activeWashbasinsCount: number; // Frei eingebbare Anzahl aktiver Waschtische (0-50)
  
  showerDurationMinutes: number; // Durchschnittliche Duschzeit (z.B. 6 min)
}

export interface CirculationConfig {
  enabled: boolean;
  pipeLengthMeters: number; // Gesamtlänge Zirkulationsleitungen (m)
  specificLossWpm: number; // Spezifischer Wärmeverlust (W/m) z.B. 11 W/m nach GEG
  flowTempC: number; // Vorlauftemperatur Zirkulation (°C) (am Abgang FWS)
  returnTempC: number; // Rücklauftemperatur Zirkulation (°C) (am Eintritt FWS)
  pumpFlowRateLh: number; // Volumenstrom Zirkulationspumpe (l/h)
  maxAllowedPipeVolumeLitres: number; // 3-Liter-Regel nach DVGW W 551
  maxTapDistancePipeVolumeLitres: number; // Tatsächliches Leitungsvolumen zur entferntesten Zapfstelle
}

export interface SystemCalculations {
  // Thermische Leistung
  totalWpThermalPowerKw: number;
  totalWpElectricalPowerKw: number;
  systemCop: number;
  centralHeatingPowerKw: number;
  totalHeatGenerationPowerKw: number;
  
  // Speicherenergetik (6.000 L)
  totalStorageVolumeLiters: number;
  totalStoredEnergyKwh: number; // Bezogen auf minUsableTemp
  storedEnergyFullDeltaKwh: number; // Bezogen auf Kaltwasser (10°C)
  storageStateOfChargePercent: number; // 0 - 100%
  storageReheatTimeHours: number; // Zeit zur Vollladung bei aktiven Wärmeerzeugern
  
  // Bedarfs- und Zapfwerte
  activeShowersCount: number;
  activeWashbasinsCount: number;
  peakMixedWaterFlowLmin: number; // Gesamt-Mischwasser l/min
  peakHotWaterFlowLmin: number; // Warmwasserbedarf (60°C) l/min
  peakHotWaterFlowM3h: number; // m³/h
  peakThermalDemandKw: number; // Benötigte Spitzenleistung am Wärmeüberträger
  
  // Frischwasserstationen Kapazität
  fwsTotalCapacityLmin: number;
  fwsCapacityUtilizationPercent: number;
  fwsSufficient: boolean;
  requiredPrimaryFlowLh: number; // Erforderlicher Heizwasservolumenstrom
  
  // Versorgungsdauer & Autonomie
  autonomyStorageOnlyMinutes: number; // Dauer bei reinem Speicherbetrieb bis leer
  autonomyWithGenerationMinutes: number; // Dauer mit aktiven Erzeugern
  continuousFlowCoveragePercent: number; // Dauerdeckungsgrad (Erzeugung / Bedarf)
  
  // Analyse der Betriebszustände & Speicherladung
  netPowerBalanceKw: number; // Erzeugung - (Last + Zirkulation). Positiv = Speicher lädt, Negativ = Speicher entlädt
  operatingStateKey: 'DISCHARGING_FAST' | 'DISCHARGING_SLOW' | 'BALANCED' | 'CHARGING' | 'STANDBY_CIRCULATION';
  operatingStateTitle: string;
  operatingStateDescription: string;
  
  // Wassermengen & Duschgang-Bilanz
  coldWaterFlowLmin: number; // Benötigte Kaltwasser-Zumischung (10°C) l/min
  showerSessionTotalMixedLiters: number; // Mischwassermenge für 1 Duschzyklus (z.B. 6 Min)
  showerSessionTotalHot60Liters: number; // 60°C Warmwassermenge für 1 Duschzyklus
  showerSessionEnergyKwh: number; // Dem Speicher für 1 Duschzyklus entzogene Wärmeenergie
  showerSessionRechargeTimeWpMinutes: number; // Wiederaufladezeit für 1 Duschzyklus mit 3x WP (135 kW)
  showerSessionRechargeTimeWtMinutes: number; // Wiederaufladezeit für 1 Duschzyklus mit 136 kW WT
  showerSessionRechargeTimeCombinedMinutes: number; // Wiederaufladezeit für 1 Duschzyklus mit WP + 136 kW WT (271 kW)
  
  // Ladedauern Gesamtspeicher (6.000 L von minUsableTemp auf Soll 65°C)
  fullStorageRechargeHoursWp: number; // mit 3x WP (135 kW)
  fullStorageRechargeHoursWt: number; // mit 136 kW WT
  fullStorageRechargeHoursCombined: number; // mit WP + 136 kW WT (271 kW)
  
  // Zirkulation & Verluste
  circulationLossKw: number;
  circulationTempDropK: number; // Delta T Vorlauf/Rücklauf
  circulationPumpMinFlowLh: number; // Nach DVGW W 551 erforderlicher Mindestvolumenstrom
  circulationPumpAdequate: boolean;
  
  // COP- und Effizienzanalyse basierend auf Quellen- und Speichertemperatur
  copAnalysis: CopAnalysis;
  
  // Trinkwasserhygiene & Normen
  normCompliance: {
    w551OutletTemp: {
      status: 'OK' | 'WARNING' | 'ERROR';
      actual: number;
      target: number;
      rule: string;
      description: string;
    };
    w551ReturnTemp: {
      status: 'OK' | 'WARNING' | 'ERROR';
      actual: number;
      target: number;
      rule: string;
      description: string;
    };
    w551TempDrop: {
      status: 'OK' | 'WARNING' | 'ERROR';
      actual: number;
      maxAllowed: number;
      rule: string;
      description: string;
    };
    threeLiterRule: {
      status: 'OK' | 'WARNING' | 'ERROR';
      actualVolumeL: number;
      thresholdL: number;
      rule: string;
      description: string;
    };
    fwsCapacityCheck: {
      status: 'OK' | 'WARNING' | 'ERROR';
      utilization: number;
      rule: string;
      description: string;
    };
    bufferDimensioningCheck: {
      status: 'OK' | 'WARNING' | 'ERROR';
      storedMinutes: number;
      rule: string;
      description: string;
    };
    vdi6023Stagnation: {
      status: 'OK' | 'WARNING' | 'INFO';
      rule: string;
      description: string;
    };
  };
  overallStatus: 'OK' | 'WARNING' | 'ERROR';
  overallScorePercent: number;
}

export interface TechnicianInspection {
  inspectorName: string;
  companyName: string;
  facilityName: string;
  facilityAddress: string;
  inspectionDate: string;
  orderNumber: string;
  measuredSystemPressureBar: number;
  measuredWpFlowTempC: number;
  measuredWpReturnTempC: number;
  measuredBufferTopTempC: number;
  measuredBufferBottomTempC: number;
  measuredFwsOutletTempC: number;
  measuredCircReturnTempC: number;
  thermalDisinfectionTested: boolean;
  circulationPumpOperational: boolean;
  safetyValvesChecked: boolean;
  expansionVesselsChecked: boolean;
  legionellaFilterInstalled: boolean;
  recommendations: string[];
  notes: string;
  statusApproved: boolean;
}

export type PresetScenario = 'PEAK_SPORT' | 'STANDARD_COMMERCIAL' | 'LOW_NIGHT' | 'WP_N_MINUS_1';

export interface CopCurvePoint {
  sourceTemp: number;
  flowTemp: number;
  cop: number;
  isCurrent: boolean;
  status: 'OPTIMAL' | 'GOOD' | 'FAIR' | 'CRITICAL';
}

export interface CopAnalysis {
  systemCop: number;
  nominalCop: number;
  avgSourceTempC: number;
  avgFlowTempC: number;
  bufferBottomTempC: number;
  tempLiftK: number; // T_VL - T_Quelle (z.B. 58 K)
  carnotCop: number;
  carnotEfficiencyPercent: number; // Gütegrad z.B. 58.5%
  efficiencyStatus: 'OPTIMAL' | 'GOOD' | 'FAIR' | 'CRITICAL';
  efficiencyLabel: string;
  efficiencyBadgeClass: string;
  efficiencyDescription: string;
  monteurTips: string[];
  sourceTempCurve: {
    sourceTemp: number;
    cop: number;
    isCurrent: boolean;
    label: string;
  }[];
  flowTempCurve: {
    flowTemp: number;
    cop: number;
    isCurrent: boolean;
    label: string;
  }[];
}

export interface OperatingCostConfig {
  electricityPricePerKwh: number; // Strompreis in €/kWh (z.B. 0.32 €/kWh = 32 ct/kWh)
  comparisonHeatingPricePerKwh: number; // Vergleichspreis für Zentralheizung/Fernwärme in €/kWh (z.B. 0.12 €/kWh)
  dailyHighLoadHours: number; // Stunden pro Tag mit aktiver Duschzapfung (z.B. 4h)
  dailyLowLoadHours: number; // Stunden pro Tag mit reiner Zirkulation (z.B. 20h)
  operatingDaysPerYear: number; // Betriebstage pro Jahr (z.B. 300)
}

export interface OperatingCostResults {
  // Momentane Betriebskosten bei aktueller Last (€/h)
  actualThermalDemandKw: number; // Duschlast + Zirkulationsverlust
  activeWpThermalPowerKw: number;
  activeWpElectricPowerKw: number;
  currentCop: number;

  // Momentane Stundenkosten (€/h)
  instantaneousWpCostPerHourEur: number; // Bei tatsächlich laufenden Wärmepumpen
  thermalDemandCostPerHourEur: number; // Kosten zur Deckung der aktuellen thermischen Last über WP
  directElectricCostPerHourEur: number; // Bei COP 1.0 (z.B. Heizstab / Durchlauferhitzer)
  centralHeatingCostPerHourEur: number; // Bei 136 kW WT / Fernwärme / Gas (Vergleichspreis)
  hourlySavingsVsDirectElectricEur: number;
  hourlySavingsVsCentralHeatingEur: number;

  // Spezifische Wärmegestehungskosten (ct/kWh_th)
  heatCostPerKwhThCent: number; // (Strompreis / COP) * 100
  heatCostDirectElectricCent: number; // Strompreis * 100 (COP 1.0)
  heatCostCentralHeatingCent: number; // Vergleichspreis * 100

  // Duschkosten
  costPerShowerSessionEur: number; // Komplette Sitzung mit allen aktiven Duschplätzen
  costPerSingleShowerEur: number; // 1 Einzeldusche (6 min Mischwasser 38°C)
  costShareShowersPerHourEur: number; // Anteil Duschzapfung an Stundenkosten
  costShareCirculationPerHourEur: number; // Anteil Zirkulation an Stundenkosten

  // Hochrechnung Tag / Monat / Jahr
  dailyCostWpEur: number;
  dailyCostDirectElectricEur: number;
  dailyCostCentralHeatingEur: number;

  monthlyCostWpEur: number;
  annualCostWpEur: number;
  annualCostDirectElectricEur: number;
  annualCostCentralHeatingEur: number;
  annualSavingsVsDirectElectricEur: number;
  annualSavingsVsCentralHeatingEur: number;

  // COP Sensitivitätskurve: Wie verändern sich die Wärmekosten bei variierendem COP?
  copCostCurve: {
    cop: number;
    sourceTemp: number;
    heatCostCentPerKwhTh: number;
    hourlyCostAtCurrentLoadEur: number;
    isCurrent: boolean;
  }[];
}
