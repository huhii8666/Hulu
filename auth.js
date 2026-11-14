import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const SUPABASE_URL = 'YOUR_SUPABASE_PROJECT_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
const configured = SUPABASE_URL.startsWith('https://') && !SUPABASE_URL.includes('YOUR_') && SUPABASE_ANON_KEY.length > 20 && !SUPABASE_ANON_KEY.includes('YOUR_');
const $ = (s) => document.querySelector(s);
const panel = $('#authPanel'), authButton = $('#authButton'), authStatus = $('#authStatus');
const form = $('#authForm'), message = $('#authMessage'), submit = $('#authSubmit');
const passwordInput = $('#authPassword'), emailInput = $('#authEmail');
let mode = 'signup', client = null;
function showMessage(text, error = false) { message.textContent = text; message.classList.toggle('error', error); message.classList.remove('hidden'); }
function setMode(next) {
 mode = next; $('#signupTab').classList.toggle('active', mode === 'signup'); $('#loginTab').classList.toggle('active', mode === 'login');
 submit.textContent = mode === 'signup' ? 'ساخت حساب با ایمیل' : 'ورود با ایمیل';
 $('#authTitle').textContent = mode === 'signup' ? 'ساخت حساب BlueFit' : 'ورود به BlueFit';
 $('#authHint').textContent = mode === 'signup' ? 'ایمیلت را وارد کن؛ ممکن است برای فعال‌سازی حساب، پیام تأیید دریافت کنی.' : 'با ایمیل و رمز عبور حساب خودت وارد شو.';
 $('#forgotPassword').classList.toggle('hidden', mode !== 'login'); message.classList.add('hidden');
}
function setSignedIn(user) {
 if (!user) { authStatus.textContent = 'وارد حساب نشده‌ای'; authButton.textContent = 'ورود / ثبت‌نام'; $('#authSignout').classList.add('hidden'); return; }
 authStatus.textContent = user.email || 'حساب فعال'; authButton.textContent = 'حساب من'; $('#authSignout').classList.remove('hidden');
}
authButton.addEventListener('click', () => { panel.classList.toggle('hidden'); if (!panel.classList.contains('hidden')) panel.scrollIntoView({behavior:'smooth',block:'start'}); });
$('#signupTab').addEventListener('click', () => setMode('signup'));
$('#loginTab').addEventListener('click', () => setMode('login'));
$('#authClose').addEventListener('click', () => panel.classList.add('hidden'));
if (!configured) {
 showMessage('اتصال حساب هنوز تنظیم نشده است. برای فعال‌سازی، آدرس پروژه و کلید عمومی Supabase باید در auth.js قرار بگیرند.', true);
 submit.disabled = true; submit.textContent = 'در انتظار تنظیم اتصال';
} else {
 client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
 client.auth.getSession().then(({data:{session}}) => setSignedIn(session?.user || null));
 client.auth.onAuthStateChange((_event, session) => setSignedIn(session?.user || null));
 form.addEventListener('submit', async (event) => {
  event.preventDefault(); const email = emailInput.value.trim(), password = passwordInput.value;
  if (!email || !password) return showMessage('ایمیل و رمز عبور را وارد کن.', true);
  if (password.length < 8) return showMessage('رمز عبور باید حداقل ۸ نویسه داشته باشد.', true);
  submit.disabled = true; submit.textContent = 'لطفاً صبر کن…'; message.classList.add('hidden');
  try {
   if (mode === 'signup') {
    const {data,error} = await client.auth.signUp({email,password,options:{emailRedirectTo:window.location.origin}});
    if (error) throw error;
    showMessage(data.session ? 'حساب ساخته شد و وارد شدی.' : 'درخواست ثبت‌نام انجام شد. صندوق ایمیلت را برای تأیید آدرس بررسی کن.');
   } else {
    const {error} = await client.auth.signInWithPassword({email,password}); if (error) throw error; showMessage('با موفقیت وارد شدی.');
   }
   passwordInput.value = '';
  } catch(error) { showMessage(error.message || 'مشکلی پیش آمد. دوباره تلاش کن.', true); }
  finally { submit.disabled = false; submit.textContent = mode === 'signup' ? 'ساخت حساب با ایمیل' : 'ورود با ایمیل'; }
 });
 $('#forgotPassword').addEventListener('click', async () => {
  const email = emailInput.value.trim(); if (!email) return showMessage('اول ایمیلت را وارد کن.', true);
  const {error} = await client.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin});
  showMessage(error ? error.message : 'اگر این ایمیل حساب داشته باشد، لینک بازیابی برایش ارسال می‌شود.', !!error);
 });
 $('#authSignout').addEventListener('click', async () => {
  const {error} = await client.auth.signOut(); showMessage(error ? error.message : 'از حساب خارج شدی.', !!error);
 });
}
setMode('signup');
