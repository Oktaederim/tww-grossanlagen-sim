import React from 'react';
import {
  Sparkles,
  Trophy,
  Coffee,
  Moon,
  AlertOctagon,
  ShieldAlert,
} from 'lucide-react';
import {
  HeatPumpConfig,
  CentralHeatingConfig,
  BufferStorageConfig,
  FreshWaterStationConfig,
  SanitaryConsumerConfig,
  CirculationConfig,
} from '../types';

interface ScenarioSimulatorProps {
  onApplyScenario: (scenarioKey: string) => void;
  activeScenario: string | null;
}

export const ScenarioSimulator: React.FC<ScenarioSimulatorProps> = ({
  onApplyScenario,
  activeScenario,
}) => {
  const scenarios = [
    {
      key: 'PEAK_SPORT',
      title: 'Spitzenlast Sport / Schichtende',
      subtitle: '40 von 50 Duschen aktiv (80% Glzg.)',
      desc: 'Härtetest für die 4 FWS und den 6.000L Speichervorrat bei maximaler Entnahme.',
      icon: Trophy,
      badge: 'Extremlast',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
    },
    {
      key: 'STANDARD_COMMERCIAL',
      title: 'Normaler Bade- & Duschbetrieb',
      subtitle: '15 Duschen aktiv (30% Glzg.)',
      desc: 'Typischer Tagesbetrieb mit optimaler Wärmepumpen-Effizienz und Schichtung.',
      icon: Coffee,
      badge: 'Regelbetrieb',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    },
    {
      key: 'LOW_NIGHT',
      title: 'Nacht- & Bereitschaftsbetrieb',
      subtitle: '0 Duschen (nur Zirkulation)',
      desc: 'Überprüfung der Zirkulationstemperaturen (≥55°C) und Speicher-Stillstandsverluste.',
      icon: Moon,
      badge: 'Schwachlast',
      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    },
    {
      key: 'WP_N_MINUS_1',
      title: 'Redundanzfall: WP 1 defekt (N-1)',
      subtitle: '2 von 3 WP aktiv + Zusatzheizung',
      desc: 'Simuliert den Ausfall einer Wärmepumpe und die automatische Zuschaltung des WT.',
      icon: AlertOctagon,
      badge: 'N-1 Test',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    },
    {
      key: 'THERMAL_DISINFECTION',
      title: 'Thermische Desinfektion (DVGW W 551)',
      subtitle: '70°C Vorlauf / >65°C Rücklauf',
      desc: 'Heizt Puffer und FWS auf 70°C zur thermischen Abtötung möglicher Legionellen.',
      icon: ShieldAlert,
      badge: 'Hygiene-Spülung',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
    },
  ];

  return (
    <div
      id="scenario-simulator-card"
      className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-6"
    >
      <div className="flex items-center justify-between gap-2 mb-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            Monteur-Praxisszenarien & Schnell-Stresstests
          </h2>
          <p className="text-xs text-slate-500">
            Auf Knopfdruck realistische Lastzustände und Ausfallszenarien vor Ort simulieren
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {scenarios.map((sc) => {
          const IconComponent = sc.icon;
          const isSelected = activeScenario === sc.key;

          return (
            <button
              key={sc.key}
              type="button"
              onClick={() => onApplyScenario(sc.key)}
              className={`text-left p-3.5 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-indigo-50/70 border-indigo-500 shadow-xs ring-2 ring-indigo-500/20'
                  : 'bg-slate-50/50 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${sc.badgeColor}`}
                  >
                    {sc.badge}
                  </span>
                </div>

                <h3 className="text-xs font-bold text-slate-900 leading-tight">
                  {sc.title}
                </h3>
                <p className="text-[11px] font-medium text-slate-700 mt-0.5">
                  {sc.subtitle}
                </p>
                <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">
                  {sc.desc}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
                <span className={`font-semibold ${isSelected ? 'text-indigo-700' : 'text-slate-600'}`}>
                  {isSelected ? 'Aktiv' : 'Aktivieren'}
                </span>
                <span className="text-[10px] text-slate-400">→</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
