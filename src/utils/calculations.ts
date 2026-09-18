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
export const FWS_HEAT_EXCHANGER_MIN_PINCH_POINT_K = 4.0;

/**
 * Berechnet den thermodynamischen COP einer Trinkwarmwasser-Wärmepumpe
 * basierend auf Quellentemperatur (T_Quelle), Speichervorlauftemperatur (T_VL)
 * und Pufferrücklauftemperatur (T_RL unten).
 *
 * Realer Typenschild-/Prüfstandsbezug: W10 / W60 / RL30 -> typischer TWW-COP ~3.1 - 3.4.
 * Bei W7 / W65 (Hochtemperatur-TWW-Hub 58 K) liegt der maximale physikalische
 * Scroll-/Hubkolben-COP in Großanlagen bei ca. 2.6 - 3.0.
 */
export function calculateDynamicCop(
  sourceTempC: number,
  flowTempC: number,
  bufferBottomTempC: number = 30
): number {
  // Realistische Basis bei W7 / W65 / RL30: COP = 2.85
  const baseCop = 2.85;
  const deltaSource = sourceTempC - 7.0; // ~ +2.0% COP je K wärmere Quelle
  const deltaFlow = 65.0 - flowTempC; // ~ +1.8% COP je K kälterer Vorlauf
  const deltaReturnPenalty = Math.max(0, bufferBottomTempC - 30.0) * 0.015; // Strafe bei Verlust der Pufferschichtung
  
  const copFactor = 1.0 + (deltaSource * 0.020) + (deltaFlow * 0.018) - deltaReturnPenalty;
  const rawCop = baseCop * copFactor;
  // Physikalischer Deckel für 65°C TWW-Hub: max 4.4 bei hoher Quellentemperatur, min 1.6
  return Math.round(Math.min(4.4, Math.max(1.6, rawCop)) * 100) / 100;
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
      const elPower = Math.round((wp.thermalPowerKw / currentCop) * 10) / 10;
      totalWpElectricalPowerKw += elPower;
    }
  });

  const systemCop =
    totalWpElectricalPowerKw > 0
      ? Math.round((totalWpThermalPowerKw / totalWpElectricalPowerKw) * 100) / 100
      : 0;

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
  const deltaTWarmCold = Math.max(1, fws.hotWaterOutletTempC - fws.coldWaterInletTempC);
  
  const showerMixRatio = Math.max(0, (sanitary.showerMixedTempC - fws.coldWaterInletTempC) / deltaTWarmCold);
  const washbasinMixRatio = Math.max(0, (sanitary.washbasinMixedTempC - fws.coldWaterInletTempC) / deltaTWarmCold);

  const showerHotWaterLmin = showerTotalMixedFlowLmin * showerMixRatio;
  const washbasinHotWaterLmin = washbasinTotalMixedFlowLmin * washbasinMixRatio;
  const peakHotWaterFlowLmin = Math.round((showerHotWaterLmin + washbasinHotWaterLmin) * 10) / 10;
  const peakHotWaterFlowM3h = Math.round(((peakHotWaterFlowLmin * 60) / 1000) * 100) / 100;
  const coldWaterFlowLmin = Math.round(Math.max(0, peakMixedWaterFlowLmin - peakHotWaterFlowLmin) * 10) / 10;

  // Benötigte Spitzen-Wärmeleistung am FWS-Wärmeüberträger (kW)
  // Q = V_ww (l/min) * 60 (min/h) * c (kWh/(l*K)) * DeltaT
  const peakThermalDemandKw =
    Math.round(peakHotWaterFlowLmin * 60 * SPECIFIC_HEAT_WATER_KWH_PER_L_K * deltaTWarmCold * 10) / 10;

  // 3. Frischwasserstationen (FWS) Kapazität & Auslastung
  const effectiveFwsCount = Math.min(fws.count, Math.max(0, fws.activeStations));
  const fwsTotalCapacityLmin = effectiveFwsCount * fws.ratedCapacityPerStationLmin;
  const fwsCapacityUtilizationPercent =
    fwsTotalCapacityLmin > 0
      ? Math.round((peakHotWaterFlowLmin / fwsTotalCapacityLmin) * 100)
      : (peakHotWaterFlowLmin > 0 ? 999 : 0);
  const fwsSufficient = peakHotWaterFlowLmin <= fwsTotalCapacityLmin && effectiveFwsCount > 0;
  const isHydraulicOverloaded = !fwsSufficient && peakHotWaterFlowLmin > 0;

  // Erforderlicher Primär-Heizwasservolumenstrom (l/h)
  // Q = m_prim * c * (T_prim_VL - T_prim_RL)
  const primaryDeltaT = Math.max(2, fws.primaryFlowTempC - fws.primaryReturnTempC);
  const requiredPrimaryFlowLh =
    peakThermalDemandKw > 0
      ? (peakThermalDemandKw / (SPECIFIC_HEAT_WATER_KWH_PER_L_K * primaryDeltaT))
      : 0;

  // Reale Hydraulik: Primärrücklauf-Einspeisung über 3-Wege-Umschaltventil in Puffer 3
  // Wenn Rücklauf < 30°C: ganz unten (optimale Schichtung & WP-Eintritt)
  // Wenn Rücklauf >= 30°C: mittig in Puffer 3 (verhindert Zerstörung der Fußzonen-Auskühlung)
  const fwsReturnValvePosition: 'BOTTOM_STRAT' | 'MID_STRAT' =
    fws.primaryReturnTempC < 30.0 ? 'BOTTOM_STRAT' : 'MID_STRAT';
  const fwsReturnValveReason =
    fws.primaryReturnTempC < 30.0
      ? `FWS-Rücklauf (${fws.primaryReturnTempC}°C < 30°C): Ventil schaltet in Tiefzone Puffer 3 (Ideal für WP-Eintritt).`
      : `FWS-Rücklauf (${fws.primaryReturnTempC}°C ≥ 30°C): Ventil schaltet in Mittelzone Puffer 3 (Schutz vor Schichtungsstörung).`;

  // 4. Speicher-Energetik (3 x 2000L = 6000L) mit Schichtungsmodell (F2)
  const totalStorageVolumeLiters = buffer.count * buffer.volumePerTankLiters;
  
  // Mindest-Vorlauftemperatur für FWS unter Berücksichtigung der Grädigkeit (Pinch Point):
  // Um 60°C TWW bereitzustellen, muss der Puffer-Kopf mindestens 60°C + 4K = 64°C warm sein!
  const minRequiredBufferHeadTempC = fws.hotWaterOutletTempC + FWS_HEAT_EXCHANGER_MIN_PINCH_POINT_K;
  
  // Physikalisches Veto zur thermischen Versorgbarkeit (F1 & F2)
  let isThermalSupplyFeasible = true;
  let supplyInfeasibilityReason = '';

  if (buffer.topTempC < minRequiredBufferHeadTempC) {
    isThermalSupplyFeasible = false;
    supplyInfeasibilityReason = `Puffertemperatur oben (${buffer.topTempC}°C) unterschreitet die physikalisch erforderliche Mindest-Vorlauftemperatur von ${minRequiredBufferHeadTempC.toFixed(1)}°C (${fws.hotWaterOutletTempC}°C TWW + ${FWS_HEAT_EXCHANGER_MIN_PINCH_POINT_K} K Grädigkeit des FWS-Wärmetauschers). Warmwasser-Solltemperatur kann thermodynamisch nicht erreicht werden!`;
  } else if (effectiveFwsCount === 0 && peakHotWaterFlowLmin > 0) {
    isThermalSupplyFeasible = false;
    supplyInfeasibilityReason = 'Keine Frischwasserstation aktiv! Warmwasserversorgung unterbrochen.';
  } else if (isHydraulicOverloaded) {
    isThermalSupplyFeasible = false;
    supplyInfeasibilityReason = `Spitzen-Warmwasserbedarf (${peakHotWaterFlowLmin} l/min) übersteigt die hydraulische Maximalleistung der ${effectiveFwsCount} aktiven FWS (${fwsTotalCapacityLmin.toFixed(1)} l/min) um ${peakHotWaterFlowLmin - fwsTotalCapacityLmin} l/min. Zapfdruck- und Temperaturabfall an den Duschköpfen!`;
  }

  // Nutzbare Energie im Schichtspeicher:
  // Es darf nur das heiße Nutzvolumen oberhalb der Mindestnutztemperatur (inkl. Grädigkeit) bilanziert werden
  const effectiveMinTemp = Math.max(buffer.minUsableTempC, minRequiredBufferHeadTempC);
  const hotLayerFraction = buffer.hotLayerFraction !== undefined
    ? Math.max(0, Math.min(1, buffer.hotLayerFraction))
    : Math.max(0, Math.min(1, (buffer.topTempC - buffer.bottomTempC) > 0 ? (buffer.topTempC - effectiveMinTemp) / Math.max(1, buffer.topTempC - buffer.bottomTempC) : 0.5));

  // Nutzbares Heißwasservolumen (Liter)
  const usableHotVolumeLiters = totalStorageVolumeLiters * hotLayerFraction;
  const usableDischargeDeltaT = Math.max(0, buffer.topTempC - effectiveMinTemp);

  const totalStoredEnergyKwh =
    isThermalSupplyFeasible
      ? Math.round(usableHotVolumeLiters * SPECIFIC_HEAT_WATER_KWH_PER_L_K * usableDischargeDeltaT * 10) / 10
      : 0;

  // Gesamter thermischer Energieinhalt bezogen auf Kaltwasser (10°C)
  const fullDeltaT = Math.max(0, buffer.topTempC - fws.coldWaterInletTempC);
  const storedEnergyFullDeltaKwh =
    Math.round(totalStorageVolumeLiters * SPECIFIC_HEAT_WATER_KWH_PER_L_K * fullDeltaT * 10) / 10;

  // Ladezustand in % (bezogen auf Zielbeladung vs minUsableTemp)
  const maxPossibleDeltaT = Math.max(1, buffer.targetChargingTempC - buffer.minUsableTempC);
  const currentAvgTemp = (buffer.topTempC + buffer.bottomTempC) / 2;
  const currentDeltaT = Math.max(0, currentAvgTemp - buffer.minUsableTempC);
  const storageStateOfChargePercent = Math.min(
    100,
    Math.max(0, Math.round((currentDeltaT / maxPossibleDeltaT) * 100))
  );

  // Wiederaufheizzeit des Speichers von minUsableTemp auf targetChargingTemp (Stunden)
  const storageReheatEnergyNeededKwh =
    totalStorageVolumeLiters * SPECIFIC_HEAT_WATER_KWH_PER_L_K * maxPossibleDeltaT;
  const storageReheatTimeHours =
    totalHeatGenerationPowerKw > 0
      ? Math.round((storageReheatEnergyNeededKwh / totalHeatGenerationPowerKw) * 10) / 10
      : 99.9;

  // 5. Zirkulation & Verluste nach DVGW W 551 / DIN 1988-200
  const circulationLossKw = circulation.enabled
    ? (circulation.pipeLengthMeters * circulation.specificLossWpm) / 1000
    : 0;

  const circulationTempDropK = Math.max(0, circulation.flowTempC - circulation.returnTempC);

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
    operatingStateDescription = `Geringe Unterdeckung von ${Math.abs(netPowerBalanceKw)} kW. Die Puffer überbrücken diesen Zustand problemlos über viele Stunden.`;
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

  // Wiederaufladezeiten für genau diese entnommene Duschgang-Energie:
  const wpPower = totalWpThermalPowerKw > 0 ? totalWpThermalPowerKw : 120.0;
  const showerSessionRechargeTimeWpMinutes = Math.round((showerSessionEnergyKwh / wpPower) * 60 * 10) / 10;

  const wtPower = centralHeating.powerKw > 0 ? centralHeating.powerKw : 136.0;
  const showerSessionRechargeTimeWtMinutes = Math.round((showerSessionEnergyKwh / wtPower) * 60 * 10) / 10;

  const combinedPower = wpPower + wtPower;
  const showerSessionRechargeTimeCombinedMinutes = Math.round((showerSessionEnergyKwh / combinedPower) * 60 * 10) / 10;

  const fullStorageRechargeHoursWp = Math.round((storageReheatEnergyNeededKwh / wpPower) * 10) / 10;
  const fullStorageRechargeHoursWt = Math.round((storageReheatEnergyNeededKwh / wtPower) * 10) / 10;
  const fullStorageRechargeHoursCombined = Math.round((storageReheatEnergyNeededKwh / combinedPower) * 10) / 10;

  // 8b. Trinkwasserzähler-Bilanzierung
  let waterMeterDeltaM3: number | undefined;
  let waterMeterThermalEnergyKwh: number | undefined;
  if (fws.waterMeterReadingM3 !== undefined && fws.waterMeterLastReadingM3 !== undefined) {
    waterMeterDeltaM3 = Math.max(0, Math.round((fws.waterMeterReadingM3 - fws.waterMeterLastReadingM3) * 1000) / 1000);
    // Gemessene thermische Energie = V_m3 * 1000 l/m3 * c * DeltaT
    waterMeterThermalEnergyKwh = Math.round(waterMeterDeltaM3 * 1000 * SPECIFIC_HEAT_WATER_KWH_PER_L_K * deltaTWarmCold * 10) / 10;
  }

  // 9. Normen- und Hygiene-Prüfungen
  const w551OutletStatus =
    fws.hotWaterOutletTempC >= 60
      ? 'OK'
      : fws.hotWaterOutletTempC >= 58
      ? 'WARNING'
      : 'ERROR';

  const w551ReturnStatus =
    circulation.returnTempC >= 55
      ? 'OK'
      : circulation.returnTempC >= 53
      ? 'WARNING'
      : 'ERROR';

  const w551DropStatus =
    circulationTempDropK <= 5.0
      ? 'OK'
      : circulationTempDropK <= 6.5
      ? 'WARNING'
      : 'ERROR';

  const threeLiterRuleStatus =
    circulation.maxTapDistancePipeVolumeLitres <= 3.0
      ? 'OK'
      : 'WARNING';

  const fwsCapStatus =
    effectiveFwsCount > 0 && fwsCapacityUtilizationPercent <= 90
      ? 'OK'
      : effectiveFwsCount > 0 && fwsCapacityUtilizationPercent <= 100
      ? 'WARNING'
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
      target: 60,
      rule: 'DVGW W 551 / DIN 1988-200 Abs. 6.2',
      description: 'Warmwasser-Austrittstemperatur am Erzeuger muss mindestens 60°C betragen (Großanlage).',
    },
    w551ReturnTemp: {
      status: w551ReturnStatus as 'OK' | 'WARNING' | 'ERROR',
      actual: circulation.returnTempC,
      target: 55,
      rule: 'DVGW W 551 Abs. 6.3.1',
      description: 'Zirkulations-Rücklauftemperatur muss im gesamten System mindestens 55°C betragen.',
    },
    w551TempDrop: {
      status: w551DropStatus as 'OK' | 'WARNING' | 'ERROR',
      actual: circulationTempDropK,
      maxAllowed: 5.0,
      rule: 'DVGW W 551 & DIN 1988-200',
      description: 'Die Temperaturdifferenz zwischen Vorlauf und Rücklauf der Zirkulation darf maximal 5 K betragen.',
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
      utilization: fwsCapacityUtilizationPercent,
      rule: 'DIN 1988-300 / DIN EN 806 Spitzenlast',
      description: `Spitzendurchfluss: ${fwsTotalCapacityLmin.toFixed(1)} l/min Gesamtkapazität bei ${effectiveFwsCount} FWS.`,
    },
    bufferDimensioningCheck: {
      status: bufferDimStatus as 'OK' | 'WARNING' | 'ERROR',
      storedMinutes: autonomyStorageOnlyMinutes,
      rule: 'DIN 4708 Zentrale Wassererwärmungsanlagen',
      description: isThermalSupplyFeasible
        ? 'Speichervorrat (6.000 l) muss Bedarfsspitzen ohne Temperaturabfall überbrücken können.'
        : supplyInfeasibilityReason,
    },
    vdi6023Stagnation: {
      status: 'INFO' as const,
      rule: 'VDI/DVGW 6023 Hygiene in Trinkwasser-Installationen',
      description: 'Nachweispflicht: Wasserwechsel alle 72 Stunden an allen Entnahmestellen muss vor Ort dokumentiert sein.',
    },
  };

  // Gesamtbewertung
  const errorCount = Object.values(normCompliance).filter((item) => item.status === 'ERROR').length;
  const warningCount = Object.values(normCompliance).filter((item) => item.status === 'WARNING').length;

  let overallStatus: 'OK' | 'WARNING' | 'ERROR' = 'OK';
  if (errorCount > 0 || !isThermalSupplyFeasible) {
    overallStatus = 'ERROR';
  } else if (warningCount > 0) {
    overallStatus = 'WARNING';
  }

  let score = 100 - errorCount * 30 - warningCount * 12;
  if (!isThermalSupplyFeasible) score = Math.min(score, 40);
  score = Math.max(10, Math.min(100, score));

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
  let efficiencyDescription = `Hohe Arbeitszahl (${systemCop}) für Trinkwarmwasserbereitung (65°C Vorlauf).`;

  if (systemCop >= 3.1) {
    efficiencyStatus = 'OPTIMAL';
    efficiencyLabel = 'Sehr gut (Hocheffizient)';
    efficiencyBadgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-300';
    efficiencyDescription = `Sehr guter COP von ${systemCop} bei ΔT ${tempLiftK} K Temperaturhub. Sehr gute Kältemittel-Unterkühlung und ideale Pufferschichtung.`;
  } else if (systemCop >= 2.6) {
    efficiencyStatus = 'GOOD';
    efficiencyLabel = 'Normaler Standardbereich';
    efficiencyBadgeClass = 'bg-blue-100 text-blue-800 border-blue-300';
    efficiencyDescription = `Typischer Auslegungspunkt (COP ${systemCop}) für Hochtemperatur-TWW-Bereitung (65°C Vorlauf, W7).`;
  } else if (systemCop >= 2.1) {
    efficiencyStatus = 'FAIR';
    efficiencyLabel = 'Erhöhter Strombedarf';
    efficiencyBadgeClass = 'bg-amber-100 text-amber-800 border-amber-300';
    efficiencyDescription = `Großer Temperaturhub (ΔT = ${tempLiftK} K) oder erhöhte Pufferrücklauftemperatur.`;
  } else {
    efficiencyStatus = 'CRITICAL';
    efficiencyLabel = 'Kritischer Bereich (Wärmetauscher zuschalten)';
    efficiencyBadgeClass = 'bg-rose-100 text-rose-800 border-rose-300';
    efficiencyDescription = `Extrem ungünstiger Temperaturhub (COP < 2.1). Zuschaltung der 136 kW Zusatzheizung empfohlen!`;
  }

  const monteurTips: string[] = [];
  if (buffer.bottomTempC > 30) {
    monteurTips.push(
      `Pufferrücklauf liegt bei ${buffer.bottomTempC}°C (Soll: ≤ 30°C). 3-Wege-Ventil schaltet FWS-Rücklauf in Puffer-Mitte, um WP-COP nicht weiter zu belasten.`
    );
  } else {
    monteurTips.push(
      `Kühle Puffer-Rücklauftemperatur (${buffer.bottomTempC}°C) sichert optimale Kältemittelkondensation und hohe Arbeitszahl.`
    );
  }
  if (avgSourceTempC < 4) {
    monteurTips.push(
      `Niedrige Quellentemperatur (${avgSourceTempC}°C): Bei Spitzenlast empfiehlt sich Unterstützung durch den 136 kW Wärmetauscher.`
    );
  }
  monteurTips.push(
    `Temperaturhub: ΔT ${tempLiftK} K (${avgSourceTempC}°C Quelle → ${avgFlowTempC}°C Vorlauf). Gütegrad liegt bei realistischen ${carnotEfficiencyPercent}%.`
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

  const copAnalysis: CopAnalysis = {
    systemCop,
    nominalCop: 2.85,
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
    storedEnergyFullDeltaKwh,
    storageStateOfChargePercent,
    storageReheatTimeHours,
    activeShowersCount,
    activeWashbasinsCount,
    peakMixedWaterFlowLmin: Math.round(peakMixedWaterFlowLmin * 10) / 10,
    peakHotWaterFlowLmin: Math.round(peakHotWaterFlowLmin * 10) / 10,
    peakHotWaterFlowM3h: Math.round(peakHotWaterFlowM3h * 100) / 100,
    peakThermalDemandKw: Math.round(peakThermalDemandKw * 10) / 10,
    coldWaterFlowLmin,
    fwsTotalCapacityLmin: Math.round(fwsTotalCapacityLmin * 10) / 10,
    fwsCapacityUtilizationPercent,
    fwsSufficient,
    requiredPrimaryFlowLh: Math.round(requiredPrimaryFlowLh),
    autonomyStorageOnlyMinutes,
    autonomyWithGenerationMinutes,
    continuousFlowCoveragePercent,
    isThermalSupplyFeasible,
    supplyInfeasibilityReason,
    isHydraulicOverloaded,
    fwsReturnValvePosition,
    fwsReturnValveReason,
    waterMeterDeltaM3,
    waterMeterThermalEnergyKwh,
    netPowerBalanceKw,
    operatingStateKey,
    operatingStateTitle,
    operatingStateDescription,
    showerSessionTotalMixedLiters,
    showerSessionTotalHot60Liters,
    showerSessionEnergyKwh,
    showerSessionRechargeTimeWpMinutes,
    showerSessionRechargeTimeWtMinutes,
    showerSessionRechargeTimeCombinedMinutes,
    fullStorageRechargeHoursWp,
    fullStorageRechargeHoursWt,
    fullStorageRechargeHoursCombined,
    circulationLossKw: Math.round(circulationLossKw * 100) / 100,
    circulationTempDropK: Math.round(circulationTempDropK * 10) / 10,
    circulationPumpMinFlowLh,
    circulationPumpAdequate,
    copAnalysis,
    normCompliance,
    overallStatus,
    overallScorePercent: score,
  };
}

export const DEFAULT_HEAT_PUMPS: HeatPumpConfig[] = [
  {
    id: 'wp-1',
    name: 'Wärmepumpe 1 (Grundlast)',
    enabled: true,
    thermalPowerKw: 40.0, // Reale Geräteleistung nach Typenschild (F3: 3x 40 kW = 120 kW)
    electricalPowerKw: 14.0, // Bei W7 / W65 (COP ~2.85)
    sourceTempC: 7.0,
    flowTempC: 65.0,
  },
  {
    id: 'wp-2',
    name: 'Wärmepumpe 2 (Mittellast)',
    enabled: true,
    thermalPowerKw: 40.0,
    electricalPowerKw: 14.0,
    sourceTempC: 7.0,
    flowTempC: 65.0,
  },
  {
    id: 'wp-3',
    name: 'Wärmepumpe 3 (Spitzenlast)',
    enabled: true,
    thermalPowerKw: 40.0,
    electricalPowerKw: 14.0,
    sourceTempC: 7.0,
    flowTempC: 65.0,
  },
];

export const DEFAULT_CENTRAL_HEATING: CentralHeatingConfig = {
  enabled: true,
  powerKw: 136.0, // 136 kW Plattenwärmetauscher zur alternativen oder zusätzlichen Pufferladung
  flowTempC: 75.0,
  returnTempC: 50.0,
};

export const DEFAULT_BUFFER_STORAGE: BufferStorageConfig = {
  count: 3,
  volumePerTankLiters: 2000,
  totalVolumeLiters: 6000,
  topTempC: 65.0,
  bottomTempC: 30.0,
  targetChargingTempC: 65.0,
  minUsableTempC: 60.0, // F1/F2: Mindest-Nutztemperatur (FWS benötigt 60°C TWW + Grädigkeit)
  ambientTempC: 18.0,
  insulationLossKwh24h: 7.5,
  hotLayerFraction: 0.6, // 60% geschichtetes Heißwasservolumen
};

export const DEFAULT_FWS: FreshWaterStationConfig = {
  count: 4,
  ratedCapacityPerStationLmin: 37.3, // F3: Reale Nennleistung 130 kW bei 10->60°C (37,3 l/min je FWS = 149 l/min gesamt)
  ratedPowerPerStationKw: 130.0,
  primaryFlowTempC: 65.0,
  primaryReturnTempC: 28.0,
  coldWaterInletTempC: 10.0,
  hotWaterOutletTempC: 60.0, // Norm 60°C nach DVGW W 551
  activeStations: 4,
  waterMeterReadingM3: 1428.65, // Trinkwasserzähler Zulauf zu FWS
  waterMeterLastReadingM3: 1420.20, // Letzter Ablesestand (Delta = 8,45 m³)
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
  facilityName: 'Sportzentrum & Duschkomplex Nord (Großanlage)',
  facilityAddress: 'Olympiastraße 14, 80809 München',
  inspectionDate: new Date().toISOString().slice(0, 10),
  orderNumber: 'PR-2026-TWW-01',
  measuredSystemPressureBar: undefined, // Vom Monteur vor Ort einzutragen
  measuredWpFlowTempC: undefined,
  measuredWpReturnTempC: undefined,
  measuredBufferTopTempC: undefined,
  measuredBufferBottomTempC: undefined,
  measuredFwsOutletTempC: undefined,
  measuredCircReturnTempC: undefined,
  stagnationFlushingConfirmed: false, // F5: Nicht vorbelegt! Monteur muss vor Ort bestätigen
  safetyValvesChecked: false, // F5: Nicht vorbelegt!
  expansionVesselsChecked: false, // F5: Nicht vorbelegt!
  thermalDisinfectionTested: false, // F5: Nicht vorbelegt!
  circulationPumpOperational: false, // F5: Nicht vorbelegt!
  legionellaFilterInstalled: false, // F5: Nicht vorbelegt!
  recommendations: [],
  notes: '',
  statusApproved: false, // F5: Standardmäßig nicht freigegeben ohne Prüfung
};
