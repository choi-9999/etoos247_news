import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, Sparkles, FileText, Lock, LogOut, BarChart2, Sun, Moon } from 'lucide-react';
import './Header.css';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRole: 'admin' | 'branch';
  setUserRole: (role: 'admin' | 'branch') => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  userRole,
  setUserRole,
  theme,
  toggleTheme,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

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
    <header className="app-header glass">
      <div className="header-left">
        <div className="header-logo-container" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('articles')}>
          <img src="/etoos_logo.png" alt="이투스247학원" className="header-logo-img" />
        </div>
        <span className="header-logo-sub">기사 송출 관리 시스템</span>
      </div>

      <nav className="header-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={`header-nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <Icon size={16} className="nav-icon" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="header-right">
        {/* THEME TOGGLE BUTTON */}
        <button 
          className="btn-header-theme-toggle" 
          onClick={toggleTheme} 
          title={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        <button 
          className={`btn-header-role-toggle ${userRole === 'admin' ? 'admin-active' : ''}`} 
          onClick={handleRoleToggle}
        >
          {userRole === 'admin' ? (
            <>
              <LogOut size={13} />
              <span>지점 모드 전환</span>
            </>
          ) : (
            <>
              <Lock size={13} />
              <span>본사 관리자 모드</span>
            </>
          )}
        </button>

        <div className="header-user-profile">
          <div className="header-user-avatar">{userRole === 'admin' ? 'HQ' : 'BR'}</div>
          <span className="header-user-name">{userRole === 'admin' ? '본사 관리자' : '지점 사용자'}</span>
        </div>
      </div>

      {/* PASSWORD PROMPT MODAL */}
      {isModalOpen && createPortal(
        <div className="header-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="header-modal-container" onClick={(e) => e.stopPropagation()}>
            <h3 className="header-modal-title">본사 관리자 인증</h3>
            <p className="header-modal-subtitle">본사 관리자 권한으로 변경하려면 비밀번호를 입력해주세요.</p>
            
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
        </div>,
        document.body
      )}
    </header>
  );
};
