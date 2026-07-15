import React from 'react';
import { MessageSquare, Globe, ArrowUp } from 'lucide-react';
import './Footer.css';

export const Footer: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <footer className="app-footer">
      <div className="footer-container">
        {/* Top Section */}
        <div className="footer-top">
          <div className="footer-brand">
            <div className="footer-logo">
              <img src="/etoos_logo.png" alt="이투스247학원" className="footer-logo-img" />
            </div>
          </div>
          
          <nav className="footer-links">
            <a href="https://247.etoos.com/member/privacy.do?tab=privacy" target="_blank" rel="noopener noreferrer" className="footer-link">개인정보처리방침</a>
            <a href="https://247.etoos.com/member/privacy.do?tab=terms" target="_blank" rel="noopener noreferrer" className="footer-link">이용약관</a>
            <a href="https://247.etoos.com/franchise/inquiry.do" target="_blank" rel="noopener noreferrer" className="footer-link">가맹문의</a>
            <a href="https://247.etoos.com/cont/history.do" target="_blank" rel="noopener noreferrer" className="footer-link">브랜드 소개</a>
          </nav>
        </div>

        <hr className="footer-divider" />

        {/* Bottom Section */}
        <div className="footer-bottom">
          <div className="footer-info">
            <p className="footer-address">
              이투스이씨아이 주식회사 | 서울특별시 서초구 남부순환로 2547, 3층(서초동 1354-3)
            </p>

            <p className="footer-copyright">
              Copyright ⓒ ETOOS ECI Co.,Ltd. All rights Reserved.
            </p>
          </div>

          <div className="footer-social-wrapper">
            <div className="footer-social-icons">
              <a href="https://www.youtube.com/@etoos247" target="_blank" rel="noopener noreferrer" className="social-icon-btn" title="YouTube">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17z"/>
                  <polygon points="10 15 15 12 10 9"/>
                </svg>
              </a>
              <a href="https://www.instagram.com/etoos247_official/" target="_blank" rel="noopener noreferrer" className="social-icon-btn" title="Instagram">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                </svg>
              </a>
              <a href="https://blog.naver.com/etooseci247" target="_blank" rel="noopener noreferrer" className="social-icon-btn" title="Naver Blog">
                <MessageSquare size={18} />
              </a>
              <a href="https://247.etoos.com/index.do" target="_blank" rel="noopener noreferrer" className="social-icon-btn" title="Website">
                <Globe size={18} />
              </a>
            </div>

            <div className="footer-family-sites">
              <select className="family-select" defaultValue="" onChange={(e) => {
                if (e.target.value) window.open(e.target.value, '_blank');
              }}>
                <option value="" disabled>패밀리 사이트</option>
                <option value="https://247.etoos.com/index.do">이투스247학원</option>
                <option value="https://etoos247-experience-info.vercel.app/">247체험단</option>
              </select>
            </div>

            <button className="btn-scroll-top" onClick={scrollToTop} title="맨 위로 이동">
              <ArrowUp size={16} />
              <span>TOP</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
