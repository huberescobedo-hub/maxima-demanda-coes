import React from 'react';
import { Zap, Download, RefreshCw, HelpCircle, FileSpreadsheet, ShieldAlert } from 'lucide-react';
import { AllRegionKey } from '../types';
import { REGIONS_METADATA } from '../data/regions';

interface HeaderProps {
  currentRegion: AllRegionKey;
  totalFilteredRecords: number;
  onResetFilters: () => void;
  onOpenHelp: () => void;
  onExportCSV: () => void;
  onExportJSON: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRegion,
  totalFilteredRecords,
  onResetFilters,
  onOpenHelp,
  onExportCSV,
  onExportJSON,
}) => {
  const regionInfo = REGIONS_METADATA[currentRegion];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Brand & Title */}
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
              <Zap className="w-6 h-6 fill-amber-500 text-amber-600" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                  COES • SEIN PERÚ
                </span>
                <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  ✓ Validado COES
                </span>
                <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                  2010 - 2026 (A la fecha)
                </span>
                <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                  200 Meses Consolidados
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight mt-0.5">
                Máxima Demanda Eléctrica en el Perú
              </h1>
              <p className="text-xs text-slate-500 hidden sm:block">
                Análisis mensual, día de la semana y hora específica de los picos de potencia coincidente por regiones
              </p>
            </div>
          </div>

          {/* Quick Stats & Actions */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
              <span className="text-slate-500">Región activa:</span>
              <span className="font-semibold text-slate-800">{regionInfo.shortName}</span>
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: regionInfo.color }} />
              <span className="text-slate-400">|</span>
              <span className="text-slate-500">Registros:</span>
              <span className="font-bold text-slate-900">{totalFilteredRecords} / 200</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onExportCSV}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
                title="Exportar a archivo CSV (Excel)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Descargar</span> CSV
              </button>

              <button
                type="button"
                onClick={onExportJSON}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
                title="Exportar datos en formato JSON"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                JSON
              </button>

              <button
                type="button"
                onClick={onResetFilters}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                title="Restablecer todos los filtros"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Restablecer</span>
              </button>

              <button
                type="button"
                onClick={onOpenHelp}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors cursor-pointer"
                title="Ver metodología y conceptos COES / OSINERGMIN"
              >
                <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden sm:inline">Guía</span> COES
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
