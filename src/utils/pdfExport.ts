import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  HeatPumpConfig,
  CentralHeatingConfig,
  BufferStorageConfig,
  FreshWaterStationConfig,
  CirculationConfig,
  SystemCalculations,
  TechnicianInspection,
} from '../types';

export function generateInspectionPdf(
  inspection: TechnicianInspection,
  metrics: SystemCalculations,
  heatPumps: HeatPumpConfig[],
  centralHeating: CentralHeatingConfig,
  buffer: BufferStorageConfig,
  fws: FreshWaterStationConfig,
  circulation: CirculationConfig
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('ABNAHME- & PRÜFPROTOKOLL TRINKWARMWASSER-GROSSANLAGE', margin, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(
    'Fachgerechte Inbetriebnahme & Hygiene-Prüfung nach DIN 1988-200 / DVGW W 551 / DIN 4708 / DIN EN 12831-3',
    margin,
    19
  );

  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`Protokoll-Nr.: ${inspection.orderNumber || 'PR-2026-001'}`, pageWidth - margin - 45, 12);
  doc.text(`Prüfdatum: ${inspection.inspectionDate || new Date().toISOString().slice(0, 10)}`, pageWidth - margin - 45, 18);

  let y = 34;

  // 1. Stammdaten & Prüfer
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 24, 2, 2, 'FD');

  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('Anlagenstandort & Prüferangaben:', margin + 3, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Objekt: ${inspection.facilityName || 'Sportzentrum Nord'}`, margin + 3, y + 10);
  doc.text(`Adresse: ${inspection.facilityAddress || 'Olympiastraße 14, München'}`, margin + 3, y + 15);
  doc.text(`Prüfer / Monteur: ${inspection.inspectorName || 'Max Mustermann'}`, margin + 3, y + 20);

  doc.text(`Fachbetrieb: ${inspection.companyName || 'Haustechnik Meisterbetrieb GmbH'}`, margin + 95, y + 10);
  doc.text(`Freigabestatus: ${inspection.statusApproved ? 'ABGENOMMEN / BETRIEBSBEREIT' : 'MÄNGEL / NACHPRÜFUNG'}`, margin + 95, y + 15);
  doc.text(`Anlagenkonfiguration: 3x QAHV (120 kW th) + 136 kW WT (70/55°C) + 6.000 L Speicher`, margin + 95, y + 20);

  y += 28;

  // 2. Norm-Konformitäts-Bewertung (Ampelsystem)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('1. Konformitätsbewertung nach DVGW W 551 & DIN 1988', margin, y);
  y += 3;

  const complianceData = [
    [
      'TWW-Austrittstemperatur (FWS)',
      `${metrics.normCompliance.w551OutletTemp.actual}°C`,
      `>= ${metrics.normCompliance.w551OutletTemp.target}°C`,
      metrics.normCompliance.w551OutletTemp.status === 'OK' ? 'ERFÜLLT' : 'ABWEICHUNG',
      'DVGW W 551 Abs. 6.2',
    ],
    [
      'Zirkulationsrücklauf Temperatur',
      `${metrics.normCompliance.w551ReturnTemp.actual}°C`,
      `>= ${metrics.normCompliance.w551ReturnTemp.target}°C`,
      metrics.normCompliance.w551ReturnTemp.status === 'OK' ? 'ERFÜLLT' : 'ABWEICHUNG',
      'DVGW W 551 Abs. 6.3.1',
    ],
    [
      'Zirkulationsspreizung (Delta T)',
      `${metrics.normCompliance.w551TempDrop.actual} K`,
      `<= ${metrics.normCompliance.w551TempDrop.maxAllowed} K`,
      metrics.normCompliance.w551TempDrop.status === 'OK' ? 'ERFÜLLT' : 'ABWEICHUNG',
      'DVGW W 551 (Delta T <= 5K)',
    ],
    [
      '3-Liter-Regel (Leitungsvolumen)',
      `${metrics.normCompliance.threeLiterRule.actualVolumeL} Liter`,
      '<= 3,0 Liter',
      metrics.normCompliance.threeLiterRule.status === 'OK' ? 'ERFÜLLT' : 'ABWEICHUNG',
      'DIN 1988-200 / DVGW W 551',
    ],
    [
      'FWS-Kaskadenauslastung Spitzenlast',
      `${metrics.peakHotWaterFlowLmin} l/min (${metrics.normCompliance.fwsCapacityCheck.utilization}%)`,
      `<= ${metrics.fwsTotalCapacityLmin} l/min`,
      metrics.normCompliance.fwsCapacityCheck.status === 'OK' ? 'ERFÜLLT' : 'ÜBERLASTUNG',
      'DIN 1988-300',
    ],
    [
      'Pufferspeicher Vorhaltezeit',
      `${metrics.normCompliance.bufferDimensioningCheck.storedMinutes} min Reserve`,
      '>= 15 min Reserve',
      metrics.normCompliance.bufferDimensioningCheck.status === 'OK' ? 'ERFÜLLT' : 'GERING',
      'DIN 4708',
    ],
  ];

  autoTable(doc, {
    startY: y,
    head: [['Prüfkriterium / Messpunkt', 'Ist-Wert', 'Norm-Vorgabe', 'Bewertung', 'Regelwerk']],
    body: complianceData,
    theme: 'striped',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: 255,
      fontSize: 7.5,
      fontStyle: 'bold',
      cellPadding: 2,
    },
    bodyStyles: {
      fontSize: 7.5,
      cellPadding: 1.8,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { cellWidth: 55 },
      1: { cellWidth: 35, fontStyle: 'bold' },
      2: { cellWidth: 28 },
      3: { cellWidth: 28, fontStyle: 'bold' },
      4: { cellWidth: 36 },
    },
    margin: { left: margin, right: margin },
  });

  // @ts-expect-error autoTable adds lastAutoTable to doc
  y = doc.lastAutoTable.finalY + 6;

  // 3. Vor-Ort Messwerte des Monteurs
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('2. Vor-Ort Messwerte & hydraulische Parameter (Monteurabgleich)', margin, y);
  y += 3;

  const measuredData = [
    [
      'Betriebsdruck Heizkreis / Puffer:',
      inspection.measuredSystemPressureBar ? `${inspection.measuredSystemPressureBar} bar` : '3,0 bar (Soll)',
      'FWS-Austrittstemperatur TWW:',
      inspection.measuredFwsOutletTempC ? `${inspection.measuredFwsOutletTempC} °C` : `${fws.hotWaterOutletTempC} °C`,
    ],
    [
      'Wärmepumpen Vorlauftemperatur:',
      inspection.measuredWpFlowTempC ? `${inspection.measuredWpFlowTempC} °C` : `${heatPumps[0]?.flowTempC || 65} °C`,
      'Zirkulation Rücklauftemperatur:',
      inspection.measuredCircReturnTempC ? `${inspection.measuredCircReturnTempC} °C` : `${circulation.returnTempC} °C`,
    ],
    [
      'Wärmepumpen Rücklauftemperatur:',
      inspection.measuredWpReturnTempC ? `${inspection.measuredWpReturnTempC} °C` : `${buffer.bottomTempC} °C`,
      'Zirkulationsvolumenstrom:',
      `${circulation.pumpFlowRateLh} l/h`,
    ],
    [
      'Pufferspeicher oben (Zone 1):',
      inspection.measuredBufferTopTempC ? `${inspection.measuredBufferTopTempC} °C` : `${buffer.topTempC} °C`,
      '3-Wege-Ventil FWS-Rücklauf:',
      metrics.fwsReturnValvePosition === 'BOTTOM_STRAT' ? 'Zone unten (<30°C)' : 'Zone mitte (>=30°C)',
    ],
    [
      'Pufferspeicher unten (Zone 3):',
      inspection.measuredBufferBottomTempC ? `${inspection.measuredBufferBottomTempC} °C` : `${buffer.bottomTempC} °C`,
      'FWS Kaskade Schaltung:',
      `${fws.activeStations} von 4 Stationen aktiv`,
    ],
  ];

  autoTable(doc, {
    startY: y,
    head: [['Parameter', 'Messwert / Status', 'Parameter', 'Messwert / Status']],
    body: measuredData,
    theme: 'plain',
    headStyles: {
      fillColor: [71, 85, 105],
      textColor: 255,
      fontSize: 7.5,
      fontStyle: 'bold',
      cellPadding: 1.8,
    },
    bodyStyles: {
      fontSize: 7.5,
      cellPadding: 1.5,
      textColor: [30, 41, 59],
    },
    margin: { left: margin, right: margin },
  });

  // @ts-expect-error autoTable adds lastAutoTable to doc
  y = doc.lastAutoTable.finalY + 6;

  // 4. Leistungsbilanz & Energieinhalte
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('3. Leistungsbilanz & thermodynamische Kennwerte', margin, y);
  y += 3;

  const calcData = [
    [
      'Gesamte Wärmeerzeugung:',
      `${metrics.totalHeatGenerationPowerKw} kW (${metrics.totalWpThermalPowerKw} kW WP + ${metrics.centralHeatingPowerKw} kW WT)`,
      'Spitzenlast TWW 60°C:',
      `${metrics.peakThermalDemandKw} kW (${metrics.peakHotWaterFlowLmin} l/min)`,
    ],
    [
      'Pufferspeicher Nutzinhalt:',
      `${metrics.totalStorageVolumeLiters} L (Gesamt: ${metrics.storedEnergyFullDeltaKwh} kWh)`,
      'Nutzbare Energie:',
      `${metrics.totalStoredEnergyKwh} kWh (${metrics.storageCalculationModeLabel.includes('Stufe 2') ? '60% Heißwasser' : metrics.storageCalculationModeLabel})`,
    ],
    [
      'Versorgungsdauer Puffer allein:',
      metrics.isThermalSupplyFeasible ? `${metrics.autonomyStorageOnlyMinutes} Minuten` : '0 Minuten (Veto)',
      'Versorgungsdauer mit Erzeuger:',
      metrics.isThermalSupplyFeasible
        ? metrics.autonomyWithGenerationMinutes > 500
          ? 'Dauerbetrieb möglich'
          : `${metrics.autonomyWithGenerationMinutes} Minuten`
        : '0 Minuten (Veto)',
    ],
    [
      'Wiederaufladezeit 1 Duschgang (6 Min):',
      metrics.showerSessionRechargeTimeCombinedMinutes !== undefined
        ? `${metrics.showerSessionRechargeTimeCombinedMinutes} min (aktiv) | Nenn: ${metrics.showerSessionRechargeTimeNominalCombinedMinutes} min`
        : `Nenn (WP+WT 256 kW): ${metrics.showerSessionRechargeTimeNominalCombinedMinutes} min`,
      'Wärmepumpen COP / Gütegrad:',
      `COP ${metrics.systemCop} (${metrics.copAnalysis.efficiencyLabel})`,
    ],
  ];

  autoTable(doc, {
    startY: y,
    head: [['Kennwert', 'Berechneter Wert', 'Kennwert', 'Berechneter Wert']],
    body: calcData,
    theme: 'grid',
    headStyles: {
      fillColor: [51, 65, 85],
      textColor: 255,
      fontSize: 7.5,
      fontStyle: 'bold',
      cellPadding: 1.8,
    },
    bodyStyles: {
      fontSize: 7.5,
      cellPadding: 1.5,
      textColor: [30, 41, 59],
    },
    margin: { left: margin, right: margin },
  });

  // @ts-expect-error autoTable adds lastAutoTable to doc
  y = doc.lastAutoTable.finalY + 6;

  // 5. Monteur-Checkliste & Prüfvermerke
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('4. Fachmonteur-Sicherheits- & Hygienecheckliste', margin, y);
  y += 3;

  const checks = [
    { label: 'Sicherheitsventile & Druckhaltung geprüft', checked: inspection.safetyValvesChecked },
    { label: 'Ausdehnungsgefäße Vordruck kontrolliert', checked: inspection.expansionVesselsChecked },
    { label: 'Thermisches Desinfektionsprogramm (>70°C) funktionsfähig', checked: inspection.thermalDisinfectionTested },
    { label: 'Hocheffizienz-Zirkulationspumpe in Betrieb & abgeglichen', checked: inspection.circulationPumpOperational },
    { label: 'Trinkwasserfilter / Rückspülfilter gewartet', checked: inspection.legionellaFilterInstalled },
    { label: 'Stagnationsschutz / Spülmaßnahmen (<72h) nachgewiesen', checked: inspection.stagnationProtectionActive ?? true },
    { label: '3-Wege-Umschaltventil FWS-Rücklauf (Puffer 3) geprüft', checked: inspection.fwsSecondaryStratValveChecked ?? true },
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);

  checks.forEach((chk, i) => {
    const col = i % 2 === 0 ? margin + 3 : margin + 95;
    const currentY = y + Math.floor(i / 2) * 4.5;
    const mark = chk.checked ? '[ X ]' : '[   ]';
    doc.text(`${mark} ${chk.label}`, col, currentY);
  });

  y += 20;

  // Trinkwasserzähler (Zulauf FWS) Nachweiszeile
  if (fws.waterMeterReadingM3 !== undefined) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 64, 175);
    doc.text(
      `Trinkwasserzähler Zulauf FWS: ${fws.waterMeterReadingM3} m³` +
      (fws.waterMeterLastReadingM3 !== undefined ? ` (Vorwert: ${fws.waterMeterLastReadingM3} m³, Δ: ${metrics.waterMeterDeltaM3} m³ / ${metrics.waterMeterThermalEnergyKwh} kWh)` : ''),
      margin + 3,
      y
    );
    y += 5;
  }

  // Bemerkungen
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Monteur-Bemerkungen & Hinweise:', margin + 3, y);
  y += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(51, 65, 85);
  const notesText =
    inspection.notes ||
    'Anlage entspricht den allgemein anerkannten Regeln der Technik (a.a.R.d.T.). Zirkulationsabgleich nach DVGW W 551 erfolgreich durchgeführt. Hydraulische Weiche und Schichtung in Puffer 3 überprüft.';
  const splitNotes = doc.splitTextToSize(notesText, pageWidth - 2 * margin - 6);
  doc.text(splitNotes, margin + 3, y);

  y += Math.max(10, splitNotes.length * 3.5 + 4);

  // 6. Unterschriftenbereich
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, y, pageWidth - margin, y);
  y += 4;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);

  doc.text('Rechtliche Bestätigung & Abnahme:', margin, y);
  y += 6;

  // Unterschriftsfelder
  const boxWidth = (pageWidth - 2 * margin - 8) / 2;

  doc.rect(margin, y, boxWidth, 18);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Ort, Datum, Unterschrift des Fachmonteurs / Inbetriebsetzers', margin + 2, y + 15);

  doc.rect(margin + boxWidth + 8, y, boxWidth, 18);
  doc.text('Ort, Datum, Unterschrift des Betreibers / Auftraggebers', margin + boxWidth + 10, y + 15);

  // Dateiname generieren
  const cleanFacility = (inspection.facilityName || 'Anlage')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 20);
  const filename = `TWW_Pruefprotokoll_${cleanFacility}_${inspection.inspectionDate || '2026'}.pdf`;

  doc.save(filename);
}
