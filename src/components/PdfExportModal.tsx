import React, { useState } from 'react';
import {
  X,
  FileText,
  Download,
  CheckCircle,
  AlertTriangle,
  ClipboardCheck,
  ShieldCheck,
  Building,
  User,
  Gauge,
  Thermometer,
} from 'lucide-react';
import {
  TechnicianInspection,
  SystemCalculations,
  HeatPumpConfig,
  CentralHeatingConfig,
  BufferStorageConfig,
  FreshWaterStationConfig,
  CirculationConfig,
} from '../types';
import { generateInspectionPdf } from '../utils/pdfExport';

interface PdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  inspection: TechnicianInspection;
  setInspection: React.Dispatch<React.SetStateAction<TechnicianInspection>>;
  metrics: SystemCalculations;
  heatPumps: HeatPumpConfig[];
  centralHeating: CentralHeatingConfig;
  buffer: BufferStorageConfig;
  fws: FreshWaterStationConfig;
  circulation: CirculationConfig;
}

export const PdfExportModal: React.FC<PdfExportModalProps> = ({
  isOpen,
  onClose,
  inspection,
  setInspection,
  metrics,
  heatPumps,
  centralHeating,
  buffer,
  fws,
  circulation,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const handleDownload = () => {
    setIsGenerating(true);
    try {
      generateInspectionPdf(
        inspection,
        metrics,
        heatPumps,
        centralHeating,
        buffer,
        fws,
        circulation
      );
    } catch (err) {
      console.error('Fehler bei der PDF-Erstellung:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                Fachmonteur-Abnahmeprotokoll (PDF-Export)
              </h3>
              <p className="text-xs text-slate-300">
                Offizieller Nachweis nach DIN 1988-200 / DVGW W 551 / DIN 4708 / DIN EN 12831-3
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* Status-Ampel Übersicht */}
          <div
            className={`p-4 rounded-xl border flex items-center justify-between ${
              metrics.overallStatus === 'OK'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : metrics.overallStatus === 'WARNING'
                ? 'bg-amber-50 border-amber-300 text-amber-950'
                : 'bg-rose-50 border-rose-300 text-rose-950'
            }`}
          >
            <div className="flex items-center gap-3">
              {metrics.overallStatus === 'OK' ? (
                <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0" />
              )}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider">
                  Konformitätsbewertung: {metrics.overallScorePercent}% (
                  {metrics.overallStatus === 'OK'
                    ? 'Normgerecht'
                    : metrics.overallStatus === 'WARNING'
                    ? 'Eingeschränkt konform'
                    : 'Kritische Abweichung'}
                  )
                </h4>
                <p className="text-xs mt-0.5 opacity-90">
                  {metrics.overallStatus === 'OK'
                    ? 'Alle Kernanforderungen der DVGW W 551 und DIN 1988-200 werden rechnerisch eingehalten.'
                    : 'Einzelne Grenzwerte oder Leistungsreserven weichen von der Normvorgabe ab.'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <label className="text-xs font-semibold flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={inspection.statusApproved}
                  onChange={(e) =>
                    setInspection((prev) => ({ ...prev, statusApproved: e.target.checked }))
                  }
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                Fachliche Freigabe erteilen
              </label>
            </div>
          </div>

          {/* 1. Stammdaten */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Building className="w-4 h-4 text-slate-500" />
              1. Auftrags- & Anlagendaten
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">
                  Objekt / Liegenschaft:
                </label>
                <input
                  type="text"
                  value={inspection.facilityName}
                  onChange={(e) =>
                    setInspection((p) => ({ ...p, facilityName: e.target.value }))
                  }
                  className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">
                  Standort / Adresse:
                </label>
                <input
                  type="text"
                  value={inspection.facilityAddress}
                  onChange={(e) =>
                    setInspection((p) => ({ ...p, facilityAddress: e.target.value }))
                  }
                  className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">
                  Fachhandwerksbetrieb / Monteur:
                </label>
                <input
                  type="text"
                  placeholder="z.B. Haustechnik Meisterbetrieb GmbH"
                  value={inspection.companyName}
                  onChange={(e) =>
                    setInspection((p) => ({ ...p, companyName: e.target.value }))
                  }
                  className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">
                  Prüfdatum & Protokollnummer:
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={inspection.inspectionDate}
                    onChange={(e) =>
                      setInspection((p) => ({ ...p, inspectionDate: e.target.value }))
                    }
                    className="border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 flex-1"
                  />
                  <input
                    type="text"
                    value={inspection.orderNumber}
                    onChange={(e) =>
                      setInspection((p) => ({ ...p, orderNumber: e.target.value }))
                    }
                    placeholder="PR-2026-001"
                    className="border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 w-32"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 2. Vor-Ort Messwerte des Monteurs */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Gauge className="w-4 h-4 text-slate-500" />
              2. Vor-Ort Messwerte (Monteur-Messungen)
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <label className="text-[11px] text-slate-600 block mb-1">
                  Anlagendruck (bar):
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="z.B. 3.0"
                  value={inspection.measuredSystemPressureBar ?? ''}
                  onChange={(e) =>
                    setInspection((p) => ({
                      ...p,
                      measuredSystemPressureBar:
                        e.target.value === '' ? undefined : Number(e.target.value),
                    }))
                  }
                  className="w-full border border-slate-300 rounded px-2.5 py-1 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-600 block mb-1">
                  TWW-Austritt gemessen (°C):
                </label>
                <input
                  type="number"
                  step="0.5"
                  placeholder={`${fws.hotWaterOutletTempC}`}
                  value={inspection.measuredFwsOutletTempC ?? ''}
                  onChange={(e) =>
                    setInspection((p) => ({
                      ...p,
                      measuredFwsOutletTempC:
                        e.target.value === '' ? undefined : Number(e.target.value),
                    }))
                  }
                  className="w-full border border-slate-300 rounded px-2.5 py-1 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-600 block mb-1">
                  Zirkulation Rücklauf (°C):
                </label>
                <input
                  type="number"
                  step="0.5"
                  placeholder={`${circulation.returnTempC}`}
                  value={inspection.measuredCircReturnTempC ?? ''}
                  onChange={(e) =>
                    setInspection((p) => ({
                      ...p,
                      measuredCircReturnTempC:
                        e.target.value === '' ? undefined : Number(e.target.value),
                    }))
                  }
                  className="w-full border border-slate-300 rounded px-2.5 py-1 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-600 block mb-1">
                  WP Vorlauf gemessen (°C):
                </label>
                <input
                  type="number"
                  step="0.5"
                  placeholder={`${heatPumps[0]?.flowTempC ?? 65}`}
                  value={inspection.measuredWpFlowTempC ?? ''}
                  onChange={(e) =>
                    setInspection((p) => ({
                      ...p,
                      measuredWpFlowTempC:
                        e.target.value === '' ? undefined : Number(e.target.value),
                    }))
                  }
                  className="w-full border border-slate-300 rounded px-2.5 py-1 text-xs text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* 3. Sicherheits- & Hygienecheckliste */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-slate-500" />
              3. Checkliste nach a.a.R.d.T. & DVGW W 551
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <label className="flex items-center gap-2 text-xs text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={inspection.safetyValvesChecked}
                  onChange={(e) =>
                    setInspection((p) => ({ ...p, safetyValvesChecked: e.target.checked }))
                  }
                  className="rounded border-slate-300 text-indigo-600 w-3.5 h-3.5"
                />
                Sicherheitsventile & Druckhaltung geprüft
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={inspection.expansionVesselsChecked}
                  onChange={(e) =>
                    setInspection((p) => ({ ...p, expansionVesselsChecked: e.target.checked }))
                  }
                  className="rounded border-slate-300 text-indigo-600 w-3.5 h-3.5"
                />
                Ausdehnungsgefäße Vordruck kontrolliert
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={inspection.thermalDisinfectionTested}
                  onChange={(e) =>
                    setInspection((p) => ({ ...p, thermalDisinfectionTested: e.target.checked }))
                  }
                  className="rounded border-slate-300 text-indigo-600 w-3.5 h-3.5"
                />
                Thermisches Desinfektionsprogramm (&gt;70°C) funktionsfähig
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={inspection.circulationPumpOperational}
                  onChange={(e) =>
                    setInspection((p) => ({
                      ...p,
                      circulationPumpOperational: e.target.checked,
                    }))
                  }
                  className="rounded border-slate-300 text-indigo-600 w-3.5 h-3.5"
                />
                Hocheffizienz-Zirkulationspumpe hydraulisch abgeglichen
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={inspection.legionellaFilterInstalled}
                  onChange={(e) =>
                    setInspection((p) => ({
                      ...p,
                      legionellaFilterInstalled: e.target.checked,
                    }))
                  }
                  className="rounded border-slate-300 text-indigo-600 w-3.5 h-3.5"
                />
                Trinkwasserfilter / Rückspülfilter geprüft & gereinigt
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={inspection.stagnationProtectionActive ?? true}
                  onChange={(e) =>
                    setInspection((p) => ({
                      ...p,
                      stagnationProtectionActive: e.target.checked,
                    }))
                  }
                  className="rounded border-slate-300 text-indigo-600 w-3.5 h-3.5"
                />
                Stagnationsschutz / automatische Spülung (&lt;72h) nachgewiesen
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-800 cursor-pointer md:col-span-2">
                <input
                  type="checkbox"
                  checked={inspection.fwsSecondaryStratValveChecked ?? true}
                  onChange={(e) =>
                    setInspection((p) => ({
                      ...p,
                      fwsSecondaryStratValveChecked: e.target.checked,
                    }))
                  }
                  className="rounded border-slate-300 text-indigo-600 w-3.5 h-3.5"
                />
                3-Wege-Umschaltventil FWS-Rücklauf (Puffer 3 oben/unten) funktionsgeprüft
              </label>
            </div>
          </div>

          {/* Bemerkungen */}
          <div>
            <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block mb-1">
              Monteur-Bemerkungen / Auflagen:
            </label>
            <textarea
              rows={2}
              value={inspection.notes}
              onChange={(e) => setInspection((p) => ({ ...p, notes: e.target.value }))}
              placeholder="Besondere Hinweise, z.B. Einweisung des Betreibers erfolgt, Probeentnahme für Legionellen nach 3 Monaten empfohlen..."
              className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
          <div className="text-xs text-slate-500">
            Das Protokoll erzeugt ein druckfertiges DIN-A4-Dokument mit Tabellen und Unterschriftenfeldern.
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={handleDownload}
              disabled={isGenerating}
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {isGenerating ? 'Erzeuge PDF...' : 'Prüfprotokoll herunterladen (PDF)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
