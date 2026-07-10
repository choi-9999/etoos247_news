import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Copy, Calendar, Check, X } from 'lucide-react';
import type { CalendarEvent } from './CalendarView';
import './AIWriter.css';

export const ETOOS_ARTICLE_PROMPT = `## 이투스247학원 기사 작성 프롬프트

당신은 이투스247학원 브랜드 콘텐츠 및 보도자료 전문 에디터다.
아래 규칙을 최우선으로 적용하여 기사형 콘텐츠를 작성한다.

---

# 기본 작성 원칙

* 기사 문체는 자연스러운 언론 기사 스타일로 작성한다.
* 과장·선정·광고성 표현은 지양한다.
* 실제 설명회·운영·학습관리·이벤트 내용을 중심으로 구성한다.
* 정보 전달 + 학부모/수험생 공감 중심의 톤으로 작성한다.
* 문장은 지나치게 길지 않게 끊어 읽기 쉽게 작성한다.
* 불필요한 감탄사, 과도한 수식어는 사용하지 않는다.
* “압도적”, “최강”, “유일”, “완벽” 등의 표현은 필요한 경우에만 제한적으로 사용한다.
* SEO를 고려하되 키워드를 반복 남용하지 않는다.

---

# 지점 기사 작성 규칙

* **본문 내 지점명 사용 규정:** 기사 제목의 지점명 노출 여부와 관계없이, 기사의 본문(텍스트 내용) 내에서는 언제나 지점명을 자연스럽게 노출하고 사용할 수 있다.

## 1. 모집/운영 기사일 경우

예시:

* 재수정규반
* 조기반수반
* 썸머스쿨
* 윈터스쿨
* 5월 시작반
* 학습 시스템 소개
* 관리 시스템 소개
* 운영 컬럼형 기사

### 제목 규칙

* 제목에 지역명 + 지점명 직접 노출 금지
* 제목에서 “모집” 표현 최소화
* 클릭 유도형 + 학습/입시 인사이트 중심으로 작성

예시:

* “6월 모평 앞두고 학습 루틴 중요해져”
* “여름방학 3주가 성적 흐름 바꾼다”
* “수능 몰입도 높이는 관리형 학습 환경 주목”

### 본문 규칙

* 컬럼처럼 자연스럽게 작성
* 기사 내에서는 자연스럽게 지점명 노출 가능
* 지점명 표기는 반드시 아래 형식으로 통일

→ \`이투스247학원 OO점\`

(잘못된 예시)

* 이투스247 OO점
* 이투스247OO학원
* OO247학원

(올바른 예시)

* 이투스247학원 의정부점
* 이투스247학원 대구수성1관
* 이투스247학원 부산서면점

### 문체 방향

* “원장이 직접 이야기하는 컬럼” 느낌
* 입시/학습/관리 철학이 드러나는 구조
* 단순 홍보보다 “왜 이런 시스템이 필요한가”를 설명

### 마무리 문구

마지막 문단에는 반드시 아래 흐름 포함

* 현재 운영/모집 중이라는 내용
* 상담 가능 안내
* 자연스러운 CTA

예시:

* “한편, 이투스247학원 의정부점은 현재 5월 시작반을 운영 중이며, 자세한 상담은 방문 및 전화 문의를 통해 가능하다.”
* “이투스247학원 대구수성1관은 현재 고등부 썸머스쿨을 선착순 운영 중이다.”

---

## 2. 이벤트/설명회/사회공헌 기사일 경우

예시:

* 설명회
* 장학금
* 멘토단
* 기업 협찬 이벤트
* 사회공헌
* 장학생 인터뷰
* 응원 이벤트

### 제목 규칙

* 제목에 지점명/브랜드명 노출 가능
* 클릭 유도형 제목 허용
* 단, 과도한 어그로 금지

예시:

* “2028 대입, 완전히 달라진다”
* “수능 D-200, 장학생들이 전한 응원 메시지”
* “농심과 함께한 수능 응원 이벤트”

### 본문 규칙

* 기사 본문 내에서는 지점명을 제한 없이 자유롭고 자연스럽게 사용할 수 있다.

---

# 브랜드 및 용어 규칙

## 필수 치환 규칙

* “이투스패스” → 반드시 “이투스 구독권”으로 수정
* “247학원” 단독 사용 지양
* “MY247 APP” / “MY247 앱” 표기 통일 가능
* “순공” 표현 사용 가능

---

# 기사 구성 권장 흐름

## 모집/운영 기사

1. 입시 흐름 및 문제 제기
2. 현재 학생들이 겪는 고민
3. 지점 시스템 소개
4. 학습/생활/입시 관리 설명
5. 실제 운영 방식
6. 관계자 코멘트
7. 모집/운영 안내

## 설명회 기사

1. 변화하는 입시 환경
2. 설명회 개최 목적
3. 설명회 핵심 내용
4. 참석자 반응
5. 관계자 코멘트
6. 후속 일정 안내

## 이벤트 기사

1. 이벤트 목적
2. 협찬/운영 내용
3. 학생 반응
4. 지점 반응
5. 관계자 코멘트
6. 브랜드 마무리

---

# 네이버/언론 송출 대응 규칙

## 절대 금지

### 1. 검색어 남용

* 지역명 반복 금지
* “독학재수학원” 반복 금지
* 동일 키워드 반복 삽입 금지

### 2. 과장 광고

* “무조건 합격”
* “100% 성공”
* “전국 최고”
* “압도적 1위”
  등 근거 없는 표현 금지

### 3. 기사형 광고 과도화 금지

* 가격 직접 노출 최소화
* 지나친 구매 유도 금지
* 상품 스펙 나열식 금지

### 4. 중복 기사 방지

* 동일 주제라도 구조·문장·관점 변경 필수
* 최근 기사와 제목·문단 구성 차별화

---

# 스타일 규칙

* 기사 제목은 28~40자 내외 선호
* 부제는 항상 2개 작성 가능하도록 구성
* 인터뷰/멘트는 실제 학생·학부모 톤처럼 자연스럽게
* “관계자는” 표현 과도 반복 금지
* 문단은 짧고 가독성 있게 구성
* 학부모 관점 + 학생 관점 균형 있게 포함

---

# 기숙학원 표기 규칙

항상 아래 형식 유지

* 이투스247 이천기숙학원
* 이투스247 안성기숙학원
* 이투스247 독학기숙학원

---

# 최종 목표

기사는:
* 광고처럼 보이지 않되
* 학부모와 수험생이 실제로 읽고 싶고
* 검색 유입이 가능하며
* 브랜드 신뢰도를 높이고
* 네이버 기사 정책 리스크를 줄이는 방향으로 작성한다.`;

interface AIWriterProps {
  onAddEvent: (event: CalendarEvent) => void;
  setActiveTab: (tab: string) => void;
  userRole: 'admin' | 'branch';
  events: CalendarEvent[];
}

const normalizeTypoText = (text: string): string => {
  return text
    .replace(/^\[사\s*제목\]/gm, '[기사 제목]')
    .replace(/^사\s*제목\s*:/gm, '기사 제목:')
    .replace(/^#+\s*사\s*제목/gm, '# 기사 제목');
};

const parseTitleFromText = (text: string, branchName: string): string => {
  const normalized = normalizeTypoText(text);
  const lines = normalized.split('\n');
  let parsedTitle = '';
  let currentSection: 'none' | 'title' | 'subtitle' | 'body' = 'none';

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmedLine = rawLine.trim();

    if (!trimmedLine) continue;

    if (
      trimmedLine.includes('기사 제목') || 
      trimmedLine.includes('기사제목') || 
      trimmedLine.includes('사 제목') || 
      trimmedLine.includes('사제목')
    ) {
      currentSection = 'title';
      const cleanTitle = trimmedLine
        .replace(/(기사|사)\s*제목/g, '')
        .replace(/[\*\#\[\]\:\-]/g, '')
        .trim();
      if (cleanTitle) {
        parsedTitle = cleanTitle;
      }
      continue;
    } else if (trimmedLine.includes('부제목') || trimmedLine.includes('기사 본문') || trimmedLine.includes('기사본문')) {
      break;
    }

    if (currentSection === 'title') {
      parsedTitle = trimmedLine.replace(/[\*\#\[\]]/g, '').trim();
      break;
    }
  }
  return parsedTitle || `${branchName} 신규 홍보 기사`;
};

export const AIWriter: React.FC<AIWriterProps> = ({ onAddEvent, setActiveTab, userRole, events }) => {
  const isServerAiEnabled = true;

  // Config states
  const [branch, setBranch] = useState('');
  const [category, setCategory] = useState<'모집/개강' | '입시/설명회' | '학습/관리' | '이벤트/소식'>('모집/개강');
  const [articleTitle, setArticleTitle] = useState('');
  const [tone, setTone] = useState('professional');
  const [keywordInput, setKeywordInput] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [bulletPoints, setBulletPoints] = useState('');
  const [apiError, setApiError] = useState<string | null>(null);

  // Execution states
  const [status, setStatus] = useState<'idle' | 'loading' | 'typing' | 'done'>('idle');
  const [fullArticleText, setFullArticleText] = useState('');
  const [displayedText, setDisplayedText] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  // Schedule Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [scheduleDate, setScheduleDate] = useState(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });
  const [uploadedImages, setUploadedImages] = useState<{ file: File; name: string; type: 'image'; sizeStr: string }[]>([]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files);
    const newUploaded = filesArray.map(file => {
      const sizeInMB = file.size / (1024 * 1024);
      const sizeStr = sizeInMB > 0.1 ? `${sizeInMB.toFixed(2)} MB` : `${(file.size / 1024).toFixed(1)} KB`;
      return {
        file,
        name: file.name,
        type: 'image' as const,
        sizeStr
      };
    });
    setUploadedImages((prev) => [...prev, ...newUploaded]);
  };

  const handleRemoveImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, idx) => idx !== index));
  };



  // Templates dictionary
  const getArticleTemplate = (
    titleInput: string, 
    branchName: string, 
    _categoryName: '모집/개강' | '입시/설명회' | '학습/관리' | '이벤트/소식', 
    kwList: string[], 
    details: string
  ) => {
    // 1. 지점명 포맷팅 룰 적용
    // 기숙 지점 형식: 이투스247 OO기숙학원
    // 일반 지점 형식: 이투스247학원 OO점
    let formattedBranch = branchName.trim();
    const isKiSook = formattedBranch.includes('기숙');

    if (isKiSook) {
      if (!formattedBranch.includes('이투스247')) {
        formattedBranch = `이투스247 ${formattedBranch}`;
      }
      if (!formattedBranch.includes('기숙학원') && !formattedBranch.includes('독학기숙')) {
        formattedBranch = formattedBranch.replace(/기숙$/, '기숙학원');
        if (!formattedBranch.includes('기숙학원')) {
          formattedBranch = `${formattedBranch}기숙학원`;
        }
      }
    } else {
      if (!formattedBranch.includes('이투스247학원')) {
        if (formattedBranch.includes('이투스247')) {
          formattedBranch = formattedBranch.replace('이투스247', '이투스247학원');
        } else {
          formattedBranch = `이투스247학원 ${formattedBranch}`;
        }
      }
      if (!formattedBranch.endsWith('점') && !formattedBranch.endsWith('관') && !formattedBranch.endsWith('학원')) {
        formattedBranch = `${formattedBranch}점`;
      }
    }

    // 2. 제목 규칙: 28~40자 내외 선호.
    // 모집/운영 기사일 경우 제목에 지역명+지점명 노출 금지.
    // "모집" 최소화. 클릭 유도형 + 입시/학습 인사이트 중심
    let finalTitle = titleInput.trim();
    if (!finalTitle) {
      if (isKiSook) {
        finalTitle = '수능 몰입도 높이는 관리형 학습 환경 주목... 24시간 밀착 케어 시스템 가동';
      } else {
        finalTitle = '여름방학 3주가 성적 흐름 바꾼다... 입시 루틴 설계가 대입 성패 결정';
      }
    } else {
      // 제목에서 지점명 노출 금지 규칙 반영
      const cleanBranchText = branchName.replace(/이투스247학원|이투스247|점|관|학원/g, '').trim();
      if (cleanBranchText && finalTitle.includes(cleanBranchText)) {
        finalTitle = finalTitle.replaceAll(cleanBranchText, '').trim();
      }
      finalTitle = finalTitle
        .replace(/이투스247학원|이투스247/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      if (finalTitle.length < 10) {
        finalTitle = '여름방학 3주가 성적 흐름 바꾼다... 입시 루틴 설계가 대입 성패 결정';
      }
    }

    // 3. 부제목 2개 생성 규칙
    const kwText = kwList.length > 0 ? kwList.slice(0, 3).join(', ') : '개인맞춤 학습, 밀착 관리';
    const subTitle1 = `- 수험생의 학습 루틴 유지를 위한 1:1 밀착 학습 코칭 및 과학적인 분석 시스템 도입`;
    const subTitle2 = `- 최적의 순공 시간 확보를 돕는 학습 환경과 체계적인 생활 관리 프로그램 결합`;

    // 4. 필수 단어 치환 및 용어 통일 헬퍼 함수
    const applyTextReplacements = (text: string) => {
      let replaced = text;
      replaced = replaced.replace(/이투스패스/g, '이투스 구독권');
      
      // "247학원" 단독 사용 지양 -> "이투스247학원"으로 교정
      replaced = replaced.replace(/247학원/g, (_match, offset, fullText) => {
        const before = fullText.substring(Math.max(0, offset - 4), offset);
        if (before.includes('이투스')) {
          return '247학원';
        }
        return '이투스247학원';
      });

      replaced = replaced.replace(/MY247\s*(APP|앱|app)/gi, 'MY247 APP');
      return replaced;
    };

    // 5. 추가 상세 요구사항 정제
    let detailPara = '';
    if (details) {
      const sanitizedDetails = applyTextReplacements(details);
      detailPara = `\n\n지점 측에 따르면 이번 프로그램은 "${sanitizedDetails}"에 초점을 맞춰 학생들의 학습 피드백 만족도를 비약적으로 높였다.`;
    }

    // 6. 본문 생성
    let content = `대입 성공을 위해서는 단순한 강의 수강을 넘어 수험생 본인의 완벽한 순공 시간 확보와 과학적인 밀착 관리가 필수적인 요소로 꼽히고 있다. 이에 따라 스마트한 학습 환경과 탄탄한 관리 시스템을 갖춘 ${formattedBranch}에 학부모와 수험생들의 이목이 쏠리고 있다.

${formattedBranch}은 입시 흐름에 발맞춰 학생 개인별 취약점을 정밀하게 분석하고 학습 효율을 최대로 끌어올릴 수 있는 맞춤형 솔루션을 정식 가동한다. 핵심 키워드인 [${kwText}]을 기반으로 설계된 독자적인 커리큘럼은 학습 동기부여와 실전 감각 배양에 크게 기여할 것으로 기대를 모은다.

특히, 학생들은 독자적인 모바일 플래너인 MY247 APP을 통해 실시간 학습 현황을 기록하며 과학적인 피드백을 수시로 전달받을 수 있다. 학습 분석 결과에 따라 맞춤 인강 선택과 전용 자습실 공간 이용 팁을 제공받는 일대일 매니징 또한 함께 진행된다.${detailPara}

학원 관계자는 "체계적인 분석 시스템을 바탕으로 N수생 및 고등부 수험생들의 순공 시간 확보에 최선을 다하고 있다"라며 "단순히 지식을 주입하기보다 학생들이 스스로 올바른 루틴을 찾을 수 있도록 돕는 학습 파트너가 될 것"이라고 강조했다.`;

    // 7. 마무리 CTA (필수 흐름: 현재 운영/모집 중이라는 내용 + 상담 가능 안내 + 자연스러운 CTA)
    let ctaText = '';
    if (isKiSook) {
      ctaText = `한편, ${formattedBranch}은 현재 2027학년도 대입 성공을 위한 독학기숙 과정을 선착순 운영 및 모집 중이다. 자세한 입학 조건과 맞춤 상담 신청은 공식 홈페이지 방문 및 대표 전화 문의를 통해 상세히 확인할 수 있다.`;
    } else {
      ctaText = `한편, ${formattedBranch}은 현재 신규 시즌 대비 학습반을 모집 중에 있으며, 성적 향상을 위한 일대일 심층 상담은 지점 방문 및 유선 예약을 통해 안내받을 수 있다.`;
    }

    content = `${content}\n\n${ctaText}`;

    // 8. 최종 필수 치환 적용
    const finalContent = applyTextReplacements(content);

    return {
      title: finalTitle,
      subTitle1: subTitle1,
      subTitle2: subTitle2,
      content: finalContent
    };
  };

  // Use refs to avoid useEffect re-triggering during rapid state updates
  const fullTextRef = useRef(fullArticleText);

  useEffect(() => {
    fullTextRef.current = fullArticleText;
  }, [fullArticleText]);

  // Typing effect hook
  useEffect(() => {
    if (status === 'typing') {
      let currentIndex = 0;
      setDisplayedText('');
      
      const interval = setInterval(() => {
        const text = fullTextRef.current;
        if (currentIndex < text.length) {
          setDisplayedText((prev) => prev + text.charAt(currentIndex));
          currentIndex++;
        } else {
          clearInterval(interval);
          setStatus('done');
          const generatedTitle = parseTitleFromText(fullTextRef.current, branch);
          if (generatedTitle) {
            setArticleTitle(generatedTitle);
          }
        }
      }, 8); // stream character every 8ms

      return () => clearInterval(interval);
    }
  }, [status]);

  // Keyword management
  const handleAddKeyword = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && keywordInput.trim()) {
      e.preventDefault();
      if (!keywords.includes(keywordInput.trim())) {
        setKeywords([...keywords, keywordInput.trim()]);
      }
      setKeywordInput('');
    }
  };

  const handleRemoveKeyword = (index: number) => {
    setKeywords(keywords.filter((_, idx) => idx !== index));
  };

  // Generate action
  const handleGenerate = async () => {
    if (!branch.trim() || !articleTitle.trim()) {
      alert('지점명과 기사 제목을 모두 입력해 주세요.');
      return;
    }
    setStatus('loading');
    setIsCopied(false);
    setApiError(null);

    // 1. 지점명 포맷팅 룰 미리 적용 (프롬프트 주입용)
    let formattedBranch = branch.trim();
    const isKiSook = formattedBranch.includes('기숙');
    if (isKiSook) {
      if (!formattedBranch.includes('이투스247')) {
        formattedBranch = `이투스247 ${formattedBranch}`;
      }
      if (!formattedBranch.includes('기숙학원') && !formattedBranch.includes('독학기숙')) {
        formattedBranch = formattedBranch.replace(/기숙$/, '기숙학원');
        if (!formattedBranch.includes('기숙학원')) {
          formattedBranch = `${formattedBranch}기숙학원`;
        }
      }
    } else {
      if (!formattedBranch.includes('이투스247학원')) {
        if (formattedBranch.includes('이투스247')) {
          formattedBranch = formattedBranch.replace('이투스247', '이투스247학원');
        } else {
          formattedBranch = `이투스247학원 ${formattedBranch}`;
        }
      }
      if (!formattedBranch.endsWith('점') && !formattedBranch.endsWith('관') && !formattedBranch.endsWith('학원')) {
        formattedBranch = `${formattedBranch}점`;
      }
    }

    if (isServerAiEnabled) {
      // Vercel 서버 함수를 통해 Gemini API 키를 숨긴 상태로 호출
      try {
        const response = await fetch('/api/generate-article', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `${ETOOS_ARTICLE_PROMPT}

[기사 생성 요청 조건]
- 대상 지점명: ${formattedBranch}
- 분류: ${category}
- 기사 제목 (대략): ${articleTitle}
- 보도 어조: ${tone === 'friendly' ? '친근하고 알기 쉬운' : tone === 'trendy' ? '트렌디하고 간결한' : '전문적이고 공신력 있는 (보도자료 표준)'}
- 핵심 키워드: ${keywords.join(', ')}
- 추가 요구사항: ${bulletPoints || '없음'}

위 규칙(지점 기사 작성 규칙, 필수 치환 규칙 등)을 100% 충실히 적용하여 아래 형식의 텍스트 규격으로만 기사를 출력해줘.
그 외 잡설이나 설명, 서론/결론 멘트는 절대로 작성하지 마.

출력 양식:
[기사 제목]
{제목}

[부제목]
- {부제목 1}
- {부제목 2}

[기사 본문]
{본문 내용}`
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 8192
            }
          })
        });

        const data = await response.json();
        if (!response.ok) {
          const serverMessage = data?.error?.message || data?.error || data?.message;
          throw new Error(serverMessage ? `Gemini API 호출 실패: ${serverMessage}` : `Gemini API 호출 실패 (상태 코드: ${response.status})`);
        }

        console.log('Gemini API 응답 원본:', JSON.stringify(data, null, 2));
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        console.log('Gemini API 생성 텍스트:', rawText);
        if (!rawText) {
          throw new Error('API 응답에서 텍스트를 파싱하지 못했습니다.');
        }

        // 텍스트 미완성 끊김 검증 (150자 미만 시 오류로 간주하여 로컬 폴백 가동)
        if (rawText.trim().length < 150) {
          throw new Error(`AI 생성 원고가 비정상적으로 짧거나 잘렸습니다. (글자 수: ${rawText.trim().length}자)`);
        }

        setFullArticleText(normalizeTypoText(rawText.trim()));
        setStatus('typing');
      } catch (err: any) {
        console.error('Gemini API 호출에 실패하여 로컬 템플릿 시뮬레이터로 폴백합니다.', err);
        setApiError(err.message || String(err));
        const generated = getArticleTemplate(articleTitle, branch, category, keywords, bulletPoints);
        const fullText = `[기사 제목]
${generated.title}

[부제목]
${generated.subTitle1}
${generated.subTitle2}

[기사 본문]
${generated.content}`;
        setFullArticleText(normalizeTypoText(fullText));
        setStatus('typing');
      }
    } else {
      // 로컬 규칙 기반 시뮬레이터 Fallback (1.5초 시뮬레이션 대기)
      setTimeout(() => {
        const generated = getArticleTemplate(articleTitle, branch, category, keywords, bulletPoints);
        const fullText = `[기사 제목]
${generated.title}

[부제목]
${generated.subTitle1}
${generated.subTitle2}

[기사 본문]
${generated.content}`;
        setFullArticleText(normalizeTypoText(fullText));
        setStatus('typing');
      }, 1500);
    }
  };

  // Copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(displayedText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('클립보드 복사 실패', err);
    }
  };

  // Schedule Submit
  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayedText) return;

    // Parse Title & Content from displayedText
    const lines = displayedText.split('\n');
    let title = '';
    const subtitleLines: string[] = [];
    const bodyLines: string[] = [];
    
    let currentSection: 'none' | 'title' | 'subtitle' | 'body' = 'none';

    for (let i = 0; i < lines.length; i++) {
      const rawLine = lines[i];
      const trimmedLine = rawLine.trim();

      if (!trimmedLine) {
        if (currentSection === 'subtitle') {
          subtitleLines.push('');
        } else if (currentSection === 'body') {
          bodyLines.push('');
        }
        continue;
      }

      // Detect section shifts
      if (
        trimmedLine.includes('기사 제목') || 
        trimmedLine.includes('기사제목') || 
        trimmedLine.includes('사 제목') || 
        trimmedLine.includes('사제목')
      ) {
        currentSection = 'title';
        const cleanTitle = trimmedLine
          .replace(/(기사|사)\s*제목/g, '')
          .replace(/[\*\#\[\]\:\-]/g, '')
          .trim();
        if (cleanTitle) {
          title = cleanTitle;
        }
        continue;
      } else if (trimmedLine.includes('부제목')) {
        currentSection = 'subtitle';
        continue;
      } else if (trimmedLine.includes('기사 본문') || trimmedLine.includes('기사본문')) {
        currentSection = 'body';
        continue;
      }

      // Collect section data
      if (currentSection === 'title') {
        if (!title) {
          title = trimmedLine.replace(/[\*\#\[\]]/g, '').trim();
        }
      } else if (currentSection === 'subtitle') {
        subtitleLines.push(rawLine);
      } else if (currentSection === 'body') {
        bodyLines.push(rawLine);
      }
    }

    const filteredSubtitle = subtitleLines.join('\n').trim();
    const filteredBody = bodyLines.join('\n').trim();
    let content = '';

    if (filteredSubtitle && filteredBody) {
      content = `[부제목]\n${filteredSubtitle}\n\n[기사 본문]\n${filteredBody}`;
    } else if (filteredBody) {
      content = filteredBody;
    } else if (filteredSubtitle) {
      content = filteredSubtitle;
    } else {
      content = displayedText;
    }

    const targetHasEvent = events.some(evt => evt.date === scheduleDate);
    if (targetHasEvent) {
      alert('선택하신 날짜에는 이미 송출 일정이 등록되어 있습니다. 하루에 최대 한 건만 송출 가능합니다.');
      return;
    }

    const finalTitle = modalTitle.trim() || title.trim() || articleTitle.trim() || `${branch} 신규 홍보 기사`;

    // Determine attachment metadata
    let attachmentType: 'file' | 'image' | 'none' = 'none';
    let attachmentName = '';
    let attachmentCount: number | undefined = undefined;

    if (uploadedImages.length > 0) {
      attachmentType = 'image';
      attachmentCount = uploadedImages.length;
      const firstImg = uploadedImages[0];
      attachmentName = `${firstImg.name}${uploadedImages.length > 1 ? ` 외 ${uploadedImages.length - 1}건` : ''}`;
    }

    const newEvent: CalendarEvent = {
      id: `evt-${Date.now()}`,
      title: finalTitle,
      content: content,
      date: scheduleDate,
      time: '10:00', // 기본 시간 고정
      branch: branch,
      media: ['네이버뉴스'], // Default
      status: userRole === 'admin' ? 'approved' : 'pending',
      createdDate: new Date().toISOString().split('T')[0],
      category: category, // 분류 연동
      attachmentType,
      attachmentName,
      attachmentCount,
      mediaAttachments: uploadedImages.map(img => ({
        name: img.name,
        type: img.type,
        size: img.sizeStr
      }))
    };

    onAddEvent(newEvent);
    setUploadedImages([]); // Reset images on successful reservation
    setIsModalOpen(false);
    
    // Switch to Calendar Tab
    setActiveTab('calendar');
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">송출 기사 AI 작성기</h1>
        <p className="page-subtitle">학원 지점 및 주요 키워드를 바탕으로 언론 보도용 기사를 생성하고 캘린더에 즉시 등록 요청을 보낼 수 있습니다.</p>
      </div>

      <div className="writer-grid">
        {/* LEFT: SETTINGS PANEL */}
        <div className="control-panel glass">
          <h3 className="panel-title">
            <Sparkles size={18} style={{ color: 'var(--color-primary)' }} />
            기사 생성 조건 설정
          </h3>

          <div className={`api-status-tip ${isServerAiEnabled ? 'active' : 'fallback'}`}>
            <span className="status-dot"></span>
            <span className="status-text">
              {isServerAiEnabled
                ? '보안 서버를 통한 실시간 Gemini AI 모드 활성화'
                : '로컬 시뮬레이션 작동 중'}
            </span>
          </div>

          {apiError && (
            <div className="api-error-banner" style={{
              background: 'rgba(239, 68, 68, 0.05)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              color: 'var(--color-rejected, #ef4444)',
              padding: '10px 14px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '0.8rem',
              lineHeight: '1.4'
            }}>
              ⚠️ <strong>Gemini 연동 오류 감지:</strong> {apiError} (안전하게 로컬 시뮬레이터로 기사가 임시 작성되었습니다.)
            </div>
          )}

          <div className="form-group">
            <label className="form-label">지점명</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="예: 양재점"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              required 
            />
          </div>

          <div className="form-group">
            <label className="form-label">분류</label>
            <div className="remodeled-radio-group" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '6px', padding: '4px 0' }}>
              {(['모집/개강', '입시/설명회', '학습/관리', '이벤트/소식'] as const).map((cat) => (
                <label key={cat} className="remodeled-radio-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input 
                    type="radio" 
                    name="category"
                    checked={category === cat}
                    onChange={() => setCategory(cat)}
                    className="remodeled-radio-input"
                  />
                  <span className="custom-radio-circle"></span>
                  <span className="radio-text">{cat}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">기사 제목</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="보도할 기사 제목을 입력해 주세요."
              value={articleTitle}
              onChange={(e) => setArticleTitle(e.target.value)}
              required 
            />
          </div>

          <div className="form-group">
            <label className="form-label">보도 어조 (Tone)</label>
            <select 
              className="form-control" 
              value={tone}
              onChange={(e) => setTone(e.target.value)}
            >
              <option value="professional">전문적이고 공신력 있는 (보도자료 표준)</option>
              <option value="friendly">친근하고 알기 쉬운</option>
              <option value="trendy">트렌디하고 간결한</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">주요 키워드 (Enter로 입력)</label>
            <div className="keyword-inputs">
              <input 
                type="text" 
                className="form-control" 
                placeholder="예: 장학혜택, 멘토링, 학습시설"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={handleAddKeyword}
              />
              <div className="keyword-badge-container">
                {keywords.map((kw, index) => (
                  <span key={index} className="keyword-badge">
                    #{kw}
                    <X 
                      size={12} 
                      className="keyword-badge-delete"
                      onClick={() => handleRemoveKeyword(index)} 
                    />
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">추가 요구사항 (선택사항)</label>
            <textarea 
              className="form-control" 
              rows={4}
              placeholder="예: 선착순 30명 마감, 전 과목 1:1 무한 코칭 서비스 개설 내용 포함"
              value={bulletPoints}
              onChange={(e) => setBulletPoints(e.target.value)}
              style={{ resize: 'none' }}
            />
          </div>

          <button 
            className="btn btn-primary" 
            style={{ marginTop: '12px' }}
            onClick={handleGenerate}
            disabled={status === 'loading' || status === 'typing' || !branch.trim() || !articleTitle.trim()}
          >
            <Sparkles size={16} />
            AI 기사 초안 생성하기
          </button>
        </div>

        {/* RIGHT: GENERATED OUTPUT PANEL */}
        <div className="output-panel glass">
          <h3 className="panel-title">AI 기사 생성 결과물</h3>

          {status === 'idle' && (
            <div className="placeholder-container">
              <div className="sparkle-avatar">
                <Sparkles size={32} />
              </div>
              <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                조건 설정 후 기사를 생성해 주세요
              </p>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                좌측에서 지점명 및 기사 유형을 선택한 뒤 [AI 기사 초안 생성하기] 버튼을 클릭하면 기사가 실시간으로 작성됩니다.
              </p>
            </div>
          )}

          {status === 'loading' && (
            <div className="loading-simulation">
              <div className="loading-circle"></div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                키워드와 지점 정보를 매핑하여 AI 보도 기사 초안을 작성하고 있습니다...
              </p>
            </div>
          )}

          {(status === 'typing' || status === 'done') && (
            <div className="editor-container">
              <div className="editor-toolbar">
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginRight: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {status === 'typing' ? 'AI 기사 작성 중...' : '작성 완료 (에디터로 직접 편집 가능)'}
                </span>
                <button className="editor-btn-tool" onClick={() => setDisplayedText(fullArticleText)}>건너뛰기</button>
              </div>

              <textarea 
                className={`article-textarea ${status === 'typing' ? 'typing-cursor' : ''}`}
                value={displayedText}
                onChange={(e) => {
                  if (status === 'done') setDisplayedText(e.target.value);
                }}
                disabled={status === 'typing'}
              />

              <div className="editor-actions">
                <button className="btn btn-secondary" onClick={handleCopy} disabled={status === 'typing'}>
                  {isCopied ? <Check size={16} style={{ color: 'var(--color-completed)' }} /> : <Copy size={16} />}
                  {isCopied ? '복사 완료' : '클립보드 복사'}
                </button>
                <button 
                  className="btn btn-primary" 
                  disabled={status === 'typing'}
                  onClick={() => {
                    const parsedTitle = parseTitleFromText(displayedText, branch);
                    setModalTitle(parsedTitle || articleTitle || `${branch} 신규 홍보 기사`);
                    setIsModalOpen(true);
                  }}
                >
                  <Calendar size={16} />
                  캘린더에 바로 예약
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* QUICK SCHEDULE MODAL */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => { setIsModalOpen(false); setUploadedImages([]); }}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">송출 예약 신청</h3>
              <button className="modal-close" onClick={() => { setIsModalOpen(false); setUploadedImages([]); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit}>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">기사 제목</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={modalTitle}
                  onChange={(e) => setModalTitle(e.target.value)}
                  required 
                  placeholder="등록할 기사 제목을 입력해 주세요."
                />
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">예약 날짜</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  required 
                />
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>기사 송출 이미지 첨부 (선택사항, 다중)</span>
                  {uploadedImages.length > 0 && <span style={{ fontSize: '0.8rem', color: 'var(--color-primary)' }}>({uploadedImages.length}개)</span>}
                </label>
                <div className="image-upload-area" style={{ 
                  border: '1px dashed var(--border-color, #e2e8f0)', 
                  padding: '14px', 
                  borderRadius: '8px', 
                  textAlign: 'center',
                  background: 'rgba(255, 255, 255, 0.01)',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'border-color 0.2s'
                }}>
                  <input 
                    type="file" 
                    multiple 
                    accept="image/*" 
                    onChange={handleImageChange}
                    style={{ 
                      position: 'absolute', 
                      top: 0, left: 0, width: '100%', height: '100%', 
                      opacity: 0, cursor: 'pointer' 
                    }}
                  />
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    클릭하거나 이미지를 여기에 끌어다 놓으세요
                  </p>
                </div>
                
                {uploadedImages.length > 0 && (
                  <div className="uploaded-images-list" style={{ 
                    marginTop: '10px', 
                    maxHeight: '120px', 
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}>
                    {uploadedImages.map((img, idx) => (
                      <div key={idx} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        background: 'rgba(0, 0, 0, 0.03)', 
                        padding: '6px 10px', 
                        borderRadius: '6px',
                        fontSize: '0.75rem'
                      }}>
                        <span style={{ 
                          textOverflow: 'ellipsis', 
                          overflow: 'hidden', 
                          whiteSpace: 'nowrap', 
                          maxWidth: '70%',
                          color: 'var(--text-primary)'
                        }}>
                          🖼️ {img.name}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: 'var(--text-muted)' }}>{img.sizeStr}</span>
                          <button 
                            type="button" 
                            onClick={() => handleRemoveImage(idx)}
                            style={{ 
                              background: 'none', 
                              border: 'none', 
                              color: '#ef4444', 
                              cursor: 'pointer',
                              padding: '2px',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ flex: 1 }}
                  onClick={() => { setIsModalOpen(false); setUploadedImages([]); }}
                >
                  취소
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ flex: 1 }}
                >
                  예약 확정
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
