import React, { useState } from 'react';
import { Calendar, Sparkles, FileText, Lock, LogOut, BarChart2, ChevronLeft, ChevronRight } from 'lucide-react';
import './Sidebar.css';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRole: 'admin' | 'branch';
  setUserRole: (role: 'admin' | 'branch') => void;
  userBranch: string;
  setUserBranch: (branch: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab,
  userRole,
  setUserRole
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    {
      id: 'calendar',
      label: '송출 요청 캘린더',
      icon: Calendar,
    },
    {
      id: 'writer',
      label: '기사 AI 작성기',
      icon: Sparkles,
    },
    {
      id: 'articles',
      label: '예시 기사 보관함',
      icon: FileText,
    },
    ...(userRole === 'admin' ? [
      {
        id: 'dashboard',
        label: '대시보드',
        icon: BarChart2,
      }
    ] : []),
  ];

  const handleRoleToggle = () => {
    if (userRole === 'admin') {
      setUserRole('branch');
      if (activeTab === 'dashboard') {
        setActiveTab('calendar');
      }
    } else {
      setIsModalOpen(true);
      setPassword('');
      setErrorMessage('');
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'etoos247!') {
      setUserRole('admin');
      setIsModalOpen(false);
    } else {
      setErrorMessage('비밀번호가 일치하지 않습니다.');
    }
  };

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header" style={{ position: 'relative' }}>
        <div className="logo-container">
          <div className="logo-icon">E</div>
          {!isCollapsed && <span className="logo-text">이투스247</span>}
        </div>
        {!isCollapsed && <span className="logo-sub">기사 송출 관리 시스템</span>}
        
        <button 
          type="button"
          className="btn-sidebar-toggle"
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{
            position: 'absolute',
            right: isCollapsed ? '50%' : '16px',
            transform: isCollapsed ? 'translateX(50%)' : 'none',
            top: '34px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-secondary)',
            borderRadius: '50%',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
            zIndex: 10
          }}
          title={isCollapsed ? "메뉴 펼치기" : "메뉴 접기"}
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className="nav-item-icon" />
              {!isCollapsed && <span>{item.label}</span>}
            </div>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="user-avatar">{userRole === 'admin' ? 'HQ' : 'BR'}</div>
          {!isCollapsed && (
            <div className="user-info">
              <span className="user-name">{userRole === 'admin' ? '본사 관리자' : '지점 사용자'}</span>
            </div>
          )}
        </div>

        <button 
          className={`btn-role-toggle ${userRole === 'admin' ? 'admin-active' : ''}`} 
          onClick={handleRoleToggle}
          title={isCollapsed ? (userRole === 'admin' ? '지점 모드 전환 (로그아웃)' : '본사 관리자 모드') : undefined}
        >
          {userRole === 'admin' ? (
            <>
              <LogOut size={14} />
              {!isCollapsed && '지점 모드 전환 (로그아웃)'}
            </>
          ) : (
            <>
              <Lock size={14} />
              {!isCollapsed && '본사 관리자 모드'}
            </>
          )}
        </button>
      </div>

      {/* PASSWORD PROMPT MODAL */}
      {isModalOpen && (
        <div className="sidebar-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="sidebar-modal-container" onClick={(e) => e.stopPropagation()}>
            <h3 className="sidebar-modal-title">본사 관리자 인증</h3>
            <p className="sidebar-modal-subtitle">본사 관리자 권한으로 변경하려면 비밀번호를 입력해주세요.</p>
            
            <form onSubmit={handlePasswordSubmit}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <input 
                  type="password" 
                  className="form-control" 
                  placeholder="비밀번호 입력"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                  required 
                />
                {errorMessage && (
                  <span className="password-error-message">{errorMessage}</span>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ flex: 1, padding: '8px 12px', fontSize: '0.85rem' }}
                  onClick={() => setIsModalOpen(false)}
                >
                  취소
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ flex: 1, padding: '8px 12px', fontSize: '0.85rem' }}
                >
                  인증 완료
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
};
