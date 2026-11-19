import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, SITE_URL } from "./supabase-config.js";

const $ = (id) => document.getElementById(id);
const message = $("message");
let mode = "login";
let supabase = null;

function notify(text, kind = "") {
  message.textContent = text;
  message.className = "status" + (kind ? " " + kind : "");
}
function setMode(next) {
  mode = next;
  $("tabLogin").className = next === "login" ? "active" : "inactive";
  $("tabSignup").className = next === "signup" ? "active" : "inactive";
  $("heading").textContent = next === "login" ? "Masuk ke akun Anda" : "Buat akun Development";
  $("submit").textContent = next === "login" ? "Masuk" : "Daftar";
  $("password").autocomplete = next === "login" ? "current-password" : "new-password";
}
function showSession(session) {
  $("authForm").classList.toggle("hidden", !!session);
  $("sessionPanel").classList.toggle("hidden", !session);
  if (session) $("signedInAs").textContent = "Terautentikasi sebagai: " + session.user.email;
}
async function initialize() {
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY || SUPABASE_PUBLISHABLE_KEY.includes("REPLACE_ME")) {
    notify("Konfigurasi belum lengkap. Salin supabase-config.example.js menjadi supabase-config.js lalu isi URL proyek dan publishable key.", "error");
    $("submit").disabled = true;
    $("reset").disabled = true;
    return;
  }
  if (location.origin !== SITE_URL.replace(/\/$/, "")) {
    notify("Alamat aplikasi berbeda dari SITE_URL. Buka melalui " + SITE_URL, "error");
  }
  supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { flowType: "pkce", autoRefreshToken: true, persistSession: true, detectSessionInUrl: true }
  });
  const url = new URL(location.href);
  if (url.searchParams.has("code")) {
    const { error } = await supabase.auth.exchangeCodeForSession(url.searchParams.get("code"));
    if (error) notify("Verifikasi callback gagal: " + error.message, "error");
    else {
      history.replaceState({}, document.title, location.pathname);
      notify("Callback berhasil. Sesi autentikasi aktif.", "ok");
    }
  }
  const { data: { session } } = await supabase.auth.getSession();
  showSession(session);
  if (!session) notify("Supabase Auth siap. Silakan masuk menggunakan email Anda.", "ok");
  supabase.auth.onAuthStateChange((_event, nextSession) => showSession(nextSession));
}
$("tabLogin").addEventListener("click", () => setMode("login"));
$("tabSignup").addEventListener("click", () => setMode("signup"));
$("submit").addEventListener("click", async () => {
  if (!supabase) return;
  const email = $("email").value.trim();
  const password = $("password").value;
  if (!email || !password) return notify("Email dan kata sandi wajib diisi.", "error");
  if (mode === "signup" && password.length < 12) return notify("Gunakan kata sandi minimal 12 karakter.", "error");
  $("submit").disabled = true;
  try {
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      notify("Login berhasil.", "ok");
    } else {
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: SITE_URL + "/people-assessment/" }
      });
      if (error) throw error;
      if (!data.session) notify("Pendaftaran diterima. Periksa email untuk konfirmasi sebelum masuk.", "ok");
      else notify("Akun berhasil dibuat dan sesi aktif.", "ok");
    }
  } catch (error) { notify("Autentikasi gagal: " + error.message, "error"); }
  finally { $("submit").disabled = false; }
});
$("reset").addEventListener("click", async () => {
  if (!supabase) return;
  const email = $("email").value.trim();
  if (!email) return notify("Isi email terlebih dahulu untuk menerima tautan reset.", "error");
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: SITE_URL + "/people-assessment/"
  });
  notify(error ? "Permintaan reset gagal: " + error.message : "Jika email terdaftar, tautan reset akan dikirim. Periksa kotak masuk Anda.", error ? "error" : "ok");
});
$("logout").addEventListener("click", async () => {
  const { error } = await supabase.auth.signOut();
  notify(error ? "Logout gagal: " + error.message : "Anda telah keluar.", error ? "error" : "ok");
});
$("continue").addEventListener("click", () => notify("Autentikasi aktif. Modul assessment dan pemetaan role menunggu migration database serta RLS yang telah diaudit.", "ok"));
initialize().catch(error => notify("Inisialisasi Supabase gagal: " + error.message, "error"));