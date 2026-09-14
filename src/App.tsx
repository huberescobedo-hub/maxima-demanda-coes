import React, { useState, useMemo, useCallback } from 'react';
import { 
  PEAK_DEMAND_RECORDS, 
  calculateSystemStats,
  MONTH_NAMES 
} from './data/demandData';
import { REGIONS_METADATA } from './data/regions';
import { FilterState, PeakDemandRecord, AllRegionKey } from './types';
import { Header } from './components/Header';
import { FiltersBar } from './components/FiltersBar';
import { KpiMetrics } from './components/KpiMetrics';
import { DemandTrendChart } from './components/DemandTrendChart';
import { SeasonalHeatmap } from './components/SeasonalHeatmap';
import { RegionalBreakdownChart } from './components/RegionalBreakdownChart';
import { TemporalAnalysis } from './components/TemporalAnalysis';
import { DataTable } from './components/DataTable';
import { RecordModal } from './components/RecordModal';
import { TechnicalGuideModal } from './components/TechnicalGuideModal';

const INITIAL_FILTERS: FilterState = {
  region: 'nacional',
  startYear: 2010,
  endYear: 2026,
  months: [],
  daysOfWeek: [],
  timeSlot: 'all',
  minMW: 0,
  maxMW: 10000,
  searchQuery: '',
};

export default function App() {
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [selectedRecord, setSelectedRecord] = useState<PeakDemandRecord | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Filter application
  const filteredRecords = useMemo(() => {
    return PEAK_DEMAND_RECORDS.filter((rec) => {
      // 1. Year range
      if (rec.year < filters.startYear || rec.year > filters.endYear) {
        return false;
      }

      // 2. Months
      if (filters.months.length > 0 && !filters.months.includes(rec.month)) {
        return false;
      }

      // 3. Day of week
      if (filters.daysOfWeek.length > 0 && !filters.daysOfWeek.includes(rec.dayOfWeek)) {
        return false;
      }

      // 4. Time slot
      if (filters.timeSlot === 'hp' && !rec.isPeakHour) {
        return false;
      }
      if (filters.timeSlot === '19_20' && rec.hour !== 19) {
        return false;
      }
      if (filters.timeSlot === '20_21' && rec.hour !== 20) {
        return false;
      }

      // 5. Search query
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase();
        const matchesDate = rec.date.includes(q);
        const matchesMonth = rec.monthName.toLowerCase().includes(q);
        const matchesDay = rec.dayOfWeek.toLowerCase().includes(q);
        const matchesTime = rec.time.includes(q);
        const matchesNotes = rec.notes.toLowerCase().includes(q);
        const matchesYear = String(rec.year).includes(q);
        if (!matchesDate && !matchesMonth && !matchesDay && !matchesTime && !matchesNotes && !matchesYear) {
          return false;
        }
      }

      return true;
    });
  }, [filters]);

  // Compute stats for current filtered selection and active region
  const stats = useMemo(() => {
    return calculateSystemStats(filteredRecords, filters.region);
  }, [filteredRecords, filters.region]);

  const handleResetFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
  }, []);

  const handleSelectRegion = useCallback((region: AllRegionKey) => {
    setFilters((prev) => ({ ...prev, region }));
  }, []);

  // Export to CSV
  const handleExportCSV = useCallback(() => {
    const regionKey = filters.region;
    const regionName = REGIONS_METADATA[regionKey].shortName;
    
    const headers = [
      'Año',
      'Mes_Numero',
      'Mes_Nombre',
      'Dia_Del_Mes',
      'Fecha_Completa',
      'Dia_De_Semana',
      'Tipo_Dia',
      'Hora_Especifica',
      'Bloque_Horario',
      `Demanda_${regionName}_MW`,
      'Demanda_Nacional_SEIN_MW',
      'Exportacion_PER_ECU_MW',
      'Importacion_ECU_PER_MW',
      'Participacion_Porcentaje',
      'Crecimiento_YoY_Porcentaje',
      'Ranking_Historico_SEIN',
      'Observaciones_COES'
    ];

    const rows = filteredRecords.map((r) => {
      const regPoint = r.regions[regionKey];
      return [
        r.year,
        r.month,
        `"${r.monthName}"`,
        r.day,
        r.date,
        `"${r.dayOfWeek}"`,
        `"${r.dayType}"`,
        r.time,
        `"${r.periodName}"`,
        regPoint ? regPoint.demandMW : r.nationalDemandMW,
        r.nationalDemandMW,
        r.exportEcuMW ?? 0,
        r.importEcuMW ?? 0,
        regPoint ? regPoint.sharePercentage : 100,
        r.growthYoY !== null ? r.growthYoY : '',
        r.rankHistoric,
        `"${r.notes.replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `maxima_demanda_peru_${regionKey}_${filters.startYear}_${filters.endYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [filteredRecords, filters.region, filters.startYear, filters.endYear]);

  // Export to JSON
  const handleExportJSON = useCallback(() => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredRecords, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `maxima_demanda_peru_${filters.region}_2011_2026.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }, [filteredRecords, filters.region]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Navigation & App Header */}
      <Header
        currentRegion={filters.region}
        totalFilteredRecords={filteredRecords.length}
        onResetFilters={handleResetFilters}
        onOpenHelp={() => setIsHelpOpen(true)}
        onExportCSV={handleExportCSV}
        onExportJSON={handleExportJSON}
      />

      {/* Main Dashboard Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Interactive Filtering Module (Region, Years, Months, Days, Time, Search) */}
        <FiltersBar
          filters={filters}
          onChangeFilters={setFilters}
          onReset={handleResetFilters}
          totalResults={filteredRecords.length}
        />

        {/* 5 Core Metric Cards */}
        <KpiMetrics
          stats={stats}
          currentRegion={filters.region}
          onInspectRecord={setSelectedRecord}
        />

        {/* Main 15-Year Historical Evolution Chart */}
        <DemandTrendChart
          records={filteredRecords}
          currentRegion={filters.region}
          onSelectRecord={setSelectedRecord}
        />

        {/* 15 Years x 12 Months Heatmap Matrix */}
        <SeasonalHeatmap
          records={filteredRecords}
          currentRegion={filters.region}
          onSelectRecord={setSelectedRecord}
        />

        {/* Temporal Distribution: Exact Hours, Days of Week, and Seasonality */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TemporalAnalysis
            records={filteredRecords}
            currentRegion={filters.region}
          />
          <RegionalBreakdownChart
            records={filteredRecords}
            currentRegion={filters.region}
            onSelectRegion={handleSelectRegion}
          />
        </div>

        {/* Comprehensive Data Table with Search, Sort, and CSV Export */}
        <DataTable
          records={filteredRecords}
          currentRegion={filters.region}
          onSelectRecord={setSelectedRecord}
          onExportCSV={handleExportCSV}
        />
      </main>

      {/* Footer with Operational Data References */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">COES - SEIN</span>
            <span>•</span>
            <span>Comité de Operación Económica del Sistema Interconectado Nacional del Perú</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Período: 2010 - 2026 (A la fecha)</span>
            <span>•</span>
            <button
              type="button"
              onClick={() => setIsHelpOpen(true)}
              className="text-amber-700 hover:underline cursor-pointer font-medium"
            >
              Marco Metodológico
            </button>
          </div>
        </div>
      </footer>

      {/* Detailed Record Inspector Modal */}
      <RecordModal
        record={selectedRecord}
        currentRegion={filters.region}
        onClose={() => setSelectedRecord(null)}
        onSelectRegion={handleSelectRegion}
      />

      {/* Regulatory & COES Guide Modal */}
      <TechnicalGuideModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </div>
  );
}
