// Inha iClass 원본 다운로더 (learn.inha.ac.kr/local/ubdoc)
// adownload.php 는 dl 플래그와 무관하게 "원본 파일"을 그대로 내려준다.
// (download.php 는 404, adownload.php 가 실제 원본 경로)
// 현재 뷰어 페이지의 쿼리(id/tp/pg/item/fid)를 그대로 붙이면 된다.

(function () {
  "use strict";
  if (!location.search) return;

  const dir = location.pathname.replace(/\/[^/]*$/, "/");
  const url = `${dir}adownload.php${location.search}`;

  function addButton() {
    if (document.getElementById("iclass-orig-dl")) return;
    const a = document.createElement("a");
    a.id = "iclass-orig-dl";
    a.textContent = "📥 원본 다운로드";
    a.href = url;
    a.setAttribute("download", ""); // 뷰 대신 저장 유도 (서버 content-disposition 우선)
    Object.assign(a.style, {
      position: "fixed",
      top: "10px",
      right: "12px",
      zIndex: 2147483647,
      padding: "8px 14px",
      background: "#0b7a3b",
      color: "#fff",
      textDecoration: "none",
      borderRadius: "6px",
      font: "600 13px/1.2 sans-serif",
      boxShadow: "0 2px 8px rgba(0,0,0,.3)",
    });
    document.body.appendChild(a);
  }

  if (document.body) addButton();
  else document.addEventListener("DOMContentLoaded", addButton);
})();
