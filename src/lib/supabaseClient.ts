import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Fallback 방어용 경고 문구 출력
if (!supabaseUrl || supabaseUrl.includes('your-project-id') || !supabaseAnonKey || supabaseAnonKey.includes('your-anon-key')) {
  console.warn(
    'Supabase 연동 정보가 설정되지 않았습니다. 로컬 데이터(localStorage/mock)로 임시 작동합니다. 실제 DB 연동을 원하시면 .env 파일에 VITE_SUPABASE_URL 및 VITE_SUPABASE_ANON_KEY 값을 올바르게 설정해주세요.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
