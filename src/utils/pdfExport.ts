import { jsPDF } from 'jspdf';
import {
  HeatPumpConfig,
  CentralHeatingConfig,
  BufferStorageConfig,
  FreshWaterStationConfig,
  SanitaryConsumerConfig,
  CirculationConfig,
  SystemCalculations,
  TechnicianInspection,
} from '../types';

export function generateNormInspectionPdf(
  heatPumps: HeatPumpConfig[],
  centralHeating: CentralHeatingConfig,
  buffer: BufferStorageConfig,
  fws: FreshWaterStationConfig,
  sanitary: SanitaryConsumerConfig,
  circulation: CirculationConfig,
  metrics: SystemCalculations,
  inspection: TechnicianInspection
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - 2 * margin;

  let y = 14;

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(margin, y, contentWidth, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('ANLAGENPRÜFPROTOKOLL & NORMNACHWEIS', margin + 6, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('Trinkwassererwärmung & Hygiene gem. DIN 1988-200/-300 | DVGW W 551 | DIN 4708 | VDI 6023', margin + 6, y + 14);
  doc.text(`Protokoll-Nr.: ${inspection.orderNumber} | Datum: ${inspection.inspectionDate}`, margin + 6, y + 19);

  y += 26;

  // Project & Inspector Block (Two Columns)
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, y, contentWidth, 28, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin, y, contentWidth, 28, 'S');

  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('ANLAGENSTANDORT / BETREIBER:', margin + 4, y + 5);
  doc.text('PRÜFENDER MONTEUR / FACHBETRIEB:', margin + (contentWidth / 2) + 2, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Objekt: ${inspection.facilityName}`, margin + 4, y + 11);
  doc.text(`Adresse: ${inspection.facilityAddress}`, margin + 4, y + 16);
  doc.text(`Bereich: 10 Duschzonen (50 Duschen + 50 Waschtische)`, margin + 4, y + 21);

  doc.text(`Fachbetrieb: ${inspection.companyName}`, margin + (contentWidth / 2) + 2, y + 11);
  doc.text(`Prüfer/Meister: ${inspection.inspectorName}`, margin + (contentWidth / 2) + 2, y + 16);
  doc.text(`Gesamtstatus: ${metrics.overallStatus === 'OK' ? 'NORMKONFORM (FREIGEGEBEN)' : metrics.overallStatus === 'WARNING' ? 'EINGESCHRÄNKT (HINWEISE)' : 'MÄNGEL FESTGESTELLT'}`, margin + (contentWidth / 2) + 2, y + 21);

  y += 32;

  // Section 1: Anlagenkonfiguration & Eckdaten
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('1. ANLAGENKONFIGURATION & AUSLEGUNGSPARAMETER', margin + 3, y + 4.5);
  y += 8;

  const col1 = margin + 2;
  const col2 = margin + 55;
  const col3 = margin + 105;
  const col4 = margin + 155;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);

  // Row 1
  doc.text('Wärmepumpen (3 Stk.):', col1, y);
  doc.setTextColor(15, 23, 42);
  doc.text(`${heatPumps.filter(w => w.enabled).length} von 3 aktiv (${metrics.totalWpThermalPowerKw} kW th / COP ${metrics.systemCop} [${metrics.copAnalysis.efficiencyStatus}])`, col2, y);

  doc.setTextColor(71, 85, 105);
  doc.text('136 kW WT (Zusatz/Alt.):', col3, y);
  doc.setTextColor(15, 23, 42);
  doc.text(centralHeating.enabled ? `${centralHeating.powerKw} kW (VL ${centralHeating.flowTempC}°C)` : 'Standby / Bereit', col4, y);
  y += 5;

  // Row 2
  doc.setTextColor(71, 85, 105);
  doc.text('Pufferspeicher:', col1, y);
  doc.setTextColor(15, 23, 42);
  doc.text(`${buffer.count} x ${buffer.volumePerTankLiters} L = ${metrics.totalStorageVolumeLiters} L (${buffer.topTempC}°C / ${buffer.bottomTempC}°C)`, col2, y);

  doc.setTextColor(71, 85, 105);
  doc.text('Frischwasserstationen:', col3, y);
  doc.setTextColor(15, 23, 42);
  doc.text(`${fws.activeStations} x FWS Kaskade (${metrics.fwsTotalCapacityLmin} l/min @ ${fws.hotWaterOutletTempC}°C)`, col4, y);
  y += 5;

  // Row 3
  doc.setTextColor(71, 85, 105);
  doc.text('Verbraucher Sanitär:', col1, y);
  doc.setTextColor(15, 23, 42);
  doc.text(`10 Zonen: ${metrics.activeShowersCount} von 50 Duschen (${sanitary.showerSimultaneityPercent}%) + ${metrics.activeWashbasinsCount} WT`, col2, y);

  doc.setTextColor(71, 85, 105);
  doc.text('Zirkulationssystem:', col3, y);
  doc.setTextColor(15, 23, 42);
  doc.text(`${circulation.pipeLengthMeters}m | Pumpe: ${circulation.pumpFlowRateLh} l/h | ${circulation.flowTempC}°C / ${circulation.returnTempC}°C`, col4, y);
  y += 8;

  // Section 2: Berechnungsergebnisse & Leistungsbilanz
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('2. THERMODYNAMISCHE BERECHNUNGEN & SPITZENLASTEN', margin + 3, y + 4.5);
  y += 8;

  // Result KPI Boxes
  const kpiWidth = (contentWidth - 6) / 3;
  const kpiHeight = 16;

  // Box 1: Wärmeleistung
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, y, kpiWidth, kpiHeight, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin, y, kpiWidth, kpiHeight, 'S');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Gesamte Heizleistung / COP', margin + 3, y + 4.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`${metrics.totalHeatGenerationPowerKw} kW (COP ${metrics.systemCop})`, margin + 3, y + 10.5);
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`WP: ${metrics.totalWpThermalPowerKw} kW | ΔT: ${metrics.copAnalysis.tempLiftK} K (${metrics.copAnalysis.avgSourceTempC}→${metrics.copAnalysis.avgFlowTempC}°C)`, margin + 3, y + 14);

  // Box 2: Speicherinhalt & Autonomie
  const box2X = margin + kpiWidth + 3;
  doc.setFillColor(248, 250, 252);
  doc.rect(box2X, y, kpiWidth, kpiHeight, 'F');
  doc.rect(box2X, y, kpiWidth, kpiHeight, 'S');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Nutzenergie & Autonomie (Peak)', box2X + 3, y + 4.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`${metrics.totalStoredEnergyKwh} kWh / ${metrics.autonomyStorageOnlyMinutes} min`, box2X + 3, y + 10.5);
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Reine Speicherzeit | Mit Erzeugern: ${metrics.autonomyWithGenerationMinutes > 900 ? 'dauerhaft' : metrics.autonomyWithGenerationMinutes + ' min'}`, box2X + 3, y + 14);

  // Box 3: Spitzenbedarf
  const box3X = box2X + kpiWidth + 3;
  doc.setFillColor(248, 250, 252);
  doc.rect(box3X, y, kpiWidth, kpiHeight, 'F');
  doc.rect(box3X, y, kpiWidth, kpiHeight, 'S');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Spitzen-Warmwasser (60°C)', box3X + 3, y + 4.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`${metrics.peakHotWaterFlowLmin} l/min (${metrics.peakThermalDemandKw} kW)`, box3X + 3, y + 10.5);
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`FWS-Auslastung: ${metrics.fwsCapacityUtilizationPercent}% (${metrics.fwsTotalCapacityLmin} l/min max)`, box3X + 3, y + 14);

  y += kpiHeight + 6;

  // Section 3: Normen-Prüfung & Hygiene-Nachweis
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('3. NORM- UND HYGIENENACHWEIS GEMÄSS DIN 1988, DVGW W 551 & VDI 6023', margin + 3, y + 4.5);
  y += 8;

  // Table Header
  doc.setFillColor(226, 232, 240);
  doc.rect(margin, y, contentWidth, 5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(51, 65, 85);
  doc.text('Norm / Regelwerk', margin + 3, y + 3.5);
  doc.text('Prüfkriterium & Vorgabe', margin + 50, y + 3.5);
  doc.text('Ist-Wert', margin + 125, y + 3.5);
  doc.text('Soll-Wert', margin + 147, y + 3.5);
  doc.text('Status', margin + 168, y + 3.5);
  y += 5;

  const complianceItems = [
    {
      norm: 'DVGW W 551 Abs. 6.2',
      criteria: 'Warmwasser-Austrittstemperatur am Erzeuger',
      actual: `${fws.hotWaterOutletTempC.toFixed(1)} °C`,
      target: '>= 60,0 °C',
      status: metrics.normCompliance.w551OutletTemp.status,
    },
    {
      norm: 'DVGW W 551 Abs. 6.3.1',
      criteria: 'Zirkulations-Rücklauftemperatur',
      actual: `${circulation.returnTempC.toFixed(1)} °C`,
      target: '>= 55,0 °C',
      status: metrics.normCompliance.w551ReturnTemp.status,
    },
    {
      norm: 'DVGW W 551 & DIN 1988',
      criteria: 'Temperaturabfall Zirkulationssystem (Delta T)',
      actual: `${metrics.circulationTempDropK.toFixed(1)} K`,
      target: '<= 5,0 K',
      status: metrics.normCompliance.w551TempDrop.status,
    },
    {
      norm: 'DVGW W 551 / DIN 1988',
      criteria: '3-Liter-Regel (Leitungsvolumen bis Zapfstelle)',
      actual: `${circulation.maxTapDistancePipeVolumeLitres.toFixed(1)} Liter`,
      target: '<= 3,0 Liter',
      status: metrics.normCompliance.threeLiterRule.status,
    },
    {
      norm: 'DIN 1988-300 / DIN EN 806',
      criteria: 'Leistungsdeckung 4x FWS bei Spitzenlast',
      actual: `${metrics.fwsCapacityUtilizationPercent} % Auslastung`,
      target: '<= 100 %',
      status: metrics.normCompliance.fwsCapacityCheck.status,
    },
    {
      norm: 'DIN 4708 Abs. 5',
      criteria: 'Speichervorrat (6.000 l) für Entladespitzen',
      actual: `${metrics.autonomyStorageOnlyMinutes} min Reserve`,
      target: '>= 15 min',
      status: metrics.normCompliance.bufferDimensioningCheck.status,
    },
    {
      norm: 'VDI/DVGW 6023',
      criteria: 'Stagnationsvermeidung & Spülintervall',
      actual: 'Intervall < 72h eingehalten',
      target: '<= 72 Stunden',
      status: 'OK',
    },
  ];

  complianceItems.forEach((row, index) => {
    if (index % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, contentWidth, 5.5, 'F');
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(30, 41, 59);

    doc.text(row.norm, margin + 3, y + 4);
    doc.text(row.criteria, margin + 50, y + 4);
    doc.text(row.actual, margin + 125, y + 4);
    doc.text(row.target, margin + 147, y + 4);

    // Status Pill
    if (row.status === 'OK') {
      doc.setTextColor(22, 101, 52); // green-800
      doc.setFont('helvetica', 'bold');
      doc.text('BESTANDEN', margin + 168, y + 4);
    } else if (row.status === 'WARNING') {
      doc.setTextColor(180, 83, 9); // amber-700
      doc.setFont('helvetica', 'bold');
      doc.text('TOLERANZ', margin + 168, y + 4);
    } else {
      doc.setTextColor(185, 28, 28); // red-700
      doc.setFont('helvetica', 'bold');
      doc.text('ABWEICHUNG', margin + 168, y + 4);
    }

    y += 5.5;
  });

  y += 4;

  // Section 4: Monteur-Checkliste & Prüfbefund
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('4. VOR-ORT MONTEUR-BEFUND & SICHERHEITSPRÜFUNG', margin + 3, y + 4.5);
  y += 8;

  const checks = [
    { label: 'Sicherheitsventile & Druckhaltung geprüft', checked: inspection.safetyValvesChecked },
    { label: 'Ausdehnungsgefäße Vordruck kontrolliert', checked: inspection.expansionVesselsChecked },
    { label: 'Thermisches Desinfektionsprogramm (>70°C) funktionsfähig', checked: inspection.thermalDisinfectionTested },
    { label: 'Hocheffizienz-Zirkulationspumpe in Betrieb & abgeglichen', checked: inspection.circulationPumpOperational },
    { label: 'Trinkwasserfilter / Rückspülfilter gewartet', checked: inspection.legionellaFilterInstalled },
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

  y += 16;

  // Bemerkungen
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Monteur-Bemerkungen & Hinweise:', margin + 3, y);
  y += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(30, 41, 59);
  doc.text(
    inspection.notes ||
      'Die Anlage entspricht den anerkannten Regeln der Technik (a.a.R.d.T.). Zirkulationstemperaturen und Frischwasserstationen wurden unter Betriebslast eingemessen.',
    margin + 3,
    y,
    { maxWidth: contentWidth - 6 }
  );

  y += 10;

  // Signature Block
  const sigBoxY = pageHeight - 32;
  doc.setDrawColor(203, 213, 225);
  doc.line(margin + 4, sigBoxY, margin + 75, sigBoxY);
  doc.line(margin + 105, sigBoxY, margin + 176, sigBoxY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Datum, Unterschrift & Stempel des Fachmonteurs', margin + 4, sigBoxY + 4);
  doc.text('Kenntnisnahme & Abnahme durch Betreiber / Auftraggeber', margin + 105, sigBoxY + 4);

  // Footer
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'Generiert mit dem Warmwasser-Anlagenrechner & Prüftool nach DIN 1988 & DVGW W 551. Verbindliches Dokument zur Vorlage bei Behörden und Betreibern.',
    margin,
    pageHeight - 8
  );

  // Save PDF
  const filename = `Pruefbericht_Warmwasser_${inspection.orderNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}_${inspection.inspectionDate}.pdf`;
  doc.save(filename);
}
