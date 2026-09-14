import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import { Clock, Calendar, Sun, AlertCircle } from 'lucide-react';
import { PeakDemandRecord, AllRegionKey, DayOfWeek } from '../types';
import { MONTH_NAMES, DAYS_OF_WEEK } from '../data/demandData';
import { REGIONS_METADATA } from '../data/regions';

interface TemporalAnalysisProps {
  records: PeakDemandRecord[];
  currentRegion: AllRegionKey;
  onFilterByHour?: (hour: string) => void;
  onFilterByDay?: (day: DayOfWeek) => void;
}

export const TemporalAnalysis: React.FC<TemporalAnalysisProps> = ({
  records,
  currentRegion,
}) => {
  const [activeTab, setActiveTab] = useState<'hour' | 'day' | 'season'>('hour');
  const regionInfo = REGIONS_METADATA[currentRegion];

  // 1. Hour Distribution
  const hourMap = new Map<string, { count: number; sumMW: number }>();
  records.forEach((r) => {
    const mw = r.regions[currentRegion]?.demandMW ?? r.nationalDemandMW;
    const cur = hourMap.get(r.time) || { count: 0, sumMW: 0 };
    cur.count += 1;
    cur.sumMW += mw;
    hourMap.set(r.time, cur);
  });

  const hourData = Array.from(hourMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([time, val]) => ({
      time: `${time}h`,
      rawTime: time,
      frecuencia: val.count,
      promedioMW: Math.round(val.sumMW / val.count),
    }));

  // 2. Day of Week Distribution
  const dayMap = new Map<DayOfWeek, { count: number; sumMW: number }>();
  DAYS_OF_WEEK.forEach((d) => dayMap.set(d, { count: 0, sumMW: 0 }));

  records.forEach((r) => {
    const mw = r.regions[currentRegion]?.demandMW ?? r.nationalDemandMW;
    const cur = dayMap.get(r.dayOfWeek) || { count: 0, sumMW: 0 };
    cur.count += 1;
    cur.sumMW += mw;
    dayMap.set(r.dayOfWeek, cur);
  });

  const dayData = DAYS_OF_WEEK.map((day) => {
    const val = dayMap.get(day) || { count: 0, sumMW: 0 };
    return {
      day,
      shortDay: day.slice(0, 3),
      frecuencia: val.count,
      promedioMW: val.count > 0 ? Math.round(val.sumMW / val.count) : 0,
      isWeekend: day === 'Sábado' || day === 'Domingo',
    };
  });

  // 3. Month Seasonality Distribution
  const monthMap = new Map<number, { count: number; sumMW: number }>();
  Array.from({ length: 12 }, (_, i) => i + 1).forEach((m) =>
    monthMap.set(m, { count: 0, sumMW: 0 })
  );

  records.forEach((r) => {
    const mw = r.regions[currentRegion]?.demandMW ?? r.nationalDemandMW;
    const cur = monthMap.get(r.month)!;
    cur.count += 1;
    cur.sumMW += mw;
  });

  const monthData = MONTH_NAMES.map((name, idx) => {
    const mNum = idx + 1;
    const val = monthMap.get(mNum)!;
    return {
      month: name,
      shortMonth: name.slice(0, 3),
      frecuencia: val.count,
      promedioMW: val.count > 0 ? Math.round(val.sumMW / val.count) : 0,
    };
  });

  // Dynamically compute peak/mode values for each dimension so colors adapt to real data and filters
  const maxHourFreq = hourData.length > 0 ? Math.max(...hourData.map((h) => h.frecuencia)) : 0;
  const maxDayFreq = dayData.length > 0 ? Math.max(...dayData.map((d) => d.frecuencia)) : 0;
  const maxMonthMW = monthData.length > 0 ? Math.max(...monthData.map((m) => m.promedioMW)) : 0;

  const topHour = hourData.find((h) => h.frecuencia === maxHourFreq);
  const topDay = dayData.find((d) => d.frecuencia === maxDayFreq);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-6 space-y-4">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              Análisis de Ocurrencia Temporal (Horas, Días y Meses)
            </h3>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 border border-orange-200 inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-600"></span>
              Naranja = Mayor Concentración
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Comportamiento y concentración horaria de los {records.length} picos coincidentes del SEIN
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('hour')}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
              activeTab === 'hour'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Hora Específica
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('day')}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
              activeTab === 'day'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Día de Semana
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('season')}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
              activeTab === 'season'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Estacionalidad Mensual
          </button>
        </div>
      </div>

      {/* Chart Section */}
      <div className="h-64 sm:h-72 w-full">
        {activeTab === 'hour' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="time"
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                tick={{ fill: '#64748b', fontSize: 11 }}
              />
              <YAxis
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                tick={{ fill: '#64748b', fontSize: 11 }}
                allowDecimals={false}
                width={40}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const d = payload[0].payload;
                  const isMax = d.frecuencia === maxHourFreq && maxHourFreq > 0;
                  return (
                    <div className="bg-slate-900 text-white rounded-xl shadow-xl p-3 border border-slate-700 text-xs space-y-1">
                      <div className="font-bold text-amber-400 border-b border-slate-800 pb-1 flex items-center justify-between gap-2">
                        <span>Hora: {d.rawTime} hrs</span>
                        {isMax && (
                          <span className="text-[10px] bg-orange-600 text-white px-1.5 py-0.2 rounded font-semibold">
                            Mayor Frecuencia
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between gap-4 text-slate-300">
                        <span>Picos Registrados:</span>
                        <span className="font-bold text-white">{d.frecuencia} meses</span>
                      </div>
                      <div className="flex justify-between gap-4 text-slate-300">
                        <span>Demanda Promedio:</span>
                        <span className="font-bold text-amber-300">
                          {d.promedioMW.toLocaleString()} MW
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 pt-1">
                        Horario de Punta regulatorio COES
                      </div>
                    </div>
                  );
                }}
              />
              <Bar dataKey="frecuencia" name="Cantidad de Meses" radius={[6, 6, 0, 0]}>
                {hourData.map((entry, index) => (
                  <Cell
                    key={`cell-hour-${index}`}
                    fill={entry.frecuencia === maxHourFreq && maxHourFreq > 0 ? '#ea580c' : '#3b82f6'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}

        {activeTab === 'day' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dayData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="shortDay"
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                tick={{ fill: '#64748b', fontSize: 11 }}
              />
              <YAxis
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                tick={{ fill: '#64748b', fontSize: 11 }}
                allowDecimals={false}
                width={40}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const d = payload[0].payload;
                  const isMax = d.frecuencia === maxDayFreq && maxDayFreq > 0;
                  return (
                    <div className="bg-slate-900 text-white rounded-xl shadow-xl p-3 border border-slate-700 text-xs space-y-1">
                      <div className="font-bold text-amber-400 border-b border-slate-800 pb-1 flex items-center justify-between gap-2">
                        <span>{d.day}</span>
                        {isMax && (
                          <span className="text-[10px] bg-orange-600 text-white px-1.5 py-0.2 rounded font-semibold">
                            Mayor Ocurrencia
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between gap-4 text-slate-300">
                        <span>Picos Ocurridos:</span>
                        <span className="font-bold text-white">{d.frecuencia} veces</span>
                      </div>
                      <div className="flex justify-between gap-4 text-slate-300">
                        <span>Demanda Promedio:</span>
                        <span className="font-bold text-amber-300">
                          {d.promedioMW.toLocaleString()} MW
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 pt-1">
                        {d.isWeekend ? 'Fin de semana (menor carga industrial)' : 'Día laboral hábil'}
                      </div>
                    </div>
                  );
                }}
              />
              <Bar dataKey="frecuencia" name="Ocurrencias" radius={[6, 6, 0, 0]}>
                {dayData.map((entry, index) => (
                  <Cell
                    key={`cell-day-${index}`}
                    fill={
                      entry.isWeekend
                        ? '#cbd5e1'
                        : entry.frecuencia === maxDayFreq && maxDayFreq > 0
                        ? '#ea580c'
                        : '#2563eb'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}

        {activeTab === 'season' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="shortMonth"
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                tick={{ fill: '#64748b', fontSize: 11 }}
              />
              <YAxis
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                tick={{ fill: '#64748b', fontSize: 11 }}
                domain={['dataMin - 500', 'dataMax + 200']}
                tickFormatter={(v) => `${Math.round(v)} MW`}
                width={65}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const d = payload[0].payload;
                  const isMax = d.promedioMW === maxMonthMW && maxMonthMW > 0;
                  return (
                    <div className="bg-slate-900 text-white rounded-xl shadow-xl p-3 border border-slate-700 text-xs space-y-1">
                      <div className="font-bold text-amber-400 border-b border-slate-800 pb-1 flex items-center justify-between gap-2">
                        <span>Mes de {d.month}</span>
                        {isMax && (
                          <span className="text-[10px] bg-orange-600 text-white px-1.5 py-0.2 rounded font-semibold">
                            Mayor Demanda Media
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between gap-4 text-slate-300">
                        <span>Demanda Promedio:</span>
                        <span className="font-bold text-white">
                          {d.promedioMW.toLocaleString()} MW
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 pt-1">
                        Histórico consolidado COES
                      </div>
                    </div>
                  );
                }}
              />
              <Bar dataKey="promedioMW" name="Demanda Promedio (MW)" radius={[6, 6, 0, 0]}>
                {monthData.map((entry, index) => (
                  <Cell
                    key={`cell-month-${index}`}
                    fill={entry.promedioMW === maxMonthMW && maxMonthMW > 0 ? '#ea580c' : '#0284c7'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Analytical Callout */}
      <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-amber-950">
            ¿Por qué la máxima demanda en el SEIN se concentra a las {topHour?.rawTime ?? '19:00'} hrs los días {topDay?.day ?? 'Martes'}?
          </p>
          <p className="text-[11px] text-amber-800/90 leading-relaxed">
            En el SEIN, el pico horario (donde la hora <strong>{topHour?.rawTime ?? '19:00'} hrs</strong> lidera con {topHour?.frecuencia ?? 60} meses y el día <strong>{topDay?.day ?? 'Martes'}</strong> con {topDay?.frecuencia ?? 64} ocurrencias) es producto de la <strong>superposición coincidente</strong>: finalización de jornada laboral e industrial diurna, encendido simultáneo de iluminación pública y residencial, uso de artefactos y aire acondicionado en los hogares, aforos en centros comerciales y la continuidad ininterrumpida de las plantas mineras en el país.
          </p>
        </div>
      </div>
    </div>
  );
};
