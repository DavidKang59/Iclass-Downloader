// Inha iClass 문서 다운로더 — coursemos Synap 뷰어 fallback
// 뷰어는 원본 대신 각 페이지를 PNG로 렌더한다(<rs>/<fn>.files/N.png).
// dl=0 이어도 접근 가능하므로 전부 받아 JPEG로 합쳐 PDF로 저장한다.
// (원본 다운로드가 가능하면 learn 페이지의 "원본 다운로드" 버튼을 쓰는 게 낫다.)

(function () {
  "use strict";

  const JPEG_QUALITY = 0.85; // ponytail: 화질/용량 타협값. 더 선명히 원하면 1.0.

  const param = (n) => new URLSearchParams(location.search).get(n);
  const fn = param("fn");
  const rs = param("rs");
  if (!fn || !rs) return;

  const rmn = param("rmn") || fn;
  const resultDir = rs.endsWith("/") ? rs : rs + "/";
  const filesBase = `${resultDir}${fn}.files/`;
  const xmlUrl = `${resultDir}${fn}.xml`;

  // 페이지 수: XML manifest의 변환 타입별 카운트 → 없으면 순차 탐색.
  // ponytail: 페이지 이미지 naming ".files/N.png" 고정 가정(현 뷰어 동작).
  async function getPageCount() {
    try {
      const xml = await fetch(xmlUrl).then((r) => r.text());
      for (const tag of ["pdf_cnt", "slide_cnt", "image_cnt", "sheet_cnt"]) {
        const m = xml.match(new RegExp(`<${tag}>\\s*(\\d+)`));
        if (m && +m[1] > 0) return +m[1];
      }
    } catch (e) {
      console.warn("[iclass-dl] manifest 실패, 순차 탐색", e);
    }
    let n = 0;
    while (n < 500) {
      const r = await fetch(`${filesBase}${n + 1}.png`, { method: "HEAD" });
      if (!r.ok) break;
      n++;
    }
    return n;
  }

  // PNG 페이지 → {jpeg, w, h}
  async function pageToJpeg(i) {
    const blob = await fetch(`${filesBase}${i}.png`).then((r) => {
      if (!r.ok) throw new Error(`${i}페이지 실패 (${r.status})`);
      return r.blob();
    });
    const bmp = await createImageBitmap(blob);
    const cv = document.createElement("canvas");
    cv.width = bmp.width;
    cv.height = bmp.height;
    cv.getContext("2d").drawImage(bmp, 0, 0);
    const dataUrl = cv.toDataURL("image/jpeg", JPEG_QUALITY);
    const bin = atob(dataUrl.slice(dataUrl.indexOf(",") + 1));
    const jpeg = new Uint8Array(bin.length);
    for (let k = 0; k < bin.length; k++) jpeg[k] = bin.charCodeAt(k);
    return { jpeg, w: bmp.width, h: bmp.height };
  }

  function baseName(name) {
    const i = name.lastIndexOf(".");
    return i > 0 ? name.slice(0, i) : name;
  }

  async function run(btn) {
    btn.disabled = true;
    try {
      const total = await getPageCount();
      if (!total) throw new Error("페이지를 찾을 수 없습니다.");
      const pages = [];
      for (let i = 1; i <= total; i++) {
        btn.textContent = `📥 ${i}/${total} 변환중...`;
        pages.push(await pageToJpeg(i));
      }
      const pdf = self.buildImagePdf(pages);
      const url = URL.createObjectURL(new Blob([pdf], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = baseName(decodeURIComponent(rmn)) + ".pdf";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      btn.textContent = "✅ 저장 완료";
    } catch (e) {
      console.error("[iclass-dl]", e);
      btn.textContent = "❌ 실패 (콘솔 확인)";
      alert("다운로드 실패: " + e.message);
    } finally {
      setTimeout(() => {
        btn.disabled = false;
        btn.textContent = "📥 PDF 다운로드";
      }, 2500);
    }
  }

  function addButton() {
    if (document.getElementById("iclass-dl-btn")) return;
    const btn = document.createElement("button");
    btn.id = "iclass-dl-btn";
    btn.textContent = "📥 PDF 다운로드";
    Object.assign(btn.style, {
      position: "fixed",
      top: "10px",
      right: "12px",
      zIndex: 2147483647,
      padding: "8px 14px",
      background: "#0b63ce",
      color: "#fff",
      border: "none",
      borderRadius: "6px",
      font: "600 13px/1.2 sans-serif",
      cursor: "pointer",
      boxShadow: "0 2px 8px rgba(0,0,0,.3)",
    });
    btn.addEventListener("click", () => run(btn));
    document.body.appendChild(btn);
  }

  if (document.body) addButton();
  else document.addEventListener("DOMContentLoaded", addButton);
})();
