# 이투스247학원 송출 관리 시스템 - Supabase 셋업 가이드

본 시스템의 다중 지점 실시간 데이터 동기화를 위해 Supabase 데이터베이스를 연동합니다. 아래 가이드에 따라 테이블을 구성하고 환경변수를 설정해주세요.

---

## 1. Supabase 테이블 생성 (SQL Editor)

Supabase 프로젝트 대시보드 진입 후 좌측 메뉴의 **SQL Editor** -> **New Query**를 선택하고 아래 SQL 스크립트를 붙여넣어 실행(Run)해 주세요.

```sql
-- 1. etoos_news_events 테이블 생성 (모든 필드 완벽 대응)
create table etoos_news_events (
  id text primary key,
  title text not null,
  content text,
  date text not null,
  time text,
  branch text not null,
  media text[],
  status text not null check (status in ('pending', 'approved', 'completed', 'rejected')),
  createdDate text,
  attachmentType text,
  attachmentName text,
  category text,
  mediaAttachments jsonb,
  newsUrl text,
  articleCategory text,
  articleCategoryLabel text,
  categoryLabel text,
  articleImage text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. RLS (Row Level Security) 활성화
alter table etoos_news_events enable row level security;

-- 3. 익명(Anon) 사용자에게 모든 권한(Read/Write/Update/Delete) 부여 정책 생성
create policy "Allow public read for everyone" on etoos_news_events
  for select using (true);

create policy "Allow public insert for everyone" on etoos_news_events
  for insert with check (true);

create policy "Allow public update for everyone" on etoos_news_events
  for update using (true);

create policy "Allow public delete for everyone" on etoos_news_events
  for delete using (true);
```

---

## 1.5 Supabase Storage 버킷 생성 (파일 원본 보관)

지점에서 올린 **실제 원본 파일(.docx, 원본 이미지 등)**을 업로드 및 저장하기 위해 아래 설정을 진행해 주세요.

1. Supabase 대시보드 좌측 메뉴 중 **`Storage`**로 이동합니다.
2. **`New Bucket`** 버튼을 클릭합니다.
3. 버킷 이름(Bucket Name)에 **`etoos-news`**를 입력합니다.
4. **`Public Bucket`** 옵션을 활성화(체크)해 줍니다. (외부에서 직접 다운로드 링크로 원본을 다운받기 위함)
5. **`Save`**를 클릭하여 생성합니다.

---

## 2. 로컬 환경 변수 설정 (.env)

Supabase 대시보드의 **Project Settings** -> **API** 메뉴에서 아래 값을 복사하여 프로젝트 루트 폴더의 `.env` 파일에 덮어씌워 줍니다.

```env
# Google AI Studio Gemini API Key
VITE_GEMINI_API_KEY=your-gemini-api-key

# Supabase 연동 정보
VITE_SUPABASE_URL=https://<your-project-reference>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-public-key>
```

---

## 3. 작동 원리 (Fallback & DB Sync)
* **API Key 미설정 시**: `.env`에 설정이 없거나 기본 プレースホルダー가 있을 시, 시스템은 로컬 브라우저의 `localStorage` 및 JSON Mock 데이터를 활용하여 오프라인 모드로 안전하게 작동합니다.
* **API Key 설정 시**: 로컬 및 배포 호스팅 서버에서 Supabase 클라우드 데이터베이스에 실시간 쿼리하여 다중 사용자 간 실시간 캘린더 송출 현황을 동기화합니다.
