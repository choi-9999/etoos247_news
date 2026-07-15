import React from 'react';
import type { CalendarEvent } from './CalendarView';
import { FileText, CheckCircle, TrendingUp, Award, Layers } from 'lucide-react';
import './Dashboard.css';

interface DashboardProps {
  events: CalendarEvent[];
  featuredArticleIds?: string[];
  onUpdateFeaturedArticles?: (ids: string[]) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  events, 
  featuredArticleIds = [], 
  onUpdateFeaturedArticles 
}) => {
  const totalEvents = events.length;
  
  // 1. KPI Calculations
  const completedEvents = events.filter(e => e.status === 'completed').length;
  const pendingEvents = events.filter(e => e.status === 'pending').length;
  const approvedEvents = events.filter(e => e.status === 'approved').length;
  const rejectedEvents = events.filter(e => e.status === 'rejected').length;

  const completionRate = totalEvents > 0 ? ((completedEvents / totalEvents) * 100).toFixed(1) : '0.0';

  const now = new Date();
  const dashboardYear = now.getFullYear();
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentMonthLabel = `${now.getMonth() + 1}월`;
  const thisMonthEvents = events.filter(e => e.date.startsWith(currentYearMonth)).length;

  const hasAttachmentEvents = events.filter(e => e.attachmentType && e.attachmentType !== 'none').length;
  const attachmentRate = totalEvents > 0 ? ((hasAttachmentEvents / totalEvents) * 100).toFixed(1) : '0.0';

  // 2. Status Donut Chart Calculations
  const statuses = [
    { label: '송출 완료', count: completedEvents, color: '#3b82f6', key: 'completed' },
    { label: '승인 완료', count: approvedEvents, color: '#10b981', key: 'approved' },
    { label: '승인 대기', count: pendingEvents, color: '#f59e0b', key: 'pending' },
    { label: '송출 반려', count: rejectedEvents, color: '#ef4444', key: 'rejected' },
  ];

  const statusTotal = completedEvents + approvedEvents + pendingEvents + rejectedEvents;
  let accumulatedPercent = 0;

  const donutSlices = statuses
    .filter(s => s.count > 0)
    .map(s => {
      const percentage = statusTotal > 0 ? (s.count / statusTotal) * 100 : 0;
      const startPercent = accumulatedPercent;
      accumulatedPercent += percentage;
      return {
        ...s,
        percentage,
        startPercent,
      };
    });

  const donutGradient = statusTotal > 0
    ? `conic-gradient(${donutSlices
        .map(slice => `${slice.color} ${slice.startPercent}% ${slice.startPercent + slice.percentage}%`)
        .join(', ')})`
    : 'conic-gradient(rgba(148, 163, 184, 0.16) 0 100%)';

  // 3. Monthly Trend Calculations (completed articles, full year)
  const months = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, '0'));
  const monthNames = months.map(month => `${Number(month)}월`);
  const monthlyCounts = months.map(m => {
    return events.filter(e => e.status === 'completed' && e.date.startsWith(`${dashboardYear}-${m}`)).length;
  });

  const maxMonthCount = Math.max(...monthlyCounts, 1);
  const chartHeight = 180;
  const chartWidth = 840;
  const paddingX = 44;
  const paddingY = 32;

  // Generate SVG Points for Line Chart
  const points = monthlyCounts.map((count, index) => {
    const x = paddingX + (index * (chartWidth - paddingX * 2)) / (months.length - 1);
    const y = chartHeight - paddingY - (count / maxMonthCount) * (chartHeight - paddingY * 2);
    return { x, y, count };
  });

  const pathD = points.length > 0
    ? points.reduce((path, point, index) => {
        if (index === 0) return `M ${point.x} ${point.y}`;
        const previous = points[index - 1];
        const controlX = (previous.x + point.x) / 2;
        return `${path} C ${controlX} ${previous.y}, ${controlX} ${point.y}, ${point.x} ${point.y}`;
      }, '')
    : '';

  // Generate Area Path for Line Chart Gradient
  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z`
    : '';

  // 4. Branch Activities Top Ranking (Show all active branches)
  const branchCounts: { [key: string]: number } = {};
  events.forEach(e => {
    if (e.branch) {
      branchCounts[e.branch] = (branchCounts[e.branch] || 0) + 1;
    }
  });

  const topBranches = Object.entries(branchCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const maxBranchCount = topBranches.length > 0 ? topBranches[0].count : 1;

  // 5. Category Distribution
  const categoryCounts = {
    recruitment: 0,
    briefing: 0,
    system: 0,
    event: 0,
  };

  events.forEach(e => {
    const cat = e.category;
    if (cat === '모집/개강') categoryCounts.recruitment++;
    else if (cat === '입시/설명회') categoryCounts.briefing++;
    else if (cat === '학습/관리') categoryCounts.system++;
    else if (cat === '이벤트/소식') categoryCounts.event++;
  });

  const categories = [
    { label: '모집/개강', count: categoryCounts.recruitment, color: '#f43f5e', key: 'recruitment' },
    { label: '입시/설명회', count: categoryCounts.briefing, color: '#a855f7', key: 'briefing' },
    { label: '학습/관리', count: categoryCounts.system, color: '#06b6d4', key: 'system' },
    { label: '이벤트/소식', count: categoryCounts.event, color: '#10b981', key: 'event' },
  ];

  const maxCatCount = Math.max(...categories.map(c => c.count), 1);

  // 기사 리스트 (송출 완료된 건만) 최신순
  const completedArticles = events
    .filter(evt => evt.status === 'completed')
    .sort((a, b) => b.date.localeCompare(a.date));

  const handleToggleFeatured = (articleId: string) => {
    if (!onUpdateFeaturedArticles) return;
    if (featuredArticleIds.includes(articleId)) {
      onUpdateFeaturedArticles(featuredArticleIds.filter(id => id !== articleId));
    } else {
      onUpdateFeaturedArticles([...featuredArticleIds, articleId]);
    }
  };

  return (
    <div className="page-container dashboard-page">
      <div className="page-header">
        <h1 className="page-title">본사 통계 대시보드</h1>
        <p className="page-subtitle">이투스247 전국 지점의 송출 요청 데이터 및 마케팅 추이를 실시간 지표로 관찰합니다.</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <div className="kpi-card glass">
          <div className="kpi-icon-wrapper" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
            <FileText size={20} />
          </div>
          <div className="kpi-details">
            <span className="kpi-label">누적 기사 요청 건수</span>
            <h3 className="kpi-value">{totalEvents} <span className="kpi-unit">건</span></h3>
          </div>
        </div>

        <div className="kpi-card glass">
          <div className="kpi-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
            <CheckCircle size={20} />
          </div>
          <div className="kpi-details">
            <span className="kpi-label">기사 송출 완료율</span>
            <h3 className="kpi-value">{completionRate} <span className="kpi-unit">%</span></h3>
          </div>
        </div>

        <div className="kpi-card glass">
          <div className="kpi-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
            <TrendingUp size={20} />
          </div>
          <div className="kpi-details">
            <span className="kpi-label">당월({currentMonthLabel}) 송출 진행 건수</span>
            <h3 className="kpi-value">{thisMonthEvents} <span className="kpi-unit">건</span></h3>
          </div>
        </div>

        <div className="kpi-card glass">
          <div className="kpi-icon-wrapper" style={{ background: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4' }}>
            <Layers size={20} />
          </div>
          <div className="kpi-details">
            <span className="kpi-label">보도 이미지/자료 첨부율</span>
            <h3 className="kpi-value">{attachmentRate} <span className="kpi-unit">%</span></h3>
          </div>
        </div>
      </div>

      {/* Charts Layout */}
      <div className="dashboard-grid">
        {/* ROW 1: Donut Chart & Line Chart */}
        <div className="chart-box glass">
          <h3 className="chart-box-title">송출 요청 처리 상태</h3>
          <div className="donut-chart-container">
            <div className="donut-svg-wrapper">
              <div className="donut-ring" style={{ background: donutGradient }} aria-label="송출 요청 처리 상태 그래프"></div>
              <div className="donut-center-text">
                <span className="center-value">{statusTotal}</span>
                <span className="center-label">전체 요청</span>
              </div>
            </div>
            
            <div className="donut-legend">
              {statuses.map(s => {
                const pct = statusTotal > 0 ? ((s.count / statusTotal) * 100).toFixed(0) : 0;
                return (
                  <div key={s.key} className="legend-item">
                    <span className="legend-dot" style={{ backgroundColor: s.color }}></span>
                    <span className="legend-label">{s.label}</span>
                    <span className="legend-count">{s.count}건 ({pct}%)</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="chart-box glass">
          <h3 className="chart-box-title">월별 기사 송출 추이 ({dashboardYear}년)</h3>
          <div className="line-chart-container">
            <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none" className="line-svg">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.28" />
                  <stop offset="55%" stopColor="#60a5fa" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              
              {/* Grid Lines */}
              {[paddingY, chartHeight / 2, chartHeight - paddingY].map((y, idx) => (
                <line
                  key={y}
                  x1={paddingX}
                  y1={y}
                  x2={chartWidth - paddingX}
                  y2={y}
                  stroke={idx === 2 ? 'rgba(148, 163, 184, 0.28)' : 'rgba(148, 163, 184, 0.18)'}
                  strokeDasharray={idx === 2 ? undefined : '4 6'}
                />
              ))}

              {/* Area path */}
              {areaD && <path d={areaD} fill="url(#chartGradient)" />}
              
              {/* Line path */}
              {pathD && <path d={pathD} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="trend-line-path" />}

              {/* Points & Labels */}
              {points.map((p, idx) => (
                <g key={idx}>
                  <circle cx={p.x} cy={p.y} r="7" fill="rgba(37, 99, 235, 0.14)" className="trend-node-halo" />
                  <circle cx={p.x} cy={p.y} r="4.5" fill="#ffffff" stroke="#2563eb" strokeWidth="2.4" className="trend-node" />
                  <text x={p.x} y={p.y - 12} textAnchor="middle" fill="var(--text-primary)" fontSize="11" fontWeight="700">
                    {p.count}건
                  </text>
                  <text x={p.x} y={chartHeight - 6} textAnchor="middle" fill="var(--text-muted)" fontSize="11" fontWeight="600">
                    {monthNames[idx]}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* ROW 2: Top Branches & Category Distribution */}
        <div className="chart-box glass">
          <h3 className="chart-box-title">지점별 홍보 활성화 순위</h3>
          <div className="branch-ranking-list">
            {topBranches.length === 0 ? (
              <div className="no-data-msg">송출 데이터가 존재하지 않습니다.</div>
            ) : (
              topBranches.map((br, index) => {
                const ratio = ((br.count / maxBranchCount) * 100).toFixed(0);
                return (
                  <div key={br.name} className="ranking-row">
                    <div className="ranking-badge">
                      {index === 0 ? <Award size={16} style={{ color: '#f59e0b' }} /> : <span>{index + 1}</span>}
                    </div>
                    <div className="ranking-details">
                      <div className="ranking-info">
                        <span className="ranking-name">{br.name}</span>
                        <span className="ranking-count">{br.count}건 송출</span>
                      </div>
                      <div className="progress-bar-bg">
                        <div className="progress-bar-fill" style={{ width: `${ratio}%`, background: '#3b82f6' }}></div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="chart-box glass">
          <h3 className="chart-box-title">기사 유형별 보도 비중</h3>
          <div className="category-distribution-list">
            {categories.map(cat => {
              const ratio = ((cat.count / maxCatCount) * 100).toFixed(0);
              const percentage = totalEvents > 0 ? ((cat.count / totalEvents) * 100).toFixed(0) : 0;
              return (
                <div key={cat.key} className="category-row">
                  <div className="category-info-meta">
                    <span className="cat-label-text">{cat.label}</span>
                    <span className="cat-count-text">{cat.count}건 ({percentage}%)</span>
                  </div>
                  <div className="progress-bar-bg">
                    <div className="progress-bar-fill" style={{ width: `${ratio}%`, backgroundColor: cat.color }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Featured Article Selector Section */}
      <div className="featured-management-box glass">
        <div className="featured-management-header">
          <div>
            <h3 className="chart-box-title">롤링 배너(Featured) 대표 기사 선정 관리</h3>
            <p className="featured-management-subtitle">
              홈 화면 하단의 대표 기사 자동 롤링 캐러셀 영역에 노출할 기사를 선정합니다. (최대 5개 권장)
            </p>
          </div>
          <div className="featured-count-badge">
            선택됨: <span className="highlight-count">{featuredArticleIds.length}</span> 개
          </div>
        </div>

        {completedArticles.length === 0 ? (
          <div className="no-data-msg">송출 완료된 기사가 존재하지 않습니다. 기사가 송출 완료된 후 지정할 수 있습니다.</div>
        ) : (
          <div className="featured-articles-list">
            {completedArticles.map((art) => {
              const isSelected = featuredArticleIds.includes(art.id);
              // Get category class for badge styling
              let catClass = 'badge-event';
              if (art.category === '모집/개강') catClass = 'badge-recruitment';
              else if (art.category === '입시/설명회') catClass = 'badge-briefing';
              else if (art.category === '학습/관리') catClass = 'badge-system';

              return (
                <div 
                  key={art.id} 
                  className={`featured-article-item ${isSelected ? 'active' : ''}`}
                  onClick={() => handleToggleFeatured(art.id)}
                >
                  <div className="featured-article-left">
                    <div className={`featured-checkbox-circle ${isSelected ? 'checked' : ''}`}>
                      {isSelected && <span className="checkmark">✓</span>}
                    </div>
                    <div className="featured-article-meta-info">
                      <div className="featured-article-title-row">
                        <span className={`featured-cat-badge ${catClass}`}>{art.category || '이벤트/소식'}</span>
                        <h4 className="featured-article-title">{art.title}</h4>
                      </div>
                      <div className="featured-article-sub-row">
                        <span className="featured-sub-item branch-name">{art.branch}</span>
                        <span className="featured-sub-item event-date">{art.date}</span>
                      </div>
                    </div>
                  </div>
                  <div className="featured-status-indicator">
                    {isSelected ? (
                      <span className="featured-indicator-active">선정됨</span>
                    ) : (
                      <span className="featured-indicator-inactive">미선정</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
