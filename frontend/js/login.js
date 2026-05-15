import { api } from "/js/api.js";
import { getToken, setToken } from "/js/auth.js";
import { toast } from "/js/toast.js";

if (getToken()) {
  // 이미 로그인 상태면 루트로 보내서 라우팅 결정
  location.replace("/");
}

let mode = "login";

const form = document.getElementById("authForm");
const submitBtn = document.getElementById("submitBtn");
const toggleBtn = document.getElementById("toggleMode");
const modeText = document.getElementById("modeText");
const modeHint = document.getElementById("modeHint");
const modeTitle = document.getElementById("modeTitle");
const pwdInput = form.querySelector('input[name="password"]');

function applyMode() {
  const isLogin = mode === "login";
  modeTitle.textContent = isLogin ? "로그인" : "회원가입";
  submitBtn.textContent = isLogin ? "로그인" : "가입하기";
  toggleBtn.textContent = isLogin ? "회원가입" : "로그인";
  modeText.textContent = isLogin ? "계정이 없으신가요?" : "이미 계정이 있으신가요?";
  modeHint.textContent = isLogin ? "팀에 입장하려면 로그인하세요" : "새 계정을 만들고 시작";
  pwdInput.autocomplete = isLogin ? "current-password" : "new-password";
}

toggleBtn.addEventListener("click", () => {
  mode = mode === "login" ? "signup" : "login";
  applyMode();
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form).entries());
  const path = mode === "login" ? "/auth/login" : "/auth/signup";
  submitBtn.disabled = true;
  submitBtn.textContent = mode === "login" ? "로그인 중…" : "가입 중…";
  try {
    const res = await api(path, { method: "POST", body: data });
    setToken(res.access_token);
    const target = res.user?.current_team_id
      ? `/pages/board.html?team_id=${res.user.current_team_id}`
      : "/pages/teams.html";
    location.replace(target);
  } catch (err) {
    toast(err.msg || "요청 실패");
    submitBtn.disabled = false;
    applyMode();
  }
});

applyMode();
