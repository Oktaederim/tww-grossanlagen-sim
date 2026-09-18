import {
  HeatPumpConfig,
  CentralHeatingConfig,
  BufferStorageConfig,
  FreshWaterStationConfig,
  SanitaryConsumerConfig,
  CirculationConfig,
  SystemCalculations,
  CopAnalysis,
  TechnicianInspection,
} from '../types';

// Spezifische Wärmekapazität von Wasser: c = 1.163 Wh / (kg * K) = 0.001163 kWh / (l * K)
export const SPECIFIC_HEAT_WATER_KWH_PER_L_K = 0.001163;
export const WATER_DENSITY_KG_L = 1.0;

/**
 * Physikalische Grädigkeit des FWS-Plattenwärmetauschers (Kelvin).
 * Nach DIN EN 12831-3 / VDI 2072 benötigt die FWS primärseitig eine Temperatur,
 * die mind. um die Grädigkeit (ca. 4-5 K) über der geforderten TWW-Solltemperatur liegt.
 */
/**
 * Berechnet den COP einer Trinkwarmwasser-Wärmepumpe.
 *
 * Referenz- und Dokumentationsbasis:
 * Mitsubishi QAHV-N560YA-HPB (CO2 / R744 Hochtemperatur-Wärmepumpe):
 * Typenschild-Referenzpunkt A7/W9->65°C:
 * - Thermische Leistung: 40,0 kW
 * - Elektrische Leistungsaufnahme: 10,97 kW
 * - Typenschild-COP: 3,65
 * (Luft: 7/6 °C, Wasser: 9/65 °C).
 *
 * Wichtige fachliche Regel:
 * Der dokumentierte Betriebspunkt A7/W9→65, 40 kW, 10,97 kW, COP 3,65 ist der
 * verbindliche Anlagen-Referenzpunkt. Bei abweichenden Betriebsbedingungen
 * wird eine an die Carnot-Güte angelehnte Schätzung mit deklariertem
 * Simulationsstatus vorgenommen.
 */
export function calculateDynamicCop(
  sourceTempC: number,
  flowTempC: number,
  bufferBottomTempC: number = 30
): number {
  const NOMINAL_SOURCE_TEMP = 7.0;
  const NOMINAL_FLOW_TEMP = 65.0;
  const NOMINAL_INLET_TEMP = 9.0;
  const NOMINAL_COP = 3.65; // Mitsubishi QAHV: 40.0 kW / 10.97 kW bei A7/W9->65°C

  // Exakter Treffer am dokumentierten Typenschildpunkt (A7/W9->65°C)
  // Gilt fachlich NUR, wenn Außenluft 7°C, Vorlauf 65°C UND Wassereintritt 9°C vorliegen!
  const isDocumentedPoint =
    Math.abs(sourceTempC - NOMINAL_SOURCE_TEMP) < 0.2 &&
    Math.abs(flowTempC - NOMINAL_FLOW_TEMP) < 0.2 &&
    Math.abs(bufferBottomTempC - NOMINAL_INLET_TEMP) < 0.5;

  if (isDocumentedPoint) {
    return NOMINAL_COP;
  }

  // Thermodynamische Carnot-Güteabschätzung für Temperaturabweichungen
  const tHotK = flowTempC + 273.15;
  const tColdK = sourceTempC + 273.15;
  const carnotDeltaT = Math.max(5, tHotK - tColdK);
  const carnotCop = tHotK / carnotDeltaT;

  const nominalHotK = NOMINAL_FLOW_TEMP + 273.15;
  const nominalColdK = NOMINAL_SOURCE_TEMP + 273.15;
  const nominalCarnotCop = nominalHotK / (nominalHotK - nominalColdK);

  // Gütegrad eta_c basierend auf dem dokumentierten Referenzpunkt (~0.626)
  const etaCarnot = NOMINAL_COP / nominalCarnotCop;

  // Einfluss der Wassereintrittstemperatur bei CO2 (R744 transkritisch):
  // Laut Mitsubishi QAHV-Planungshandbuch führt bei A7/W65 ein Eintritt von 15°C statt 9°C
  // zu einem COP-Abfall von 3,65 auf 3,44 (ca. 0,035 COP-Verlust pro Kelvin Eintrittserhöhung).
  const inletDiffK = bufferBottomTempC - NOMINAL_INLET_TEMP;
  let inletPenalty = 0;
  if (inletDiffK > 0) {
    // Grundverlust durch höhere Gaskühleraustrittstemperatur
    inletPenalty = inletDiffK * 0.035;
    // Zusätzlicher progressiver Verlust bei > 30°C Rücklauf (Nähe zum kritischen Punkt 31,1 °C)
    if (bufferBottomTempC > 30.0) {
      inletPenalty += (bufferBottomTempC - 30.0) * 0.025;
    }
  } else if (inletDiffK < 0) {
    // Kälteres Eintrittswasser als 9°C verbessert die Gaskühlung
    inletPenalty = inletDiffK * 0.015;
  }

  const estimatedCop = (carnotCop * etaCarnot) - inletPenalty;
  return Math.round(Math.min(4.8, Math.max(1.8, estimatedCop)) * 100) / 100;
}

export function calculateSystemMetrics(
  heatPumps: HeatPumpConfig[],
  centralHeating: CentralHeatingConfig,
  buffer: BufferStorageConfig,
  fws: FreshWaterStationConfig,
  sanitary: SanitaryConsumerConfig,
  circulation: CirculationConfig
): SystemCalculations {
  // 1. Heat Generation (Wärmeerzeugung) & Dynamischer COP
  let totalWpThermalPowerKw = 0;
  let totalWpElectricalPowerKw = 0;

  heatPumps.forEach((wp) => {
    if (wp.enabled) {
      const currentCop =
        wp.manualCop ?? calculateDynamicCop(wp.sourceTempC, wp.flowTempC, buffer.bottomTempC);
      totalWpThermalPowerKw += wp.thermalPowerKw;
      const elPower = Math.round((wp.thermalPowerKw / currentCop) * 100) / 100;
      totalWpElectricalPowerKw += elPower;
    }
  });

  const systemCop =
    totalWpElectricalPowerKw > 0
      ? Math.round((totalWpThermalPowerKw / totalWpElectricalPowerKw) * 100) / 100
      : 0;

  // Der Referenzpunkt gilt NUR als dokumentiert, wenn Außenluft 7°C, Vorlauf 65°C UND Wassereintritt 9°C vorliegen.
  // Liegt der Pufferrücklauf beispielsweise bei 30°C, handelt es sich um einen Modell-COP.
  const isQahvDocumentedPoint =
    heatPumps.some(
      (wp) =>
        wp.enabled &&
        Math.abs(wp.sourceTempC - 7.0) < 0.2 &&
        Math.abs(wp.flowTempC - 65.0) < 0.2 &&
        Math.abs(buffer.bottomTempC - 9.0) < 0.5
    );

  const qahvCopReferenceText = isQahvDocumentedPoint
    ? 'Dokumentierter Typenschild-Referenzpunkt Mitsubishi QAHV-N560YA-HPB: A7/W9→65°C, 40,0 kW th / 10,97 kW el = COP 3,65.'
    : `Modell-COP (Simulation): Die Steigung von ca. 0,035 COP/K zwischen 9 und 15°C Wassereintritt ist aus den Mitsubishi-Punkten abgeleitet; die Fortsetzung bis ${buffer.bottomTempC}°C stellt eine thermodynamische Modellrechnung dar und ist keine garantierte Herstellerkennlinie.`;

  const centralHeatingPowerKw = centralHeating.enabled ? centralHeating.powerKw : 0;
  const totalHeatGenerationPowerKw = totalWpThermalPowerKw + centralHeatingPowerKw;

  // 2. Tapping & Sanitary Demand (Sanitärbedarf 10 Bereiche à 5 Duschen + 5 Waschtische)
  const totalShowers = sanitary.showerAreasCount * sanitary.panelsPerArea; // 50
  const totalWashbasins = sanitary.showerAreasCount * sanitary.washbasinsPerArea; // 50

  const activeShowersCount = sanitary.activeShowersCount !== undefined
    ? Math.min(totalShowers, Math.max(0, sanitary.activeShowersCount))
    : Math.round((totalShowers * sanitary.showerSimultaneityPercent) / 100);

  const activeWashbasinsCount = sanitary.activeWashbasinsCount !== undefined
    ? Math.min(totalWashbasins, Math.max(0, sanitary.activeWashbasinsCount))
    : Math.round((totalWashbasins * sanitary.washbasinSimultaneityPercent) / 100);

  // Mischwasser-Volumenströme (l/min)
  const showerTotalMixedFlowLmin = activeShowersCount * sanitary.showerPanelFlowLmin;
  const washbasinTotalMixedFlowLmin = activeWashbasinsCount * sanitary.washbasinFlowLmin;
  const peakMixedWaterFlowLmin = showerTotalMixedFlowLmin + washbasinTotalMixedFlowLmin;

  // Warmwasseranteil (60°C) nach Mischungsformel: V_ww = V_mix * (T_mix - T_kalt) / (T_ww - T_kalt)
  // Mathematische Deckelung auf [0, 1] verhindert unplausible Werte bei versehentlicher Übertemperatur-Eingabe
  const deltaTWarmCold = Math.max(1, fws.hotWaterOutletTempC - fws.coldWaterInletTempC);
  
  const showerMixRatio = Math.min(1.0, Math.max(0.0, (sanitary.showerMixedTempC - fws.coldWaterInletTempC) / deltaTWarmCold));
  const washbasinMixRatio = Math.min(1.0, Math.max(0.0, (sanitary.washbasinMixedTempC - fws.coldWaterInletTempC) / deltaTWarmCold));

  const showerHotWaterLmin = showerTotalMixedFlowLmin * showerMixRatio;
  const washbasinHotWaterLmin = washbasinTotalMixedFlowLmin * washbasinMixRatio;
  const peakHotWaterFlowLmin = Math.round((showerHotWaterLmin + washbasinHotWaterLmin) * 10) / 10;
  const peakHotWaterFlowM3h = Math.round(((peakHotWaterFlowLmin * 60) / 1000) * 100) / 100;
  const coldWaterFlowLmin = Math.round(Math.max(0, peakMixedWaterFlowLmin - peakHotWaterFlowLmin) * 10) / 10;

  // Benötigte Spitzen-Wärmeleistung am FWS-Wärmeüberträger (kW)
  const peakThermalDemandKw =
    Math.round(peakHotWaterFlowLmin * 60 * SPECIFIC_HEAT_WATER_KWH_PER_L_K * deltaTWarmCold * 10) / 10;

  // 3. Frischwasserstationen (FWS) Kapazität & Auslastung
  // Vollständiger dokumentierter Hersteller-Nennbetriebspunkt nach Projektzusammenfassung_TWS.docx:
  // Danfoss TD-FLS 130 kW:
  // Primär: 70 °C Vorlauf, 25 °C Rücklauf
  // Sekundär: 10 °C Kaltwasserzulauf, 60 °C Warmwasseraustritt
  // Nur bei diesem exakten Temperaturprogramm (70/25 -> 10/60 °C) sind 130 kW bzw. 37,3 l/min je FWS belegt.
  const effectiveFwsCount = Math.min(fws.count, Math.max(0, fws.activeStations));
  const fwsNominalCapacityLmin = Math.round(effectiveFwsCount * fws.ratedCapacityPerStationLmin * 10) / 10;
  
  const isDocumentedNominalProgram =
    Math.abs(fws.primaryFlowTempC - 70.0) <= 0.5 &&
    Math.abs(fws.primaryReturnTempC - 25.0) <= 2.0 &&
    Math.abs(fws.coldWaterInletTempC - 10.0) <= 1.0 &&
    Math.abs(fws.hotWaterOutletTempC - 60.0) <= 0.5;

  const fwsTotalCapacityLmin = fwsNominalCapacityLmin;
  const fwsAvailableCapacityLmin = isDocumentedNominalProgram ? fwsNominalCapacityLmin : undefined;

  let fwsOperatingRating: 'NOMINAL_CONFIRMED_70C' | 'UNPROVEN_AT_65C_PRIMARY' | 'CRITICAL_UNDER_65C' = 'NOMINAL_CONFIRMED_70C';
  let fwsOperatingNotice = '';
  let fwsAvailableCapacityText = '';
  let fwsUtilizationStatusText = '';
  let fwsCapacityUtilizationPercent: number | undefined;

  if (isDocumentedNominalProgram) {
    fwsOperatingRating = 'NOMINAL_CONFIRMED_70C';
    fwsOperatingNotice = `Dokumentiertes Hersteller-Nennprogramm (Danfoss TD-FLS 130 kW: Primär 70/25°C → Sekundär 10/60°C): 130 kW thermisch bzw. 37,3 l/min je Station (${fwsNominalCapacityLmin.toFixed(1)} l/min Kaskade).`;
    fwsAvailableCapacityText = `${fwsNominalCapacityLmin.toFixed(1)} l/min (dokumentierter Nennpunkt 70/25→10/60°C)`;
    fwsCapacityUtilizationPercent =
      fwsNominalCapacityLmin > 0
        ? Math.round((peakHotWaterFlowLmin / fwsNominalCapacityLmin) * 100)
        : 0;
    fwsUtilizationStatusText = `${fwsCapacityUtilizationPercent}%`;
  } else if (fws.hotWaterOutletTempC > 60.5) {
    // Abweichendes Programm: z. B. Thermische Desinfektion (70°C TWW)
    fwsOperatingRating = 'UNPROVEN_AT_65C_PRIMARY';
    fwsOperatingNotice = `Modell-/Prüfpunkt (TWW ${fws.hotWaterOutletTempC}°C, z. B. Thermische Desinfektion): Die Nennleistung von 130 kW bzw. 37,3 l/min je TD-FLS ist ausschließlich für 70/25°C Primär → 10/60°C Sekundär dokumentiert. Bei ${fws.hotWaterOutletTempC}°C TWW ist die tatsächliche Übertragerleistung nicht herstellerbestätigt und darf nicht als bestätigte Nennleistung gewertet werden.`;
    fwsAvailableCapacityText = `Unbelegt bei ${fws.primaryFlowTempC}/${fws.primaryReturnTempC} → ${fws.coldWaterInletTempC}/${fws.hotWaterOutletTempC}°C (Modell-/Prüfpunkt)`;
    fwsCapacityUtilizationPercent = undefined;
    fwsUtilizationStatusText = `Auslastung bei ${fws.hotWaterOutletTempC}°C TWW nicht herstellerbestätigt`;
  } else if (fws.primaryFlowTempC < 64.0) {
    fwsOperatingRating = 'CRITICAL_UNDER_65C';
    fwsOperatingNotice = `Kritischer Vorlauf: Primär ${fws.primaryFlowTempC}°C reicht kaum aus, um ${fws.hotWaterOutletTempC}°C Warmwasser normgerecht zu garantieren (Pinch-Point-Unterschreitung möglich).`;
    fwsAvailableCapacityText = `Nicht ausreichend für ${fws.hotWaterOutletTempC}°C TWW`;
    fwsCapacityUtilizationPercent = undefined;
    fwsUtilizationStatusText = `Nicht belastbar / Untertemperatur`;
  } else {
    // Abweichendes Programm: z. B. 65°C Primär-VL oder abweichende Kaltwasser-/Rücklauftemperaturen
    fwsOperatingRating = 'UNPROVEN_AT_65C_PRIMARY';
    fwsOperatingNotice = `Abweichender Modell-/Prüfpunkt (${fws.primaryFlowTempC}/${fws.primaryReturnTempC} → ${fws.coldWaterInletTempC}/${fws.hotWaterOutletTempC}°C): Dokumentiert ist ausschließlich 70/25°C Primär → 10/60°C Sekundär (130 kW / 37,3 l/min). Die reale Leistung bei diesem Betriebspunkt ist herstellerseitig nicht nachgewiesen (Nachrechnung/Prüfung erforderlich).`;
    fwsAvailableCapacityText = `Unbelegt bei ${fws.primaryFlowTempC}/${fws.primaryReturnTempC} → ${fws.coldWaterInletTempC}/${fws.hotWaterOutletTempC}°C (Nennwert bei 70/25→10/60°C: ${fwsNominalCapacityLmin.toFixed(1)} l/min)`;
    fwsCapacityUtilizationPercent = undefined;
    fwsUtilizationStatusText = `Auslastung bei abweichendem Temperaturprogramm nicht belastbar berechenbar`;
  }

  // Dreistufige Bewertung der FWS-Kapazität (nachgewiesen ausreichend / nicht bewertbar / nachgewiesen nicht ausreichend):
  let fwsCapacityEvaluation: 'PROVEN_SUFFICIENT' | 'UNPROVEN_AT_OPERATING_POINT' | 'PROVEN_INSUFFICIENT';
  if (effectiveFwsCount === 0 && peakHotWaterFlowLmin > 0) {
    fwsCapacityEvaluation = 'PROVEN_INSUFFICIENT';
  } else if (fws.primaryFlowTempC <= fws.hotWaterOutletTempC) {
    fwsCapacityEvaluation = 'PROVEN_INSUFFICIENT';
  } else if (isDocumentedNominalProgram) {
    fwsCapacityEvaluation = peakHotWaterFlowLmin <= fwsNominalCapacityLmin
      ? 'PROVEN_SUFFICIENT'
      : 'PROVEN_INSUFFICIENT';
  } else {
    // Abweichendes Temperaturprogramm (z. B. 65°C Primär oder Desinfektion 70°C):
    // Liegt die Zapfung selbst über der maximalen 70/25->10/60-Nennleistung, ist die Station sicher unzureichend.
    if (peakHotWaterFlowLmin > fwsNominalCapacityLmin) {
      fwsCapacityEvaluation = 'PROVEN_INSUFFICIENT';
    } else {
      // Ansonsten rechnerisch unbestimmt, da Hersteller-Kennlinien für abweichende Programme nicht vorliegen.
      fwsCapacityEvaluation = 'UNPROVEN_AT_OPERATING_POINT';
    }
  }

  const fwsSufficient = fwsCapacityEvaluation === 'PROVEN_SUFFICIENT';
  const isHydraulicOverloaded = fwsCapacityEvaluation === 'PROVEN_INSUFFICIENT' && peakHotWaterFlowLmin > 0;

  // Erforderlicher Primär-Heizwasservolumenstrom (l/h)
  const primaryDeltaT = Math.max(2, fws.primaryFlowTempC - fws.primaryReturnTempC);
  const requiredPrimaryFlowLh =
    peakThermalDemandKw > 0
      ? (peakThermalDemandKw / (SPECIFIC_HEAT_WATER_KWH_PER_L_K * primaryDeltaT))
      : 0;

  // Reale Hydraulik: Primärrücklauf-Einspeisung über 3-Wege-Umschaltventil in Puffer 3 (Simulationsannahme)
  const fwsReturnValvePosition: 'BOTTOM_STRAT' | 'MID_STRAT' =
    fws.primaryReturnTempC < 30.0 ? 'BOTTOM_STRAT' : 'MID_STRAT';
  const fwsReturnValveReason =
    fws.primaryReturnTempC < 30.0
      ? `Simulationsannahme für mögliche Rücklaufeinschichtung: FWS-Rücklauf (${fws.primaryReturnTempC}°C < 30°C) rechnerisch in Tiefzone Puffer 3 geschichtet (in Bestandsunterlagen nicht als bestätigte Regelstrategie dokumentiert).`
      : `Simulationsannahme für mögliche Rücklaufeinschichtung: FWS-Rücklauf (${fws.primaryReturnTempC}°C ≥ 30°C) rechnerisch in Mittelzone Puffer 3 geschichtet (in Bestandsunterlagen nicht als bestätigte Regelstrategie dokumentiert).`;

  // 4. Speicher-Energetik (3 x 2000L = 6000L) - 3 Stufen
  const totalStorageVolumeLiters = buffer.count * buffer.volumePerTankLiters;
  
  let usableHotVolumeLiters = 0;
  let totalStoredEnergyKwh = 0;
  let storageCalculationModeLabel = '';
  let storageCalculationExplanation = '';

  const mode = buffer.storageCalcMode || 'manual_fraction';

  if (mode === 'fully_mixed') {
    // Stufe 1: Vollständig durchmischter Speicher (konservative physikalische Untergrenze)
    const avgTemp = (buffer.topTempC + buffer.bottomTempC) / 2;
    const deltaT = Math.max(0, avgTemp - buffer.minUsableTempC);
    usableHotVolumeLiters = deltaT > 0 ? totalStorageVolumeLiters : 0;
    totalStoredEnergyKwh = Math.round(usableHotVolumeLiters * SPECIFIC_HEAT_WATER_KWH_PER_L_K * deltaT * 10) / 10;
    storageCalculationModeLabel = 'Stufe 1: Vollständig durchmischter Speicher';
    storageCalculationExplanation = `Mitteltemperatur T_avg = ${avgTemp.toFixed(1)}°C über 6.000 L. Nutzbare Temperaturdifferenz über Mindesttemperatur (${buffer.minUsableTempC}°C): ${deltaT.toFixed(1)} K. Konservative Untergrenze ohne Schichtungseffekt.`;
  } else if (mode === 'multi_sensor') {
    // Stufe 3: Messbetrieb mit 3 Fühlerzonen (je 2.000 L)
    const deltaTop = Math.max(0, buffer.sensorTopTempC - buffer.minUsableTempC);
    const energyTop = 2000 * SPECIFIC_HEAT_WATER_KWH_PER_L_K * deltaTop;

    const deltaMid = Math.max(0, buffer.sensorMidTempC - buffer.minUsableTempC);
    const energyMid = 2000 * SPECIFIC_HEAT_WATER_KWH_PER_L_K * deltaMid;

    const deltaBottom = Math.max(0, buffer.sensorBottomTempC - buffer.minUsableTempC);
    const energyBottom = 2000 * SPECIFIC_HEAT_WATER_KWH_PER_L_K * deltaBottom;

    totalStoredEnergyKwh = Math.round((energyTop + energyMid + energyBottom) * 10) / 10;
    usableHotVolumeLiters =
      (deltaTop > 0 ? 2000 : 0) +
      (deltaMid > 0 ? 2000 : 0) +
      (deltaBottom > 0 ? 2000 : 0);
    storageCalculationModeLabel = 'Stufe 3: 3-Zonen-Näherung aus Fühlertemperaturen';
    storageCalculationExplanation = `Näherung aus 3 Fühlertemperaturen (Oben: ${buffer.sensorTopTempC}°C, Mitte: ${buffer.sensorMidTempC}°C, Unten: ${buffer.sensorBottomTempC}°C) für je 2.000 L Zonen. Die Temperaturen sind Messwerte; das Energieergebnis bleibt ein Berechnungsmodell.`;
  } else {
    // Stufe 2: Praxis - Eingegebener nutzbarer Heißwasseranteil (manual_fraction)
    const fraction = Math.max(0.1, Math.min(1.0, buffer.hotLayerFraction ?? 0.6));
    usableHotVolumeLiters = Math.round(totalStorageVolumeLiters * fraction);
    const deltaT = Math.max(0, buffer.topTempC - buffer.minUsableTempC);
    totalStoredEnergyKwh = Math.round(usableHotVolumeLiters * SPECIFIC_HEAT_WATER_KWH_PER_L_K * deltaT * 10) / 10;
    storageCalculationModeLabel = 'Stufe 2: Eingegebener Heißwasseranteil (Simulationsannahme)';
    storageCalculationExplanation = `${Math.round(fraction * 100)}% Heißwasserschicht (${usableHotVolumeLiters.toLocaleString('de-DE')} L) bei T_oben = ${buffer.topTempC}°C oberhalb Mindestnutztemperatur ${buffer.minUsableTempC}°C.`;
  }

  // Zwei Werte für den Praktiker:
  // 1. Gesamter thermischer Energieinhalt über Rücklauf (z. B. 28-30 °C)
  const storageThermalContentFullDeltaKwh = Math.round(
    totalStorageVolumeLiters * SPECIFIC_HEAT_WATER_KWH_PER_L_K * Math.max(0, buffer.topTempC - buffer.bottomTempC) * 10
  ) / 10;
  // 2. Unmittelbar für 60°C TWW nutzbare Exergie/Energie (Delta zu minUsableTemp)
  const storageImmediateUsableEnergyKwh = totalStoredEnergyKwh;

  // 5. Pinch-Point & Versorgbarkeit (ohne starres 4-K-Veto)
  let isThermalSupplyFeasible = true;
  let thermalMarginStatus: 'ADEQUATE' | 'CRITICAL_MARGIN' | 'INSUFFICIENT' = 'ADEQUATE';
  let thermalMarginNotice = '';
  let supplyInfeasibilityReason = '';

  const fwsPrimaryFlowTempC = fws.primaryFlowTempC ?? buffer.topTempC;
  const fwsPrimaryReturnTempC = fws.primaryReturnTempC ?? buffer.bottomTempC;
  const fwsPrimaryDeltaTK = Math.max(0, Math.round((fwsPrimaryFlowTempC - fwsPrimaryReturnTempC) * 10) / 10);

  const tempMargin = buffer.topTempC - fws.hotWaterOutletTempC;

  if (buffer.topTempC < fws.hotWaterOutletTempC) {
    isThermalSupplyFeasible = false;
    thermalMarginStatus = 'INSUFFICIENT';
    thermalMarginNotice = `Untertemperatur: Speicherkopf (${buffer.topTempC}°C) liegt unter der geforderten TWW-Solltemperatur (${fws.hotWaterOutletTempC}°C).`;
    supplyInfeasibilityReason = `Puffertemperatur oben (${buffer.topTempC}°C) ist geringer als geforderte Warmwassertemperatur (${fws.hotWaterOutletTempC}°C).`;
  } else if (tempMargin < 4.0) {
    isThermalSupplyFeasible = true;
    thermalMarginStatus = 'CRITICAL_MARGIN';
    thermalMarginNotice = `Kritischer Betriebsbereich: Grädigkeitsabstand Primär-VL zu TWW beträgt nur ${tempMargin.toFixed(1)} K (< 4 K). Reale TWW-Temperatur hängt von Primärvolumenstrom ab und muss herstellerseitig nachgewiesen werden.`;
  } else {
    isThermalSupplyFeasible = true;
    thermalMarginStatus = 'ADEQUATE';
    thermalMarginNotice = `Ausreichender Grädigkeitsabstand von ${tempMargin.toFixed(1)} K (Puffer ${buffer.topTempC}°C → TWW ${fws.hotWaterOutletTempC}°C).`;
  }

  if (effectiveFwsCount === 0 && peakHotWaterFlowLmin > 0) {
    isThermalSupplyFeasible = false;
    thermalMarginStatus = 'INSUFFICIENT';
    supplyInfeasibilityReason = 'Keine Frischwasserstation aktiv! Warmwasserversorgung unterbrochen.';
  } else if (fwsCapacityEvaluation === 'PROVEN_INSUFFICIENT' && peakHotWaterFlowLmin > 0) {
    isThermalSupplyFeasible = false;
    thermalMarginStatus = 'INSUFFICIENT';
    supplyInfeasibilityReason = `FWS-Überlastung: Spitzen-Warmwasserbedarf (${peakHotWaterFlowLmin} l/min) übersteigt die Nennleistung der ${effectiveFwsCount} aktiven FWS (${fwsTotalCapacityLmin.toFixed(1)} l/min). Keine reguläre 60°C TWW-Versorgung möglich.`;
  }

  // Gesamter thermischer Energieinhalt bezogen auf Kaltwasser (10°C)
  const fullDeltaT = Math.max(0, buffer.topTempC - fws.coldWaterInletTempC);
  const storedEnergyFullDeltaKwh =
    Math.round(totalStorageVolumeLiters * SPECIFIC_HEAT_WATER_KWH_PER_L_K * fullDeltaT * 10) / 10;

  // Ladezustand in % konsistent zum gewählten Speichermodell:
  // 1. Nutzbarer Heißvolumen-Anteil des Modells:
  const storageEffectiveLayerFractionPercent = Math.round(
    (usableHotVolumeLiters / totalStorageVolumeLiters) * 100
  );

  // 2. Temperaturzustand der Heißzone bezogen auf das Sollziel (z. B. 65°C Soll über 60°C Mindestnutztemp):
  const maxPossibleDeltaT = Math.max(1, buffer.targetChargingTempC - buffer.minUsableTempC);
  const currentHotLayerDeltaT = Math.max(0, buffer.topTempC - buffer.minUsableTempC);
  const storageTemperatureChargePercent = Math.min(
    100,
    Math.max(0, Math.round((currentHotLayerDeltaT / maxPossibleDeltaT) * 100))
  );

  // 3. Maximal nutzbare Energie innerhalb des gewählten Modellvolumens bei Solltemperatur:
  const modelMaxUsableEnergyKwh =
    usableHotVolumeLiters * SPECIFIC_HEAT_WATER_KWH_PER_L_K * maxPossibleDeltaT;

  // 4. Modellabhängiger Ladezustand (SoC) des definierten Heißbereichs:
  const storageStateOfChargePercent =
    modelMaxUsableEnergyKwh > 0
      ? Math.min(100, Math.max(0, Math.round((totalStoredEnergyKwh / modelMaxUsableEnergyKwh) * 100)))
      : 0;

  // Wiederaufheizzeit des Speichers von minUsableTemp auf targetChargingTemp (Stunden)
  const storageReheatEnergyNeededKwh =
    totalStorageVolumeLiters * SPECIFIC_HEAT_WATER_KWH_PER_L_K * maxPossibleDeltaT;
  const storageReheatTimeHours =
    totalHeatGenerationPowerKw > 0
      ? Math.round((storageReheatEnergyNeededKwh / totalHeatGenerationPowerKw) * 10) / 10
      : 99.9;

  // 5. Zirkulation & Verluste nach DVGW W 551 / DIN 1988-200
  // Die Zirkulations-Vorlauftemperatur entspricht physikalisch dem TWW-Austritt der FWS-Kaskade
  const circFlowTempC = fws.hotWaterOutletTempC;
  const circReturnTempC = circulation.returnTempC;
  const isCirculationReturnPlausible = circReturnTempC <= circFlowTempC;

  const circulationLossKw = circulation.enabled
    ? (circulation.pipeLengthMeters * (circulation.specificLossWpm ?? 12.0)) / 1000
    : 0;

  // Spreizung Delta T = Vorlauf - Rücklauf (bei physikalisch normaler Abkühlung positiv)
  const circulationTempDropK = Math.round((circFlowTempC - circReturnTempC) * 10) / 10;

  // Erforderlicher Zirkulations-Mindestvolumenstrom für maximal 5K Spreizung:
  // V_zirk = Q_loss / (c * DeltaT_max = 5K)
  const circulationPumpMinFlowLh =
    circulation.enabled && circulationLossKw > 0
      ? Math.round(circulationLossKw / (SPECIFIC_HEAT_WATER_KWH_PER_L_K * 5))
      : 0;
  const circulationPumpAdequate =
    !circulation.enabled || circulation.pumpFlowRateLh >= circulationPumpMinFlowLh;

  // 6. Versorgungsdauer & Autonomie (mit physikalischem Veto)
  const totalDischargeLoadKw = peakThermalDemandKw + circulationLossKw;

  let autonomyStorageOnlyMinutes = 0;
  let autonomyWithGenerationMinutes = 0;

  if (!isThermalSupplyFeasible) {
    // VETO: Wenn die Solltemperatur physikalisch gar nicht erreicht werden kann oder FWS überlastet ist,
    // beträgt die normgerechte Versorgungsdauer exakt 0 Minuten!
    autonomyStorageOnlyMinutes = 0;
    autonomyWithGenerationMinutes = 0;
  } else if (totalDischargeLoadKw > 0) {
    autonomyStorageOnlyMinutes = Math.round(
      (totalStoredEnergyKwh / totalDischargeLoadKw) * 60
    );
    const netDeficitKw = totalDischargeLoadKw - totalHeatGenerationPowerKw;
    if (netDeficitKw <= 0) {
      autonomyWithGenerationMinutes = 999; // Dauerbetrieb
    } else {
      autonomyWithGenerationMinutes = Math.round(
        (totalStoredEnergyKwh / netDeficitKw) * 60
      );
    }
  } else {
    autonomyStorageOnlyMinutes = 999;
    autonomyWithGenerationMinutes = 999;
  }

  const continuousFlowCoveragePercent =
    totalDischargeLoadKw > 0
      ? Math.min(100, Math.round((totalHeatGenerationPowerKw / totalDischargeLoadKw) * 100))
      : 100;

  // 7. Netto-Leistungsbilanz & Betriebszustands-Klassifizierung
  const netPowerBalanceKw = Math.round((totalHeatGenerationPowerKw - totalDischargeLoadKw) * 10) / 10;

  let operatingStateKey: 'DISCHARGING_FAST' | 'DISCHARGING_SLOW' | 'BALANCED' | 'CHARGING' | 'STANDBY_CIRCULATION' = 'BALANCED';
  let operatingStateTitle = 'Gleichgewichtszustand (Dauerbetrieb)';
  let operatingStateDescription = 'Wärmeerzeugung und Entnahme halten sich die Waage. Speichertemperatur bleibt stabil.';

  if (!isThermalSupplyFeasible) {
    operatingStateKey = 'DISCHARGING_FAST';
    operatingStateTitle = 'Versorgungsabbruch / Untertemperatur';
    operatingStateDescription = supplyInfeasibilityReason;
  } else if (peakHotWaterFlowLmin === 0) {
    operatingStateKey = 'STANDBY_CIRCULATION';
    operatingStateTitle = 'Bereitschaft & Zirkulationserhaltung';
    operatingStateDescription = 'Keine Dusch- oder Waschtischentnahme aktiv. Wärmeerzeugung deckt ausschließlich die Zirkulationsverluste und hält die 60°C/55°C Hygienezustände.';
  } else if (netPowerBalanceKw >= 15) {
    operatingStateKey = 'CHARGING';
    operatingStateTitle = 'Speicher-Ladebetrieb / Rekuperation (+ Überschuss)';
    operatingStateDescription = `Erzeuger speisen ${netPowerBalanceKw} kW mehr ein als aktuell entnommen wird. Die 6.000 L Puffer werden aktiv von oben nach unten geladen.`;
  } else if (netPowerBalanceKw <= -45) {
    operatingStateKey = 'DISCHARGING_FAST';
    operatingStateTitle = 'Starke Speicherentladung (Spitzenlast Duschbetrieb)';
    operatingStateDescription = `Massiver Entzug übersteigt die Erzeugung um ${Math.abs(netPowerBalanceKw)} kW. Die 6.000 L Pufferreserve fängt die Lastspitze ab.`;
  } else if (netPowerBalanceKw < -5) {
    operatingStateKey = 'DISCHARGING_SLOW';
    operatingStateTitle = 'Mäßige Speicherentladung (Teillast)';
    operatingStateDescription = `Geringe Unterdeckung von ${Math.abs(netPowerBalanceKw)} kW. Die Puffer decken die Unterdeckung rechnerisch für ca. ${autonomyWithGenerationMinutes > 500 ? 'mehrere Stunden' : `${autonomyWithGenerationMinutes} Minuten`}.`;
  }

  // 8. Spezifische Duschgang-Wassermengen & Nachladezeiten
  const showerSessionTotalMixedLiters = Math.round(
    activeShowersCount * sanitary.showerPanelFlowLmin * sanitary.showerDurationMinutes
  );
  const showerSessionTotalHot60Liters = Math.round(
    showerHotWaterLmin * sanitary.showerDurationMinutes
  );
  const showerSessionEnergyKwh = Math.round(
    (showerSessionTotalHot60Liters * SPECIFIC_HEAT_WATER_KWH_PER_L_K * deltaTWarmCold) * 10
  ) / 10;

  // Dynamisch berechnete Energie für 1 Einzeldusche:
  // E = V_punkt_Misch * t_dusch * c * (T_misch - T_kalt) / 1000
  const singleShowerEnergyKwh = Math.round(
    (sanitary.showerPanelFlowLmin * sanitary.showerDurationMinutes * SPECIFIC_HEAT_WATER_KWH_PER_L_K * Math.max(0, sanitary.showerMixedTempC - fws.coldWaterInletTempC)) * 1000
  ) / 1000;

  // Wiederaufladezeiten für genau diese entnommene Duschgang-Energie:
  // Feste Referenzwerte bei voller Nennleistung aller Komponenten:
  const nominal3WpPowerKw = 120.0; // 3x Mitsubishi QAHV à 40 kW Nennleistung
  const nominalWtPowerKw = 136.0;  // 136 kW Plattenwärmetauscher Nennleistung
  const nominalCombinedPowerKw = nominal3WpPowerKw + nominalWtPowerKw; // 256 kW

  const showerSessionRechargeTimeNominal3WpMinutes =
    Math.round((showerSessionEnergyKwh / nominal3WpPowerKw) * 60 * 10) / 10;
  const showerSessionRechargeTimeNominalWtMinutes =
    Math.round((showerSessionEnergyKwh / nominalWtPowerKw) * 60 * 10) / 10;
  const showerSessionRechargeTimeNominalCombinedMinutes =
    Math.round((showerSessionEnergyKwh / nominalCombinedPowerKw) * 60 * 10) / 10;

  // Dynamische Zeiten basierend auf aktuell tatsächlich aktiven Erzeugern (ohne fiktive Ersatzleistung):
  const activeWtPowerKw = centralHeating.enabled ? centralHeating.powerKw : 0;

  const showerSessionRechargeTimeWpMinutes =
    totalWpThermalPowerKw > 0
      ? Math.round((showerSessionEnergyKwh / totalWpThermalPowerKw) * 60 * 10) / 10
      : undefined;

  const showerSessionRechargeTimeWtMinutes =
    activeWtPowerKw > 0
      ? Math.round((showerSessionEnergyKwh / activeWtPowerKw) * 60 * 10) / 10
      : undefined;

  const totalActiveGenPowerKw = totalWpThermalPowerKw + activeWtPowerKw;
  const showerSessionRechargeTimeCombinedMinutes =
    totalActiveGenPowerKw > 0
      ? Math.round((showerSessionEnergyKwh / totalActiveGenPowerKw) * 60 * 10) / 10
      : undefined;

  // Ladedauern Gesamtspeicher (6.000 L von minUsableTemp auf Soll 65°C):
  const fullStorageRechargeHoursNominal3Wp =
    Math.round((storageReheatEnergyNeededKwh / nominal3WpPowerKw) * 10) / 10;
  const fullStorageRechargeHoursNominalWt =
    Math.round((storageReheatEnergyNeededKwh / nominalWtPowerKw) * 10) / 10;
  const fullStorageRechargeHoursNominalCombined =
    Math.round((storageReheatEnergyNeededKwh / nominalCombinedPowerKw) * 10) / 10;

  const fullStorageRechargeHoursWp =
    totalWpThermalPowerKw > 0
      ? Math.round((storageReheatEnergyNeededKwh / totalWpThermalPowerKw) * 10) / 10
      : undefined;
  const fullStorageRechargeHoursWt =
    activeWtPowerKw > 0
      ? Math.round((storageReheatEnergyNeededKwh / activeWtPowerKw) * 10) / 10
      : undefined;
  const fullStorageRechargeHoursCombined =
    totalActiveGenPowerKw > 0
      ? Math.round((storageReheatEnergyNeededKwh / totalActiveGenPowerKw) * 10) / 10
      : undefined;

  // 9. Normen- und Hygiene-Prüfungen
  const isDisinfectionMode = fws.hotWaterOutletTempC >= 68.0;
  const w551OutletTarget = isDisinfectionMode ? 70.0 : 60.0;
  const w551ReturnTarget = isDisinfectionMode ? 65.0 : 55.0;

  const w551OutletStatus =
    fws.hotWaterOutletTempC >= w551OutletTarget
      ? 'OK'
      : fws.hotWaterOutletTempC >= w551OutletTarget - 2.0
      ? 'WARNING'
      : 'ERROR';

  // Rücklauftemperatur-Prüfung:
  // VETO: Liegt der Rücklauf ÜBER dem Vorlauf, ist das physikalisch unmöglich (Mess- oder Parametrierungsfehler)
  let w551ReturnStatus: 'OK' | 'WARNING' | 'ERROR' = 'OK';
  let w551ReturnDescription = '';

  if (!isCirculationReturnPlausible) {
    w551ReturnStatus = 'ERROR';
    w551ReturnDescription = `Physikalisch unplausibel: Zirkulationsrücklauf (${circReturnTempC.toFixed(1)}°C) liegt über der Vorlauftemperatur (${circFlowTempC.toFixed(1)}°C) am Erzeugeraustritt!`;
  } else if (circReturnTempC >= w551ReturnTarget) {
    w551ReturnStatus = 'OK';
    w551ReturnDescription = isDisinfectionMode
      ? `Zirkulations-Rücklauftemperatur (${circReturnTempC.toFixed(1)}°C) erfüllt die Vorgabe für thermische Desinfektion (≥ 65°C bei 70°C Vorlauf).`
      : `Zirkulations-Rücklauftemperatur (${circReturnTempC.toFixed(1)}°C) erfüllt die DVGW-Mindestvorgabe (≥ 55°C im gesamten System).`;
  } else if (circReturnTempC >= w551ReturnTarget - 2.0) {
    w551ReturnStatus = 'WARNING';
    w551ReturnDescription = `Grenzbereich: Zirkulationsrücklauf (${circReturnTempC.toFixed(1)}°C) liegt knapp unter dem Sollwert (≥ ${w551ReturnTarget.toFixed(1)}°C).`;
  } else {
    w551ReturnStatus = 'ERROR';
    w551ReturnDescription = `Hygienerisiko: Zirkulationsrücklauf (${circReturnTempC.toFixed(1)}°C) unterschreitet den Sollwert (≥ ${w551ReturnTarget.toFixed(1)}°C) deutlich!`;
  }

  // Temperaturspreizung Delta T <= 5 K:
  let w551DropStatus: 'OK' | 'WARNING' | 'ERROR' = 'OK';
  let w551DropDescription = '';

  if (!isCirculationReturnPlausible || circulationTempDropK < 0) {
    w551DropStatus = 'ERROR';
    w551DropDescription = `Physikalisch unplausible Spreizung (${circulationTempDropK.toFixed(1)} K): Das Wasser erwärmt sich scheinbar im Leitungsnetz (${circFlowTempC.toFixed(1)}°C VL → ${circReturnTempC.toFixed(1)}°C RL).`;
  } else if (circulationTempDropK <= 5.0) {
    w551DropStatus = 'OK';
    w551DropDescription = `Temperaturabfall (${circulationTempDropK.toFixed(1)} K) hält die normative Obergrenze von maximal 5 K nach DVGW W 551 ein.`;
  } else if (circulationTempDropK <= 6.5) {
    w551DropStatus = 'WARNING';
    w551DropDescription = `Erhöhter Wärmeverlust: Spreizung (${circulationTempDropK.toFixed(1)} K) überschreitet 5 K geringfügig. Pumpenvolumenstrom oder Dämmung prüfen.`;
  } else {
    w551DropStatus = 'ERROR';
    w551DropDescription = `Unzulässige Spreizung (${circulationTempDropK.toFixed(1)} K > 5 K): Zu hoher Leitungsverlust oder zu geringer Zirkulationsvolumenstrom!`;
  }

  const threeLiterRuleStatus =
    circulation.maxTapDistancePipeVolumeLitres <= 3.0
      ? 'OK'
      : 'WARNING';

  const fwsCapStatus =
    fwsCapacityEvaluation === 'UNPROVEN_AT_OPERATING_POINT'
      ? 'WARNING'
      : fwsCapacityEvaluation === 'PROVEN_SUFFICIENT'
      ? 'OK'
      : 'ERROR';

  const bufferDimStatus =
    !isThermalSupplyFeasible
      ? 'ERROR'
      : autonomyStorageOnlyMinutes >= 15
      ? 'OK'
      : autonomyStorageOnlyMinutes >= 8
      ? 'WARNING'
      : 'ERROR';

  const normCompliance = {
    w551OutletTemp: {
      status: w551OutletStatus as 'OK' | 'WARNING' | 'ERROR',
      actual: fws.hotWaterOutletTempC,
      target: w551OutletTarget,
      rule: isDisinfectionMode ? 'DVGW W 551 Abs. 6.4 (Desinfektion)' : 'DVGW W 551 / DIN 1988-200 Abs. 6.2',
      description: isDisinfectionMode
        ? 'Thermische Desinfektion: WW-Austrittstemperatur am Erzeuger muss mindestens 70°C betragen.'
        : 'Warmwasser-Austrittstemperatur am Erzeuger muss mindestens 60°C betragen (Großanlage).',
    },
    w551ReturnTemp: {
      status: w551ReturnStatus as 'OK' | 'WARNING' | 'ERROR',
      actual: circReturnTempC,
      target: w551ReturnTarget,
      rule: isDisinfectionMode ? 'DVGW W 551 Abs. 6.4 (Desinfektion)' : 'DVGW W 551 Abs. 6.3.1',
      description: w551ReturnDescription,
    },
    w551TempDrop: {
      status: w551DropStatus as 'OK' | 'WARNING' | 'ERROR',
      actual: circulationTempDropK,
      maxAllowed: 5.0,
      rule: 'DVGW W 551 & DIN 1988-200',
      description: w551DropDescription,
    },
    threeLiterRule: {
      status: threeLiterRuleStatus as 'OK' | 'WARNING' | 'ERROR',
      actualVolumeL: circulation.maxTapDistancePipeVolumeLitres,
      thresholdL: 3.0,
      rule: 'DVGW W 551 "3-Liter-Regel"',
      description: 'Leitungsvolumen zwischen Zirkulation und entfernter Zapfstelle darf 3 Liter nicht überschreiten.',
    },
    fwsCapacityCheck: {
      status: fwsCapStatus as 'OK' | 'WARNING' | 'ERROR',
      utilization: fwsCapacityUtilizationPercent ?? 0,
      rule: 'DIN 1988-300 / DIN EN 806 Spitzenlast',
      description: fwsCapacityEvaluation === 'UNPROVEN_AT_OPERATING_POINT'
        ? `Hersteller-Leistungsdaten bei aktuellem Programm (${fws.primaryFlowTempC}/${fws.primaryReturnTempC} → ${fws.coldWaterInletTempC}/${fws.hotWaterOutletTempC}°C) nicht belegt (Modell-/Prüfpunkt). Nennwert bei 70/25→10/60°C: ${fwsNominalCapacityLmin.toFixed(1)} l/min.`
        : `Spitzendurchfluss: ${peakHotWaterFlowLmin} l/min bei ${fwsTotalCapacityLmin.toFixed(1)} l/min Gesamtkapazität (${effectiveFwsCount} FWS).`,
    },
    bufferDimensioningCheck: {
      status: bufferDimStatus as 'OK' | 'WARNING' | 'ERROR',
      storedMinutes: autonomyStorageOnlyMinutes,
      rule: 'Betriebliche Plausibilitätsbewertung (angelehnt an DIN 4708)',
      description: isThermalSupplyFeasible
        ? 'Betriebliche Richtwerte zur Spitzenabdeckung: Heißschicht ≥ 15 min gilt als unkritisch, 8–15 min als betrieblich eng. (Hinweis: Dies ist eine praxisbezogene Plausibilitätsbewertung, keine formal dokumentierte DIN-4708-Auslegungsanforderung der Bestandsunterlagen).'
        : supplyInfeasibilityReason,
    },
    vdi6023Stagnation: {
      status: 'INFO' as const,
      rule: 'VDI/DVGW 6023 Hygiene in Trinkwasser-Installationen',
      description: 'Nachweispflicht: Wasserwechsel alle 72 Stunden an allen Entnahmestellen muss vor Ort dokumentiert sein.',
    },
  };

  // Gesamtbewertung (qualitativ: OK = unauffällig, WARNING = Hinweise vorhanden, ERROR = Prüfung erforderlich)
  const errorCount = Object.values(normCompliance).filter((item) => item.status === 'ERROR').length;
  const warningCount = Object.values(normCompliance).filter((item) => item.status === 'WARNING').length;

  let overallStatus: 'OK' | 'WARNING' | 'ERROR' = 'OK';
  if (errorCount > 0 || !isThermalSupplyFeasible) {
    overallStatus = 'ERROR';
  } else if (warningCount > 0) {
    overallStatus = 'WARNING';
  }

  // 10. Detaillierte COP- und Effizienzanalyse für Monteure
  const enabledWps = heatPumps.filter((w) => w.enabled);
  const avgSourceTempC =
    enabledWps.length > 0
      ? Math.round((enabledWps.reduce((acc, w) => acc + w.sourceTempC, 0) / enabledWps.length) * 10) / 10
      : 7.0;
  const avgFlowTempC =
    enabledWps.length > 0
      ? Math.round((enabledWps.reduce((acc, w) => acc + w.flowTempC, 0) / enabledWps.length) * 10) / 10
      : buffer.topTempC;
  const bufferBottomTempC = buffer.bottomTempC;

  const tempLiftK = Math.max(1, Math.round((avgFlowTempC - avgSourceTempC) * 10) / 10);

  // Carnot COP: T_hot / (T_hot - T_cold) in Kelvin
  const tHotK = avgFlowTempC + 273.15;
  const tColdK = avgSourceTempC + 273.15;
  const carnotCop = Math.round((tHotK / Math.max(1, tHotK - tColdK)) * 100) / 100;
  const carnotEfficiencyPercent =
    carnotCop > 0 ? Math.round((systemCop / carnotCop) * 1000) / 10 : 45;

  let efficiencyStatus: 'OPTIMAL' | 'GOOD' | 'FAIR' | 'CRITICAL' = 'OPTIMAL';
  let efficiencyLabel = 'Optimaler Effizienzbereich';
  let efficiencyBadgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-300';
  let efficiencyDescription = '';

  if (isQahvDocumentedPoint) {
    efficiencyStatus = 'OPTIMAL';
    efficiencyLabel = 'Dokumentierter Typenschildpunkt (COP 3,65)';
    efficiencyBadgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-300';
    efficiencyDescription =
      'Dokumentierter Typenschild-Referenzpunkt Mitsubishi QAHV-N560YA-HPB: A7/W9→65°C (40,0 kW th, 10,97 kW el, COP 3,65). Dieser Betriebspunkt ist durch das Hersteller-Datenblatt belegt.';
  } else if (systemCop >= 3.3) {
    efficiencyStatus = 'OPTIMAL';
    efficiencyLabel = 'Optimaler Bereich (Modell-COP)';
    efficiencyBadgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-300';
    efficiencyDescription = `Berechneter Modell-COP (${systemCop} bei ΔT ${tempLiftK} K Hub, ${bufferBottomTempC}°C Eintritt). Außerhalb des dokumentierten Referenzpunktes (A7/W9→65°C: COP 3,65) handelt es sich um eine thermodynamische Modellschätzung.`;
  } else if (systemCop >= 2.8) {
    efficiencyStatus = 'GOOD';
    efficiencyLabel = 'Standardbereich (Modell-COP)';
    efficiencyBadgeClass = 'bg-blue-100 text-blue-800 border-blue-300';
    efficiencyDescription = `Berechneter Modell-COP (${systemCop}) für Hochtemperatur-TWW-Bereitung. Außerhalb von A7/W9→65°C handelt es sich um eine thermodynamische Näherung; Abgleich mit Datenblatt erforderlich.`;
  } else if (systemCop >= 2.3) {
    efficiencyStatus = 'FAIR';
    efficiencyLabel = 'Erhöhter Strombedarf (Modell-COP)';
    efficiencyBadgeClass = 'bg-amber-100 text-amber-800 border-amber-300';
    efficiencyDescription = `Großer Temperaturhub (ΔT = ${tempLiftK} K) oder erhöhte Pufferrücklauftemperatur (${bufferBottomTempC}°C vs. 9°C Referenz). Berechneter Modell-COP ${systemCop}; erhöhter elektrischer Leistungsbedarf.`;
  } else {
    efficiencyStatus = 'CRITICAL';
    efficiencyLabel = 'Niedriger Effizienzbereich (Modell-COP)';
    efficiencyBadgeClass = 'bg-rose-100 text-rose-800 border-rose-300';
    efficiencyDescription = `Sehr großer Temperaturhub oder ungünstige Quellentemperatur (Modell-COP < 2,3). Vergleich mit Zentralheizung hinsichtlich verfügbarer Leistung und Wärmekosten prüfen.`;
  }

  const monteurTips: string[] = [];
  if (isQahvDocumentedPoint) {
    monteurTips.push(
      'Dokumentierter Betriebspunkt A7/W9→65°C aktiv: Die Leistungsdaten (40,0 kW th, 10,97 kW el, COP 3,65) entsprechen exakt den Mitsubishi-Herstellerunterlagen.'
    );
  }
  if (buffer.bottomTempC > 30) {
    monteurTips.push(
      `Pufferrücklauf liegt bei ${buffer.bottomTempC}°C (Soll: ≤ 30°C). Simulationsannahme: Mögliche Rücklaufeinschichtung in Puffer-Mitte prüfen (in Bestandsunterlagen noch nicht bestätigt).`
    );
  } else {
    monteurTips.push(
      `Kühle Puffer-Rücklauftemperatur (${buffer.bottomTempC}°C, Ziel: ≤ 30°C) begünstigt einen effizienten Betrieb des transkritischen CO2-Gaskühlungsprozesses bei niedriger Wassereintrittstemperatur.`
    );
  }
  if (avgSourceTempC < 4) {
    monteurTips.push(
      `Niedrige Quellentemperatur (${avgSourceTempC}°C): Vergleich mit Zentralheizung hinsichtlich verfügbarer Leistung und Wärmekosten prüfen.`
    );
  }
  monteurTips.push(
    `Temperaturhub: ΔT ${tempLiftK} K (${avgSourceTempC}°C Quelle → ${avgFlowTempC}°C Vorlauf). Berechneter Carnot-Gütegrad: ca. ${carnotEfficiencyPercent}%.`
  );

  const sourceTestPoints = [-10, -5, 0, 2, 5, 7, 10, 15, 20];
  const sourceTempCurve = sourceTestPoints.map((t) => {
    const pointCop = calculateDynamicCop(t, avgFlowTempC, bufferBottomTempC);
    const isCurrent = Math.abs(t - avgSourceTempC) < 1.5;
    return {
      sourceTemp: t,
      cop: pointCop,
      isCurrent,
      label: `${t}°C`,
    };
  });

  const flowTestPoints = [45, 50, 55, 60, 65, 70];
  const flowTempCurve = flowTestPoints.map((t) => {
    const pointCop = calculateDynamicCop(avgSourceTempC, t, bufferBottomTempC);
    const isCurrent = Math.abs(t - avgFlowTempC) < 2.5;
    return {
      flowTemp: t,
      cop: pointCop,
      isCurrent,
      label: `${t}°C`,
    };
  });

  const waterMeterDeltaM3 =
    fws.waterMeterReadingM3 !== undefined && fws.waterMeterLastReadingM3 !== undefined
      ? Math.max(0, Math.round((fws.waterMeterReadingM3 - fws.waterMeterLastReadingM3) * 100) / 100)
      : undefined;

  const waterMeterThermalEnergyKwh =
    waterMeterDeltaM3 !== undefined
      ? Math.round(waterMeterDeltaM3 * 1000 * SPECIFIC_HEAT_WATER_KWH_PER_L_K * deltaTWarmCold * 10) / 10
      : undefined;

  const waterMeterEnergyNote =
    'Rechnerische Wärmeenergie aus gemessenem Trinkwasservolumen (Annahme Erwärmung 10 → 60 °C, Delta T = 50 K). Kein geeichter Wärmemengenzähler (WMZ).';

  const copAnalysis: CopAnalysis = {
    systemCop,
    nominalCop: 3.65, // Mitsubishi QAHV Referenzwert A7/W9->65°C
    avgSourceTempC,
    avgFlowTempC,
    bufferBottomTempC,
    tempLiftK,
    carnotCop,
    carnotEfficiencyPercent,
    efficiencyStatus,
    efficiencyLabel,
    efficiencyBadgeClass,
    efficiencyDescription,
    isDocumentedReferencePoint: isQahvDocumentedPoint,
    copTypeLabel: isQahvDocumentedPoint ? 'Dokumentierter COP' : 'Modell-COP',
    monteurTips,
    sourceTempCurve,
    flowTempCurve,
  };

  return {
    totalWpThermalPowerKw,
    totalWpElectricalPowerKw,
    systemCop,
    centralHeatingPowerKw,
    totalHeatGenerationPowerKw,
    totalStorageVolumeLiters,
    totalStoredEnergyKwh,
    storageImmediateUsableEnergyKwh,
    storageThermalContentFullDeltaKwh,
    storedEnergyFullDeltaKwh,
    storageStateOfChargePercent,
    storageTemperatureChargePercent,
    storageEffectiveLayerFractionPercent,
    storageReheatTimeHours,
    singleShowerEnergyKwh,
    activeShowersCount,
    activeWashbasinsCount,
    peakMixedWaterFlowLmin: Math.round(peakMixedWaterFlowLmin * 10) / 10,
    peakHotWaterFlowLmin: Math.round(peakHotWaterFlowLmin * 10) / 10,
    peakHotWaterFlowM3h: Math.round(peakHotWaterFlowM3h * 100) / 100,
    peakThermalDemandKw: Math.round(peakThermalDemandKw * 10) / 10,
    coldWaterFlowLmin,
    fwsTotalCapacityLmin: Math.round(fwsTotalCapacityLmin * 10) / 10,
    fwsNominalCapacityLmin,
    fwsAvailableCapacityLmin,
    fwsAvailableCapacityText,
    fwsCapacityUtilizationPercent,
    fwsUtilizationStatusText,
    fwsSufficient,
    fwsCapacityEvaluation,
    fwsOperatingRating,
    fwsOperatingNotice,
    requiredPrimaryFlowLh: Math.round(requiredPrimaryFlowLh),
    autonomyStorageOnlyMinutes,
    autonomyWithGenerationMinutes,
    continuousFlowCoveragePercent,
    isThermalSupplyFeasible,
    thermalMarginStatus,
    thermalMarginNotice,
    supplyInfeasibilityReason,
    isHydraulicOverloaded,
    fwsReturnValvePosition,
    fwsReturnValveReason,
    storageCalculationModeLabel,
    storageCalculationExplanation,
    waterMeterDeltaM3,
    waterMeterThermalEnergyKwh,
    waterMeterEnergyNote,
    isQahvDocumentedPoint,
    qahvCopReferenceText,
    netPowerBalanceKw,
    operatingStateKey,
    operatingStateTitle,
    operatingStateDescription,
    showerSessionTotalMixedLiters,
    showerSessionTotalHot60Liters,
    showerSessionEnergyKwh,
    showerSessionRechargeTimeWpMinutes,
    showerSessionRechargeTimeNominal3WpMinutes,
    showerSessionRechargeTimeWtMinutes,
    showerSessionRechargeTimeNominalWtMinutes,
    showerSessionRechargeTimeCombinedMinutes,
    showerSessionRechargeTimeNominalCombinedMinutes,
    fullStorageRechargeHoursWp,
    fullStorageRechargeHoursNominal3Wp,
    fullStorageRechargeHoursWt,
    fullStorageRechargeHoursNominalWt,
    fullStorageRechargeHoursCombined,
    fullStorageRechargeHoursNominalCombined,
    circFlowTempC,
    circReturnTempC,
    circulationLossKw: Math.round(circulationLossKw * 100) / 100,
    circulationTempDropK,
    circulationPumpMinFlowLh,
    circulationPumpAdequate,
    isCirculationReturnPlausible,
    fwsPrimaryFlowTempC,
    fwsPrimaryReturnTempC,
    fwsPrimaryDeltaTK,
    copAnalysis,
    normCompliance,
    overallStatus,
  };
}

export const DEFAULT_HEAT_PUMPS: HeatPumpConfig[] = [
  {
    id: 'wp-1',
    name: 'Mitsubishi QAHV-N560YA-HPB (WP 1 - Grundlast)',
    enabled: true,
    thermalPowerKw: 40.0, // Typenschild A7/W9->65: 40.0 kW thermisch
    electricalPowerKw: 10.97, // Typenschild: 10.97 kW elektrisch (COP 3.65)
    sourceTempC: 7.0,
    flowTempC: 65.0,
  },
  {
    id: 'wp-2',
    name: 'Mitsubishi QAHV-N560YA-HPB (WP 2 - Mittellast)',
    enabled: true,
    thermalPowerKw: 40.0,
    electricalPowerKw: 10.97,
    sourceTempC: 7.0,
    flowTempC: 65.0,
  },
  {
    id: 'wp-3',
    name: 'Mitsubishi QAHV-N560YA-HPB (WP 3 - Spitzenlast)',
    enabled: true,
    thermalPowerKw: 40.0,
    electricalPowerKw: 10.97,
    sourceTempC: 7.0,
    flowTempC: 65.0,
  },
];

export const DEFAULT_CENTRAL_HEATING: CentralHeatingConfig = {
  enabled: true,
  powerKw: 136.0, // 136 kW Plattenwärmetauscher zur alternativen oder zusätzlichen Pufferladung
  flowTempC: 70.0, // Planwert 70°C (nicht 75°C)
  returnTempC: 55.0, // Planwert 55°C (nicht 50°C)
  flowRateM3h: 7.8, // Planwert 7,8 m³/h
  nominalPipe: 'DN40', // Planwert DN40
};

export const DEFAULT_BUFFER_STORAGE: BufferStorageConfig = {
  count: 3,
  volumePerTankLiters: 2000,
  totalVolumeLiters: 6000,
  topTempC: 65.0,
  bottomTempC: 30.0,
  targetChargingTempC: 65.0,
  minUsableTempC: 60.0, // Mindest-Nutztemperatur
  ambientTempC: 18.0,
  insulationLossKwh24h: 7.5,
  storageCalcMode: 'manual_fraction', // Stufe 1: fully_mixed | Stufe 2: manual_fraction | Stufe 3: multi_sensor
  hotLayerFraction: 0.6, // Stufe 2: 60% Heißwasser-Nutzanteil (Simulationsannahme)
  sensorTopTempC: 65.0, // Stufe 3: Puffer oben
  sensorMidTempC: 48.0, // Stufe 3: Puffer mitte
  sensorBottomTempC: 30.0, // Stufe 3: Puffer unten
};

export const DEFAULT_FWS: FreshWaterStationConfig = {
  count: 4,
  ratedCapacityPerStationLmin: 37.3, // Nennleistung 130 kW bei 70/25 -> 10/60°C (37,3 l/min je FWS = 149,2 l/min gesamt)
  ratedPowerPerStationKw: 130.0,
  primaryFlowTempC: 65.0, // Prüfpunkt: 65°C Primär-VL (Leistung noch nachzuweisen)
  primaryReturnTempC: 28.0,
  coldWaterInletTempC: 10.0,
  hotWaterOutletTempC: 60.0, // Norm 60°C nach DVGW W 551
  activeStations: 4,
  waterMeterReadingM3: undefined, // Standardmäßig leer für reale Vor-Ort-Ablesung
  waterMeterLastReadingM3: undefined,
  waterMeterIsSample: false,
};

export const DEFAULT_SANITARY: SanitaryConsumerConfig = {
  showerAreasCount: 10,
  panelsPerArea: 5,
  washbasinsPerArea: 5,
  totalShowerPanels: 50,
  totalWashbasins: 50,
  showerPanelFlowLmin: 10.0,
  washbasinFlowLmin: 5.0,
  showerMixedTempC: 38.0,
  washbasinMixedTempC: 38.0,
  showerSimultaneityPercent: 50, // 50% = 25 Duschen gleichzeitig (realistisch für FWS-Deckung)
  washbasinSimultaneityPercent: 30, // 30% = 15 Waschtische gleichzeitig
  activeShowersCount: 25, // 25 Duschpaneele aktiv
  activeWashbasinsCount: 15, // 15 Waschtische aktiv
  showerDurationMinutes: 6,
};

export const DEFAULT_CIRCULATION: CirculationConfig = {
  enabled: true,
  pipeLengthMeters: 220,
  specificLossWpm: 12.0, // 12 W/m
  flowTempC: 60.0,
  returnTempC: 56.0, // 4K Spreizung -> konform
  pumpFlowRateLh: 600, // 600 l/h
  maxAllowedPipeVolumeLitres: 3.0,
  maxTapDistancePipeVolumeLitres: 2.4, // Konform mit 3-Liter-Regel
};

export const DEFAULT_INSPECTION: TechnicianInspection = {
  inspectorName: '',
  companyName: '',
  facilityName: '', // Standardmäßig leer für echte Liegenschaft
  facilityAddress: '',
  inspectionDate: new Date().toISOString().slice(0, 10),
  orderNumber: '',
  measuredSystemPressureBar: undefined, // Vom Monteur vor Ort einzutragen
  measuredWpFlowTempC: undefined,
  measuredWpReturnTempC: undefined,
  measuredBufferTopTempC: undefined,
  measuredBufferBottomTempC: undefined,
  measuredFwsOutletTempC: undefined,
  measuredCircReturnTempC: undefined,
  stagnationFlushingConfirmed: false,
  safetyValvesChecked: false,
  expansionVesselsChecked: false,
  thermalDisinfectionTested: false,
  circulationPumpOperational: false,
  legionellaFilterInstalled: false,
  recommendations: [],
  notes: '',
  statusApproved: false, // Standardmäßig nicht freigegeben ohne Prüfung
};

/**
 * Muster-Inspektionsdaten für Präsentations- und Demozwecke (klar gekennzeichnet)
 */
export const SAMPLE_INSPECTION: TechnicianInspection = {
  inspectorName: 'Max Mustermann (Servicetechniker TGA)',
  companyName: 'Muster TGA-Wartung GmbH & Co. KG',
  facilityName: 'Sportzentrum & Duschkomplex Nord (Großanlage - DEMO)',
  facilityAddress: 'Musterstraße 14, 80000 München',
  inspectionDate: new Date().toISOString().slice(0, 10),
  orderNumber: 'DEMO-2026-TWW-01',
  measuredSystemPressureBar: 3.0,
  measuredWpFlowTempC: 65.0,
  measuredWpReturnTempC: 30.0,
  measuredBufferTopTempC: 65.0,
  measuredBufferBottomTempC: 30.0,
  measuredFwsOutletTempC: 60.0,
  measuredCircReturnTempC: 56.0,
  stagnationFlushingConfirmed: true,
  safetyValvesChecked: true,
  expansionVesselsChecked: true,
  thermalDisinfectionTested: true,
  circulationPumpOperational: true,
  legionellaFilterInstalled: false,
  recommendations: [
    'Regelmäßige mikrobiologische Beprobung nach TrinkwV alle 12 Monate durchführen.',
    'Spreizung der Frischwasserstationen (Delta T Primär/Sekundär) halbjährlich prüfen.',
  ],
  notes: 'Musterprotokoll zur Veranschaulichung der PDF-Ausgabe.',
  statusApproved: true,
};
