import React, { useState } from 'react';
import { useLanguage } from './LanguageContext';

interface DepartmentData {
  name: string;
  nameAr: string;
  count: number;
}

interface TimelineData {
  date: string;
  volume: number;
}

interface ChartsProps {
  employees: any[];
  requests: any[];
  isDarkMode: boolean;
}

export const DashboardCharts: React.FC<ChartsProps> = ({ employees, requests, isDarkMode }) => {
  const { t, isRtl } = useLanguage();
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const [hoveredLineDot, setHoveredLineDot] = useState<number | null>(null);

  // Predefined departments mapping for clean rendering
  const departmentLabels: Record<string, { en: string, ar: string }> = {
    'Information Technology': { en: 'Information Technology', ar: 'تكنولوجيا المعلومات' },
    'Human Resources': { en: 'Human Resources', ar: 'الموارد البشرية' },
    'Engineering': { en: 'Engineering', ar: 'الإدارة الهندسية' },
    'Operations': { en: 'Operations', ar: 'إدارة العمليات' },
    'Finance': { en: 'Finance', ar: 'الإدارة المالية' },
    'Sales & Marketing': { en: 'Sales & Marketing', ar: 'المبيعات والتسويق' },
    'Procurement & Stores': { en: 'Procurement & Stores', ar: 'المشتريات والمخازن' },
    'Transportation & Support Services': { en: 'Transportation & Support Services', ar: 'الحركة والخدمات' },
    'Quality Control': { en: 'Quality Control', ar: 'إدارة الجودة' },
    'Security, Health & Safety': { en: 'Security, Health & Safety', ar: 'الأمن والسلامة' },
    'Legal Affairs': { en: 'Legal Affairs', ar: 'الشؤون القانونية' },
    'Public Relations & Media': { en: 'Public Relations & Media', ar: 'العلاقات والإعلام' },
    'Production & Manufacturing': { en: 'Production & Manufacturing', ar: 'الإنتاج والتصنيع' }
  };

  // 1. Calculate dynamic workforce distribution by department
  const dynamicDeptsMap: Record<string, number> = {};
  employees.forEach(emp => {
    const dName = emp.department || 'Other';
    dynamicDeptsMap[dName] = (dynamicDeptsMap[dName] || 0) + 1;
  });

  // Convert to array of DepartmentData
  let deptStats: DepartmentData[] = Object.keys(dynamicDeptsMap).map(key => {
    const labelObj = departmentLabels[key] || { en: key, ar: key };
    return {
      name: labelObj.en,
      nameAr: labelObj.ar,
      count: dynamicDeptsMap[key]
    };
  });

  // Fallback seed if empty
  if (deptStats.length === 0) {
    deptStats = [
      { name: 'Information Technology', nameAr: 'تكنولوجيا المعلومات', count: 0 },
      { name: 'Human Resources', nameAr: 'الموارد البشرية', count: 0 },
      { name: 'Engineering', nameAr: 'الإدارة الهندسية', count: 0 }
    ];
  }

  // Limit to top 6 departments to avoid cluttering, and sort
  deptStats.sort((a, b) => b.count - a.count);
  const visibleDeptStats = deptStats.slice(0, 6);

  const maxCount = Math.max(...visibleDeptStats.map(d => d.count), 1);

  // Group requests by date (last 6 days)
  const getPastDates = () => {
    const dates = [];
    // Anchor to latest record's date or today
    const anchorDate = requests.length > 0
      ? new Date(requests[0].created_at)
      : new Date();
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(anchorDate);
      d.setDate(anchorDate.getDate() - i);
      dates.push(d.toISOString().slice(0, 10));
    }
    return dates;
  };

  const timelineDates = getPastDates();
  const timelineStats: TimelineData[] = timelineDates.map(dateStr => {
    const volume = requests.filter(r => r.created_at.slice(0, 10) === dateStr).length;
    return {
      date: dateStr,
      volume
    };
  });

  const maxVolume = Math.max(...timelineStats.map(t => t.volume), 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-6">
      
      {/* Chart 1: Workforce Distribution */}
      <div className={`p-6 rounded-2xl border transition-all duration-200 shadow-sm ${
        isDarkMode 
          ? 'bg-zinc-900 border-zinc-805 text-white' 
          : 'bg-white border-zinc-150 text-gray-900'
      }`}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-sm font-black tracking-tight text-gray-900 dark:text-zinc-100 uppercase">
              {t('workforceByDept')}
            </h3>
            <p className="text-[10px] text-gray-400 dark:text-zinc-500 font-medium">
              {isRtl ? 'توزيع الموظفين الفعلي على مستوى الأقسام' : 'Personnel distribution across active departments'}
            </p>
          </div>
          <span className="text-[10px] px-2 py-0.5 bg-red-500/10 text-red-500 rounded font-bold uppercase tracking-wider font-mono">
            {employees.length} {isRtl ? 'موظف' : 'employees'}
          </span>
        </div>
        
        {/* SVG Bar Chart */}
        <div className="relative h-60 w-full flex items-end justify-between px-2 pt-6">
          
          {/* Grid lines background */}
          <div className="absolute inset-x-0 bottom-8 h-40 flex flex-col justify-between pointer-events-none">
            {[0, 25, 50, 75, 100].map((percent, idx) => (
              <div key={idx} className="flex items-center w-full">
                <span className={`text-[9px] w-6 font-semibold select-none text-right mr-1.5 font-mono ${isDarkMode ? 'text-zinc-650' : 'text-gray-300'}`}>
                  {Math.round((maxCount * percent) / 100)}
                </span>
                <div className={`flex-grow border-b border-dashed ${isDarkMode ? 'border-zinc-800/40' : 'border-gray-100'}`} />
              </div>
            ))}
          </div>

          <div className="relative z-10 flex-grow h-40 flex items-end justify-around pb-1 overflow-visible">
            {visibleDeptStats.map((dept, i) => {
              const heightPercent = (dept.count / maxCount) * 100;
              const barHeight = Math.max((heightPercent / 100) * 128, 6); // visual scale mapping limit

              return (
                <div 
                  key={i} 
                  className="flex flex-col items-center flex-grow max-w-[64px] group relative"
                  onMouseEnter={() => setHoveredBar(i)}
                  onMouseLeave={() => setHoveredBar(null)}
                >
                  {/* Tooltip */}
                  {hoveredBar === i && (
                    <div className="absolute -top-[52px] z-20 bg-zinc-950 border border-zinc-800 text-white text-[10px] py-1.5 px-3 rounded-lg shadow-xl font-sans flex flex-col items-center transform -translate-y-1">
                      <span className="font-bold select-none whitespace-nowrap">{isRtl ? dept.nameAr : dept.name}</span>
                      <span className="text-xs text-red-400 font-black font-mono">{dept.count} {isRtl ? 'موظفين' : 'Personnel'}</span>
                      <div className="absolute -bottom-1 left-12 w-2 h-2 bg-zinc-950 border-r border-b border-zinc-800 rotate-45"></div>
                    </div>
                  )}

                  {/* The Bar */}
                  <div 
                    className="w-8 rounded-t-lg transition-all duration-300 cursor-pointer shadow-md bg-gradient-to-t hover:scale-x-105 hover:brightness-110"
                    style={{ 
                      height: `${barHeight}px`,
                      backgroundImage: isDarkMode 
                        ? 'linear-gradient(to top, #7f1d1d, #ef4444)' 
                        : 'linear-gradient(to top, #18181b, #dc2626)'
                    }}
                  />
                  
                  {/* Label */}
                  <span className={`text-[9px] mt-2 block select-none h-4 whitespace-nowrap overflow-hidden text-ellipsis w-14 text-center font-bold ${
                    isDarkMode ? 'text-zinc-500' : 'text-gray-450'
                  }`} title={isRtl ? dept.nameAr : dept.name}>
                    {isRtl ? dept.nameAr : dept.name.slice(0, 8)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Chart 2: Requests Timeline */}
      <div className={`p-6 rounded-2xl border transition-all duration-200 shadow-sm ${
        isDarkMode 
          ? 'bg-zinc-900 border-zinc-805 text-white' 
          : 'bg-white border-zinc-150 text-gray-900'
      }`}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-sm font-black tracking-tight text-gray-900 dark:text-zinc-100 uppercase">
              {t('requestsTimeline')}
            </h3>
            <p className="text-[10px] text-gray-400 dark:text-zinc-500 font-medium">
              {isRtl ? 'حجم طلبات الخدمات الذاتية خلال الأيام الأخيرة' : 'Inbound request volume trend curves'}
            </p>
          </div>
          <span className="text-[10px] px-2 py-0.5 bg-zinc-550/10 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-gray-500 dark:text-zinc-400 rounded font-bold uppercase tracking-wider font-mono">
            {requests.length} {isRtl ? 'إجمالي طلب' : 'total requests'}
          </span>
        </div>

        {/* SVG Area Chart */}
        <div className="relative h-60 w-full flex flex-col justify-end">
          <svg className="w-full h-40 overflow-visible" viewBox="0 0 500 160" preserveAspectRatio="none">
            {/* Grid Lines */}
            {[0, 40, 80, 120, 160].map((y, idx) => (
              <line
                key={idx}
                x1="0"
                y1={y}
                x2="500"
                y2={y}
                stroke={isDarkMode ? '#27272a' : '#f4f4f5'}
                strokeWidth="1"
                strokeDasharray="3 3"
              />
            ))}

            {/* Calculations for polygon points */}
            {(() => {
              const paddingX = 40;
              const width = 500 - paddingX * 2;
              const points = timelineStats.map((item, i) => {
                const x = paddingX + (i * width) / (timelineStats.length - 1);
                // invert y for SVG coordinate system (y: 160 is bottom, y: 15 is top)
                const y = 145 - (item.volume / maxVolume) * 110;
                return { x, y, val: item.volume, date: item.date };
              });

              const pointsString = points.map(p => `${p.x},${p.y}`).join(' ');
              const fillPointsString = `${points[0].x},145 ` + pointsString + ` ${points[points.length - 1].x},145`;

              return (
                <>
                  {/* Fill Area with Gradient */}
                  <defs>
                    <linearGradient id="chartGradientNew" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <polygon points={fillPointsString} fill="url(#chartGradientNew)" />

                  {/* Line stroke */}
                  <polyline
                    points={pointsString}
                    fill="none"
                    stroke="#dc2626"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Interactive Dot indicators */}
                  {points.map((p, i) => (
                    <g 
                      key={i} 
                      className="cursor-pointer overflow-visible"
                      onMouseEnter={() => setHoveredLineDot(i)}
                      onMouseLeave={() => setHoveredLineDot(null)}
                    >
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={hoveredLineDot === i ? "6" : "4.5"}
                        fill={isDarkMode ? '#18181b' : '#ffffff'}
                        stroke="#dc2626"
                        strokeWidth="2.5"
                        className="transition-all duration-150"
                      />
                      
                      {hoveredLineDot === i && (
                        <foreignObject x={p.x - 55} y={p.y - 52} width="110" height="46" className="overflow-visible z-30">
                          <div className="bg-zinc-950 border border-zinc-800 text-white text-[9px] rounded-lg p-1 shadow-lg text-center font-sans flex flex-col justify-center leading-normal">
                            <span className="font-bold text-zinc-400 block">{p.date}</span>
                            <span className="text-red-400 font-extrabold">{p.val} {isRtl ? 'طلبات' : 'Requests'}</span>
                          </div>
                        </foreignObject>
                      )}
                    </g>
                  ))}
                </>
              );
            })()}
          </svg>

          {/* X axis descriptions */}
          <div className="flex justify-between px-6 pt-3 border-t border-zinc-100 dark:border-zinc-805 mt-2">
            {timelineStats.map((item, i) => {
              const dateObj = new Date(item.date);
              const formattedDate = dateObj.toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' });
              return (
                <span key={i} className={`text-[9px] font-bold font-mono leading-none ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  {formattedDate}
                </span>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
};
