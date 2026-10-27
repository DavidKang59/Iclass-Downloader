// Inha iClass 영상 링크 추출 (learn.inha.ac.kr/mod/vod/viewer.php)
// 강의 영상 페이지에서 m3u8 링크를 찾아 버튼으로 복사한다. (구 crx 기능 흡수)

(function () {
  "use strict";

  function findM3u8() {
    const m = document.documentElement.innerHTML.match(/https:\/\/[^\s"']+\.m3u8/);
    return m && m[0];
  }

  function addButton() {
    if (document.getElementById("iclass-m3u8-btn")) return;
    const link = findM3u8();
    const btn = document.createElement("button");
    btn.id = "iclass-m3u8-btn";
    btn.textContent = link ? "🎬 m3u8 링크 복사" : "🎬 m3u8 없음";
    Object.assign(btn.style, {
      position: "fixed",
      top: "10px",
      right: "12px",
      zIndex: 2147483647,
      padding: "8px 14px",
      background: link ? "#8a2be2" : "#777",
      color: "#fff",
      border: "none",
      borderRadius: "6px",
      font: "600 13px/1.2 sans-serif",
      cursor: link ? "pointer" : "default",
      boxShadow: "0 2px 8px rgba(0,0,0,.3)",
    });
    if (link) {
      console.log("🎬 영상 링크:", link);
      btn.addEventListener("click", () => {
        navigator.clipboard.writeText(link);
        btn.textContent = "✅ 복사됨";
        setTimeout(() => (btn.textContent = "🎬 m3u8 링크 복사"), 2000);
      });
    }
    document.body.appendChild(btn);
  }

  // 영상 플레이어가 늦게 주입될 수 있어 잠깐 기다렸다 삽입
  if (document.body) setTimeout(addButton, 800);
  else document.addEventListener("DOMContentLoaded", () => setTimeout(addButton, 800));
})();
