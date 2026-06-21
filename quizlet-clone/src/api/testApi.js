import { SUPABASE_URL, SUPABASE_KEY, supabaseHeaders } from "./config";
export const testConnection = async () => {
  console.log("URL đang gọi:", `${SUPABASE_URL}/sets`); // thêm dòng này
  console.log("Key:", SUPABASE_KEY); // thêm dòng này

  const res = await fetch(`${SUPABASE_URL}/sets`, {
    headers: supabaseHeaders,
  });
  const data = await res.json();
  console.log("Kết nối thành công:", data);
};
