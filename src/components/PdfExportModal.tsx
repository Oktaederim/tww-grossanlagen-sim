import React, { useState } from 'react';
import {
  X,
  FileText,
  Download,
  Printer,
  CheckCircle2,
  Building,
  User,
  Calendar,
  ClipboardList,
} from 'lucide-react';
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
import { generateNormInspectionPdf } from '../utils/pdfExport';

interface PdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  heatPumps: HeatPumpConfig[];
  centralHeating: CentralHeatingConfig;
  buffer: BufferStorageConfig;
  fws: FreshWaterStationConfig;
  sanitary: SanitaryConsumerConfig;
  circulation: CirculationConfig;
  metrics: SystemCalculations;
  inspection: TechnicianInspection;
  setInspection: React.Dispatch<React.SetStateAction<TechnicianInspection>>;
}

export const PdfExportModal: React.FC<PdfExportModalProps> = ({
  isOpen,
  onClose,
  heatPumps,
  centralHeating,
  buffer,
  fws,
  sanitary,
  circulation,
  metrics,
  inspection,
  setInspection,
}) => {
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleDownloadPdf = () => {
    setIsExporting(true);
    try {
      generateNormInspectionPdf(
        heatPumps,
        centralHeating,
        buffer,
        fws,
        sanitary,
        circulation,
        metrics,
        inspection
      );
    } catch (err) {
      console.error('Failed to generate PDF', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div
        id="pdf-export-modal-dialog"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-scale-in"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-blue-400" />
            <div>
              <h2 className="text-base font-bold">
                Normgerechtes Prüfprotokoll & Abnahmenachweis (PDF)
              </h2>
              <p className="text-xs text-slate-300">
                Gemäß DIN 1988-200 / DIN 1988-300, DVGW W 551 und DIN 4708
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Facility & Technician Form */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
                <Building className="w-4 h-4 text-blue-600" />
                Anlagenstandort & Betreiber
              </h3>

              <div>
                <label className="text-[11px] font-medium text-slate-600 block mb-1">
                  Objekt- / Anlagenbezeichnung
                </label>
                <input
                  type="text"
                  value={inspection.facilityName}
                  onChange={(e) =>
                    setInspection((prev) => ({ ...prev, facilityName: e.target.value }))
                  }
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-600 block mb-1">
                  Standort-Adresse
                </label>
                <input
                  type="text"
                  value={inspection.facilityAddress}
                  onChange={(e) =>
                    setInspection((prev) => ({ ...prev, facilityAddress: e.target.value }))
                  }
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-600 block mb-1">
                  Protokoll- / Auftragsnummer
                </label>
                <input
                  type="text"
                  value={inspection.orderNumber}
                  onChange={(e) =>
                    setInspection((prev) => ({ ...prev, orderNumber: e.target.value }))
                  }
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 font-mono bg-white"
                />
              </div>
            </div>

            <div className="space-y-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
                <User className="w-4 h-4 text-emerald-600" />
                Prüfer & Fachbetrieb
              </h3>

              <div>
                <label className="text-[11px] font-medium text-slate-600 block mb-1">
                  Fachbetrieb / Firma
                </label>
                <input
                  type="text"
                  value={inspection.companyName}
                  onChange={(e) =>
                    setInspection((prev) => ({ ...prev, companyName: e.target.value }))
                  }
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-600 block mb-1">
                  Prüfer / SHK-Monteur
                </label>
                <input
                  type="text"
                  value={inspection.inspectorName}
                  onChange={(e) =>
                    setInspection((prev) => ({ ...prev, inspectorName: e.target.value }))
                  }
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-600 block mb-1">
                  Prüfdatum
                </label>
                <input
                  type="date"
                  value={inspection.inspectionDate}
                  onChange={(e) =>
                    setInspection((prev) => ({ ...prev, inspectionDate: e.target.value }))
                  }
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Inspection Checklist */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
              <ClipboardList className="w-4 h-4 text-blue-600" />
              Sicherheits- & Funktionsprüfungen vor Ort
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                <input
                  type="checkbox"
                  checked={inspection.safetyValvesChecked}
                  onChange={(e) =>
                    setInspection((prev) => ({
                      ...prev,
                      safetyValvesChecked: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 rounded text-blue-600 accent-blue-600"
                />
                <span>Sicherheitsventile & Druckhaltung geprüft</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                <input
                  type="checkbox"
                  checked={inspection.expansionVesselsChecked}
                  onChange={(e) =>
                    setInspection((prev) => ({
                      ...prev,
                      expansionVesselsChecked: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 rounded text-blue-600 accent-blue-600"
                />
                <span>Membran-Druckausdehnungsgefäße geprüft</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                <input
                  type="checkbox"
                  checked={inspection.thermalDisinfectionTested}
                  onChange={(e) =>
                    setInspection((prev) => ({
                      ...prev,
                      thermalDisinfectionTested: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 rounded text-blue-600 accent-blue-600"
                />
                <span>Thermisches Desinfektionsprogramm (&gt;70°C) aktivierbar</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                <input
                  type="checkbox"
                  checked={inspection.circulationPumpOperational}
                  onChange={(e) =>
                    setInspection((prev) => ({
                      ...prev,
                      circulationPumpOperational: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 rounded text-blue-600 accent-blue-600"
                />
                <span>Hocheffizienz-Zirkulationspumpe hydraulisch abgeglichen</span>
              </label>
            </div>
          </div>

          {/* Technician Notes */}
          <div>
            <label className="font-semibold text-slate-800 block mb-1">
              Prüfbefund & Anmerkungen des Monteurs für den Betreiber:
            </label>
            <textarea
              rows={3}
              value={inspection.notes}
              onChange={(e) =>
                setInspection((prev) => ({ ...prev, notes: e.target.value }))
              }
              className="w-full p-2.5 rounded-lg border border-slate-300 text-xs text-slate-800 bg-white"
            />
          </div>

          {/* Quick Norm Summary Pill */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">
                Gesamturteil: {metrics.overallStatus === 'OK' ? 'Normkonform (Freigabe erteilt)' : 'Eingeschränkt / Hinweise beachten'}
              </span>
            </div>
            <span className="font-mono font-bold">{metrics.overallScorePercent}% Score</span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-3.5 border-t border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-slate-700 hover:bg-slate-200 font-medium text-xs transition cursor-pointer"
          >
            Abbrechen
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 font-medium text-xs transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Drucken</span>
          </button>

          <button
            id="btn-download-pdf-action"
            type="button"
            disabled={isExporting}
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-sm transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Wird erstellt...' : 'PDF Protokoll herunterladen'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
