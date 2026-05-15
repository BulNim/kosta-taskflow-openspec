import { api } from "./api.js";
import { getToken, setToken } from "./auth.js";
import { toast } from "./toast.js";

if (getToken()) location.replace("/pages/teams.html");

let mode = "login"; // 'login' | 'signup'

const form = document.getElementById("authForm");
const submitBtn = document.getElementById("submitBtn");
const toggleBtn = document.getElementById("toggleMode");
const modeText = document.getElementById("modeText");
const modeHint = document.getElementById("modeHint");
const pwdInput = form.querySelector('input[name="password"]');

function applyMode() {
  if (mode === "login") {
    submitBtn.textContent = "로그인";
    toggleBtn.textContent = "회원가입";
    modeText.textContent = "계정이 없으신가요?";
    modeHint.textContent = "로그인하여 팀에 입장";
    pwdInput.autocomplete = "current-password";
  } else {
    submitBtn.textContent = "회원가입";
    toggleBtn.textContent = "로그인으로";
    modeText.textContent = "이미 계정이 있으신가요?";
    modeHint.textContent = "새 계정을 만들고 시작";
    pwdInput.autocomplete = "new-password";
  }
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
  try {
    const res = await api(path, { method: "POST", body: data });
    setToken(res.access_token);
    location.replace("/pages/teams.html");
  } catch (err) {
    toast(err.msg || "요청 실패");
  } finally {
    submitBtn.disabled = false;
  }
});

applyMode();
