import React, { useState } from 'react';
import {
  Wrench,
  Gauge,
  Thermometer,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { SystemCalculations } from '../types';

interface FieldInspectionChecklistProps {
  metrics: SystemCalculations;
}

export const FieldInspectionChecklist: React.FC<FieldInspectionChecklistProps> = ({
  metrics,
}) => {
  const [measuredPressure, setMeasuredPressure] = useState<number>(3.0);
  const [showTips, setShowTips] = useState<boolean>(false);

  return (
    <div
      id="field-inspection-checklist"
      className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-slate-700" />
            Monteur-Praxis-Checkliste & Inbetriebnahmeprüfung
          </h2>
          <p className="text-xs text-slate-500">
            Wichtige Vor-Ort-Messungen und Prüfschritte bei Wartung und hydraulischem Abgleich
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowTips(!showTips)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition self-start sm:self-auto cursor-pointer"
        >
          <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
          <span>{showTips ? 'Tipps ausblenden' : 'Monteur-Praxistipps'}</span>
        </button>
      </div>

      {showTips && (
        <div className="mb-4 p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 space-y-2 animate-fade-in">
          <div className="font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
            Praxishinweise für den Monteur vor Ort:
          </div>
          <ul className="list-disc list-inside space-y-1 text-slate-700 text-[11px]">
            <li>
              <strong>Pufferspeicher-Schichtung:</strong> Um den hohen COP der 3 Wärmepumpen zu sichern, muss der Rücklauf aus den 4 FWS unter 30°C liegen. Ein zu hoher Rücklauf deutet auf verkalkte Plattenwärmetauscher oder zu geringe Durchströmung auf der Sekundärseite hin.
            </li>
            <li>
              <strong>Hydraulischer Abgleich der FWS:</strong> Bei Kaskadierung von 4 Frischwasserstationen muss sichergestellt sein, dass das Heizwasser über ein Tichelmann-System oder voreinstellbare Strangregulierventile gleichmäßig verteilt wird.
            </li>
            <li>
              <strong>Zirkulationstemperatur:</strong> Bei Unterschreitung von 55°C im Zirkulationsrücklauf muss gemäß Trinkwasserverordnung unverzüglich die Pumpe kontrolliert oder der hydraulische Strangabgleich nachjustiert werden.
            </li>
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        {/* Pressure & Safety */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-blue-600" />
              Anlagendruck
            </span>
            <span
              className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                measuredPressure >= 2.5 && measuredPressure <= 3.5
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {measuredPressure.toFixed(1)} bar
            </span>
          </div>

          <div>
            <div className="flex justify-between text-slate-500 text-[11px] mb-1">
              <span>Manometer-Ablesung (bar)</span>
              <span>Soll: 2.5 - 3.5 bar</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="5.0"
              step="0.1"
              value={measuredPressure}
              onChange={(e) => setMeasuredPressure(Number(e.target.value))}
              className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded"
            />
          </div>

          <p className="text-[10px] text-slate-500">
            {measuredPressure < 2.0
              ? 'Achtung: Druck zu niedrig! MAG Vordruck und Nachspeisung prüfen.'
              : measuredPressure > 3.8
              ? 'Achtung: Druck zu hoch! Sicherheitsventil 4 bar Ansprechgrenze beachten.'
              : 'Betriebsdruck im optimalen Bereich.'}
          </p>
        </div>

        {/* Temperature Delta FWS */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
          <span className="font-bold text-slate-800 flex items-center gap-1.5">
            <Thermometer className="w-4 h-4 text-emerald-600" />
            Auskühlung FWS Rücklauf
          </span>

          <div className="text-[11px] text-slate-600 space-y-1.5 pt-1">
            <div className="flex justify-between">
              <span>Puffer-Vorlauf zur FWS:</span>
              <span className="font-mono font-bold text-slate-800">
                {metrics.fwsPrimaryFlowTempC.toFixed(1)} °C
              </span>
            </div>
            <div className="flex justify-between">
              <span>Rücklauf zum Puffer:</span>
              <span className="font-mono font-bold text-emerald-700">
                {metrics.fwsPrimaryReturnTempC.toFixed(1)} °C
              </span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-1">
              <span>Auskühlungs-Spreizung:</span>
              <span className="font-mono font-bold text-blue-700">
                {metrics.fwsPrimaryDeltaTK.toFixed(1)} K
              </span>
            </div>
          </div>

          <p className="text-[10px] text-emerald-700 mt-1">
            {metrics.fwsPrimaryReturnTempC <= 30
              ? 'Hervorragende Auskühlung. Hält den unteren Pufferbereich kalt für maximale Wärmepumpen-Effizienz.'
              : 'Erhöhte Rücklauftemperatur: Verminderte Schichtungseffizienz prüfen.'}
          </p>
        </div>

        {/* Circulation Flow & Delta-T */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
          <span className="font-bold text-slate-800 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-violet-600" />
            Zirkulations-Schnelldiagnose
          </span>

          <div className="text-[11px] text-slate-600 space-y-1.5 pt-1">
            <div className="flex justify-between">
              <span>Errechneter Verlust:</span>
              <span className="font-mono font-bold">{metrics.circulationLossKw} kW</span>
            </div>
            <div className="flex justify-between">
              <span>Mindest-Volumenstrom:</span>
              <span className="font-mono font-bold">{metrics.circulationPumpMinFlowLh} l/h</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-1">
              <span>Aktuelle Spreizung:</span>
              <span
                className={`font-mono font-bold ${
                  !metrics.isCirculationReturnPlausible || metrics.circulationTempDropK < 0
                    ? 'text-rose-600'
                    : metrics.circulationTempDropK <= 5.0
                    ? 'text-emerald-700'
                    : 'text-rose-600'
                }`}
              >
                {metrics.circulationTempDropK} K
              </span>
            </div>
          </div>

          <p className="text-[10px] text-slate-500 mt-1">
            {!metrics.isCirculationReturnPlausible || metrics.circulationTempDropK < 0
              ? 'Unplausibel: Rücklauf wärmer als Vorlauf. Sensorik prüfen!'
              : metrics.circulationPumpAdequate
              ? 'Zirkulationspumpe ausreichend dimensioniert nach DVGW W 551.'
              : 'Pumpenleistung unzureichend! Spreizung überschreitet 5 K.'}
          </p>
        </div>
      </div>
    </div>
  );
};
