export interface HeatPumpConfig {
  id: string;
  name: string;
  thermalPowerKw: number;
  electricalPowerKw: number;
  cop: number;
  flowTempC: number;
  sourceTempC: number; // Quellentemperatur (Außenluft oder Sole)
  enabled: boolean;
}

export interface CentralHeatingConfig {
  enabled: boolean;
  powerKw: number;
  flowTempC: number;
  description: string;
}

export interface BufferStorageConfig {
  count: number;
  volumePerTankLiters: number;
  topTempC: number;
  bottomTempC: number;
  targetChargingTempC: number;
  minUsableTempC: number;
  heatLossPerDayKwh: number;
}

export interface FreshWaterStationConfig {
  activeStations: number;
  maxCapacityPerStationLmin: number;
  coldWaterInletTempC: number;
  hotWaterOutletTempC: number;
  primaryFlowTempC: number;
  primaryReturnTempC: number;
  designPinchPointK: number; // Physikalische Grädigkeit des Tauschers (Standard 4 K)
  waterMeterReadingM3?: number; // Aktueller Zählerstand Trinkwasser-Zulauf FWS
  waterMeterLastReadingM3?: number; // Vorheriger Zählerstand
}

export interface SanitaryConsumerConfig {
  showersCount: number;
  showerFlowRateLmin: number;
  showerSimultaneityPercent: number;
  showerMixedTempC: number;
  activeShowersCount: number;
  washbasinsCount: number;
  washbasinFlowRateLmin: number;
  washbasinSimultaneityPercent: number;
  washbasinMixedTempC: number;
  activeWashbasinsCount: number;
}

export interface CirculationConfig {
  flowTempC: number;
  returnTempC: number;
  pipeLengthMeters: number;
  specificHeatLossWpm: number;
  pumpFlowRateLh: number;
  pumpPowerWatts: number;
  maxAllowedPipeVolumeLitres: number;
  maxTapDistancePipeVolumeLitres: number;
}

export interface SystemCalculations {
  // Erzeugung
  totalHeatGenerationPowerKw: number;
  totalWpThermalPowerKw: number;
  totalWpElectricalPowerKw: number;
  systemCop: number;
  centralHeatingPowerKw: number;
  
  // Puffer & Energieinhalt
  totalStorageVolumeLiters: number;
  totalStoredEnergyKwh: number;
  effectiveTemperatureDifferenceK: number;
  storageStateOfChargePercent: number;
  
  // Last & Bedarfe
  peakHotWaterFlowLmin: number; // 60°C TWW-Spitzenvolumenstrom
  peakHotWaterFlowM3h: number;
  peakMixedWaterFlowLmin: number; // 40°C Mischwasser
  peakThermalDemandKw: number;
  
  // FWS Kaskade
  fwsTotalCapacityLmin: number;
  fwsCapacityUtilizationPercent: number;
  fwsSufficient: boolean;

  // Physikalische Machbarkeit & Veto
  isThermalSupplyFeasible: boolean; // Puffer-Vorlauf >= TWW-Soll + Grädigkeit
  supplyInfeasibilityReason?: string;
  isHydraulicOverloaded: boolean;

  // Reale Hydraulik & Ventilschaltung
  fwsReturnValvePosition: 'BOTTOM_STRAT' | 'MID_STRAT';
  fwsReturnValveReason: string;

  // Trinkwasserzähler-Messung & Analyse
  waterMeterDeltaM3?: number;
  waterMeterThermalEnergyKwh?: number;
  
  // Analyse der Betriebszustände & Speicherladung
  netPowerBalanceKw: number;
  operatingStateKey: 'DISCHARGING_FAST' | 'DISCHARGING_SLOW' | 'BALANCED' | 'CHARGING' | 'STANDBY_CIRCULATION';
  operatingStateTitle: string;
  operatingStateDescription: string;
  
  // Wassermengen & Duschgang-Bilanz
  coldWaterFlowLmin: number;
  showerSessionTotalMixedLiters: number;
  showerSessionTotalHot60Liters: number;
  showerSessionEnergyKwh: number;
  showerSessionRechargeTimeWpMinutes: number;
  showerSessionRechargeTimeWtMinutes: number;
  showerSessionRechargeTimeCombinedMinutes: number;
  
  // Ladedauern Gesamtspeicher
  fullStorageRechargeHoursWp: number;
  fullStorageRechargeHoursWt: number;
  fullStorageRechargeHoursCombined: number;
  
  // Zirkulation & Verluste
  circulationLossKw: number;
  circulationTempDropK: number;
  circulationPumpMinFlowLh: number;
  circulationPumpAdequate: boolean;
  
  // COP- und Effizienzanalyse
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
      target: number;
      rule: string;
      description: string;
    };
    threeLiterRule: {
      status: 'OK' | 'WARNING' | 'ERROR';
      actualVolumeL: number;
      rule: string;
      description: string;
    };
    fwsCapacityCheck: {
      status: 'OK' | 'WARNING' | 'ERROR';
      demandLmin: number;
      capacityLmin: number;
      utilization: number;
      rule: string;
      description: string;
    };
    bufferDimensioningCheck: {
      status: 'OK' | 'WARNING' | 'ERROR';
      autonomyMinutes: number;
      rule: string;
      description: string;
    };
  };
  
  // Autonomie / Versorgungsdauer
  autonomyStorageOnlyMinutes: number;
  autonomyWithGenerationMinutes: number;
  
  // Gesamt-Bewertung
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
  measuredSystemPressureBar?: number;
  measuredWpFlowTempC?: number;
  measuredWpReturnTempC?: number;
  measuredBufferTopTempC?: number;
  measuredBufferBottomTempC?: number;
  measuredFwsOutletTempC?: number;
  measuredCircReturnTempC?: number;
  stagnationFlushingConfirmed: boolean;
  stagnationProtectionActive?: boolean;
  fwsSecondaryStratValveChecked?: boolean;
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
  tempLiftK: number;
  carnotCop: number;
  carnotEfficiencyPercent: number;
  efficiencyStatus: 'OPTIMAL' | 'GOOD' | 'FAIR' | 'CRITICAL';
  efficiencyLabel: string;
  efficiencyBadgeClass: string;
  efficiencyDescription: string;
  sourceTempCurve: CopCurvePoint[];
  flowTempCurve: CopCurvePoint[];
  technicianAdvice: string[];
  warningMessage?: string;
}

export interface CostTariffConfig {
  electricityPriceCentKwh: number;
  gasOrHeatPriceCentKwh: number;
  operatingHoursPerDay: number;
  annualOperatingDays: number;
}
