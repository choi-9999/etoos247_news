import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { CalendarView } from './components/CalendarView';
import type { CalendarEvent } from './components/CalendarView';
import { AIWriter } from './components/AIWriter';
import { ArticleShowcase } from './components/ArticleShowcase';
import { Dashboard } from './components/Dashboard';
import { supabase } from './lib/supabaseClient';
import initialEventsData from './data/eventsData.json';
import './App.css';

const initialEvents: CalendarEvent[] = initialEventsData as CalendarEvent[];

const isSupabaseConfigured = 
  import.meta.env.VITE_SUPABASE_URL && 
  !import.meta.env.VITE_SUPABASE_URL.includes('your-project-id') &&
  import.meta.env.VITE_SUPABASE_ANON_KEY &&
  !import.meta.env.VITE_SUPABASE_ANON_KEY.includes('your-anon-key');

function App() {
  const [activeTab, setActiveTab] = useState<string>('articles');
  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    const saved = localStorage.getItem('calendarEvents');
    return saved ? JSON.parse(saved) : initialEvents;
  });
  const [userRole, setUserRole] = useState<'admin' | 'branch'>('branch');
  const [userBranch] = useState<string>('서울강남점');
  const [featuredArticleIds, setFeaturedArticleIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('featuredArticleIds');
    return saved ? JSON.parse(saved) : [];
  });
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });

  // Supabase 실시간 데이터 동기화 fetch
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const fetchSupabaseEvents = async () => {
      try {
        const { data, error } = await supabase
          .from('etoos_news_events')
          .select('*')
          .order('date', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          // DB 데이터와 로컬 전용 이벤트를 병합 (덮어쓰지 않고 합치기)
          const dbIds = new Set(data.map((e: CalendarEvent) => e.id));
          const savedLocal = localStorage.getItem('calendarEvents');
          const localEvents: CalendarEvent[] = savedLocal ? JSON.parse(savedLocal) : [];
          // 로컬에만 있고 DB에 없는 이벤트 (아직 미싱크 이벤트)
          const localOnlyEvents = localEvents.filter(e => !dbIds.has(e.id));

          if (localOnlyEvents.length > 0) {
            console.log(`로컬 전용 미동기화 이벤트 ${localOnlyEvents.length}건 → DB에 백필 중...`);
            for (const evt of localOnlyEvents) {
              // 핵심 컬럼만으로 안전하게 INSERT
              await supabase.from('etoos_news_events').insert({
                id: evt.id,
                title: evt.title,
                content: evt.content || '',
                date: evt.date,
                time: evt.time || '10:00',
                branch: evt.branch,
                media: evt.media || ['네이버뉴스'],
                status: evt.status,
                category: evt.category || '이벤트/소식',
                mediaAttachments: evt.mediaAttachments || [],
              });
            }
          }

          // DB 데이터 + 로컬 전용 이벤트 병합 후 상태 갱신
          const merged = [...data as CalendarEvent[], ...localOnlyEvents];
          merged.sort((a, b) => a.date.localeCompare(b.date));
          setEvents(merged);
        } else {
          // DB가 비어있는 최초 실행 시, 현재 로컬 데이터를 DB에 업로드
          const savedLocal = localStorage.getItem('calendarEvents');
          const localEvents: CalendarEvent[] = savedLocal ? JSON.parse(savedLocal) : initialEvents;
          console.log(`Supabase DB가 비어있어 로컬 데이터 ${localEvents.length}건을 업로드합니다.`);

          for (const evt of localEvents) {
            await supabase.from('etoos_news_events').insert({
              id: evt.id,
              title: evt.title,
              content: evt.content || '',
              date: evt.date,
              time: evt.time || '10:00',
              branch: evt.branch,
              media: evt.media || ['네이버뉴스'],
              status: evt.status,
              category: evt.category || '이벤트/소식',
              mediaAttachments: evt.mediaAttachments || [],
            });
          }
          console.log('로컬 데이터 DB 업로드 완료');
          setEvents(localEvents); // 상태 업데이트 추가
        }
      } catch (err) {
        console.error('Supabase 데이터 가져오기 실패, 로컬 백업 데이터를 사용합니다:', err);
        const savedLocal = localStorage.getItem('calendarEvents');
        const fallback = savedLocal ? JSON.parse(savedLocal) : initialEvents;
        setEvents(fallback); // 폴백 복구 추가
      }
    };

    fetchSupabaseEvents();
  }, []);

  // 송출 완료(completed) -> 송출 예정(approved) 일괄 일회성 마이그레이션 훅
  // ※ localStorage 플래그로 최초 1회만 실행 (F5 시 반복 실행 방지)
  useEffect(() => {
    const MIGRATION_KEY = 'migration_completed_to_approved_v1_done';
    if (localStorage.getItem(MIGRATION_KEY)) return; // 이미 실행됨 → 스킵

    const migrateStatus = async () => {
      // 1. 로컬 상태 일괄 변경
      setEvents((prev) => {
        const hasCompleted = prev.some(e => e.status === 'completed');
        if (hasCompleted) {
          console.log('로컬 상태: 송출 완료(completed) 기사 일괄 복원 진행');
          return prev.map(e => e.status === 'completed' ? { ...e, status: 'approved' } : e);
        }
        return prev;
      });

      // 2. Supabase DB 설정 시 DB 상태 일괄 변경
      if (isSupabaseConfigured) {
        try {
          const { error } = await supabase
            .from('etoos_news_events')
            .update({ status: 'approved' })
            .eq('status', 'completed');
          if (error) throw error;
          console.log('Supabase DB: 송출 완료 기사 일괄 복원 완료');
        } catch (err) {
          console.error('Supabase DB 일괄 복원 오류:', err);
        }
      }

      // 완료 플래그 저장 (다음 F5부터 스킵)
      localStorage.setItem(MIGRATION_KEY, 'true');
    };

    migrateStatus();
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('calendarEvents', JSON.stringify(events));
  }, [events]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleAddEvent = async (newEvent: CalendarEvent) => {
    setEvents((prev) => [...prev, newEvent]);

    if (isSupabaseConfigured) {
      try {
        // 1단계: 반드시 존재하는 핵심 컬럼만으로 INSERT (스키마 미스 방어)
        const corePayload = {
          id: newEvent.id,
          title: newEvent.title,
          content: newEvent.content || '',
          date: newEvent.date,
          time: newEvent.time || '10:00',
          branch: newEvent.branch,
          media: newEvent.media || ['네이버뉴스'],
          status: newEvent.status,
          category: newEvent.category || '이벤트/소식',
          mediaAttachments: newEvent.mediaAttachments || [],
        };

        const { error: insertError } = await supabase
          .from('etoos_news_events')
          .insert(corePayload);

        if (insertError) throw insertError;

        // 2단계: 확장 컬럼은 UPDATE로 덧붙이기 (컬럼 없으면 조용히 무시됨)
        const extendedPayload: Record<string, unknown> = {};
        if (newEvent.createdDate) extendedPayload['createdDate'] = newEvent.createdDate;
        if (newEvent.attachmentType) extendedPayload['attachmentType'] = newEvent.attachmentType;
        if (newEvent.attachmentName !== undefined) extendedPayload['attachmentName'] = newEvent.attachmentName;
        if (newEvent.newsUrl) extendedPayload['newsUrl'] = newEvent.newsUrl;
        if (newEvent.articleCategory) extendedPayload['articleCategory'] = newEvent.articleCategory;
        if (newEvent.articleCategoryLabel) extendedPayload['articleCategoryLabel'] = newEvent.articleCategoryLabel;
        if (newEvent.categoryLabel) extendedPayload['categoryLabel'] = newEvent.categoryLabel;
        if (newEvent.articleImage) extendedPayload['articleImage'] = newEvent.articleImage;

        if (Object.keys(extendedPayload).length > 0) {
          await supabase
            .from('etoos_news_events')
            .update(extendedPayload)
            .eq('id', newEvent.id);
          // 확장 컬럼 UPDATE 실패는 무시 (컬럼이 없으면 조용히 스킵)
        }

        console.log('✅ Supabase DB 저장 완료:', newEvent.id);
      } catch (err) {
        console.error('Supabase DB 추가 실패:', err);
      }
    }
  };

  const handleDeleteEvent = async (id: string) => {
    const targetEvent = events.find(e => e.id === id);
    setEvents((prev) => prev.filter(e => e.id !== id));

    if (isSupabaseConfigured) {
      try {
        // C방법: 스토리지 물리 파일 연쇄 삭제
        if (targetEvent && targetEvent.mediaAttachments && targetEvent.mediaAttachments.length > 0) {
          const filesToDelete = targetEvent.mediaAttachments
            .filter(attach => attach.url)
            .map(attach => attach.url!.split('/').pop() || '')
            .filter(name => name !== '');

          if (filesToDelete.length > 0) {
            const { error: storageErr } = await supabase.storage
              .from('etoos-news')
              .remove(filesToDelete);
            
            if (storageErr) {
              console.error('스토리지 파일 연쇄 삭제 실패:', storageErr.message);
            } else {
              console.log('스토리지 파일 연쇄 삭제 완료:', filesToDelete);
            }
          }
        }

        const { error } = await supabase.from('etoos_news_events').delete().eq('id', id);
        if (error) throw error;
      } catch (err) {
        console.error('Supabase DB 삭제 실패:', err);
      }
    }
  };

  const handleCleanupPastEvents = async (pastEventIds: string[], filesToDelete: string[]) => {
    // 1. 로컬 상태 갱신 (mediaAttachments 비우고 스펙 초기화)
    setEvents((prev) =>
      prev.map((e) =>
        pastEventIds.includes(e.id)
          ? { ...e, mediaAttachments: [], attachmentType: 'none', attachmentName: '' }
          : e
      )
    );

    if (isSupabaseConfigured) {
      try {
        // 2. Supabase Storage 물리 파일 삭제
        if (filesToDelete.length > 0) {
          const { error: storageErr } = await supabase.storage
            .from('etoos-news')
            .remove(filesToDelete);
          
          if (storageErr) throw storageErr;
        }

        // 3. Supabase DB 레코드 일괄 업데이트
        const updatePromises = pastEventIds.map(id => 
          supabase
            .from('etoos_news_events')
            .update({
              mediaAttachments: [],
              attachmentType: 'none',
              attachmentName: ''
            })
            .eq('id', id)
        );

        await Promise.all(updatePromises);
        console.log('30일 경과 스토리지 일괄 청소 완료');
      } catch (err) {
        console.error('스토리지 일괄 청소 실패:', err);
        throw err;
      }
    }
  };

  const handleUpdateEventStatus = async (
    id: string, 
    newStatus: 'pending' | 'approved' | 'completed' | 'rejected',
    newsUrl?: string,
    articleImage?: string
  ) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: newStatus, newsUrl: newsUrl || e.newsUrl, articleImage: articleImage || e.articleImage } : e))
    );

    if (isSupabaseConfigured) {
      try {
        const targetEvent = events.find(e => e.id === id);
        const { error } = await supabase
          .from('etoos_news_events')
          .update({ 
            status: newStatus, 
            newsUrl: newsUrl || (targetEvent ? targetEvent.newsUrl : null),
            articleImage: articleImage || (targetEvent ? targetEvent.articleImage : null)
          })
          .eq('id', id);
        if (error) throw error;
      } catch (err) {
        console.error('Supabase DB 상태 갱신 실패:', err);
      }
    }
  };

  const handleUpdateEventDate = async (id: string, newDate: string) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, date: newDate } : e))
    );

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('etoos_news_events')
          .update({ date: newDate })
          .eq('id', id);
        if (error) throw error;
      } catch (err) {
        console.error('Supabase DB 날짜 갱신 실패:', err);
      }
    }
  };

  const handleUpdateEventTitle = async (id: string, newTitle: string) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, title: newTitle } : e))
    );

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('etoos_news_events')
          .update({ title: newTitle })
          .eq('id', id);
        if (error) throw error;
      } catch (err) {
        console.error('Supabase DB 제목 갱신 실패:', err);
      }
    }
  };

  const handleUpdateFeaturedArticles = (ids: string[]) => {
    setFeaturedArticleIds(ids);
    localStorage.setItem('featuredArticleIds', JSON.stringify(ids));
  };

  return (
    <div className="app-container">
      <Header 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        userRole={userRole}
        setUserRole={setUserRole}
        theme={theme}
        toggleTheme={toggleTheme}
      />
      
      <main className="main-content">
        {activeTab === 'calendar' && (
          <CalendarView 
            events={events} 
            onAddEvent={handleAddEvent} 
            onDeleteEvent={handleDeleteEvent} 
            userRole={userRole}
            userBranch={userBranch}
            onUpdateEventStatus={handleUpdateEventStatus}
            onUpdateEventDate={handleUpdateEventDate}
            onUpdateEventTitle={handleUpdateEventTitle}
            onCleanupPastEvents={handleCleanupPastEvents}
          />
        )}
        {activeTab === 'writer' && (
          <AIWriter 
            onAddEvent={handleAddEvent} 
            setActiveTab={setActiveTab} 
            userRole={userRole}
            events={events}
          />
        )}
        {activeTab === 'articles' && (
          <ArticleShowcase 
            setActiveTab={setActiveTab} 
            events={events}
            featuredArticleIds={featuredArticleIds}
          />
        )}
        {activeTab === 'dashboard' && userRole === 'admin' && (
          <Dashboard 
            events={events} 
            featuredArticleIds={featuredArticleIds}
            onUpdateFeaturedArticles={handleUpdateFeaturedArticles}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}

export default App;
