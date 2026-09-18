export type StorageCalculationMode = 'fully_mixed' | 'manual_fraction' | 'multi_sensor';

export interface HeatPumpConfig {
  id: string;
  name: string;
  enabled: boolean;
  thermalPowerKw: number; // Thermische Heizleistung (kW) - Nennwert: 40.0 kW (Mitsubishi QAHV)
  electricalPowerKw: number; // Elektrische Leistungsaufnahme (kW) - Nennwert: 10.97 kW
  sourceTempC: number; // z.B. Außenluft (°C) - Nennpunkt: 7°C
  flowTempC: number; // Vorlauftemperatur (°C) - Nennpunkt: 65°C
  manualCop?: number;
}

export interface CentralHeatingConfig {
  enabled: boolean;
  powerKw: number; // Leistung über Plattenwärmetauscher (kW) - Planwert: 136 kW
  flowTempC: number; // Vorlauftemperatur Zentralheizung (°C) - Planwert: 70°C
  returnTempC: number; // Rücklauftemperatur Zentralheizung (°C) - Planwert: 55°C
  flowRateM3h?: number; // Planwert: 7.8 m³/h
  nominalPipe?: string; // Planwert: DN40
}

export interface BufferStorageConfig {
  count: number; // 3 Pufferspeicher
  volumePerTankLiters: number; // 2000 L
  totalVolumeLiters: number; // 6000 L
  topTempC: number; // Obere Speichertemperatur (°C) - z.B. 65°C
  bottomTempC: number; // Untere Speichertemperatur (°C) - z.B. 30°C
  targetChargingTempC: number; // Solltemperatur Beladung (°C) - z.B. 65°C
  minUsableTempC: number; // Mindestnutztemperatur für FWS (°C) - z.B. 60°C
  ambientTempC: number; // Aufstellraumtemperatur (°C) - z.B. 18°C
  insulationLossKwh24h: number; // Speicherverluste (kWh/24h) - z.B. 7.5 kWh/24h
  hotLayerFraction: number; // Vom Benutzer gewählte Heißwasserschicht bei manual_fraction (0.1 - 1.0)
  storageCalcMode: StorageCalculationMode; // 3 Stufen: fully_mixed | manual_fraction | multi_sensor
  sensorTopTempC: number; // Sensor Puffer oben (°C)
  sensorMidTempC: number; // Sensor Puffer mitte (°C)
  sensorBottomTempC: number; // Sensor Puffer unten (°C)
}

export interface FreshWaterStationConfig {
  count: number; // 4 FWS (Danfoss TD-FLS 130 kW PUMP-CTRL ECL)
  ratedCapacityPerStationLmin: number; // Nennkapazität 37.3 l/min je FWS (130 kW bei 70/25 -> 10/60°C)
  ratedPowerPerStationKw: number; // Nennwärmeleistung 130 kW je FWS bei 70/25°C
  primaryFlowTempC: number; // Heizungswasser Vorlauf (°C) aus Puffer 2 (aktuell simuliert: 65°C)
  primaryReturnTempC: number; // Heizungswasser Rücklauf (°C)
  coldWaterInletTempC: number; // Kaltwasserzulauf (°C) - ca. 10°C
  hotWaterOutletTempC: number; // Warmwasseraustritt (°C) - Sollwert: 60°C
  activeStations: number; // Aktive FWS (0-4)
  waterMeterReadingM3?: number; // Zählerstand Trinkwasser in m³
  waterMeterLastReadingM3?: number; // Vorheriger Zählerstand
  waterMeterIsSample?: boolean; // Kennzeichnung als Beispieldaten
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
  totalStoredEnergyKwh: number; // Unmittelbar für 60°C TWW nutzbare Energie (Delta zu minUsableTemp)
  storageImmediateUsableEnergyKwh: number; // Unmittelbar für 60°C TWW nutzbar
  storageThermalContentFullDeltaKwh: number; // Gesamter thermischer Energieinhalt über Rücklauf
  storedEnergyFullDeltaKwh: number; // Bezogen auf Kaltwasser (10°C) bzw. Rücklauf
  storageStateOfChargePercent: number; // 0 - 100%
  storageReheatTimeHours: number; // Zeit zur Vollladung bei aktiven Wärmeerzeugern
  singleShowerEnergyKwh: number; // Dynamisch berechnete Energie für 1 Duschgang (kWh)
  
  // Bedarfs- und Zapfwerte
  activeShowersCount: number;
  activeWashbasinsCount: number;
  peakMixedWaterFlowLmin: number; // Gesamt-Mischwasser l/min
  peakHotWaterFlowLmin: number; // Warmwasserbedarf (60°C) l/min
  peakHotWaterFlowM3h: number; // m³/h
  peakThermalDemandKw: number; // Benötigte Spitzenleistung am Wärmeüberträger
  
  // Frischwasserstationen Kapazität
  fwsTotalCapacityLmin: number;
  fwsNominalCapacityLmin: number; // 149.2 l/min bei 70/25°C Nennpunkt (Typenschild)
  fwsAvailableCapacityLmin?: number; // Reale Kapazität am aktuellen Betriebspunkt
  fwsAvailableCapacityText: string; // z.B. "149.2 l/min (Nennpunkt 70°C)" oder "Nicht nachgewiesen bei 65°C"
  fwsCapacityUtilizationPercent?: number; // undefined wenn nicht belastbar berechenbar
  fwsUtilizationStatusText: string; // z.B. "82%" oder "Bei 65°C nicht belastbar berechenbar"
  fwsSufficient: boolean;
  fwsOperatingRating: 'NOMINAL_CONFIRMED_70C' | 'UNPROVEN_AT_65C_PRIMARY' | 'CRITICAL_UNDER_65C';
  fwsOperatingNotice: string; // Transparenter Hinweis zum Nenn- vs. 65°C-Prüfpunkt
  requiredPrimaryFlowLh: number; // Erforderlicher Heizwasservolumenstrom
  
  // Versorgungsdauer & Autonomie (ohne starres 4-K-Veto, mit differenziertem Status)
  autonomyStorageOnlyMinutes: number; // Dauer bei reinem Speicherbetrieb bis leer
  autonomyWithGenerationMinutes: number; // Dauer mit aktiven Erzeugern
  continuousFlowCoveragePercent: number; // Dauerdeckungsgrad (Erzeugung / Bedarf)
  isThermalSupplyFeasible: boolean; // Physikalisches Veto nur bei echtem Defizit
  thermalMarginStatus: 'ADEQUATE' | 'CRITICAL_MARGIN' | 'INSUFFICIENT';
  thermalMarginNotice: string;
  supplyInfeasibilityReason?: string; // Begründung bei Nichtversorgbarkeit
  isHydraulicOverloaded: boolean; // Ob FWS-Durchfluss überschritten ist

  // Reale Hydraulik & Ventilschaltung
  fwsReturnValvePosition: 'BOTTOM_STRAT' | 'MID_STRAT'; // <30°C unten, >=30°C mittig in Puffer 3
  fwsReturnValveReason: string;

  // Speicherberechnungs-Transparenz (3 Stufen)
  storageCalculationModeLabel: string;
  storageCalculationExplanation: string;

  // Trinkwasserzähler-Messung & Analyse (kein geeichter WMZ)
  waterMeterDeltaM3?: number; // Gemessenes Zapfvolumen
  waterMeterThermalEnergyKwh?: number; // Rechnerische thermische Energie am Zähler
  waterMeterEnergyNote: string;
  
  // Mitsubishi QAHV Dokumentationsstatus
  isQahvDocumentedPoint: boolean;
  qahvCopReferenceText: string;
  
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
  measuredSystemPressureBar?: number; // Frei vom Monteur einzugeben (bar)
  measuredWpFlowTempC?: number;
  measuredWpReturnTempC?: number;
  measuredBufferTopTempC?: number;
  measuredBufferBottomTempC?: number;
  measuredFwsOutletTempC?: number;
  measuredCircReturnTempC?: number;
  stagnationFlushingConfirmed: boolean; // Aktive Monteur-Bestätigung Spülintervall <72h
  stagnationProtectionActive?: boolean; // Spülung/Stagnationsschutz
  fwsSecondaryStratValveChecked?: boolean; // 3-Wege-Umschaltventil FWS-Rücklauf
  thermalDisinfectionTested: boolean;
  circulationPumpOperational: boolean;
  safetyValvesChecked: boolean;
  expansionVesselsChecked: boolean;
  legionellaFilterInstalled: boolean;
  recommendations: string[];
  notes: string;
  statusApproved: boolean; // Nur wenn aktiv vom Monteur bestätigt
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
