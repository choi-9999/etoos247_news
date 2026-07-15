import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { CalendarView } from './components/CalendarView';
import type { CalendarEvent } from './components/CalendarView';
import { AIWriter } from './components/AIWriter';
import { ArticleShowcase } from './components/ArticleShowcase';
import { Dashboard } from './components/Dashboard';
import { supabase, isConfigured as isSupabaseConfigured } from './lib/supabaseClient';
import './App.css';

type SupabaseEventRow = Record<string, unknown>;

const getRowValue = <T,>(row: SupabaseEventRow, camelKey: string, dbKey: string, fallback: T): T => {
  const value = row[camelKey] ?? row[dbKey];
  return (value ?? fallback) as T;
};

const toCalendarEvent = (row: SupabaseEventRow): CalendarEvent => ({
  id: getRowValue(row, 'id', 'id', ''),
  title: getRowValue(row, 'title', 'title', ''),
  content: getRowValue(row, 'content', 'content', ''),
  date: getRowValue(row, 'date', 'date', ''),
  time: getRowValue(row, 'time', 'time', '10:00'),
  branch: getRowValue(row, 'branch', 'branch', ''),
  media: getRowValue(row, 'media', 'media', []),
  status: getRowValue(row, 'status', 'status', 'pending'),
  createdDate: getRowValue(row, 'createdDate', 'createddate', ''),
  attachmentType: getRowValue(row, 'attachmentType', 'attachmenttype', 'none'),
  attachmentName: getRowValue(row, 'attachmentName', 'attachmentname', ''),
  category: getRowValue(row, 'category', 'category', undefined),
  mediaAttachments: getRowValue(row, 'mediaAttachments', 'mediaattachments', []),
  newsUrl: getRowValue(row, 'newsUrl', 'newsurl', undefined),
  articleCategory: getRowValue(row, 'articleCategory', 'articlecategory', undefined),
  articleCategoryLabel: getRowValue(row, 'articleCategoryLabel', 'articlecategorylabel', undefined),
  categoryLabel: getRowValue(row, 'categoryLabel', 'categorylabel', undefined),
  articleImage: getRowValue(row, 'articleImage', 'articleimage', undefined),
});

function App() {
  const [activeTab, setActiveTab] = useState<string>('articles');
  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    // Supabase가 미설정 상태일 때만 localStorage를 백업으로 조회
    const isConfigured = 
      import.meta.env.VITE_SUPABASE_URL && 
      !import.meta.env.VITE_SUPABASE_URL.includes('your-project-id') &&
      import.meta.env.VITE_SUPABASE_ANON_KEY &&
      !import.meta.env.VITE_SUPABASE_ANON_KEY.includes('your-anon-key');

    if (!isConfigured) {
      const saved = localStorage.getItem('calendarEvents');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
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
          // 오직 Supabase DB 데이터만 표시 (로컬 스토리지 병합 및 백필 생략)
          setEvents(data.map(toCalendarEvent));
        }
      } catch (err) {
        console.error('Supabase 데이터 가져오기 실패, 기본 기사 데이터를 로드합니다:', err);
        setEvents([]);
      }
    };

    fetchSupabaseEvents();
  }, []);



  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }, [theme]);

  // Supabase가 연결되지 않은 임시 로컬 모드일 때만 예외적으로 상태값을 브라우저 캐시에 백업
  useEffect(() => {
    if (!isSupabaseConfigured) {
      localStorage.setItem('calendarEvents', JSON.stringify(events));
    }
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
          createddate: newEvent.createdDate || '',
          attachmenttype: newEvent.attachmentType || 'none',
          attachmentname: newEvent.attachmentName || '',
          mediaattachments: newEvent.mediaAttachments || [],
          newsurl: newEvent.newsUrl || null,
          articlecategory: newEvent.articleCategory || null,
          articlecategorylabel: newEvent.articleCategoryLabel || null,
          categorylabel: newEvent.categoryLabel || null,
          articleimage: newEvent.articleImage || null,
        };

        const { error: insertError } = await supabase
          .from('etoos_news_events')
          .insert(corePayload);

        if (insertError) throw insertError;

        // 2단계: 확장 컬럼은 UPDATE로 덧붙이기 (컬럼 없으면 조용히 무시됨)
        const extendedPayload: Record<string, unknown> = {};
        if (newEvent.createdDate) extendedPayload['createddate'] = newEvent.createdDate;
        if (newEvent.attachmentType) extendedPayload['attachmenttype'] = newEvent.attachmentType;
        if (newEvent.attachmentName !== undefined) extendedPayload['attachmentname'] = newEvent.attachmentName;
        if (newEvent.newsUrl) extendedPayload['newsurl'] = newEvent.newsUrl;
        if (newEvent.articleCategory) extendedPayload['articlecategory'] = newEvent.articleCategory;
        if (newEvent.articleCategoryLabel) extendedPayload['articlecategorylabel'] = newEvent.articleCategoryLabel;
        if (newEvent.categoryLabel) extendedPayload['categorylabel'] = newEvent.categoryLabel;
        if (newEvent.articleImage) extendedPayload['articleimage'] = newEvent.articleImage;

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
              mediaattachments: [],
              attachmenttype: 'none',
              attachmentname: ''
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
            newsurl: newsUrl || (targetEvent ? targetEvent.newsUrl : null),
            articleimage: articleImage || (targetEvent ? targetEvent.articleImage : null)
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

  const handleUpdateEventBranch = async (id: string, newBranch: string) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, branch: newBranch } : e))
    );

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('etoos_news_events')
          .update({ branch: newBranch })
          .eq('id', id);
        if (error) throw error;
      } catch (err) {
        console.error('Supabase DB 지점 갱신 실패:', err);
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
            onUpdateEventBranch={handleUpdateEventBranch}
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
