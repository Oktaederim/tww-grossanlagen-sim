import { SystemCalculations, OperatingCostConfig, OperatingCostResults } from '../types';

export const DEFAULT_OPERATING_COST_CONFIG: OperatingCostConfig = {
  electricityPricePerKwh: 0.32, // 32 ct/kWh Wärmepumpen-/Gewerbestrom
  comparisonHeatingPricePerKwh: 0.12, // 12 ct/kWh Zentralheizung / Fernwärme / Gas (136 kW WT)
  dailyHighLoadHours: 4, // 4 Stunden Dusch-Spitzenbetrieb pro Tag (z.B. Sport-/Vereinsbetrieb)
  dailyLowLoadHours: 20, // Automatisch berechnet: 24h - highHours
  operatingDaysPerYear: 310, // 310 Betriebstage pro Jahr
};

/**
 * Berechnet detaillierte Betriebskosten basierend auf dem aktuellen COP,
 * der momentanen thermischen Last und dem Strompreis.
 */
export function calculateOperatingCosts(
  metrics: SystemCalculations,
  config: OperatingCostConfig = DEFAULT_OPERATING_COST_CONFIG
): OperatingCostResults {
  const electricityPrice = Math.max(0.01, config.electricityPricePerKwh);
  const comparisonPrice = Math.max(0.01, config.comparisonHeatingPricePerKwh);
  const currentCop = Math.max(1.0, metrics.systemCop);

  // 1. Thermische Last
  const peakThermalDemandKw = metrics.peakThermalDemandKw;
  const circulationLossKw = metrics.circulationLossKw;
  const actualThermalDemandKw = Math.round((peakThermalDemandKw + circulationLossKw) * 10) / 10;

  // 2. Wärmepumpen-Leistung
  const activeWpThermalPowerKw = metrics.totalWpThermalPowerKw;
  const activeWpElectricPowerKw = metrics.totalWpElectricalPowerKw;

  // 3. Momentane Stundenkosten (€/h)
  // a) Bei tatsächlich laufenden Wärmepumpen (Momentanverbrauch)
  const instantaneousWpCostPerHourEur =
    Math.round(activeWpElectricPowerKw * electricityPrice * 100) / 100;

  // b) Kosten zur Deckung der aktuellen Gesamtwärmelast (Zapfung + Zirkulation) über WP
  const electricPowerNeededForDemandKw = actualThermalDemandKw / currentCop;
  const thermalDemandCostPerHourEur =
    Math.round(electricPowerNeededForDemandKw * electricityPrice * 100) / 100;

  // c) Vergleich: Direktheizstab (COP 1.0)
  const directElectricCostPerHourEur =
    Math.round(actualThermalDemandKw * electricityPrice * 100) / 100;

  // d) Vergleich: Zentralheizung / 136 kW Plattenwärmetauscher
  const centralHeatingCostPerHourEur =
    Math.round(actualThermalDemandKw * comparisonPrice * 100) / 100;

  // e) Stündliche Ersparnisse
  const hourlySavingsVsDirectElectricEur =
    Math.round((directElectricCostPerHourEur - thermalDemandCostPerHourEur) * 100) / 100;
  const hourlySavingsVsCentralHeatingEur =
    Math.round((centralHeatingCostPerHourEur - thermalDemandCostPerHourEur) * 100) / 100;

  // 4. Spezifische Wärmegestehungskosten (ct/kWh_th)
  const heatCostPerKwhThCent =
    Math.round((electricityPrice / currentCop) * 100 * 10) / 10;
  const heatCostDirectElectricCent =
    Math.round(electricityPrice * 100 * 10) / 10;
  const heatCostCentralHeatingCent =
    Math.round(comparisonPrice * 100 * 10) / 10;

  // 5. Duschkosten
  // Einzeldusche: Dynamisch berechnet aus den Sanitäreinstellungen
  // E = V_punkt_Misch * t_dusch * c * (T_misch - T_kalt) / 1000
  const singleShowerEnergyKwh = metrics.singleShowerEnergyKwh > 0 ? metrics.singleShowerEnergyKwh : 1.954;
  const costPerSingleShowerEur =
    Math.round(((singleShowerEnergyKwh / currentCop) * electricityPrice) * 1000) / 1000;

  // Gesamte Duschsitzung mit allen aktiven Duschplätzen
  const costPerShowerSessionEur =
    Math.round(((metrics.showerSessionEnergyKwh / currentCop) * electricityPrice) * 100) / 100;

  // Kostenanteile an den Stundenkosten
  const costShareShowersPerHourEur =
    Math.round(((peakThermalDemandKw / currentCop) * electricityPrice) * 100) / 100;
  const costShareCirculationPerHourEur =
    Math.round(((circulationLossKw / currentCop) * electricityPrice) * 100) / 100;

  // 6. Hochrechnungen: Tag / Monat / Jahr
  // Täglicher Wärmebedarf: High-Load (Duschen + Zirkulation) + Low-Load (nur Zirkulation)
  const highHours = Math.max(0, Math.min(24, config.dailyHighLoadHours));
  const lowHours = Math.max(0, 24 - highHours);

  const dailyThermalKwh =
    peakThermalDemandKw * highHours + circulationLossKw * 24;

  const dailyElectricKwhWp = dailyThermalKwh / currentCop;
  const dailyCostWpEur = Math.round(dailyElectricKwhWp * electricityPrice * 100) / 100;
  const dailyCostDirectElectricEur =
    Math.round(dailyThermalKwh * electricityPrice * 100) / 100;
  const dailyCostCentralHeatingEur =
    Math.round(dailyThermalKwh * comparisonPrice * 100) / 100;

  // Jahreskosten (Betriebstage mit Duschbetrieb + Ruhetage nur Zirkulation)
  const opDays = Math.max(1, Math.min(365, config.operatingDaysPerYear));
  const idleDays = 365 - opDays;
  const idleDailyCirculationKwh = circulationLossKw * 24;

  const annualThermalKwh =
    dailyThermalKwh * opDays + idleDailyCirculationKwh * idleDays;
  const annualElectricKwhWp = annualThermalKwh / currentCop;

  const annualCostWpEur = Math.round(annualElectricKwhWp * electricityPrice);
  const annualCostDirectElectricEur = Math.round(annualThermalKwh * electricityPrice);
  const annualCostCentralHeatingEur = Math.round(annualThermalKwh * comparisonPrice);

  const annualSavingsVsDirectElectricEur = annualCostDirectElectricEur - annualCostWpEur;
  const annualSavingsVsCentralHeatingEur = annualCostCentralHeatingEur - annualCostWpEur;

  const monthlyCostWpEur = Math.round(annualCostWpEur / 12);

  // 7. COP Sensitivitätskurve (Reiner mathematischer Verlauf Wärmekosten = Strompreis / COP)
  const copTestPoints = [2.0, 2.5, 3.0, 3.65, 4.0, 4.5];
  const copCostCurve = copTestPoints.map((testCop) => {
    const heatCostCent = Math.round((electricityPrice / testCop) * 100 * 10) / 10;
    const hourlyCostEur =
      Math.round(((actualThermalDemandKw / testCop) * electricityPrice) * 100) / 100;
    const isCurrent = Math.abs(testCop - currentCop) < 0.2;

    return {
      cop: testCop,
      heatCostCentPerKwhTh: heatCostCent,
      hourlyCostAtCurrentLoadEur: hourlyCostEur,
      isCurrent,
    };
  });

  return {
    actualThermalDemandKw,
    activeWpThermalPowerKw,
    activeWpElectricPowerKw,
    currentCop,
    instantaneousWpCostPerHourEur,
    thermalDemandCostPerHourEur,
    directElectricCostPerHourEur,
    centralHeatingCostPerHourEur,
    hourlySavingsVsDirectElectricEur,
    hourlySavingsVsCentralHeatingEur,
    heatCostPerKwhThCent,
    heatCostDirectElectricCent,
    heatCostCentralHeatingCent,
    costPerShowerSessionEur,
    costPerSingleShowerEur,
    costShareShowersPerHourEur,
    costShareCirculationPerHourEur,
    dailyCostWpEur,
    dailyCostDirectElectricEur,
    dailyCostCentralHeatingEur,
    monthlyCostWpEur,
    annualCostWpEur,
    annualCostDirectElectricEur,
    annualCostCentralHeatingEur,
    annualSavingsVsDirectElectricEur,
    annualSavingsVsCentralHeatingEur,
    copCostCurve,
  };
}
