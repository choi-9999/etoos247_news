import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronRight, ChevronLeft, X, Copy, Sparkles, MapPin, Calendar as CalendarIcon, FileText, ArrowRight } from 'lucide-react';
import eventsData from '../data/eventsData.json';
import type { CalendarEvent } from './CalendarView';
import './ArticleShowcase.css';

interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  category: 'recruitment' | 'briefing' | 'system' | 'event';
  categoryLabel: string;
  branch: string;
  media: string[];
  articleImage?: string;
  newsUrl?: string;
}

interface ArticleShowcaseProps {
  setActiveTab: (tab: string) => void;
  events: CalendarEvent[];
  featuredArticleIds?: string[];
}

const RECRUITMENT_IMAGES = [
  'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80'
];

const BRIEFING_IMAGES = [
  'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1431540015161-0bf868a2d407?auto=format&fit=crop&w=800&q=80'
];

const SYSTEM_IMAGES = [
  'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=800&q=80'
];

const EVENT_IMAGES = [
  'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1531050171654-7f6c722cb0f3?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80'
];

const getArticleImage = (id: string, category: 'recruitment' | 'briefing' | 'system' | 'event'): string => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash);
  
  switch (category) {
    case 'recruitment':
      return RECRUITMENT_IMAGES[index % RECRUITMENT_IMAGES.length];
    case 'briefing':
      return BRIEFING_IMAGES[index % BRIEFING_IMAGES.length];
    case 'system':
      return SYSTEM_IMAGES[index % SYSTEM_IMAGES.length];
    case 'event':
    default:
      return EVENT_IMAGES[index % EVENT_IMAGES.length];
  }
};

const resolveImageUrl = (articleImage: string | null | undefined, id: string, category: 'recruitment' | 'briefing' | 'system' | 'event'): string => {
  if (articleImage && !articleImage.includes('supabase.co/storage')) {
    return articleImage;
  }
  return getArticleImage(id, category);
};

export const ArticleShowcase: React.FC<ArticleShowcaseProps> = ({ setActiveTab, events, featuredArticleIds = [] }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [visibleCount, setVisibleCount] = useState(6);

  const mainFeedRef = useRef<HTMLDivElement>(null);

  // 현재 송출 완료된 기사 데이터(status === 'completed')를 불러와 동적 매핑
  const mockArticles: Article[] = (events || (eventsData as CalendarEvent[]))
    .filter(evt => evt.status === 'completed')
    .map((evt): Article => {
      const categoryLabel = evt.category || '이벤트/소식';
      let category: 'recruitment' | 'briefing' | 'system' | 'event' = 'event';
      if (categoryLabel === '모집/개강') category = 'recruitment';
      else if (categoryLabel === '입시/설명회') category = 'briefing';
      else if (categoryLabel === '학습/관리') category = 'system';

      // excerpt 추출: 기사 본문의 앞 150자
      let excerpt = '';
      if (evt.content) {
        const parts = evt.content.split('[기사 본문]');
        const bodyText = parts.length > 1 ? parts[1].trim() : evt.content.trim();
        excerpt = bodyText.substring(0, 150).replace(/\n/g, ' ') + (bodyText.length > 150 ? '...' : '');
      }

      return {
        id: evt.id,
        title: evt.title,
        excerpt: excerpt || evt.title,
        content: evt.content,
        date: evt.date,
        category,
        categoryLabel,
        branch: evt.branch,
        media: evt.media || ['네이버뉴스'],
        articleImage: (evt as any).articleImage,
        newsUrl: evt.newsUrl
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  // Filter & Search logic
  const filteredArticles = mockArticles.filter(art => {
    const matchesSearch = 
      art.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      art.content.toLowerCase().includes(searchQuery.toLowerCase()) || 
      art.branch.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = activeCategory === 'all' || art.category === activeCategory;

    return matchesSearch && matchesCategory;
  });

  // 4. Featured Carousel용 대표 기사 추출 (본사 대시보드 선정작 반영, 미지정 시 최신 3건 폴백)
  let featuredArticles = mockArticles.filter(art => featuredArticleIds.includes(art.id));
  featuredArticles.sort((a, b) => featuredArticleIds.indexOf(a.id) - featuredArticleIds.indexOf(b.id));
  if (featuredArticles.length === 0) {
    featuredArticles = mockArticles.slice(0, Math.min(mockArticles.length, 3));
  }

  // Top Visual용 대형 카드 데이터 매핑 (기사 데이터 중 최신 8건 선정)
  const topVisualArticles = mockArticles.slice(0, Math.min(mockArticles.length, 8));

  // 대표 기사 자동 롤링 타이머 (4.5초 간격으로 우측에서 좌측으로 이동)
  useEffect(() => {
    if (featuredArticles.length === 0) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % featuredArticles.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [featuredArticles.length]);

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? featuredArticles.length - 1 : prev - 1));
  };

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev === featuredArticles.length - 1 ? 0 : prev + 1));
  };

  const handleCardClick = (article: Article) => {
    if (article.newsUrl) {
      window.open(article.newsUrl, '_blank', 'noopener,noreferrer');
    } else {
      setSelectedArticle(article);
      setIsDrawerOpen(true);
      setIsCopied(false);
    }
  };

  const handleCopyText = async () => {
    if (!selectedArticle) return;
    try {
      await navigator.clipboard.writeText(selectedArticle.content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('클립보드 복사 실패', err);
    }
  };

  const scrollToFeedAndFilter = (category: string) => {
    setActiveCategory(category);
    setVisibleCount(6); // 카테고리 변경 시 표시 개수 초기화
    
    // 메인 피드로 스크롤 이동
    if (mainFeedRef.current) {
      mainFeedRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleShowMore = () => {
    setVisibleCount(prev => prev + 6);
  };

  return (
    <div className="page-container showcase-page">
      
      {/* 1. TOP VISUAL GRID (대표 기사 무한 좌 ➡️ 우 자동 롤링) */}
      <section className="top-visual-roller-wrapper">
        <div className="top-visual-grid">
          {[...topVisualArticles, ...topVisualArticles].map((art, idx) => {
            const imageUrl = resolveImageUrl(art.articleImage, art.id, art.category);
            return (
              <div 
                key={`top-visual-${art.id}-${idx}`} 
                className="top-visual-card"
                style={{ backgroundImage: `url(${imageUrl})` }}
                onClick={() => handleCardClick(art)}
              >
                <div className="visual-card-overlay">
                  <div className="visual-card-content">
                    <div className="visual-card-meta">
                      <span className="visual-card-tag">{art.categoryLabel}</span>
                      <span className="visual-card-branch">{art.branch}</span>
                    </div>
                    <h2 className="visual-card-title">{art.title}</h2>
                    <button className="visual-card-btn" title="상세 내용 보기">
                      <ArrowRight size={20} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="roller-mask-left"></div>
        <div className="roller-mask-right"></div>
      </section>

      {/* 2. QUICK CATEGORY COLOR BAND (가로 퀵 필터 밴드) */}
      <section className="category-color-band">
        <div 
          className="color-band-card band-recruitment"
          onClick={() => scrollToFeedAndFilter('recruitment')}
        >
          <div className="band-indicator" />
          <div className="band-content">
            <span className="band-title">모집/개강</span>
            <span className="band-desc">재수반 선착순 모집 마감 및 신설 프로그램</span>
          </div>
          <ArrowRight size={16} className="band-arrow" />
        </div>

        <div 
          className="color-band-card band-briefing"
          onClick={() => scrollToFeedAndFilter('briefing')}
        >
          <div className="band-indicator" />
          <div className="band-content">
            <span className="band-title">입시/설명회</span>
            <span className="band-desc">명문대 멘토링 및 전국 릴레이 합격 전략 설명회</span>
          </div>
          <ArrowRight size={16} className="band-arrow" />
        </div>

        <div 
          className="color-band-card band-system"
          onClick={() => scrollToFeedAndFilter('system')}
        >
          <div className="band-indicator" />
          <div className="band-content">
            <span className="band-title">학습/관리</span>
            <span className="band-desc">초밀착 학생 관리 사례 및 스마트 학습 시스템 안내</span>
          </div>
          <ArrowRight size={16} className="band-arrow" />
        </div>

        <div 
          className="color-band-card band-event"
          onClick={() => scrollToFeedAndFilter('event')}
        >
          <div className="band-indicator" />
          <div className="band-content">
            <span className="band-title">이벤트/소식</span>
            <span className="band-desc">이투스247 장학 혜택 및 신규 지점 오픈 소식</span>
          </div>
          <ArrowRight size={16} className="band-arrow" />
        </div>
      </section>

      {/* 4. FEATURED CAROUSEL (대표 기사 자동 가로 슬라이더) */}
      {featuredArticles.length > 0 && (
        <section className="showcase-carousel-wrapper">
          <div className="showcase-carousel">
            <div 
              className="showcase-carousel-track" 
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {featuredArticles.map((art) => (
                <div 
                  key={`carousel-slide-${art.id}`}
                  className="carousel-slide-item"
                  style={{
                    backgroundImage: `url(${resolveImageUrl(art.articleImage, art.id, art.category)})`
                  }}
                >
                  <div className="carousel-slide-overlay">
                    <div className="carousel-slide-content">
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
                        <span className="badge badge-completed carousel-badge">
                          {art.categoryLabel}
                        </span>
                        <span className="carousel-branch-badge">{art.branch}</span>
                      </div>
                      
                      <h2 className="carousel-title" onClick={() => handleCardClick(art)}>
                        {art.title}
                      </h2>
                      <p className="carousel-excerpt">{art.excerpt}</p>
                      <div className="carousel-meta-row">
                        <span className="carousel-date">{art.date}</span>
                        <button className="btn btn-primary btn-carousel-action" onClick={() => handleCardClick(art)}>
                          상세 기사 보기 <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <button className="carousel-arrow carousel-arrow-left" onClick={handlePrevSlide} title="이전 기사">
              <ChevronLeft size={20} />
            </button>
            <button className="carousel-arrow carousel-arrow-right" onClick={handleNextSlide} title="다음 기사">
              <ChevronRight size={20} />
            </button>

            <div className="carousel-dots">
              {featuredArticles.map((_, idx) => (
                <span 
                  key={idx} 
                  className={`carousel-dot ${currentSlide === idx ? 'active' : ''}`}
                  onClick={() => setCurrentSlide(idx)}
                />
              ))}
            </div>
          </div>
        </section>
      )}


      {/* 5. MAIN FEED SECTION (세로 필터 + 2열 그리드 + 더보기) */}
      <div className="showcase-layout-container" ref={mainFeedRef}>
        
        {/* Left Column: Vertical Sidebar Filters */}
        <aside className="showcase-filter-sidebar glass">
          <h3 className="sidebar-filter-title">기사 유형</h3>
          <nav className="sidebar-filter-nav">
            <button 
              className={`sidebar-filter-item ${activeCategory === 'all' ? 'active' : ''}`}
              onClick={() => { setActiveCategory('all'); setVisibleCount(6); }}
            >
              <span className="filter-nav-indicator" style={{ backgroundColor: 'var(--text-secondary)' }} />
              전체 보기
            </button>
            <button 
              className={`sidebar-filter-item ${activeCategory === 'recruitment' ? 'active' : ''}`}
              onClick={() => { setActiveCategory('recruitment'); setVisibleCount(6); }}
            >
              <span className="filter-nav-indicator" style={{ backgroundColor: '#3b82f6' }} />
              모집/개강
            </button>
            <button 
              className={`sidebar-filter-item ${activeCategory === 'briefing' ? 'active' : ''}`}
              onClick={() => { setActiveCategory('briefing'); setVisibleCount(6); }}
            >
              <span className="filter-nav-indicator" style={{ backgroundColor: '#ec4899' }} />
              입시/설명회
            </button>
            <button 
              className={`sidebar-filter-item ${activeCategory === 'system' ? 'active' : ''}`}
              onClick={() => { setActiveCategory('system'); setVisibleCount(6); }}
            >
              <span className="filter-nav-indicator" style={{ backgroundColor: '#10b981' }} />
              학습/관리
            </button>
            <button 
              className={`sidebar-filter-item ${activeCategory === 'event' ? 'active' : ''}`}
              onClick={() => { setActiveCategory('event'); setVisibleCount(6); }}
            >
              <span className="filter-nav-indicator" style={{ backgroundColor: '#a855f7' }} />
              이벤트/소식
            </button>
          </nav>
        </aside>

        {/* Right Column: Search + Grid */}
        <div className="showcase-content-panel">
          <div className="showcase-search-row">
            <div className="search-bar">
              <Search size={18} className="search-icon" />
              <input 
                type="text" 
                className="form-control search-input" 
                placeholder="지점명, 제목, 기사 키워드 검색..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setVisibleCount(6); }}
              />
            </div>
            <span className="showcase-count-info">
              총 <strong>{filteredArticles.length}</strong>건의 완료된 보도자료
            </span>
          </div>

          {filteredArticles.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-muted)' }} className="glass empty-showcase-container">
              <FileText size={48} style={{ margin: '0 auto 16px', display: 'block', opacity: 0.3 }} />
              검색 및 필터 조건에 부합하는 예시 기사가 없습니다.
            </div>
          ) : (
            <>
              <div className="articles-grid">
                {filteredArticles.slice(0, visibleCount).map(art => {
                  const imageUrl = resolveImageUrl(art.articleImage, art.id, art.category);
                  return (
                    <div 
                      key={art.id} 
                      className="article-card glass glass-interactive"
                      onClick={() => handleCardClick(art)}
                    >
                      <div className="article-card-image-wrapper">
                        <img src={imageUrl} alt={art.title} className="article-card-image" />
                        <div className="article-card-image-overlay">
                          <span className="badge badge-completed">{art.categoryLabel}</span>
                          <span className="article-card-branch">{art.branch}</span>
                        </div>
                      </div>
                      
                      <div className="article-card-body">
                        <span className="article-card-date">{art.date}</span>
                        <h3 className="article-card-title">{art.title}</h3>
                        <p className="article-card-excerpt">{art.excerpt}</p>
                        
                        <div className="article-card-footer">
                          <span className="view-more-link">
                            상세보기
                            <ChevronRight size={14} />
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* READ MORE BUTTON (더보기 페이징) */}
              {filteredArticles.length > visibleCount && (
                <div className="showcase-more-btn-row">
                  <button 
                    className="btn btn-secondary btn-showcase-more"
                    onClick={handleShowMore}
                  >
                    <span>더보기</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Slide-out Article Drawer */}
      {isDrawerOpen && selectedArticle && (
        <>
          <div className="drawer-backdrop" onClick={() => setIsDrawerOpen(false)} />
          <div className="drawer-panel" style={{ width: '500px' }}>
            <div className="drawer-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={20} style={{ color: 'var(--color-primary)' }} />
                <h3 className="drawer-title">예시 기사 상세</h3>
              </div>
              <button className="drawer-close" onClick={() => setIsDrawerOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="drawer-content article-full-view">
              <h2 className="article-full-title">{selectedArticle.title}</h2>
              
              <div className="article-full-meta">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={14} style={{ color: 'var(--color-primary)' }} />
                  <span>학원 지점: <strong>{selectedArticle.branch}</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CalendarIcon size={14} style={{ color: 'var(--color-primary)' }} />
                  <span>송출 완료일: {selectedArticle.date}</span>
                </div>
              </div>

              <div className="article-full-text">
                {selectedArticle.content}
              </div>
            </div>

            <div className="drawer-footer">
              <button className="btn btn-secondary" onClick={handleCopyText}>
                <Copy size={14} style={{ marginRight: '6px' }} />
                {isCopied ? '복사 완료' : '본문 텍스트 복사'}
              </button>
              <button 
                className="btn btn-primary"
                onClick={() => {
                  setIsDrawerOpen(false);
                  setActiveTab('writer');
                }}
              >
                <Sparkles size={14} />
                이 기사 템플릿으로 AI 작성하기
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
