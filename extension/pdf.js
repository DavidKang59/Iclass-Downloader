// 의존성 없는 최소 image→PDF 작성기.
// 각 페이지를 JPEG(DCTDecode)로 받아 한 장씩 전면 배치한 PDF 바이트를 만든다.
// node(require)와 content script(전역) 양쪽에서 쓸 수 있게 노출한다.

(function (root) {
  "use strict";

  // pages: [{ jpeg: Uint8Array, w: number, h: number }]  →  Uint8Array (PDF)
  function buildImagePdf(pages) {
    if (!pages.length) throw new Error("빈 페이지");
    const enc = new TextEncoder();
    const chunks = [];
    let offset = 0;
    const offsets = {}; // objNum → byte offset

    const push = (data) => {
      const u = typeof data === "string" ? enc.encode(data) : data;
      chunks.push(u);
      offset += u.length;
    };
    // 객체 하나를 기록하고 시작 오프셋을 저장
    const obj = (num, head, stream) => {
      offsets[num] = offset;
      push(`${num} 0 obj\n${head}`);
      if (stream) {
        push("\nstream\n");
        push(stream);
        push("\nendstream");
      }
      push("\nendobj\n");
    };

    push("%PDF-1.4\n%\xFF\xFF\xFF\xFF\n");

    const n = pages.length;
    const kids = pages.map((_, i) => `${3 + i * 3} 0 R`).join(" ");
    obj(1, "<< /Type /Catalog /Pages 2 0 R >>");
    obj(2, `<< /Type /Pages /Kids [ ${kids} ] /Count ${n} >>`);

    pages.forEach((p, i) => {
      const pageN = 3 + i * 3;
      const imgN = 4 + i * 3;
      const contN = 5 + i * 3;
      obj(
        pageN,
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${p.w} ${p.h}] ` +
          `/Resources << /XObject << /Im0 ${imgN} 0 R >> >> /Contents ${contN} 0 R >>`
      );
      obj(
        imgN,
        `<< /Type /XObject /Subtype /Image /Width ${p.w} /Height ${p.h} ` +
          `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.jpeg.length} >>`,
        p.jpeg
      );
      const content = `q ${p.w} 0 0 ${p.h} 0 0 cm /Im0 Do Q`;
      obj(contN, `<< /Length ${content.length} >>`, content);
    });

    // xref + trailer
    const total = 2 + n * 3; // 객체 개수(1..total)
    const xrefOffset = offset;
    let xref = `xref\n0 ${total + 1}\n0000000000 65535 f \n`;
    for (let i = 1; i <= total; i++) {
      xref += String(offsets[i]).padStart(10, "0") + " 00000 n \n";
    }
    push(xref);
    push(`trailer\n<< /Size ${total + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);

    const out = new Uint8Array(offset);
    let pos = 0;
    for (const c of chunks) {
      out.set(c, pos);
      pos += c.length;
    }
    return out;
  }

  if (typeof module !== "undefined" && module.exports) module.exports = { buildImagePdf };
  else root.buildImagePdf = buildImagePdf;
})(typeof self !== "undefined" ? self : this);
