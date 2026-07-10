import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, X, Clock, MapPin, AlertCircle, Trash2 } from 'lucide-react';
import * as mammoth from 'mammoth';
import { supabase } from '../lib/supabaseClient';
import './CalendarView.css';

export interface CalendarEvent {
  id: string;
  title: string;
  content: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  branch: string;
  media: string[];
  status: 'pending' | 'approved' | 'completed' | 'rejected';
  createdDate: string;
  attachmentType?: 'file' | 'image' | 'none';
  attachmentName?: string;
  attachmentCount?: number;
  category?: '모집/개강' | '입시/설명회' | '학습/관리' | '이벤트/소식';
  mediaAttachments?: { name: string; type: 'file' | 'image'; size?: string; url?: string }[];
  newsUrl?: string;
  articleCategory?: 'recruitment' | 'briefing' | 'system' | 'event';
  articleCategoryLabel?: string;
  categoryLabel?: string;
  articleImage?: string;
}

const isSupabaseConfigured = 
  import.meta.env.VITE_SUPABASE_URL && 
  !import.meta.env.VITE_SUPABASE_URL.includes('your-project-id') &&
  import.meta.env.VITE_SUPABASE_ANON_KEY &&
  !import.meta.env.VITE_SUPABASE_ANON_KEY.includes('your-anon-key');

interface CalendarViewProps {
  events: CalendarEvent[];
  onAddEvent: (event: CalendarEvent) => void;
  onDeleteEvent: (id: string) => void;
  userRole: 'admin' | 'branch';
  userBranch: string;
  onUpdateEventStatus: (id: string, newStatus: 'pending' | 'approved' | 'completed' | 'rejected', newsUrl?: string, articleImage?: string) => void;
  onUpdateEventDate: (id: string, newDate: string) => void;
  onUpdateEventTitle: (id: string, newTitle: string) => void;
  onCleanupPastEvents: (pastEventIds: string[], filesToDelete: string[]) => Promise<void>;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ 
  events, 
  onAddEvent, 
  onDeleteEvent,
  userRole,
  userBranch,
  onUpdateEventStatus,
  onUpdateEventDate,
  onUpdateEventTitle,
  onCleanupPastEvents
}) => {
  // Current date initialization to today
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [draggedOverDateStr, setDraggedOverDateStr] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Form states (Remodeled to match image & multiple uploads)
  const [newTitle, setNewTitle] = useState('');
  const [newBranchInput, setNewBranchInput] = useState('');
  const [newDateInput, setNewDateInput] = useState('');
  const [newCategory, setNewCategory] = useState<'모집/개강' | '입시/설명회' | '학습/관리' | '이벤트/소식'>('모집/개강');
  const [uploadedFiles, setUploadedFiles] = useState<{ file: File; name: string; type: 'file' | 'image'; sizeStr: string }[]>([]);

  const [parsedTextContent, setParsedTextContent] = useState<string>('');
  const [alertModal, setAlertModal] = useState<{ isOpen: boolean; message: string } | null>(null);

  const showAlert = (message: string) => {
    setAlertModal({ isOpen: true, message });
  };

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const showConfirm = (message: string, onConfirm: () => void) => {
    setConfirmModal({ isOpen: true, message, onConfirm });
  };

  const [completionModal, setCompletionModal] = useState<{
    isOpen: boolean;
    eventId: string;
  } | null>(null);
  const [completeNewsUrl, setCompleteNewsUrl] = useState('');
  const [completeImageUrl, setCompleteImageUrl] = useState('');

  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editingTitleVal, setEditingTitleVal] = useState<string>('');

  const handleSaveTitle = (id: string) => {
    if (editingTitleVal.trim()) {
      onUpdateEventTitle(id, editingTitleVal.trim());
    }
    setEditingEventId(null);
  };



  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-11

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Helper to construct grid
  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay(); // 0 (Sun) to 6 (Sat)

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayIndex = getFirstDayOfMonth(year, month);

  // Generate calendar day cells
  const dayCells = [];
  
  // Previous month padding cells
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const prevDays = getDaysInMonth(prevYear, prevMonth);
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const day = prevDays - i;
    const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    dayCells.push({
      day,
      isCurrentMonth: false,
      dateStr,
    });
  }

  // Current month cells
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    dayCells.push({
      day: i,
      isCurrentMonth: true,
      dateStr,
    });
  }

  // Next month padding cells to complete targetCellCount grid (35 or 42 cells)
  const totalNeededCells = firstDayIndex + daysInMonth;
  const targetCellCount = totalNeededCells <= 35 ? 35 : 42;
  const remainingCells = targetCellCount - dayCells.length;
  
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;
  for (let i = 1; i <= remainingCells; i++) {
    const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    dayCells.push({
      day: i,
      isCurrentMonth: false,
      dateStr,
    });
  }

  const numWeeks = targetCellCount / 7;
  const containerMinHeight = numWeeks === 5 ? '780px' : '920px';

  // Event handlers
  const handleDayClick = (dateStr: string) => {
    setSelectedDateStr(dateStr);
    setIsDrawerOpen(true);
    setIsAddingNew(false);
  };

  const handleOpenAddForm = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const todayStr = `${y}-${m}-${d}`;
    const targetDate = selectedDateStr || todayStr;

    if (targetDate < todayStr) {
      showAlert('오늘 이전의 날짜에는 송출 요청을 등록할 수 없습니다.');
      return;
    }

    setIsAddingNew(true);
    setNewTitle('');
    setNewBranchInput('');
    setNewDateInput(targetDate);
    setNewCategory('모집/개강');
    setUploadedFiles([]);
    setParsedTextContent('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newFilesArray: typeof uploadedFiles = [];
      let targetParseFile: File | null = null;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 5 * 1024 * 1024) {
          showAlert(`파일 [${file.name}]의 크기가 5MB를 초과하여 제외되었습니다.`);
          continue;
        }
        
        const fileExt = file.name.split('.').pop()?.toLowerCase();
        const type: 'file' | 'image' = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExt || '') ? 'image' : 'file';
        const sizeStr = `${(file.size / 1024 / 1024).toFixed(2)} MB`;
        
        newFilesArray.push({
          file,
          name: file.name,
          type,
          sizeStr
        });

        // 첫 번째 원고 파일(.docx 또는 .txt)을 파싱 대상으로 지정
        if (!targetParseFile && type === 'file' && (fileExt === 'docx' || fileExt === 'txt')) {
          targetParseFile = file;
        }
      }
      setUploadedFiles(prev => [...prev, ...newFilesArray]);

      // 파일 텍스트 추출 실행
      if (targetParseFile) {
        const fileExt = targetParseFile.name.split('.').pop()?.toLowerCase();
        if (fileExt === 'docx') {
          const reader = new FileReader();
          reader.onload = async (event) => {
            const arrayBuffer = event.target?.result as ArrayBuffer;
            if (arrayBuffer) {
              try {
                const result = await mammoth.extractRawText({ arrayBuffer });
                setParsedTextContent(result.value);
              } catch (err) {
                console.error('Word file parsing error:', err);
                showAlert('Word 파일(.docx) 본문 추출 과정에서 오류가 발생했습니다.');
              }
            }
          };
          reader.readAsArrayBuffer(targetParseFile);
        } else if (fileExt === 'txt') {
          const reader = new FileReader();
          reader.onload = (event) => {
            const text = event.target?.result as string;
            if (text) {
              setParsedTextContent(text);
            }
          };
          reader.readAsText(targetParseFile, 'utf-8');
        }
      }
    }
  };

  const handleRemoveUploadedFile = (index: number) => {
    const nextFiles = uploadedFiles.filter((_, idx) => idx !== index);
    setUploadedFiles(nextFiles);

    // 삭제 후 남은 파일 중에서 새롭게 파싱할 원고 파일(.docx 또는 .txt) 탐색
    const targetParseFile = nextFiles.find(f => {
      const fileExt = f.name.split('.').pop()?.toLowerCase();
      return f.type === 'file' && (fileExt === 'docx' || fileExt === 'txt');
    });

    if (targetParseFile) {
      const fileExt = targetParseFile.file.name.split('.').pop()?.toLowerCase();
      if (fileExt === 'docx') {
        const reader = new FileReader();
        reader.onload = async (event) => {
          const arrayBuffer = event.target?.result as ArrayBuffer;
          if (arrayBuffer) {
            try {
              const result = await mammoth.extractRawText({ arrayBuffer });
              setParsedTextContent(result.value);
            } catch (err) {
              console.error('Word file parsing error:', err);
            }
          }
        };
        reader.readAsArrayBuffer(targetParseFile.file);
      } else if (fileExt === 'txt') {
        const reader = new FileReader();
        reader.onload = (event) => {
          const text = event.target?.result as string;
          if (text) {
            setParsedTextContent(text);
          }
        };
        reader.readAsText(targetParseFile.file, 'utf-8');
      }
    } else {
      setParsedTextContent('');
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDateInput) return;

    // Check if target date is in the past
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const todayStr = `${y}-${m}-${d}`;
    if (newDateInput < todayStr) {
      showAlert('오늘 이전의 날짜에는 송출 요청을 등록할 수 없습니다.');
      return;
    }

    // Check if target date already has an event
    const targetHasEvent = events.some(evt => evt.date === newDateInput);
    if (targetHasEvent) {
      showAlert('선택하신 날짜에는 이미 송출 일정이 등록되어 있습니다. 하루에 최대 한 건만 송출 가능합니다.');
      return;
    }

    setIsUploading(true);

    try {
      const mediaAttachments: { name: string; type: 'file' | 'image'; size: string; url?: string }[] = [];

      // Supabase Storage 업로드 연동
      if (isSupabaseConfigured && uploadedFiles.length > 0) {
        for (const fileObj of uploadedFiles) {
          // 파일명 중복 방지를 위한 랜덤 타임스탬프 결합
          const fileExt = fileObj.name.split('.').pop() || '';
          const randomHash = Math.random().toString(36).substring(2, 10);
          const storagePath = `etoos_${Date.now()}_${randomHash}.${fileExt}`;

          const { data, error } = await supabase.storage
            .from('etoos-news')
            .upload(storagePath, fileObj.file, {
              cacheControl: '3600',
              upsert: false
            });

          if (error) {
            console.error(`파일 [${fileObj.name}] 업로드 실패:`, error.message);
            // 업로드 실패 시 로컬 형태로 삽입
            mediaAttachments.push({
              name: fileObj.name,
              type: fileObj.type,
              size: fileObj.sizeStr
            });
          } else if (data) {
            // Public URL 획득
            const { data: { publicUrl } } = supabase.storage
              .from('etoos-news')
              .getPublicUrl(storagePath);

            mediaAttachments.push({
              name: fileObj.name,
              type: fileObj.type,
              size: fileObj.sizeStr,
              url: publicUrl
            });
          }
        }
      } else {
        // 오프라인/로컬 테스트 분기
        uploadedFiles.forEach(f => {
          mediaAttachments.push({
            name: f.name,
            type: f.type,
            size: f.sizeStr
          });
        });
      }

      // Determine calendar display attachment summary
      const imagesCount = uploadedFiles.filter(f => f.type === 'image').length;
      
      let attachmentType: 'file' | 'image' | 'none' = 'none';
      let attachmentName = '';
      let attachmentCount: number | undefined = undefined;

      if (uploadedFiles.length > 0) {
        if (imagesCount > 0) {
          attachmentType = 'image';
          attachmentCount = imagesCount;
          const firstImg = uploadedFiles.find(f => f.type === 'image');
          attachmentName = firstImg ? `${firstImg.name}${imagesCount > 1 ? ` 외 ${imagesCount - 1}건` : ''}` : '';
        } else {
          attachmentType = 'file';
          const firstDoc = uploadedFiles[0];
          attachmentName = `${firstDoc.name}${uploadedFiles.length > 1 ? ` 외 ${uploadedFiles.length - 1}건` : ''}`;
        }
      }

      const newEvent: CalendarEvent = {
        id: `evt-${Date.now()}`,
        title: newTitle,
        content: parsedTextContent.trim() || `[${newCategory} 기사] 첨부파일 ${uploadedFiles.length}개`,
        date: newDateInput,
        time: '10:00', // 기본 시간
        branch: newBranchInput,
        media: ['네이버뉴스'], // 기본 매체
        status: userRole === 'admin' ? 'approved' : 'pending',
        createdDate: new Date().toISOString().split('T')[0],
        attachmentType,
        attachmentName,
        attachmentCount,
        category: newCategory,
        mediaAttachments
      };

      onAddEvent(newEvent);
      setIsAddingNew(false);
    } catch (err) {
      console.error('기사 등록 실패:', err);
      showAlert('기사 등록 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCleanupPastFiles = async () => {
    // 30일 이전 경계선 날짜 계산
    const boundaryDate = new Date();
    boundaryDate.setDate(boundaryDate.getDate() - 30);
    const boundaryDateStr = boundaryDate.toISOString().split('T')[0];

    // 30일 경과 및 첨부파일이 존재하는 기사 필터링
    const pastEventsWithFiles = events.filter(
      (evt) => 
        evt.date < boundaryDateStr && 
        evt.mediaAttachments && 
        evt.mediaAttachments.length > 0
    );

    if (pastEventsWithFiles.length === 0) {
      showAlert('30일 이상 경과한 정리 대상 첨부파일이 없습니다.');
      return;
    }

    showConfirm(
      `30일이 경과한 총 ${pastEventsWithFiles.length}개 송출 요청의 첨부파일(원본 워드 파일, 보도 이미지 등)을 스토리지에서 일괄 영구 삭제하시겠습니까?\n이 작업은 되돌릴 수 없으며, 클라우드 디스크 용량이 즉시 확보됩니다.`,
      async () => {
        const pastEventIds = pastEventsWithFiles.map((evt) => evt.id);
        const filesToDelete: string[] = [];

        pastEventsWithFiles.forEach((evt) => {
          evt.mediaAttachments?.forEach((attach) => {
            if (attach.url) {
              const fileName = attach.url.split('/').pop();
              if (fileName) filesToDelete.push(fileName);
            }
          });
        });

        try {
          await onCleanupPastEvents(pastEventIds, filesToDelete);
          showAlert(`30일 경과 스토리지 파일 청소 완료!\n총 ${filesToDelete.length}개의 물리 파일이 영구 삭제되었습니다.`);
        } catch (err) {
          console.error('일괄 청소 수행 중 에러:', err);
          showAlert('일괄 청소 중 오류가 발생했습니다.');
        }
      }
    );
  };

  const handleDeleteClick = (id: string) => {
    showConfirm(
      '이 송출 요청을 삭제하시겠습니까?\n이 작업은 복구할 수 없으며 연동된 첨부파일도 스토리지에서 즉시 영구 삭제됩니다.',
      () => {
        onDeleteEvent(id);
      }
    );
  };

  // Filter events for selected date
  const selectedDateEvents = events.filter(e => e.date === selectedDateStr);

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '승인대기';
      case 'approved': return '송출예정';
      case 'completed': return '송출완료';
      case 'rejected': return '반려됨';
      default: return '';
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending': return 'badge-pending';
      case 'approved': return 'badge-approved';
      case 'completed': return 'badge-completed';
      case 'rejected': return 'badge-rejected';
      default: return '';
    }
  };

  // Check if cell is "today" dynamically
  const isToday = (dateStr: string) => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return dateStr === `${y}-${m}-${d}`;
  };

  const canDeleteEvent = (evt: CalendarEvent) => {
    if (userRole === 'admin') return true;
    return evt.branch === userBranch && evt.status === 'pending';
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, eventId: string) => {
    e.dataTransfer.setData('text/plain', eventId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragEnter = (e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    if (userRole === 'admin') {
      setDraggedOverDateStr(dateStr);
    }
  };

  const handleDragLeave = () => {
    setDraggedOverDateStr(null);
  };

  const handleDrop = (e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    setDraggedOverDateStr(null);
    if (userRole !== 'admin') return;

    const eventId = e.dataTransfer.getData('text/plain');
    if (eventId) {
      // Check if target date already has an event
      const targetHasEvent = events.some(evt => evt.date === dateStr && evt.id !== eventId);
      if (targetHasEvent) {
        showAlert('선택하신 날짜에는 이미 송출 일정이 등록되어 있습니다. 하루에 최대 한 건만 송출 가능합니다.');
        return;
      }
      onUpdateEventDate(eventId, dateStr);
    }
  };

  return (
    <div className={`calendar-layout page-container ${userRole === 'admin' ? 'admin-mode-active' : ''}`}>
      <div className="page-header">
        <h1 className="page-title">송출 요청 캘린더</h1>
        <p className="page-subtitle">이투스247학원 홍보 기사의 일자별 송출 예약 일정을 관리하고 요청할 수 있습니다.</p>
      </div>

      <div className="calendar-top-bar">
        <div className="calendar-controls">
          <button className="btn-icon-nav" onClick={handlePrevMonth}>
            <ChevronLeft size={20} />
          </button>
          <div className="calendar-month-year">
            {year}년 {month + 1}월
          </div>
          <button className="btn-icon-nav" onClick={handleNextMonth}>
            <ChevronRight size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {userRole === 'admin' && (
            <button
              className="btn"
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: 'var(--color-rejected)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '10px 16px',
                borderRadius: 'var(--border-radius-md)'
              }}
              onClick={handleCleanupPastFiles}
            >
              🧹 30일 경과 스토리지 청소
            </button>
          )}
          <button 
            className="btn btn-primary"
            onClick={() => {
              const today = new Date();
              const y = today.getFullYear();
              const m = String(today.getMonth() + 1).padStart(2, '0');
              const d = String(today.getDate()).padStart(2, '0');
              const todayStr = `${y}-${m}-${d}`;
              setSelectedDateStr(todayStr);
              setIsDrawerOpen(true);
              handleOpenAddForm();
            }}
          >
            <Plus size={18} />
            송출 요청 등록
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="calendar-legend">
        <div className="legend-item">
          <span className="legend-dot" style={{ backgroundColor: 'var(--color-pending)' }}></span>
          <span>승인대기</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ backgroundColor: 'var(--color-approved)' }}></span>
          <span>송출예정 (승인완료)</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ backgroundColor: 'var(--color-completed)' }}></span>
          <span>송출완료</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ backgroundColor: 'var(--color-rejected)' }}></span>
          <span>반려</span>
        </div>
      </div>

      {/* Grid */}
      <div 
        className="calendar-grid-container"
        style={{ minHeight: containerMinHeight }}
      >
        <div className="calendar-weekdays">
          <div>일</div>
          <div>월</div>
          <div>화</div>
          <div>수</div>
          <div>목</div>
          <div>금</div>
          <div>토</div>
        </div>

        <div 
          className="calendar-days"
          style={{ gridTemplateRows: `repeat(${numWeeks}, 1fr)` }}
        >
          {dayCells.map((cell, idx) => {
            const dayEvents = events.filter(e => e.date === cell.dateStr);
            const evt = dayEvents[0]; // 하루 최대 한 건 송출
            
            const cellParts = cell.dateStr.split('-');
            const cellMonth = parseInt(cellParts[1], 10);
            const cellDay = parseInt(cellParts[2], 10);
            const isFirstDay = cellDay === 1;

            return (
              <div
                key={idx}
                className={`calendar-day-cell ${cell.isCurrentMonth ? '' : 'disabled'} ${selectedDateStr === cell.dateStr ? 'selected' : ''} ${isToday(cell.dateStr) ? 'today' : ''} ${draggedOverDateStr === cell.dateStr ? 'drag-over' : ''}`}
                onClick={() => cell.isCurrentMonth && handleDayClick(cell.dateStr)}
                onDragOver={handleDragOver}
                onDragEnter={(e) => handleDragEnter(e, cell.dateStr)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, cell.dateStr)}
              >
                <div className="cell-header">
                  {cell.isCurrentMonth ? (
                    <span 
                      className="cell-plus-btn" 
                      onClick={(e) => {
                        e.stopPropagation();
                        // If day already has an event, warn user instead of opening add form
                        if (evt) {
                          showAlert('해당 날짜에는 이미 송출 일정이 존재합니다. 하루에 한 건만 송출 가능합니다.');
                          return;
                        }
                        setSelectedDateStr(cell.dateStr);
                        setIsDrawerOpen(true);
                        handleOpenAddForm();
                      }}
                    >
                      +
                    </span>
                  ) : <span></span>}
                  <div className="calendar-day-number">
                    {isFirstDay ? `${cellMonth}월 1일` : cellDay}
                  </div>
                </div>

                {evt && (
                  <div 
                    className={`calendar-event-card ${evt.status}`}
                    draggable={userRole === 'admin'}
                    onDragStart={(e) => handleDragStart(e, evt.id)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDateStr(cell.dateStr);
                      setIsDrawerOpen(true);
                      setIsAddingNew(false);
                    }}
                  >
                    <div className="card-header">
                      <span className="card-branch">📄 {evt.branch}</span>
                      <span className={`card-badge ${evt.status}`}>
                        <span className="card-badge-dot"></span>
                        {getStatusText(evt.status)}
                      </span>
                    </div>

                    <div className="card-title">{evt.title}</div>

                    {evt.attachmentType && evt.attachmentType !== 'none' && (
                      <div className="card-attachment-area">
                        {evt.attachmentType === 'file' ? (
                          <div className="card-attachment">
                            <span style={{ fontSize: '0.75rem' }}>📄</span>
                            <span className="card-attachment-text">{evt.attachmentName}</span>
                          </div>
                        ) : (
                          <div className="card-attachment-images">
                            <div className="card-thumbnail-container">
                              {Array.from({ length: evt.attachmentCount || 1 }).map((_, thumbIdx) => (
                                <div 
                                  key={thumbIdx} 
                                  className={`card-thumbnail ${thumbIdx % 2 === 0 ? 'blue' : 'purple'}`} 
                                />
                              ))}
                            </div>
                            <span className="card-attachment-images-title">{evt.attachmentName}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Slide-out Drawer Panel */}
      {isDrawerOpen && (
        <>
          <div className="drawer-backdrop" onClick={() => setIsDrawerOpen(false)} />
          <div className="drawer-panel">
            <div className="drawer-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CalendarIcon size={20} className="color-primary" style={{ color: 'var(--color-primary)' }} />
                <h3 className="drawer-title">{selectedDateStr} 송출 일정</h3>
              </div>
              <button className="drawer-close" onClick={() => setIsDrawerOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="drawer-content">
              {isAddingNew ? (
                /* ADD NEW REQUEST FORM (Remodeled to match image) */
                <form onSubmit={handleSubmitRequest} className="remodeled-request-form">
                  <div className="remodeled-form-title-area">
                    <h4 className="remodeled-form-main-title">새 기사 송출 요청 등록</h4>
                    <p className="remodeled-form-desc">이투스247학원 홍보 기사의 송출 요청 서식을 작성해 주세요.</p>
                  </div>

                  {/* 1. 지점명 */}
                  <div className="remodeled-form-group">
                    <label className="remodeled-form-label">
                      <span className="emoji-icon">🏛️</span> 지점명<span className="required-star">*</span>
                    </label>
                    <p className="remodeled-form-sub-desc">
                      기사 송출을 요청하는 <strong>이투스247학원 지점명</strong>을 입력해 주세요.<br />
                      예) 대치점
                    </p>
                    <input 
                      type="text" 
                      className="form-control remodeled-input" 
                      placeholder="입력한 답변"
                      value={newBranchInput}
                      onChange={(e) => setNewBranchInput(e.target.value)}
                      required 
                    />
                  </div>

                  {/* 2. 송출 기사 타이틀 */}
                  <div className="remodeled-form-group">
                    <label className="remodeled-form-label">
                      <span className="emoji-icon">📰</span> 송출 기사 타이틀<span className="required-star">*</span>
                    </label>
                    <p className="remodeled-form-sub-desc">
                      외부에 노출될 <strong>기사 제목</strong>을 작성해주세요.
                      <span className="highlight-text-blue">*권장: 25~35자</span>
                    </p>
                    <div style={{ position: 'relative', width: '100%' }}>
                      <input 
                        type="text" 
                        className="form-control remodeled-input" 
                        style={{ width: '100%', paddingRight: '60px' }}
                        placeholder="입력한 답변"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        maxLength={50}
                        required 
                      />
                      <span className="char-counter" style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', margin: 0 }}>
                        {newTitle.length}자
                      </span>
                    </div>
                  </div>

                  {/* 3. 송출 희망 날짜 */}
                  <div className="remodeled-form-group">
                    <label className="remodeled-form-label">
                      <span className="emoji-icon">📅</span> 송출 희망 날짜<span className="required-star">*</span>
                    </label>
                    <p className="remodeled-form-sub-desc">기사 송출을 <strong>희망하는 날짜</strong>를 선택해 주세요.</p>
                    <div className="warning-banner">
                      <span className="warning-icon">⚠️</span> (내부 검토 일정에 따라 조정될 수 있습니다.)
                    </div>
                    <input 
                      type="date" 
                      className="form-control remodeled-input" 
                      value={newDateInput}
                      onChange={(e) => setNewDateInput(e.target.value)}
                      required 
                    />
                  </div>

                  {/* 4. 분류 */}
                  <div className="remodeled-form-group">
                    <label className="remodeled-form-label">
                      <span className="emoji-icon">📎</span> 분류<span className="required-star">*</span>
                    </label>
                    <div className="remodeled-radio-group">
                      {(['모집/개강', '입시/설명회', '학습/관리', '이벤트/소식'] as const).map((cat) => (
                        <label key={cat} className="remodeled-radio-label">
                          <input 
                            type="radio" 
                            name="category"
                            checked={newCategory === cat}
                            onChange={() => setNewCategory(cat)}
                            className="remodeled-radio-input"
                          />
                          <span className="custom-radio-circle"></span>
                          <span className="radio-text">{cat}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* 5. 송출 기사 업로드 */}
                  <div className="remodeled-form-group">
                    <label className="remodeled-form-label">
                      <span className="emoji-icon">📁</span> 송출 기사 업로드<span className="required-star">*</span>
                    </label>
                    <p className="remodeled-form-sub-desc">송출을 희망하는 기사 원고 파일을 업로드해 주세요.</p>
                    
                    <div className="file-dropzone-wrapper">
                      <input 
                        type="file" 
                        id="form-file-upload" 
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                        accept=".doc,.docx,.txt,image/*"
                        multiple
                      />
                      <label htmlFor="form-file-upload" className="file-dropzone-label">
                        <span className="dropzone-plus">+</span>
                        <span className="dropzone-text">기사 원고 및 이미지 다중 파일 선택</span>
                      </label>
                    </div>

                    {uploadedFiles.length > 0 && (
                      <div className="remodeled-uploaded-list">
                        {uploadedFiles.map((f, idx) => (
                          <div key={idx} className="remodeled-upload-chip">
                            <span className="chip-icon">{f.type === 'image' ? '🖼️' : '📄'}</span>
                            <span className="chip-name">{f.name}</span>
                            <span className="chip-size">({f.sizeStr})</span>
                            <button 
                              type="button" 
                              className="chip-remove-btn"
                              onClick={() => handleRemoveUploadedFile(idx)}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="guide-bullet-list">
                      <div className="guide-bullet-item">*MS Word 파일 권장, 5MB 제한</div>
                      <div className="guide-bullet-item">*기사 삽입 이미지는 가로 1200px × 세로 628px 사이즈를 권장드립니다.</div>
                      <div className="guide-bullet-item">*기사에 노출될 이미지를 첨부하지 않을 시 임의의 이미지로 대체됩니다.</div>
                      <div className="guide-bullet-item">*기사 송출을 하루 1건만 가능하며, 순차적으로 진행됩니다.</div>
                    </div>
                  </div>

                  <div className="remodeled-form-actions">
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      style={{ flex: 1 }}
                      onClick={() => setIsAddingNew(false)}
                    >
                      취소
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-primary" 
                      style={{ flex: 1 }}
                      disabled={!newTitle.trim() || !newBranchInput.trim() || !newDateInput || uploadedFiles.length === 0 || isUploading}
                    >
                      {isUploading ? '파일 업로드 중...' : '등록 신청'}
                    </button>
                  </div>
                </form>
              ) : (
                /* VIEW EVENTS LIST FOR THIS DAY */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>총 {selectedDateEvents.length}건의 송출 스케줄</span>
                    <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={handleOpenAddForm}>
                      <Plus size={14} /> 요청 추가
                    </button>
                  </div>

                  {selectedDateEvents.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      <AlertCircle size={36} style={{ margin: '0 auto 12px', display: 'block', opacity: '0.5' }} />
                      해당 날짜에 등록된 송출 요청 일정이 없습니다.
                    </div>
                  ) : (
                    selectedDateEvents.map(evt => {
                      const eventCategory = evt.category || '이벤트/소식';

                      return (
                        <div key={evt.id} className="event-detail-card remodeled-detail-card">
                          <div className="event-detail-header">
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <span className={`badge ${getStatusBadgeClass(evt.status)}`}>
                                {getStatusText(evt.status)}
                              </span>
                              <span className="badge category-badge">
                                {eventCategory}
                              </span>
                            </div>
                            {canDeleteEvent(evt) ? (
                              <button 
                                className="drawer-close" 
                                style={{ width: '28px', height: '28px', color: 'var(--color-rejected)' }}
                                onClick={() => handleDeleteClick(evt.id)}
                              >
                                <Trash2 size={16} />
                              </button>
                            ) : (
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>삭제 권한 없음</span>
                            )}
                          </div>
                          
                          {/* 실제 보도 완료 시 포털 바로가기 버튼 */}
                          {evt.status === 'completed' && (
                            <div className="detail-section news-result-section" style={{ marginBottom: '16px' }}>
                              <a 
                                href={evt.newsUrl || 'https://search.naver.com/search.naver?where=news&query=%EC%9D%B4%ED%88%AC%EC%8A%A4247'} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="btn btn-news-link"
                                style={{ width: '100%', textAlign: 'center', justifyContent: 'center', display: 'inline-flex' }}
                              >
                                🌐 실제 포털 보도 뉴스 바로가기 (새 창)
                              </a>
                            </div>
                          )}

                          {/* 기사 타이틀 */}
                          <div className="detail-section">
                            <div className="detail-section-label">📰 송출 기사 타이틀</div>
                            <div className="detail-section-value title-value">
                              {userRole === 'admin' ? (
                                editingEventId === evt.id ? (
                                  <input 
                                    type="text"
                                    className="form-control"
                                    style={{ 
                                      width: '100%', 
                                      fontSize: '1rem', 
                                      padding: '8px 12px', 
                                      background: 'rgba(0,0,0,0.15)', 
                                      border: '1px solid var(--border-color)', 
                                      borderRadius: 'var(--border-radius-md)', 
                                      color: 'var(--text-primary)' 
                                    }}
                                    value={editingTitleVal}
                                    onChange={(e) => setEditingTitleVal(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        handleSaveTitle(evt.id);
                                      } else if (e.key === 'Escape') {
                                        setEditingEventId(null);
                                      }
                                    }}
                                    onBlur={() => handleSaveTitle(evt.id)}
                                    autoFocus
                                  />
                                ) : (
                                  <div 
                                    style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                    onClick={() => {
                                      setEditingEventId(evt.id);
                                      setEditingTitleVal(evt.title);
                                    }}
                                    title="클릭하여 타이틀 수정"
                                  >
                                    <span>{evt.title}</span>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '8px', display: 'flex', alignItems: 'center', gap: '2px' }}>✏️ 수정</span>
                                  </div>
                                )
                              ) : (
                                evt.title
                              )}
                            </div>
                          </div>

                          {/* 기사 원고 및 첨부파일 */}
                          <div className="detail-section">
                            <div className="detail-section-label">📁 송출 기사 원고 및 첨부파일</div>
                            {evt.mediaAttachments && evt.mediaAttachments.length > 0 ? (
                              <div className="remodeled-detail-files-list" style={{ marginBottom: evt.content ? '12px' : '0' }}>
                                {evt.mediaAttachments.map((attach, attIdx) => {
                                  const FileBoxContent = (
                                    <>
                                      <span className="file-icon">{attach.type === 'image' ? '🖼️' : '📄'}</span>
                                      <div className="file-info">
                                        <div className="file-name">{attach.name}</div>
                                        <div className="file-meta">
                                          {attach.type === 'image' ? '보도 이미지' : 'MS Word 원고 파일'} {attach.size ? `(${attach.size})` : ''}
                                        </div>
                                      </div>
                                    </>
                                  );

                                  if (attach.url) {
                                    return (
                                      <a 
                                        key={attIdx} 
                                        href={attach.url} 
                                        download={attach.name}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="remodeled-detail-file-box" 
                                        style={{ marginBottom: '8px', display: 'flex', textDecoration: 'none' }}
                                        title={`${attach.name} 다운로드`}
                                      >
                                        {FileBoxContent}
                                      </a>
                                    );
                                  }

                                  return (
                                    <div key={attIdx} className="remodeled-detail-file-box" style={{ marginBottom: '8px', cursor: 'default' }}>
                                      {FileBoxContent}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : evt.attachmentType && evt.attachmentType !== 'none' ? (
                              <div className="remodeled-detail-file-box" style={{ marginBottom: evt.content ? '12px' : '0', cursor: 'default' }}>
                                <span className="file-icon">{evt.attachmentType === 'image' ? '🖼️' : '📄'}</span>
                                <div className="file-info">
                                  <div className="file-name">{evt.attachmentName}</div>
                                  <div className="file-meta">
                                    {evt.attachmentType === 'image' ? `보도 이미지 (${evt.attachmentCount || 1}건)` : 'MS Word 원고 파일 (5MB 이하)'}
                                  </div>
                                </div>
                              </div>
                            ) : null}

                            {evt.content && (() => {
                              const firstImageAttach = evt.mediaAttachments?.find(attach => attach.type === 'image');
                              return (
                                <div className="mock-news-embed-container" style={{ marginTop: '12px', width: '100%' }}>
                                  <div className="mock-news-portal-header">
                                    <div className="portal-logo">NAVER <span>뉴스</span></div>
                                    <div className="portal-nav-bar">뉴스홈 &gt; 사회 &gt; 교육</div>
                                  </div>
                                  
                                  <div className="mock-news-article-area">
                                    <h1 className="mock-news-title">
                                      {editingEventId === evt.id ? editingTitleVal : evt.title}
                                    </h1>
                                    
                                    <div className="mock-news-meta-info">
                                      <div className="media-logo-area">
                                        <span className="media-name">{evt.media && evt.media[0] ? evt.media[0] : '이투스 뉴스'}</span>
                                      </div>
                                      <div className="reporter-info">
                                        <span className="reporter-name">김태훈 기자</span>
                                        <span className="publish-time">입력 {evt.createdDate || evt.date}</span>
                                      </div>
                                    </div>

                                    {firstImageAttach && firstImageAttach.url ? (
                                      <div className="mock-news-img-box" style={{ textAlign: 'center' }}>
                                        <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px', borderRadius: 'var(--border-radius-md)', border: '1px dashed rgba(255, 255, 255, 0.1)', display: 'inline-block', width: '100%' }}>
                                          <img 
                                            src={firstImageAttach.url} 
                                            alt={firstImageAttach.name} 
                                            style={{ maxWidth: '100%', maxHeight: '320px', objectFit: 'contain', borderRadius: 'var(--border-radius-sm)' }} 
                                          />
                                        </div>
                                        <p className="mock-news-img-caption" style={{ marginTop: '8px', textAlign: 'left' }}>▲ {evt.branch}이(가) 제공한 송출 보도 기사용 참고 사진.</p>
                                      </div>
                                    ) : evt.attachmentType === 'image' ? (
                                      <div className="mock-news-img-box">
                                        <div className="mock-news-img-placeholder">
                                          <span className="image-badge">보도 사진</span>
                                          <div className="image-symbol">🖼️</div>
                                          <div className="image-label">{(evt.attachmentName || '보도 이미지').split(' 외 ')[0]}</div>
                                        </div>
                                        <p className="mock-news-img-caption">▲ {evt.branch}이(가) 제공한 송출 보도 기사용 참고 사진.</p>
                                      </div>
                                    ) : null}

                                    <div className="mock-news-body-content" style={{ whiteSpace: 'pre-wrap' }}>
                                       {evt.content.startsWith('[') && evt.content.includes('첨부파일') ? (
                                         <>
                                           <p className="lead-paragraph"><strong>[이투스247 {evt.branch} 보도]</strong> 독학재수 대표 브랜드 이투스247학원의 {evt.branch}에서 송출한 보도 기사의 전문 요약입니다.</p>
                                           <p>이투스247학원 교육전문 미디어팀의 분석에 따르면, 변화된 대학입시제도에 맞추어 맞춤식 시간 관리와 플래닝, 오답 피드백의 절대적인 양이 합격을 좌우합니다. 이에 따라 학원 측은 개인용 스마트 매니저 프로그램 및 스마트 학습 환경을 정비하고 맞춤 관리를 실시하고 있습니다.</p>
                                           <p>학원 관계자는 "체계화된 학습 분석 관리 시스템을 통해 N수생 및 수험생들의 단기 성적 상향을 위해 전 교직원이 일대일 학습 밀착 관리에 총력을 기울일 것"이라고 밝혔습니다.</p>
                                         </>
                                       ) : (
                                         /* 실제 파일에서 파싱해온 본문 전체(모든 내용) 렌더링 */
                                         <div>{evt.content}</div>
                                       )}
                                       <p className="copyright" style={{ marginTop: '16px' }}>이투스247학원 무단 전재 및 재배포 금지</p>
                                     </div>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>

                          <div className="event-detail-meta">
                            <div className="meta-field">
                              <MapPin size={12} />
                              <span>지점: <strong>{evt.branch}</strong></span>
                            </div>
                            <div className="meta-field">
                              <Clock size={12} />
                              <span>날짜: <strong>{evt.date}</strong></span>
                            </div>
                          </div>

                        {userRole === 'admin' && (
                          <div className="admin-approval-panel">
                            <div className="admin-approval-title">본사 기사 결재 및 송출 관리</div>
                            <div className="admin-approval-actions">
                              {evt.status === 'pending' && (
                                <>
                                  <button 
                                    type="button"
                                    className="btn btn-approve"
                                    onClick={() => onUpdateEventStatus(evt.id, 'approved')}
                                  >
                                    송출 승인
                                  </button>
                                  <button 
                                    type="button"
                                    className="btn btn-reject"
                                    onClick={() => onUpdateEventStatus(evt.id, 'rejected')}
                                  >
                                    반려
                                  </button>
                                </>
                              )}
                              {evt.status === 'approved' && (
                                <button 
                                  type="button"
                                  className="btn btn-complete"
                                  onClick={() => {
                                    setCompleteNewsUrl('https://search.naver.com/search.naver?where=news&query=%EC%9D%B4%ED%88%AC%EC%8A%A4247');
                                    setCompleteImageUrl('');
                                    setCompletionModal({
                                      isOpen: true,
                                      eventId: evt.id
                                    });
                                  }}
                                >
                                  송출 및 보도 완료
                                </button>
                              )}
                              {evt.status === 'rejected' && (
                                <button 
                                  type="button"
                                  className="btn btn-reset"
                                  onClick={() => onUpdateEventStatus(evt.id, 'pending')}
                                >
                                  다시 대기 상태로
                                </button>
                              )}
                              {evt.status === 'completed' && (
                                <span className="admin-status-message success">
                                  ✓ 해당 기사는 매체에 정상 송출 및 보도가 완료되었습니다.
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* PREMIUM CUSTOM ALERT MODAL */}
      {alertModal && alertModal.isOpen && (
        <div className="custom-alert-overlay" onClick={() => setAlertModal(null)}>
          <div className="custom-alert-container" onClick={(e) => e.stopPropagation()}>
            <div className="custom-alert-icon">⚠️</div>
            <div className="custom-alert-message">{alertModal.message}</div>
            <button 
              className="custom-alert-confirm-btn"
              onClick={() => setAlertModal(null)}
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* PREMIUM CUSTOM CONFIRM MODAL */}
      {confirmModal && confirmModal.isOpen && (
        <div className="custom-alert-overlay" onClick={() => setConfirmModal(null)}>
          <div className="custom-alert-container" onClick={(e) => e.stopPropagation()}>
            <div className="custom-alert-icon" style={{ borderColor: 'rgba(239, 68, 68, 0.25)', color: 'var(--color-rejected)', background: 'rgba(239, 68, 68, 0.08)' }}>🗑️</div>
            <div className="custom-alert-message">{confirmModal.message}</div>
            <div style={{ display: 'flex', gap: '8px', width: '100%', marginTop: '8px' }}>
              <button 
                type="button"
                className="btn btn-secondary" 
                style={{ flex: 1, padding: '10px 16px', fontSize: '0.875rem', fontWeight: 600 }}
                onClick={() => setConfirmModal(null)}
              >
                취소
              </button>
              <button 
                type="button"
                className="custom-alert-confirm-btn"
                style={{ flex: 1, margin: 0, background: 'var(--color-rejected)', border: 'none' }}
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal(null);
                }}
              >
                실행
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PREMIUM CUSTOM COMPLETION MODAL */}
      {completionModal && completionModal.isOpen && (
        <div className="custom-alert-overlay" onClick={() => setCompletionModal(null)}>
          <div className="custom-alert-container" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
            <div className="custom-alert-icon" style={{ borderColor: 'rgba(255, 107, 0, 0.25)', color: 'var(--color-primary)', background: 'rgba(255, 107, 0, 0.08)' }}>📰</div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: '4px 0 8px' }}>송출 및 보도 완료 처리</h3>
            <div style={{ width: '100%', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>🌐 실제 보도 뉴스 URL 링크</label>
                <input 
                  type="text" 
                  className="form-control" 
                  style={{ width: '100%', padding: '10px', fontSize: '0.85rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--border-radius-md)', color: 'var(--text-primary)' }}
                  value={completeNewsUrl}
                  onChange={(e) => setCompleteNewsUrl(e.target.value)}
                  placeholder="https://news.naver.com/..."
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>🖼️ 실제 보도 기사 대표 이미지 주소 (선택)</label>
                <input 
                  type="text" 
                  className="form-control" 
                  style={{ width: '100%', padding: '10px', fontSize: '0.85rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--border-radius-md)', color: 'var(--text-primary)' }}
                  value={completeImageUrl}
                  onChange={(e) => setCompleteImageUrl(e.target.value)}
                  placeholder="예: https://edu.donga.com/data/...jpg (외부 기사 이미지 링크)"
                />
                <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block', lineHeight: '1.3' }}>
                  ※ 외부 기사 사진 URL을 넣으시면 예시 보관함의 썸네일로 연결되며, 우리 스토리지 용량을 절약할 수 있습니다.
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', width: '100%', marginTop: '12px' }}>
              <button 
                type="button"
                className="btn btn-secondary" 
                style={{ flex: 1, padding: '10px 16px', fontSize: '0.875rem', fontWeight: 600 }}
                onClick={() => setCompletionModal(null)}
              >
                취소
              </button>
              <button 
                type="button"
                className="custom-alert-confirm-btn"
                style={{ flex: 1, margin: 0, background: 'var(--color-primary)', border: 'none' }}
                onClick={() => {
                  if (!completeNewsUrl.trim()) {
                    showAlert('실제 보도 뉴스 URL을 입력해 주세요.');
                    return;
                  }
                  onUpdateEventStatus(
                    completionModal.eventId, 
                    'completed', 
                    completeNewsUrl.trim(), 
                    completeImageUrl.trim() || undefined
                  );
                  setCompletionModal(null);
                }}
              >
                보도 완료 등록
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
