import {
  HeatPumpConfig,
  CentralHeatingConfig,
  BufferStorageConfig,
  FreshWaterStationConfig,
  SanitaryConsumerConfig,
  CirculationConfig,
  SystemCalculations,
  CopAnalysis,
} from '../types';

// Spezifische Wärmekapazität von Wasser: c = 1.163 Wh / (kg * K) = 0.001163 kWh / (l * K)
export const SPECIFIC_HEAT_WATER_KWH_PER_L_K = 0.001163;
export const WATER_DENSITY_KG_L = 1.0;

/**
 * Berechnet den thermodynamischen COP einer Trinkwarmwasser-Wärmepumpe
 * basierend auf Quellentemperatur (T_Quelle), Speichervorlauftemperatur (T_VL)
 * und Pufferrücklauftemperatur (T_RL unten).
 * Nennauslegung: W7 / W65 / RL30 -> COP 3.41
 */
export function calculateDynamicCop(
  sourceTempC: number,
  flowTempC: number,
  bufferBottomTempC: number = 30
): number {
  const nominalCop = 3.41;
  const deltaSource = sourceTempC - 7.0; // +2.4% COP je K wärmere Quelle
  const deltaFlow = 65.0 - flowTempC; // +2.0% COP je K kälterer Vorlauf
  const deltaReturnPenalty = Math.max(0, bufferBottomTempC - 30.0) * 0.012; // Strafe bei Verlust der Pufferschichtung
  
  const copFactor = 1.0 + (deltaSource * 0.024) + (deltaFlow * 0.020) - deltaReturnPenalty;
  const rawCop = nominalCop * copFactor;
  return Math.round(Math.min(5.5, Math.max(1.8, rawCop)) * 100) / 100;
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
  const effectiveFwsCount = Math.min(fws.count, Math.max(1, fws.activeStations));
  const fwsTotalCapacityLmin = effectiveFwsCount * fws.ratedCapacityPerStationLmin;
  const fwsCapacityUtilizationPercent =
    fwsTotalCapacityLmin > 0
      ? Math.round((peakHotWaterFlowLmin / fwsTotalCapacityLmin) * 100)
      : 0;
  const fwsSufficient = peakHotWaterFlowLmin <= fwsTotalCapacityLmin;

  // Erforderlicher Primär-Heizwasservolumenstrom (l/h)
  // Q = m_prim * c * (T_prim_VL - T_prim_RL)
  const primaryDeltaT = Math.max(2, fws.primaryFlowTempC - fws.primaryReturnTempC);
  const requiredPrimaryFlowLh =
    (peakThermalDemandKw / (SPECIFIC_HEAT_WATER_KWH_PER_L_K * primaryDeltaT));

  // 4. Speicher-Energetik (3 x 2000L = 6000L)
  const totalStorageVolumeLiters = buffer.count * buffer.volumePerTankLiters;
  
  // Nutzbare Energie bezogen auf mittlere Auskühlung im Speicher (bis FWS Rücklauf bzw. minUsableTemp)
  const usableDischargeDeltaT = Math.max(0, buffer.topTempC - buffer.minUsableTempC);
  const totalStoredEnergyKwh =
    totalStorageVolumeLiters * SPECIFIC_HEAT_WATER_KWH_PER_L_K * usableDischargeDeltaT;

  // Gesamter Energieinhalt bezogen auf Kaltwasser (10°C)
  const fullDeltaT = Math.max(0, buffer.topTempC - fws.coldWaterInletTempC);
  const storedEnergyFullDeltaKwh =
    totalStorageVolumeLiters * SPECIFIC_HEAT_WATER_KWH_PER_L_K * fullDeltaT;

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

  // 6. Versorgungsdauer & Autonomie
  // Gesamte Entzugsleistung = Spitzenlast + Zirkulationsverlust
  const totalDischargeLoadKw = peakThermalDemandKw + circulationLossKw;

  let autonomyStorageOnlyMinutes = 0;
  if (totalDischargeLoadKw > 0) {
    autonomyStorageOnlyMinutes = Math.round(
      (totalStoredEnergyKwh / totalDischargeLoadKw) * 60
    );
  } else {
    autonomyStorageOnlyMinutes = 999;
  }

  // Autonomie mit Erzeugung
  const netDeficitKw = totalDischargeLoadKw - totalHeatGenerationPowerKw;
  let autonomyWithGenerationMinutes = 0;
  if (netDeficitKw <= 0) {
    autonomyWithGenerationMinutes = 999; // Dauerhaft gedeckt
  } else {
    autonomyWithGenerationMinutes = Math.round(
      (totalStoredEnergyKwh / netDeficitKw) * 60
    );
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

  if (peakHotWaterFlowLmin === 0) {
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
    operatingStateDescription = `Massiver Entzug übersteigt die Erzeugung um ${Math.abs(netPowerBalanceKw)} kW. Die 6.000 L Pufferreserve fängt die Lastspitze souverän ab.`;
  } else if (netPowerBalanceKw < -5) {
    operatingStateKey = 'DISCHARGING_SLOW';
    operatingStateTitle = 'Mäßige Speicherentladung (Teillast)';
    operatingStateDescription = `Geringe Unterdeckung von ${Math.abs(netPowerBalanceKw)} kW. Die Puffer überbrücken diesen Zustand problemlos über viele Stunden.`;
  }

  // 8. Spezifische Duschgang-Wassermengen & Nachladezeiten
  // Mischwassermenge und Warmwassermenge für einen kompletten Duschgang (z.B. 6 Min)
  const showerSessionTotalMixedLiters = Math.round(
    activeShowersCount * sanitary.showerPanelFlowLmin * sanitary.showerDurationMinutes
  );
  const showerSessionTotalHot60Liters = Math.round(
    showerHotWaterLmin * sanitary.showerDurationMinutes
  );
  // Dem Puffer entzogene thermische Energie für diesen Duschgang (kWh)
  const showerSessionEnergyKwh = Math.round(
    (showerSessionTotalHot60Liters * SPECIFIC_HEAT_WATER_KWH_PER_L_K * deltaTWarmCold) * 10
  ) / 10;

  // Wiederaufladezeiten für genau diese entnommene Duschgang-Energie:
  // 1. Mit Wärmepumpen (Nennleistung 135 kW)
  const wpPower = totalWpThermalPowerKw > 0 ? totalWpThermalPowerKw : 135.0;
  const showerSessionRechargeTimeWpMinutes = Math.round((showerSessionEnergyKwh / wpPower) * 60 * 10) / 10;

  // 2. Mit 136 kW Plattenwärmetauscher
  const wtPower = 136.0;
  const showerSessionRechargeTimeWtMinutes = Math.round((showerSessionEnergyKwh / wtPower) * 60 * 10) / 10;

  // 3. Mit Hybrid-Kombination: WP + 136 kW WT (271 kW Gesamtleistung!)
  const combinedPower = wpPower + wtPower;
  const showerSessionRechargeTimeCombinedMinutes = Math.round((showerSessionEnergyKwh / combinedPower) * 60 * 10) / 10;

  // Dauer der vollständigen Puffer-Neuladung (von minUsableTemp 55°C auf Ziel 65°C, d.h. Delta 10 K):
  const fullStorageRechargeHoursWp = Math.round((storageReheatEnergyNeededKwh / wpPower) * 10) / 10;
  const fullStorageRechargeHoursWt = Math.round((storageReheatEnergyNeededKwh / wtPower) * 10) / 10;
  const fullStorageRechargeHoursCombined = Math.round((storageReheatEnergyNeededKwh / combinedPower) * 10) / 10;

  // 9. Normen- und Hygiene-Prüfungen
  // DVGW W 551 & DIN 1988-200 Kriterien
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
    fwsCapacityUtilizationPercent <= 90
      ? 'OK'
      : fwsCapacityUtilizationPercent <= 100
      ? 'WARNING'
      : 'ERROR';

  const bufferDimStatus =
    autonomyStorageOnlyMinutes >= 15
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
      description: 'Die 4 Frischwasserstationen müssen den berechneten Spitzendurchfluss sicher decken können.',
    },
    bufferDimensioningCheck: {
      status: bufferDimStatus as 'OK' | 'WARNING' | 'ERROR',
      storedMinutes: autonomyStorageOnlyMinutes,
      rule: 'DIN 4708 Zentrale Wassererwärmungsanlagen',
      description: 'Speichervorrat (6.000 l) muss Bedarfsspitzen ohne Temperaturabfall überbrücken können.',
    },
    vdi6023Stagnation: {
      status: 'OK' as const,
      rule: 'VDI/DVGW 6023 Hygiene in Trinkwasser-Installationen',
      description: 'Regelmäßiger Wasserwechsel alle 72 Stunden an allen 50 Duschpaneelen und Waschtischen sicherstellen.',
    },
  };

  // Gesamtbewertung
  const errorCount = Object.values(normCompliance).filter((item) => item.status === 'ERROR').length;
  const warningCount = Object.values(normCompliance).filter((item) => item.status === 'WARNING').length;

  let overallStatus: 'OK' | 'WARNING' | 'ERROR' = 'OK';
  if (errorCount > 0) {
    overallStatus = 'ERROR';
  } else if (warningCount > 0) {
    overallStatus = 'WARNING';
  }

  // Norm-Score in Prozent (0-100)
  let score = 100 - errorCount * 30 - warningCount * 12;
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
    carnotCop > 0 ? Math.round((systemCop / carnotCop) * 1000) / 10 : 50;

  // Status und Bewertung für Monteure
  let efficiencyStatus: 'OPTIMAL' | 'GOOD' | 'FAIR' | 'CRITICAL' = 'OPTIMAL';
  let efficiencyLabel = 'Optimaler Effizienzbereich';
  let efficiencyBadgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-300';
  let efficiencyDescription = `Sehr hoher COP (${systemCop}) für Trinkwarmwasserbereitung (65°C Vorlauf). System arbeitet thermodynamisch einwandfrei.`;

  if (systemCop >= 3.3) {
    efficiencyStatus = 'OPTIMAL';
    efficiencyLabel = 'Optimaler Bereich (Hocheffizient)';
    efficiencyBadgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-300';
    efficiencyDescription = `Hervorragender COP von ${systemCop} bei ΔT ${tempLiftK} K Temperaturhub. Sehr gute Kältemittel-Unterkühlung und ideale Pufferschichtung.`;
  } else if (systemCop >= 2.85) {
    efficiencyStatus = 'GOOD';
    efficiencyLabel = 'Guter Betriebsbereich (Nennlast)';
    efficiencyBadgeClass = 'bg-blue-100 text-blue-800 border-blue-300';
    efficiencyDescription = `Normaler Standardbetrieb (COP ${systemCop}) bei mäßigen Quellentemperaturen oder Trinkwassererwärmung auf 65°C.`;
  } else if (systemCop >= 2.3) {
    efficiencyStatus = 'FAIR';
    efficiencyLabel = 'Erhöhter Strombedarf (Großer Hub)';
    efficiencyBadgeClass = 'bg-amber-100 text-amber-800 border-amber-300';
    efficiencyDescription = `Großer Temperaturhub (ΔT = ${tempLiftK} K) oder erhöhte Pufferrücklauftemperatur. Elektrische Leistungsaufnahme steigt spürbar an.`;
  } else {
    efficiencyStatus = 'CRITICAL';
    efficiencyLabel = 'Kritischer Bereich (Wärmetauscher zuschalten!)';
    efficiencyBadgeClass = 'bg-rose-100 text-rose-800 border-rose-300';
    efficiencyDescription = `Extrem ungünstiger Temperaturhub (COP < 2.3). Verdichter läuft unter hoher Druckbelastung. Zuschaltung der 136 kW Zentralheizung dringend empfohlen!`;
  }

  // Monteur-Tipps:
  const monteurTips: string[] = [];
  if (buffer.bottomTempC > 35) {
    monteurTips.push(
      `Pufferrücklauf liegt bei ${buffer.bottomTempC}°C (Soll: ≤ 30°C). FWS-Primär-Rücklauf oder Zirkulationsrücklauf prüfen, um Kältemittel-Unterkühlung zu verbessern.`
    );
  } else {
    monteurTips.push(
      `Kühle Puffer-Rücklauftemperatur (${buffer.bottomTempC}°C) sichert optimale Kältemittelkondensation und schont den Verdichter.`
    );
  }
  if (avgSourceTempC < 0) {
    monteurTips.push(
      `Bei Frost (${avgSourceTempC}°C) empfiehlt sich Spitzenlast-Unterstützung durch den 136 kW Plattenwärmetauscher.`
    );
  } else if (avgSourceTempC >= 10) {
    monteurTips.push(
      `Milde Quellentemperatur (${avgSourceTempC}°C) ermöglicht herausragenden COP von über 3,6.`
    );
  }
  monteurTips.push(
    `Temperaturhub: ΔT ${tempLiftK} K (${avgSourceTempC}°C Quelle → ${avgFlowTempC}°C Vorlauf). Carnot-Gütegrad liegt bei stabilen ${carnotEfficiencyPercent}%.`
  );

  // Dynamische Kennlinie COP vs Quellentemperatur (-10°C bis +20°C):
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

  // Dynamische Kennlinie COP vs Speichervorlauf (45°C bis 70°C):
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
    nominalCop: 3.41,
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
    totalStoredEnergyKwh: Math.round(totalStoredEnergyKwh * 10) / 10,
    storedEnergyFullDeltaKwh: Math.round(storedEnergyFullDeltaKwh * 10) / 10,
    storageStateOfChargePercent,
    storageReheatTimeHours,
    activeShowersCount,
    activeWashbasinsCount,
    peakMixedWaterFlowLmin: Math.round(peakMixedWaterFlowLmin * 10) / 10,
    peakHotWaterFlowLmin: Math.round(peakHotWaterFlowLmin * 10) / 10,
    peakHotWaterFlowM3h: Math.round(peakHotWaterFlowM3h * 100) / 100,
    peakThermalDemandKw: Math.round(peakThermalDemandKw * 10) / 10,
    coldWaterFlowLmin,
    fwsTotalCapacityLmin,
    fwsCapacityUtilizationPercent,
    fwsSufficient,
    requiredPrimaryFlowLh: Math.round(requiredPrimaryFlowLh),
    autonomyStorageOnlyMinutes,
    autonomyWithGenerationMinutes,
    continuousFlowCoveragePercent,
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
    thermalPowerKw: 45.0,
    electricalPowerKw: 13.2,
    sourceTempC: 7.0,
    flowTempC: 65.0,
  },
  {
    id: 'wp-2',
    name: 'Wärmepumpe 2 (Mittellast)',
    enabled: true,
    thermalPowerKw: 45.0,
    electricalPowerKw: 13.2,
    sourceTempC: 7.0,
    flowTempC: 65.0,
  },
  {
    id: 'wp-3',
    name: 'Wärmepumpe 3 (Spitzenlast)',
    enabled: true,
    thermalPowerKw: 45.0,
    electricalPowerKw: 13.2,
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
  minUsableTempC: 55.0,
  ambientTempC: 18.0,
  insulationLossKwh24h: 7.5,
};

export const DEFAULT_FWS: FreshWaterStationConfig = {
  count: 4,
  ratedCapacityPerStationLmin: 50.0, // 4 * 50 = 200 l/min Gesamtleistung
  primaryFlowTempC: 65.0,
  primaryReturnTempC: 28.0,
  coldWaterInletTempC: 10.0,
  hotWaterOutletTempC: 60.0, // Norm 60°C
  activeStations: 4,
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
  showerSimultaneityPercent: 60, // 60% = 30 Duschen gleichzeitig
  washbasinSimultaneityPercent: 40, // 40% = 20 Waschtische gleichzeitig
  activeShowersCount: 30, // 30 Duschpaneele aktiv
  activeWashbasinsCount: 20, // 20 Waschtische aktiv
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

export const DEFAULT_INSPECTION: {
  inspectorName: string;
  companyName: string;
  facilityName: string;
  facilityAddress: string;
  orderNumber: string;
  safetyValvesChecked: boolean;
  expansionVesselsChecked: boolean;
  thermalDisinfectionTested: boolean;
  circulationPumpOperational: boolean;
  legionellaFilterInstalled: boolean;
  notes: string;
} = {
  inspectorName: 'Max Mustermann (SHK-Meister)',
  companyName: 'Wärmetechnik & Trinkwasserhygiene GmbH',
  facilityName: 'Sportzentrum & Hallenbad Nord / Groß-Duschkomplex',
  facilityAddress: 'Olympiastraße 14, 80809 München',
  orderNumber: 'AP-2026-WW-0492',
  safetyValvesChecked: true,
  expansionVesselsChecked: true,
  thermalDisinfectionTested: true,
  circulationPumpOperational: true,
  legionellaFilterInstalled: true,
  notes: 'Anlage mit 3x WP (135 kW) und 3x 2000L Pufferspeicher geprüft. Hydraulischer Abgleich der 4 Frischwasserstationen durchgeführt. Zirkulationstemperatur mit 56,2°C im Soll.',
};
