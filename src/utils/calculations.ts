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
 * und thermodynamischem Gütegrad (Carnot-Gütegrad ca. 50-55% für moderne Groß-WPs).
 */
export function calculateDynamicCop(
  sourceTempC: number,
  flowTempC: number,
  carnotEfficiency: number = 0.52
): number {
  const tSourceK = sourceTempC + 273.15;
  const tFlowK = flowTempC + 273.15;

  if (tFlowK <= tSourceK) {
    return 6.0;
  }

  // Theoretischer Carnot-Wirkungsgrad: COP_carnot = T_warm / (T_warm - T_kalt)
  const carnotCop = tFlowK / (tFlowK - tSourceK);

  // Realer COP mit Gütegrad
  const realCop = carnotCop * carnotEfficiency;

  // Realistische physikalische Grenzwerte für Groß-WPs
  return Math.max(1.8, Math.min(5.5, Number(realCop.toFixed(2))));
}

/**
 * Erstellt eine Kennlinienschar für die Monteur-Diagnose
 */
export function generateCopAnalysis(
  heatPumps: HeatPumpConfig[],
  bufferTopTempC: number,
  bufferBottomTempC: number
): CopAnalysis {
  const activeWps = heatPumps.filter((wp) => wp.enabled);
  const avgSourceTempC =
    activeWps.length > 0
      ? activeWps.reduce((acc, wp) => acc + (wp.sourceTempC ?? 7.0), 0) / activeWps.length
      : 7.0;

  const avgFlowTempC =
    activeWps.length > 0
      ? activeWps.reduce((acc, wp) => acc + wp.flowTempC, 0) / activeWps.length
      : bufferTopTempC;

  const systemCop = calculateDynamicCop(avgSourceTempC, avgFlowTempC);
  const nominalCop = 3.3; // Nenn-COP bei A7/W55 nach EN 14511
  const tempLiftK = Number((avgFlowTempC - avgSourceTempC).toFixed(1));

  const tSourceK = avgSourceTempC + 273.15;
  const tFlowK = avgFlowTempC + 273.15;
  const carnotCop = Number((tFlowK / (tFlowK - tSourceK)).toFixed(2));
  const carnotEfficiencyPercent = Number(((systemCop / carnotCop) * 100).toFixed(1));

  // Effizienzbewertung
  let efficiencyStatus: 'OPTIMAL' | 'GOOD' | 'FAIR' | 'CRITICAL' = 'OPTIMAL';
  let efficiencyLabel = 'Optimal';
  let efficiencyBadgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-300';
  let efficiencyDescription =
    'Sehr gute Leistungszahl. Das Temperaturniveau der Wärmepumpen ist optimal auf die Trinkwarmwasserbereitung abgestimmt.';

  if (systemCop < 2.3) {
    efficiencyStatus = 'CRITICAL';
    efficiencyLabel = 'Kritisch / Unwirtschaftlich';
    efficiencyBadgeClass = 'bg-rose-100 text-rose-800 border-rose-300';
    efficiencyDescription =
      'Sehr hohe Temperaturspreizung oder zu hohe Vorlauftemperatur. Hoher Stromverbrauch und Belastung der Verdichter.';
  } else if (systemCop < 2.85) {
    efficiencyStatus = 'FAIR';
    efficiencyLabel = 'Erhöhter Stromverbrauch';
    efficiencyBadgeClass = 'bg-amber-100 text-amber-800 border-amber-300';
    efficiencyDescription =
      'Akzeptabel für TWW-Spitzenladung bei 65°C, jedoch deutlicher Effizienzabfall gegenüber Nennpunkt.';
  } else if (systemCop < 3.3) {
    efficiencyStatus = 'GOOD';
    efficiencyLabel = 'Gut';
    efficiencyBadgeClass = 'bg-blue-100 text-blue-800 border-blue-300';
    efficiencyDescription =
      'Guter Betriebspunkt für Großwärmepumpen mit Vorlauftemperaturen um 60-65°C.';
  }

  // Kennlinie 1: COP über Quellentemperatur (-10°C bis +20°C bei aktuellem VL)
  const sourceTemps = [-10, -7, -4, 0, 4, 7, 10, 15, 20];
  const sourceTempCurve = sourceTemps.map((st) => {
    const c = calculateDynamicCop(st, avgFlowTempC);
    return {
      sourceTemp: st,
      flowTemp: avgFlowTempC,
      cop: c,
      isCurrent: Math.abs(st - avgSourceTempC) < 1.5,
      status:
        c >= 3.3 ? ('OPTIMAL' as const) : c >= 2.85 ? ('GOOD' as const) : c >= 2.3 ? ('FAIR' as const) : ('CRITICAL' as const),
    };
  });

  // Kennlinie 2: COP über Vorlauftemperatur (45°C bis 70°C bei aktueller Quelle)
  const flowTemps = [45, 50, 55, 60, 65, 70];
  const flowTempCurve = flowTemps.map((ft) => {
    const c = calculateDynamicCop(avgSourceTempC, ft);
    return {
      sourceTemp: avgSourceTempC,
      flowTemp: ft,
      cop: c,
      isCurrent: Math.abs(ft - avgFlowTempC) < 2.0,
      status:
        c >= 3.3 ? ('OPTIMAL' as const) : c >= 2.85 ? ('GOOD' as const) : c >= 2.3 ? ('FAIR' as const) : ('CRITICAL' as const),
    };
  });

  const advice: string[] = [];
  if (bufferBottomTempC > 35) {
    advice.push(
      `Puffer-Rücklauf mit ${bufferBottomTempC}°C relativ hoch. Bessere FWS-Auskühlung senkt den Rücklauf und steigert den WP-COP um ca. 2% pro Kelvin.`
    );
  } else {
    advice.push(
      `Hervorragende Rücklauftemperatur (${bufferBottomTempC}°C). Ermöglicht den Wärmepumpen maximale Effizienz im Teillastbetrieb.`
    );
  }

  if (avgFlowTempC > 65) {
    advice.push(
      'Vorlauftemperatur >65°C nur für Legionellenschutz/Desinfektion empfohlen. Im Dauerbetrieb belasten >65°C den COP und die Verdichterstandzeit.'
    );
  }

  return {
    systemCop,
    nominalCop,
    avgSourceTempC: Number(avgSourceTempC.toFixed(1)),
    avgFlowTempC: Number(avgFlowTempC.toFixed(1)),
    bufferBottomTempC,
    tempLiftK,
    carnotCop,
    carnotEfficiencyPercent,
    efficiencyStatus,
    efficiencyLabel,
    efficiencyBadgeClass,
    efficiencyDescription,
    sourceTempCurve,
    flowTempCurve,
    technicianAdvice: advice,
  };
}

/**
 * Kernfunktion für die thermodynamische Gesamtsystemberechnung
 */
export function calculateSystemMetrics(
  heatPumps: HeatPumpConfig[],
  centralHeating: CentralHeatingConfig,
  buffer: BufferStorageConfig,
  fws: FreshWaterStationConfig,
  sanitary: SanitaryConsumerConfig,
  circulation: CirculationConfig
): SystemCalculations {
  // 1. Erzeugung Wärmepumpen (3x WP à 45 kW)
  const activeHeatPumps = heatPumps.filter((wp) => wp.enabled);
  const totalWpThermalPowerKw = activeHeatPumps.reduce(
    (acc, wp) => acc + wp.thermalPowerKw,
    0
  );

  const copAnalysis = generateCopAnalysis(heatPumps, buffer.topTempC, buffer.bottomTempC);
  const systemCop = copAnalysis.systemCop;

  const totalWpElectricalPowerKw =
    systemCop > 0 ? Number((totalWpThermalPowerKw / systemCop).toFixed(1)) : 0;

  // 2. Erzeugung Zentralheizung (136 kW Plattenwärmetauscher)
  const centralHeatingPowerKw = centralHeating.enabled ? centralHeating.powerKw : 0;

  // Gesamte thermische Leistung
  const totalHeatGenerationPowerKw = totalWpThermalPowerKw + centralHeatingPowerKw;

  // 3. Verbraucher Sanitär (50 Duschen, 50 Waschtische in 10 Zonen)
  const showerMixedFlowLmin =
    (sanitary.activeShowersCount * sanitary.showerFlowRateLmin * sanitary.showerSimultaneityPercent) / 100;

  const washbasinMixedFlowLmin =
    (sanitary.activeWashbasinsCount * sanitary.washbasinFlowRateLmin * sanitary.washbasinSimultaneityPercent) / 100;

  const peakMixedWaterFlowLmin = showerMixedFlowLmin + washbasinMixedFlowLmin;

  // Mischkreuzberechnung für 60°C TWW und 10°C Kaltwasser
  const tKalt = fws.coldWaterInletTempC;
  const tWarm = fws.hotWaterOutletTempC; // 60°C
  const tMischShower = sanitary.showerMixedTempC; // 40°C
  const tMischWash = sanitary.washbasinMixedTempC; // 38°C

  const showerRatioHot = Math.max(0, Math.min(1, (tMischShower - tKalt) / (tWarm - tKalt)));
  const washbasinRatioHot = Math.max(0, Math.min(1, (tMischWash - tKalt) / (tWarm - tKalt)));

  const peakHotWaterFlowLmin = Number(
    (showerMixedFlowLmin * showerRatioHot + washbasinMixedFlowLmin * washbasinRatioHot).toFixed(1)
  );
  const peakHotWaterFlowM3h = Number(((peakHotWaterFlowLmin * 60) / 1000).toFixed(2));
  const coldWaterFlowLmin = Number((peakMixedWaterFlowLmin - peakHotWaterFlowLmin).toFixed(1));

  // Thermische Spitzenlast an den FWS (kW): P = V_Lmin * 60 * c * (T_warm - T_kalt)
  const peakThermalDemandKw = Number(
    (peakHotWaterFlowLmin * 60 * SPECIFIC_HEAT_WATER_KWH_PER_L_K * (tWarm - tKalt)).toFixed(1)
  );

  // 4. Zirkulationssystem (Verluste & Pumpenauslegung)
  const circulationLossKw = Number(
    ((circulation.pipeLengthMeters * circulation.specificHeatLossWpm) / 1000).toFixed(2)
  );

  const minPumpFlowLh =
    circulationLossKw > 0
      ? Number(((circulationLossKw / (5.0 * SPECIFIC_HEAT_WATER_KWH_PER_L_K))).toFixed(0))
      : 0;

  const circDeltaTK =
    circulation.pumpFlowRateLh > 0
      ? Number((circulationLossKw / (circulation.pumpFlowRateLh * SPECIFIC_HEAT_WATER_KWH_PER_L_K)).toFixed(1))
      : 0;

  const circulationPumpAdequate = circDeltaTK <= 5.0 && circulation.pumpFlowRateLh >= minPumpFlowLh;

  // 5. Pufferspeicher & nutzbare Wärmeenergie (3x 2.000 L)
  const totalStorageVolumeLiters = buffer.count * buffer.volumePerTankLiters;
  const deltaTBuffer = Math.max(0, buffer.topTempC - buffer.bottomTempC);
  const totalStoredEnergyKwh = Number(
    (totalStorageVolumeLiters * SPECIFIC_HEAT_WATER_KWH_PER_L_K * deltaTBuffer).toFixed(1)
  );

  const maxDeltaT = Math.max(1, buffer.targetChargingTempC - 20);
  const storageStateOfChargePercent = Math.min(
    100,
    Math.max(0, Math.round((deltaTBuffer / maxDeltaT) * 100))
  );

  // 6. Frischwasserstationen (4 Stationen Kaskade)
  const fwsTotalCapacityLmin = fws.activeStations * fws.maxCapacityPerStationLmin;
  const fwsCapacityUtilizationPercent =
    fwsTotalCapacityLmin > 0
      ? Math.round((peakHotWaterFlowLmin / fwsTotalCapacityLmin) * 100)
      : 999;
  const fwsSufficient = peakHotWaterFlowLmin <= fwsTotalCapacityLmin;

  // Reale FWS-Rücklauf-Ventilschaltung
  const fwsReturnValvePosition: 'BOTTOM_STRAT' | 'MID_STRAT' =
    fws.primaryReturnTempC < 30.0 ? 'BOTTOM_STRAT' : 'MID_STRAT';
  const fwsReturnValveReason =
    fwsReturnValvePosition === 'BOTTOM_STRAT'
      ? 'FWS-Rücklauf < 30°C: Einschichtung in die unterste Fußzone von Puffer 3 zur Sicherung des maximalen WP-COP.'
      : 'FWS-Rücklauf ≥ 30°C: Einschichtung in Mittelzone von Puffer 3, um Fußzone für WP-Rücklauf kühl zu halten.';

  // Trinkwasserzähler (Zulauf FWS)
  let waterMeterDeltaM3: number | undefined = undefined;
  let waterMeterThermalEnergyKwh: number | undefined = undefined;
  if (
    fws.waterMeterReadingM3 !== undefined &&
    fws.waterMeterLastReadingM3 !== undefined &&
    fws.waterMeterReadingM3 >= fws.waterMeterLastReadingM3
  ) {
    waterMeterDeltaM3 = Number((fws.waterMeterReadingM3 - fws.waterMeterLastReadingM3).toFixed(2));
    const deltaLiters = waterMeterDeltaM3 * 1000;
    waterMeterThermalEnergyKwh = Number(
      (deltaLiters * SPECIFIC_HEAT_WATER_KWH_PER_L_K * (tWarm - tKalt)).toFixed(1)
    );
  }

  // 7. Physikalische Machbarkeit & Veto-Prüfung
  const requiredBufferMinTempC = fws.hotWaterOutletTempC + (fws.designPinchPointK ?? FWS_HEAT_EXCHANGER_MIN_PINCH_POINT_K);
  let isThermalSupplyFeasible = true;
  let supplyInfeasibilityReason: string | undefined = undefined;

  if (buffer.topTempC < requiredBufferMinTempC) {
    isThermalSupplyFeasible = false;
    supplyInfeasibilityReason = `Speichervorlauf (${buffer.topTempC}°C) liegt unter der Mindesttemperatur für den Wärmeübertrager (${requiredBufferMinTempC}°C = ${fws.hotWaterOutletTempC}°C Soll + ${fws.designPinchPointK ?? 4} K Grädigkeit). Warmwassertemperatur bricht sofort ein!`;
  } else if (!fwsSufficient) {
    isThermalSupplyFeasible = false;
    supplyInfeasibilityReason = `FWS-Kaskade hydraulisch überlastet (${peakHotWaterFlowLmin} l/min Bedarf > ${fwsTotalCapacityLmin} l/min Kapazität). Stationen können Zapfspitze nicht bedienen.`;
  }

  // 8. Autonomie / Versorgungsdauer (Minuten)
  const totalDemandKw = peakThermalDemandKw + circulationLossKw;
  const netDeficitKw = totalDemandKw - totalHeatGenerationPowerKw;

  let autonomyStorageOnlyMinutes = 0;
  let autonomyWithGenerationMinutes = 0;

  if (isThermalSupplyFeasible && peakThermalDemandKw > 0) {
    autonomyStorageOnlyMinutes = Math.round((totalStoredEnergyKwh / totalDemandKw) * 60);

    if (netDeficitKw <= 0) {
      autonomyWithGenerationMinutes = 999;
    } else {
      autonomyWithGenerationMinutes = Math.round((totalStoredEnergyKwh / netDeficitKw) * 60);
    }
  }

  // 9. Duschgang-Bilanz (z.B. 6 Minuten Duschzyklus)
  const sessionDurationMin = 6.0;
  const showerSessionTotalMixedLiters = Math.round(peakMixedWaterFlowLmin * sessionDurationMin);
  const showerSessionTotalHot60Liters = Math.round(peakHotWaterFlowLmin * sessionDurationMin);
  const showerSessionEnergyKwh = Number(
    (peakThermalDemandKw * (sessionDurationMin / 60)).toFixed(1)
  );

  const showerSessionRechargeTimeWpMinutes =
    totalWpThermalPowerKw > 0
      ? Number(((showerSessionEnergyKwh / totalWpThermalPowerKw) * 60).toFixed(1))
      : 0;

  const showerSessionRechargeTimeWtMinutes =
    centralHeatingPowerKw > 0
      ? Number(((showerSessionEnergyKwh / centralHeatingPowerKw) * 60).toFixed(1))
      : 0;

  const showerSessionRechargeTimeCombinedMinutes =
    totalHeatGenerationPowerKw > 0
      ? Number(((showerSessionEnergyKwh / totalHeatGenerationPowerKw) * 60).toFixed(1))
      : 0;

  // Ladedauern Gesamtspeicher
  const fullRechargeEnergyKwh = Number(
    (totalStorageVolumeLiters * SPECIFIC_HEAT_WATER_KWH_PER_L_K * (buffer.targetChargingTempC - buffer.bottomTempC)).toFixed(1)
  );

  const fullStorageRechargeHoursWp =
    totalWpThermalPowerKw > 0
      ? Number((fullRechargeEnergyKwh / totalWpThermalPowerKw).toFixed(1))
      : 0;

  const fullStorageRechargeHoursWt =
    centralHeatingPowerKw > 0
      ? Number((fullRechargeEnergyKwh / centralHeatingPowerKw).toFixed(1))
      : 0;

  const fullStorageRechargeHoursCombined =
    totalHeatGenerationPowerKw > 0
      ? Number((fullRechargeEnergyKwh / totalHeatGenerationPowerKw).toFixed(1))
      : 0;

  // 10. Betriebszustand
  const netPowerBalanceKw = Number((totalHeatGenerationPowerKw - totalDemandKw).toFixed(1));
  let operatingStateKey: 'DISCHARGING_FAST' | 'DISCHARGING_SLOW' | 'BALANCED' | 'CHARGING' | 'STANDBY_CIRCULATION';
  let operatingStateTitle = '';
  let operatingStateDescription = '';

  if (peakThermalDemandKw === 0) {
    operatingStateKey = 'STANDBY_CIRCULATION';
    operatingStateTitle = 'Bereitschaft / Nur Zirkulation';
    operatingStateDescription = 'Keine Duschzapfung aktiv. Erzeugung deckt Zirkulationsverlust und lädt Speicher nach.';
  } else if (netPowerBalanceKw < -50) {
    operatingStateKey = 'DISCHARGING_FAST';
    operatingStateTitle = 'Starke Speicherentladung (Spitzenlast)';
    operatingStateDescription = 'Hoher Duschbetrieb. Pufferspeicher stützt die Spitzenlast ab.';
  } else if (netPowerBalanceKw < 0) {
    operatingStateKey = 'DISCHARGING_SLOW';
    operatingStateTitle = 'Leichte Speicherentladung';
    operatingStateDescription = 'Erzeugung fast ausreichend, Speicher gleicht verbleibendes Defizit langsam aus.';
  } else if (netPowerBalanceKw <= 15) {
    operatingStateKey = 'BALANCED';
    operatingStateTitle = 'Thermisches Gleichgewicht';
    operatingStateDescription = 'Wärmeerzeugung entspricht exakt dem momentanen Warmwasserverbrauch.';
  } else {
    operatingStateKey = 'CHARGING';
    operatingStateTitle = 'Speicherladung';
    operatingStateDescription = 'Erzeugungsüberschuss lädt die 6.000 Liter Puffervolumen nach.';
  }

  // 11. Trinkwasserhygiene & Norm-Compliance
  const w551OutletTempStatus =
    fws.hotWaterOutletTempC >= 60.0 ? 'OK' : fws.hotWaterOutletTempC >= 58.0 ? 'WARNING' : 'ERROR';

  const w551ReturnTempStatus =
    circulation.returnTempC >= 55.0 ? 'OK' : circulation.returnTempC >= 53.0 ? 'WARNING' : 'ERROR';

  const w551TempDropStatus =
    circDeltaTK <= 5.0 ? 'OK' : circDeltaTK <= 6.5 ? 'WARNING' : 'ERROR';

  const threeLiterRuleStatus =
    circulation.maxTapDistancePipeVolumeLitres <= 3.0 ? 'OK' : 'ERROR';

  const fwsCapacityStatus =
    fwsCapacityUtilizationPercent <= 90 ? 'OK' : fwsCapacityUtilizationPercent <= 100 ? 'WARNING' : 'ERROR';

  const bufferDimStatus =
    autonomyStorageOnlyMinutes >= 15 ? 'OK' : autonomyStorageOnlyMinutes >= 8 ? 'WARNING' : 'ERROR';

  let overallScore = 100;
  if (w551OutletTempStatus === 'ERROR') overallScore -= 25;
  if (w551OutletTempStatus === 'WARNING') overallScore -= 10;
  if (w551ReturnTempStatus === 'ERROR') overallScore -= 25;
  if (w551ReturnTempStatus === 'WARNING') overallScore -= 10;
  if (w551TempDropStatus === 'ERROR') overallScore -= 20;
  if (w551TempDropStatus === 'WARNING') overallScore -= 10;
  if (threeLiterRuleStatus === 'ERROR') overallScore -= 15;
  if (fwsCapacityStatus === 'ERROR') overallScore -= 25;
  if (fwsCapacityStatus === 'WARNING') overallScore -= 10;
  if (!isThermalSupplyFeasible) overallScore -= 30;

  const overallScorePercent = Math.max(0, Math.min(100, overallScore));
  const overallStatus: 'OK' | 'WARNING' | 'ERROR' =
    overallScorePercent >= 85 && isThermalSupplyFeasible
      ? 'OK'
      : overallScorePercent >= 60
      ? 'WARNING'
      : 'ERROR';

  return {
    totalHeatGenerationPowerKw,
    totalWpThermalPowerKw,
    totalWpElectricalPowerKw,
    systemCop,
    centralHeatingPowerKw,
    totalStorageVolumeLiters,
    totalStoredEnergyKwh,
    effectiveTemperatureDifferenceK: deltaTBuffer,
    storageStateOfChargePercent,
    peakHotWaterFlowLmin,
    peakHotWaterFlowM3h,
    peakMixedWaterFlowLmin,
    peakThermalDemandKw,
    fwsTotalCapacityLmin,
    fwsCapacityUtilizationPercent,
    fwsSufficient,
    isThermalSupplyFeasible,
    supplyInfeasibilityReason,
    isHydraulicOverloaded: !fwsSufficient,
    fwsReturnValvePosition,
    fwsReturnValveReason,
    waterMeterDeltaM3,
    waterMeterThermalEnergyKwh,
    netPowerBalanceKw,
    operatingStateKey,
    operatingStateTitle,
    operatingStateDescription,
    coldWaterFlowLmin,
    showerSessionTotalMixedLiters,
    showerSessionTotalHot60Liters,
    showerSessionEnergyKwh,
    showerSessionRechargeTimeWpMinutes,
    showerSessionRechargeTimeWtMinutes,
    showerSessionRechargeTimeCombinedMinutes,
    fullStorageRechargeHoursWp,
    fullStorageRechargeHoursWt,
    fullStorageRechargeHoursCombined,
    circulationLossKw,
    circulationTempDropK: circDeltaTK,
    circulationPumpMinFlowLh: minPumpFlowLh,
    circulationPumpAdequate,
    copAnalysis,
    normCompliance: {
      w551OutletTemp: {
        status: w551OutletTempStatus,
        actual: fws.hotWaterOutletTempC,
        target: 60.0,
        rule: 'DVGW W 551 Abs. 6.2 (Großanlagen ≥ 60°C am Austritt)',
        description: 'Warmwasser-Austrittstemperatur am Erzeuger zur thermischen Legionellenabtötung.',
      },
      w551ReturnTemp: {
        status: w551ReturnTempStatus,
        actual: circulation.returnTempC,
        target: 55.0,
        rule: 'DVGW W 551 Abs. 6.3.1 (Zirkulation ≥ 55°C Rücklauf)',
        description: 'Rücklauftemperatur im gesamten Leitungsnetz darf 55°C nicht unterschreiten.',
      },
      w551TempDrop: {
        status: w551TempDropStatus,
        actual: circDeltaTK,
        target: 5.0,
        rule: 'DVGW W 551 & DIN 1988-200 (ΔT ≤ 5 K Spreizung)',
        description: 'Maximaler Temperaturverlust zwischen Vorlauf und Zirkulationsrücklauf.',
      },
      threeLiterRule: {
        status: threeLiterRuleStatus,
        actualVolumeL: circulation.maxTapDistancePipeVolumeLitres,
        rule: 'DIN 1988-200 / DVGW W 551 (3-Liter-Regel)',
        description: 'Wasservolumen zwischen Abzweig Zirkulation und jeder Zapfstelle ≤ 3,0 Liter.',
      },
      fwsCapacityCheck: {
        status: fwsCapacityStatus,
        demandLmin: peakHotWaterFlowLmin,
        capacityLmin: fwsTotalCapacityLmin,
        utilization: fwsCapacityUtilizationPercent,
        rule: 'DIN 1988-300 / DIN EN 806 (Spitzenvolumenstrom-Deckung)',
        description: 'Kapazitätsauslastung der 4 kaskadierten Frischwasserstationen bei Spitzenlast.',
      },
      bufferDimensioningCheck: {
        status: bufferDimStatus,
        autonomyMinutes: autonomyStorageOnlyMinutes,
        rule: 'DIN 4708 Abs. 5 (Warmwasserbedarf & Speichervorrat)',
        description: 'Vorhaltevolumen im 6.000 L Pufferspeicher für ungedeckte Entladespitzen.',
      },
    },
    autonomyStorageOnlyMinutes,
    autonomyWithGenerationMinutes,
    overallStatus,
    overallScorePercent,
  };
}

export const DEFAULT_HEAT_PUMPS: HeatPumpConfig[] = [
  {
    id: 'wp-1',
    name: 'Wärmepumpe 1 (Grundlast)',
    thermalPowerKw: 45,
    electricalPowerKw: 13.6,
    cop: 3.3,
    flowTempC: 65.0,
    sourceTempC: 7.0,
    enabled: true,
  },
  {
    id: 'wp-2',
    name: 'Wärmepumpe 2 (Mittellast)',
    thermalPowerKw: 45,
    electricalPowerKw: 13.6,
    cop: 3.3,
    flowTempC: 65.0,
    sourceTempC: 7.0,
    enabled: true,
  },
  {
    id: 'wp-3',
    name: 'Wärmepumpe 3 (Spitzenlast / Redundanz)',
    thermalPowerKw: 45,
    electricalPowerKw: 13.6,
    cop: 3.3,
    flowTempC: 65.0,
    sourceTempC: 7.0,
    enabled: true,
  },
];

export const DEFAULT_CENTRAL_HEATING: CentralHeatingConfig = {
  enabled: true,
  powerKw: 136,
  flowTempC: 70.0,
  description: '136 kW Plattenwärmetauscher zur zentralen Nah-/Fernwärme oder Heizkesselanlage',
};

export const DEFAULT_BUFFER_STORAGE: BufferStorageConfig = {
  count: 3,
  volumePerTankLiters: 2000,
  topTempC: 65.0,
  bottomTempC: 28.0,
  targetChargingTempC: 65.0,
  minUsableTempC: 55.0,
  heatLossPerDayKwh: 4.8,
};

export const DEFAULT_FWS: FreshWaterStationConfig = {
  activeStations: 4,
  maxCapacityPerStationLmin: 80,
  coldWaterInletTempC: 10.0,
  hotWaterOutletTempC: 60.0,
  primaryFlowTempC: 65.0,
  primaryReturnTempC: 28.0,
  designPinchPointK: 4.0,
  waterMeterReadingM3: 1428.65,
  waterMeterLastReadingM3: 1420.20,
};

export const DEFAULT_SANITARY: SanitaryConsumerConfig = {
  showersCount: 50,
  showerFlowRateLmin: 9.0,
  showerSimultaneityPercent: 60,
  showerMixedTempC: 40.0,
  activeShowersCount: 30,
  washbasinsCount: 50,
  washbasinFlowRateLmin: 5.0,
  washbasinSimultaneityPercent: 40,
  washbasinMixedTempC: 38.0,
  activeWashbasinsCount: 20,
};

export const DEFAULT_CIRCULATION: CirculationConfig = {
  pipeLengthMeters: 180,
  specificHeatLossWpm: 12.0,
  pumpPowerWatts: 45,
  flowTempC: 60.0,
  returnTempC: 56.0,
  pumpFlowRateLh: 600,
  maxAllowedPipeVolumeLitres: 3.0,
  maxTapDistancePipeVolumeLitres: 2.4,
};

export const DEFAULT_INSPECTION: TechnicianInspection = {
  inspectorName: '',
  companyName: '',
  facilityName: 'Sportzentrum & Duschkomplex Nord (Großanlage)',
  facilityAddress: 'Olympiastraße 14, 80809 München',
  inspectionDate: new Date().toISOString().slice(0, 10),
  orderNumber: 'PR-2026-TWW-01',
  measuredSystemPressureBar: undefined,
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
  statusApproved: false,
};
