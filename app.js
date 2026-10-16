(async function () {
  let pdfjsLib = null;
  let pdfjsLoadError = null;

  try {
    pdfjsLib = await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs');
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs';
  } catch (error) {
    pdfjsLoadError = error;
    console.error('PDF.js failed to load:', error);
  }

  const W = 528, H = 792, $ = id => document.getElementById(id);

  const dict = {
    zh: {
      heading: 'X3 PDF → XTC / XTCH 逐页渲染测试版',
      lead: '独立测试项目：参考 XTC.js 的 PDF 逐页渲染流程。PDF 页面按宽度缩放；长页面按 792 像素高度切片。文件只在本机浏览器处理。',
      pickPdfs: '选择一个或多个 PDF',
      pickFolder: '选择整个文件夹',
      folderHint: '会递归读取选择文件夹中的 PDF',
      depthLabel: '输出格式',
      ditherLabel: '抖动算法',
      thresholdLabel: '黑白阈值（无抖动时）',
      contrastLabel: '对比度',
      brightnessLabel: '亮度',
      strengthLabel: '抖动强度',
      mergeLabel: '每几个 PDF 合并成一本',
      titleLabel: '自定义书名（可选）',
      chapterMode: '章节模式：将标题相同、章节号连续的 PDF 合并',
      chapterHint: '例如“[第1话] HEADON\'s Floor.pdf”和“[第2话] HEADON\'s Floor.pdf”会合并成“1-2 HEADON\'s Floor.xtch”。',
      methodHint: '处理方式：PDF 页面按宽度缩放到 528 像素；超过 792 像素的长页面会按 792 像素高度切片。预览和正式转换使用相同的切片逻辑。',
      previewTitle: '前 5 个输出页面预览',
      previewHint: '显示首个 PDF 产生的前 5 个输出页面；长页面会切片。调整参数可刷新当前页预览。',
      outputsTitle: '转换结果',
      start: '开始转换',
      cancel: '取消',
      zip: '下载全部结果 ZIP',
      folderDownload: '保存到文件夹',
      remove: '删除',
      clear: '清空队列',
      queueTitle: '源 PDF 队列',
      languageLabel: '语言 / Language'
    },
    en: {
      heading: 'X3 PDF → XTC / XTCH — Per-page rendering test',
      lead: 'Independent test project inspired by the PDF rendering flow in XTC.js. PDF pages are scaled by width; tall pages are sliced into 792-pixel-high segments. Files stay in your browser.',
      pickPdfs: 'Select one or more PDFs',
      pickFolder: 'Select a folder',
      folderHint: 'PDFs inside the selected folder are detected recursively',
      depthLabel: 'Output format',
      ditherLabel: 'Dithering algorithm',
      thresholdLabel: 'Threshold (when dithering is off)',
      contrastLabel: 'Contrast',
      brightnessLabel: 'Brightness',
      strengthLabel: 'Dithering strength',
      mergeLabel: 'Merge every N PDFs into one book',
      titleLabel: 'Custom book title (optional)',
      chapterMode: 'Chapter mode: merge consecutive chapters with matching titles',
      chapterHint: 'For example, “[Chapter 1] HEADON\'s Floor.pdf” and “[Chapter 2] HEADON\'s Floor.pdf” merge into “1-2 HEADON\'s Floor.xtch”.',
      methodHint: 'Method: scale PDF pages to 528 pixels wide. Pages taller than 792 pixels are sliced into 792-pixel-high output pages. Preview and conversion use the same slicing logic.',
      previewTitle: 'First 5 output pages preview',
      previewHint: 'Shows the first five output pages from the first PDF; tall pages are sliced. Adjust settings to refresh the current page.',
      outputsTitle: 'Output files',
      start: 'Start conversion',
      cancel: 'Cancel',
      zip: 'Download all results as ZIP',
      folderDownload: 'Save to folder',
      remove: 'Remove',
      clear: 'Clear queue',
      queueTitle: 'Source PDF queue',
      languageLabel: 'Language'
    }
  };

  let lang = 'zh',
      queue = [],
      outputs = [],
      cancelled = false,
      running = false,
      previewPdf = null,
      previewPages = [],
      previewIndex = 0,
      previewKey = '';

  const collator = new Intl.Collator('zh-CN', {
    numeric: true,
    sensitivity: 'base'
  });

  function tr(k) {
    return dict[lang][k] || dict.zh[k] || k;
  }

  function applyLang() {
    lang = $('language').value;
    document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN';

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const k = el.dataset.i18n;
      el.textContent = tr(k);
    });

    renderQueue();
    renderOutputs();
    updatePageLabel();
  }

  $('language').addEventListener('change', applyLang);

  function status(s, p) {
    $('status').textContent = s;
    if (p !== undefined) {
      $('bar').style.width = Math.max(0, Math.min(100, p)) + '%';
    }
  }

  function safeName(s) {
    return (s || 'converted')
      .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_')
      .replace(/[. ]+$/, '')
      .trim() || 'converted';
  }

  function fileKey(f) {
    return `${f.name}|${f.size}|${f.lastModified}|${f.webkitRelativePath || ''}`;
  }

  function sourceFolderPath(group) {
    const path = group[0]?.file.webkitRelativePath || '';
    const parts = path.split('/').filter(Boolean);
    // The final path segment is the PDF filename; keep its parent folders only.
    return parts.slice(0, -1).map(safeName);
  }

  function addFiles(files) {
    const known = new Set(queue.map(x => fileKey(x.file)));

    const arr = [...files]
      .filter(f => /\.pdf$/i.test(f.name))
      .sort((a, b) => collator.compare(
        a.webkitRelativePath || a.name,
        b.webkitRelativePath || b.name
      ));

    let n = 0;

    for (const file of arr) {
      if (!known.has(fileKey(file))) {
        queue.push({
          file,
          state: lang === 'en' ? 'Waiting' : '等待转换'
        });
        known.add(fileKey(file));
        n++;
      }
    }

    if (n) {
      status(lang === 'en' ? `Added ${n} PDF(s).` : `已加入 ${n} 个 PDF。`, 0);
      loadPreview();
    } else {
      status(arr.length ? (lang === 'en' ? 'Files are already in the queue.' : '文件已在队列中。')
        : (lang === 'en' ? 'No PDF files found.' : '没有找到 PDF 文件。'), 0);
    }

    renderQueue();
  }

  $('file').addEventListener('change', e => {
    addFiles(e.target.files);
    e.target.value = '';
  });

  $('folder').addEventListener('change', e => {
    addFiles(e.target.files);
    e.target.value = '';
  });

  function renderQueue() {
    const ul = $('queue');
    ul.replaceChildren();
    $('queueCount').textContent = String(queue.length);

    if (!queue.length) {
      const li = document.createElement('li');
      li.className = 'hint';
      li.textContent = lang === 'en'
        ? 'Select PDF files or a folder first.'
        : '请先选择 PDF 文件或文件夹。';
      ul.append(li);
    }

    queue.forEach((x, i) => {
      const li = document.createElement('li');
      const info = document.createElement('div');
      info.className = 'file-info';

      const name = document.createElement('div');
      name.className = 'filename';
      name.textContent = `${i + 1}. ${x.file.webkitRelativePath || x.file.name}`;

      const detail = document.createElement('div');
      detail.className = 'file-detail';
      detail.textContent = `${(x.file.size / 1024 / 1024).toFixed(2)} MB`;

      info.append(name, detail);

      const state = document.createElement('span');
      state.className = 'file-state ' +
        (x.state === 'Done' || x.state === '完成'
          ? 'ok'
          : x.state === 'Failed' || x.state === '失败'
            ? 'err'
            : '');

      state.textContent = x.state;
      li.append(info, state);

      const controls = document.createElement('span');

      if (!running) {
        for (const [txt, d] of [['↑', -1], ['↓', 1]]) {
          const b = document.createElement('button');
          b.className = 'secondary small';
          b.textContent = txt;
          b.disabled = d < 0 ? i === 0 : i === queue.length - 1;
          b.title = lang === 'en'
            ? (d < 0 ? 'Move up' : 'Move down')
            : (d < 0 ? '上移' : '下移');

          b.onclick = () => {
            const j = i + d;
            [queue[i], queue[j]] = [queue[j], queue[i]];
            renderQueue();
            loadPreview();
          };

          controls.append(b);
        }

        const removeButton = document.createElement('button');
        removeButton.className = 'secondary small';
        removeButton.textContent = tr('remove');
        removeButton.title = lang === 'en' ? 'Remove this PDF from the queue' : '从队列移除此 PDF';
        removeButton.onclick = () => {
          if (running) return;
          const wasPreviewFile = i === 0;
          queue.splice(i, 1);
          renderQueue();

          if (wasPreviewFile) {
            previewKey = '';
            previewPages = [];
            previewIndex = 0;
            previewPdf?.destroy();
            previewPdf = null;
          }

          loadPreview();
          status(lang === 'en' ? 'PDF removed from the queue.' : '已从队列删除该 PDF。', 0);
        };
        controls.append(removeButton);
      }

      li.append(controls);
      ul.append(li);
    });

    $('go').disabled = running || !queue.some(x =>
      x.state === '等待转换' || x.state === 'Waiting' ||
      x.state === '失败' || x.state === 'Failed'
    );
    $('clear').disabled = running || (!queue.length && !outputs.length);
    $('cancel').disabled = !running;
    $('zip').disabled = running || !outputs.length;
    const folderButton = $('folderDownload');
    if (folderButton) folderButton.disabled = running || !outputs.length;
  }

  function renderOutputs() {
    const ul = $('outputs');
    ul.replaceChildren();
    $('outCount').textContent = String(outputs.length);

    if (!outputs.length) {
      const li = document.createElement('li');
      li.className = 'hint';
      li.textContent = lang === 'en'
        ? 'Completed files will appear here.'
        : '转换完成后显示结果。';
      ul.append(li);
      return;
    }

    outputs.forEach((o, i) => {
      const li = document.createElement('li');
      const info = document.createElement('div');
      info.className = 'file-info';

      const name = document.createElement('div');
      name.className = 'filename';
      name.textContent = `${i + 1}. ${o.name}`;

      const detail = document.createElement('div');
      detail.className = 'file-detail';
      detail.textContent =
        `${o.pdfs} PDF · ${o.pages} X3 pages · ${(o.blob.size / 1024 / 1024).toFixed(2)} MB`;

      info.append(name, detail);

      const b = document.createElement('button');
      b.className = 'small';
      b.textContent = lang === 'en' ? 'Download' : '下载';
      b.onclick = () => download(o.blob, o.name);

      li.append(info, b);
      ul.append(li);
    });
  }

  function download(blob, name) {
    const u = URL.createObjectURL(blob);
    const a = document.createElement('a');

    a.href = u;
    a.download = name;
    document.body.append(a);
    a.click();
    a.remove();

    setTimeout(() => URL.revokeObjectURL(u), 15000);
  }

  function parseChapter(file) {
    const s = file.name.replace(/\.pdf$/i, '');
    const m = s.match(
      /(?:^|[\s\[【(（])(?:第\s*)?(\d+)\s*(?:话|話|章|回)\s*[\]】)）]?\s*[-_.、：:]?\s*(.*?)\s*$/i
    );

    if (!m) return null;

    const title = m[2].trim();

    return {
      n: +m[1],
      title,
      key: title.replace(/\s+/g, ' ').toLowerCase()
    };
  }

  function groupsOf(items) {
    if (!$('chapterMode').checked) {
      const n = +$('mergeCount').value || 1;
      const out = [];

      for (let i = 0; i < items.length; i += n) {
        out.push(items.slice(i, i + n));
      }

      return out;
    }

    const out = [];

    for (const it of items) {
      const ch = parseChapter(it.file);
      const last = out.at(-1);
      const prev = last?.at(-1);
      const pc = prev && parseChapter(prev.file);

      if (ch && pc && ch.key === pc.key && ch.n === pc.n + 1) {
        last.push(it);
      } else {
        out.push([it]);
      }
    }

    return out;
  }

  function outputName(group, idx) {
    const custom = $('title').value.trim();
    const chapters = group.map(x => parseChapter(x.file));

    if ($('chapterMode').checked && chapters.every(Boolean)) {
      const a = chapters[0].n;
      const b = chapters.at(-1).n;
      const title = chapters[0].title;

      return safeName(`${a === b ? a : `${a}-${b}`}${title ? ' ' + title : ''}`) +
        (+$('depth').value === 2 ? '.xtch' : '.xtc');
    }

    if (custom) {
      const nums = group.map(x => {
        const m = x.file.name.match(/(\d+)(?!.*\d)/);
        return m ? +m[1] : null;
      });

      const a = nums[0] ?? idx * (+$('mergeCount').value) + 1;
      const b = nums.at(-1) ?? a + group.length - 1;

      return safeName(
        group.length === 1 ? `${custom}${a}` : `${custom}${a}-${b}`
      ) + (+$('depth').value === 2 ? '.xtch' : '.xtc');
    }

    const stems = group.map(x => x.file.name.replace(/\.pdf$/i, ''));
    let name;

    if (stems.length === 1) {
      name = stems[0];
    } else {
      const ms = stems.map(s => s.match(/^(.*?)(\d+)$/));

      name = ms.every(Boolean) && ms.every(m => m[1] === ms[0][1])
        ? `${ms[0][1]}${ms[0][2]}-${ms.at(-1)[2]}`
        : `${stems[0]}_等${stems.length}个PDF`;
    }

    return safeName(name) + (+$('depth').value === 2 ? '.xtch' : '.xtc');
  }

  function clamp(v) {
    return Math.max(0, Math.min(255, v));
  }

  function contrastPixels(a, level) {
    if (!level) return;

    let min = 0, max = 255;
    const hist = new Uint32Array(256);

    for (const v of a) hist[Math.round(v)]++;

    const n = a.length;
    const cut = level === 1 ? .003 : level === 2 ? .008 : .02;

    let c = 0;

    for (let i = 0; i < 256; i++) {
      c += hist[i];
      if (c > n * cut) {
        min = i;
        break;
      }
    }

    c = 0;

    for (let i = 255; i >= 0; i--) {
      c += hist[i];
      if (c > n * cut) {
        max = i;
        break;
      }
    }

    if (max > min) {
      for (let i = 0; i < a.length; i++) {
        a[i] = clamp((a[i] - min) * 255 / (max - min));
      }
    }
  }

  function quant(v, depth, threshold) {
    if (depth === 1) return v < threshold ? 0 : 255;
    return v < 42 ? 0 : v < 127 ? 85 : v < 212 ? 170 : 255;
  }

  function processGray(gray, mode, depth, threshold, contrast, brightness, strength) {
    const a = new Float32Array(gray.length);

    for (let i = 0; i < a.length; i++) {
      a[i] = clamp(gray[i] + brightness * 1.5);
    }

    contrastPixels(a, contrast);

    if (mode === 'none' || strength === 0) {
      return Uint8Array.from(a, v => quant(v, depth, threshold));
    }

    const out = new Uint8Array(a.length);
    const work = new Float32Array(a);
    const s = strength / 100;

    function add(x, y, e) {
      if (x >= 0 && x < W && y >= 0 && y < H) {
        work[y * W + x] += e * s;
      }
    }

    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        const old = clamp(work[i]);
        const q = quant(old, depth, 128);

        out[i] = q;

        const e = old - q;

        if (mode === 'atkinson') {
          add(x + 1, y, e / 8);
          add(x + 2, y, e / 8);
          add(x - 1, y + 1, e / 8);
          add(x, y + 1, e / 8);
          add(x + 1, y + 1, e / 8);
          add(x, y + 2, e / 8);
        } else if (mode === 'stucki') {
          [
            [1, 0, 8], [2, 0, 4],
            [-2, 1, 2], [-1, 1, 4], [0, 1, 8],
            [1, 1, 4], [2, 1, 2],
            [-2, 2, 1], [-1, 2, 2], [0, 2, 4],
            [1, 2, 2], [2, 2, 1]
          ].forEach(([dx, dy, w]) => add(x + dx, y + dy, e * w / 42));
        } else {
          add(x + 1, y, e * 7 / 16);
          add(x - 1, y + 1, e * 3 / 16);
          add(x, y + 1, e * 5 / 16);
          add(x + 1, y + 1, e / 16);
        }
      }
    }

    return out;
  }

  function md5(input) {
    const K = new Uint32Array(64);
    const S = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21];

    for (let i = 0; i < 64; i++) {
      K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296) >>> 0;
    }

    const len = input.length;
    const bitLen = len * 8;
    const total = ((len + 9 + 63) >> 6) << 6;
    const msg = new Uint8Array(total);

    msg.set(input);
    msg[len] = 128;

    const dv = new DataView(msg.buffer);
    dv.setUint32(total - 8, bitLen >>> 0, true);
    dv.setUint32(total - 4, Math.floor(bitLen / 4294967296), true);

    let a0 = 0x67452301,
        b0 = 0xefcdab89,
        c0 = 0x98badcfe,
        d0 = 0x10325476;

    for (let o = 0; o < total; o += 64) {
      const M = new Uint32Array(16);
      const v = new DataView(msg.buffer, o, 64);

      for (let i = 0; i < 16; i++) {
        M[i] = v.getUint32(i * 4, true);
      }

      let a = a0, b = b0, c = c0, d = d0;

      for (let i = 0; i < 64; i++) {
        let f, g;

        if (i < 16) {
          f = (b & c) | (~b & d);
          g = i;
        } else if (i < 32) {
          f = (d & b) | (~d & c);
          g = (5 * i + 1) % 16;
        } else if (i < 48) {
          f = b ^ c ^ d;
          g = (3 * i + 5) % 16;
        } else {
          f = c ^ (b | ~d);
          g = (7 * i) % 16;
        }

        const sh = S[
          i < 16 ? i % 4 :
          i < 32 ? 4 + i % 4 :
          i < 48 ? 8 + i % 4 :
          12 + i % 4
        ];

        const z = (a + f + K[i] + M[g]) | 0;
        const r = (z << sh) | (z >>> (32 - sh));

        a = d;
        d = c;
        c = b;
        b = (b + r) | 0;
      }

      a0 = (a0 + a) | 0;
      b0 = (b0 + b) | 0;
      c0 = (c0 + c) | 0;
      d0 = (d0 + d) | 0;
    }

    const out = new Uint8Array(16);
    const v = new DataView(out.buffer);

    [a0, b0, c0, d0].forEach((x, i) => v.setUint32(i * 4, x, true));

    return out;
  }

  function makePage(magic, w, h, data) {
    const out = new Uint8Array(22 + data.length);
    const v = new DataView(out.buffer);

    for (let i = 0; i < 4; i++) out[i] = magic.charCodeAt(i);

    v.setUint16(4, w, true);
    v.setUint16(6, h, true);
    v.setUint32(10, data.length, true);
    out.set(data, 22);
    out.set(md5(data).slice(0, 8), 14);

    return out;
  }

  function packPage(px, depth) {
    if (depth === 1) {
      const rb = Math.ceil(W / 8);
      const data = new Uint8Array(rb * H);

      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          if (px[y * W + x] >= 128) {
            data[y * rb + (x >> 3)] |= 0x80 >> (x & 7);
          }
        }
      }

      return makePage('XTG\0', W, H, data);
    }

    const cb = Math.ceil(H / 8);
    const plane = cb * W;
    const p0 = new Uint8Array(plane);
    const p1 = new Uint8Array(plane);

    for (let x = 0; x < W; x++) {
      const off = (W - 1 - x) * cb;

      for (let y = 0; y < H; y++) {
        const p = px[y * W + x];
        const v = p >= 212 ? 0 : p >= 127 ? 1 : p >= 42 ? 2 : 3;
        const idx = off + (y >> 3);
        const bit = 7 - (y & 7);

        if (v & 1) p0[idx] |= 1 << bit;
        if (v & 2) p1[idx] |= 1 << bit;
      }
    }

    const data = new Uint8Array(plane * 2);
    data.set(p0);
    data.set(p1, plane);

    return makePage('XTH\0', W, H, data);
  }

  function buildBook(pages, is2, title) {
    const metaOff = 56;
    const indexOff = 312;
    const dataOff = indexOff + pages.length * 16;
    const total = dataOff + pages.reduce((n, p) => n + p.length, 0);
    const out = new Uint8Array(total);
    const v = new DataView(out.buffer);
    const magic = is2 ? 'XTCH' : 'XTC\0';

    for (let i = 0; i < 4; i++) out[i] = magic.charCodeAt(i);

    v.setUint16(4, 1, true);
    v.setUint16(6, pages.length, true);
    v.setUint32(8, 0x01000100, true);
    v.setUint32(12, 1, true);
    v.setBigUint64(16, BigInt(metaOff), true);
    v.setBigUint64(24, BigInt(indexOff), true);
    v.setBigUint64(32, BigInt(dataOff), true);
    v.setBigUint64(40, 0n, true);
    v.setBigUint64(48, 0n, true);

    new TextEncoder().encode(title).slice(0, 127).forEach((c, i) => {
      out[metaOff + i] = c;
    });

    let pos = dataOff;

    pages.forEach((p, i) => {
      const e = indexOff + i * 16;

      v.setBigUint64(e, BigInt(pos), true);
      v.setUint32(e + 8, p.length, true);
      v.setUint16(e + 12, W, true);
      v.setUint16(e + 14, H, true);

      out.set(p, pos);
      pos += p.length;
    });

    return out;
  }

  /*
   * Core page conversion:
   * 1. Scale to 528 pixels wide.
   * 2. Slice pages taller than 792 pixels into 792-pixel-high segments.
   * 3. Vertically center a single shorter page.
   * 4. Preview and conversion share this function.
   */
  function drawSourceToTargetPages(sourceCanvas) {
    if (!sourceCanvas.width || !sourceCanvas.height) {
      throw Error('源页面尺寸无效。');
    }

    const scale = W / sourceCanvas.width;
    const scaledHeight = Math.max(1, Math.ceil(sourceCanvas.height * scale));
    const count = Math.ceil(scaledHeight / H);
    const pages = [];

    for (let n = 0; n < count; n++) {
      const c = document.createElement('canvas');
      c.width = W;
      c.height = H;

      const ctx = c.getContext('2d', { willReadFrequently: true });

      if (!ctx) {
        throw Error('无法创建目标画布上下文。');
      }

      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, W, H);

      const start = n * H;
      const drawHeight = Math.min(H, scaledHeight - start);
      const sourceY = start / scale;
      const sourceHeight = Math.min(
        sourceCanvas.height - sourceY,
        drawHeight / scale
      );

      if (sourceHeight > 0 && drawHeight > 0) {
        const destY = count === 1
          ? Math.floor((H - scaledHeight) / 2)
          : 0;

        ctx.drawImage(
          sourceCanvas,
          0, sourceY,
          sourceCanvas.width, sourceHeight,
          0, destY,
          W, sourceHeight * scale
        );
      }

      const im = ctx.getImageData(0, 0, W, H);
      const gray = new Uint8Array(W * H);

      for (let i = 0, j = 0; i < gray.length; i++, j += 4) {
        gray[i] = Math.round(
          0.299 * im.data[j] +
          0.587 * im.data[j + 1] +
          0.114 * im.data[j + 2]
        );
      }

      pages.push(gray);

      c.width = 1;
      c.height = 1;
    }

    return pages;
  }

  function settings() {
    return {
      depth: +$('depth').value,
      mode: $('dither').value,
      threshold: +$('threshold').value,
      contrast: +$('contrast').value,
      brightness: +$('brightness').value,
      strength: +$('strength').value
    };
  }

  function paintPreview(gray) {
    const s = settings();
    const p = processGray(
      gray, s.mode, s.depth, s.threshold,
      s.contrast, s.brightness, s.strength
    );

    const c = $('preview');
    const ctx = c.getContext('2d');
    const im = ctx.createImageData(W, H);

    for (let i = 0, j = 0; i < p.length; i++, j += 4) {
      im.data[j] = p[i];
      im.data[j + 1] = p[i];
      im.data[j + 2] = p[i];
      im.data[j + 3] = 255;
    }

    ctx.putImageData(im, 0, 0);
  }

  function updatePageLabel() {
    const n = previewPages.length;

    $('pageLabel').textContent = lang === 'en'
      ? `Page ${n ? previewIndex + 1 : 0} / ${n}`
      : `第 ${n ? previewIndex + 1 : 0} / ${n} 页`;

    $('prev').disabled = !n || previewIndex <= 0;
    $('next').disabled = !n || previewIndex >= n - 1;
  }

  async function loadPreview() {
    try {
      if (!pdfjsLib) {
        throw Error('PDF.js 加载失败，请检查网络/CDN 后刷新。详情见浏览器控制台。');
      }

      const file = queue[0]?.file;

      if (!file) {
        previewPages = [];
        previewPdf?.destroy();
        previewPdf = null;
        previewKey = '';

        $('preview').getContext('2d').clearRect(0, 0, W, H);
        updatePageLabel();
        return;
      }

      const key = fileKey(file);

      if (key !== previewKey) {
        previewKey = key;
        previewPdf?.destroy();
        previewPdf = null;
        previewPages = [];
        previewIndex = 0;

        previewPdf = await pdfjsLib.getDocument({
          data: await file.arrayBuffer()
        }).promise;

        for (
          let n = 1;
          n <= previewPdf.numPages && previewPages.length < 5;
          n++
        ) {
          const page = await previewPdf.getPage(n);
          const vp = page.getViewport({ scale: 2 });
          const c = document.createElement('canvas');

          c.width = Math.ceil(vp.width);
          c.height = Math.ceil(vp.height);

          const ctx = c.getContext('2d', { willReadFrequently: true });

          if (!ctx) {
            throw Error('无法创建预览画布上下文。');
          }

          await page.render({
            canvasContext: ctx,
            viewport: vp,
            background: 'rgb(255,255,255)'
          }).promise;

          const sliced = drawSourceToTargetPages(c);
          previewPages.push(...sliced.slice(0, 5 - previewPages.length));

          page.cleanup?.();

          c.width = 1;
          c.height = 1;
        }
      }

      if (previewPages.length) {
        paintPreview(previewPages[previewIndex]);
      } else {
        $('preview').getContext('2d').clearRect(0, 0, W, H);
      }

      updatePageLabel();
    } catch (e) {
      status((lang === 'en' ? 'Preview failed: ' : '预览失败：') + e.message);
    }
  }

  $('prev').onclick = () => {
    previewIndex = Math.max(0, previewIndex - 1);

    if (previewPages[previewIndex]) {
      paintPreview(previewPages[previewIndex]);
    }

    updatePageLabel();
  };

  $('next').onclick = () => {
    previewIndex = Math.min(previewPages.length - 1, previewIndex + 1);

    if (previewPages[previewIndex]) {
      paintPreview(previewPages[previewIndex]);
    }

    updatePageLabel();
  };

  [
    'depth', 'dither', 'threshold',
    'contrast', 'brightness', 'strength'
  ].forEach(id => {
    $(id).addEventListener('input', () => {
      for (const [id2, span] of [
        ['threshold', 'thresholdValue'],
        ['brightness', 'brightnessValue'],
        ['strength', 'strengthValue']
      ]) {
        $(span).textContent =
          $(id2).value + (id2 === 'strength' ? '%' : '');
      }

      if (previewPages[previewIndex]) {
        paintPreview(previewPages[previewIndex]);
      }
    });
  });

  async function convertGroup(group, groupIndex, total) {
    if (!pdfjsLib) {
      throw Error('PDF.js 加载失败，请检查网络/CDN 后刷新。详情见浏览器控制台。');
    }

    const s = settings();
    const pages = [];
    let pageTotal = 0;

    for (let fi = 0; fi < group.length; fi++) {
      if (cancelled) throw Error('Cancelled');

      const item = group[fi];
      item.state = lang === 'en' ? 'Converting' : '转换中';
      renderQueue();

      const pdf = await pdfjsLib.getDocument({
        data: await item.file.arrayBuffer()
      }).promise;

      try {
        for (let n = 1; n <= pdf.numPages; n++) {
          if (cancelled) throw Error('Cancelled');

          const page = await pdf.getPage(n);
          const viewport = page.getViewport({ scale: 2 });
          const c = document.createElement('canvas');

          c.width = Math.ceil(viewport.width);
          c.height = Math.ceil(viewport.height);

          const ctx = c.getContext('2d', { willReadFrequently: true });

          if (!ctx) {
            throw Error('无法创建转换画布上下文。');
          }

          ctx.fillStyle = '#fff';
          ctx.fillRect(0, 0, c.width, c.height);

          await page.render({
            canvasContext: ctx,
            viewport,
            background: 'rgb(255,255,255)'
          }).promise;

          const grayPages = drawSourceToTargetPages(c);

          for (const gray of grayPages) {
            if (cancelled) throw Error('Cancelled');

            const processed = processGray(
              gray,
              s.mode,
              s.depth,
              s.threshold,
              s.contrast,
              s.brightness,
              s.strength
            );

            pages.push(packPage(processed, s.depth));
            pageTotal++;

            status(
              `${lang === 'en' ? 'Group' : '第'} ${groupIndex + 1}/${total} · ` +
              `${item.file.name} · ` +
              `${lang === 'en' ? 'PDF page' : 'PDF 页'} ${n}/${pdf.numPages} · ` +
              `${lang === 'en' ? 'X3 pages' : 'X3 页面'} ${pageTotal}`,
              ((groupIndex + ((fi + 1) / group.length) * n / pdf.numPages) / total) * 100
            );

            await new Promise(r => setTimeout(r, 0));
          }

          page.cleanup?.();

          c.width = 1;
          c.height = 1;
        }
      } finally {
        await pdf.destroy();
      }

      item.state = lang === 'en' ? 'Done' : '完成';
      renderQueue();
    }

    const name = outputName(group, groupIndex);
    const data = buildBook(
      pages,
      s.depth === 2,
      name.replace(/\.(xtc|xtch)$/i, '')
    );

    return {
      name,
      blob: new Blob([data], { type: 'application/octet-stream' }),
      pdfs: group.length,
      pages: pageTotal,
      folderPath: sourceFolderPath(group)
    };
  }

  $('go').onclick = async () => {
    if (running || !queue.length) return;

    running = true;
    cancelled = false;
    renderQueue();

    const todo = queue.filter(x =>
      x.state === '等待转换' ||
      x.state === 'Waiting' ||
      x.state === '失败' ||
      x.state === 'Failed'
    );

    const groups = groupsOf(todo);
    let done = 0, failed = 0;

    for (let i = 0; i < groups.length; i++) {
      if (cancelled) break;

      try {
        const o = await convertGroup(groups[i], i, groups.length);
        outputs.push(o);
        done++;
        renderOutputs();
      } catch (e) {
        failed++;

        for (const x of groups[i]) {
          x.state = lang === 'en' ? 'Failed' : '失败';
        }

        if (e.message !== 'Cancelled') console.error(e);

        if (!cancelled) {
          status((lang === 'en' ? 'Failed: ' : '转换失败：') + e.message);
        }
      }

      renderQueue();
    }

    running = false;
    renderQueue();

    status(
      cancelled
        ? (lang === 'en'
            ? `Cancelled. Completed ${done}, failed ${failed}.`
            : `已取消。成功 ${done} 组，失败 ${failed} 组。`)
        : (lang === 'en'
            ? `Finished. Successful ${done}, failed ${failed}.`
            : `转换结束。成功 ${done} 组，失败 ${failed} 组。`),
      100
    );
  };

  $('cancel').onclick = () => {
    cancelled = true;
    status(
      lang === 'en'
        ? 'Cancellation requested; current PDF page will finish first.'
        : '已请求取消，当前 PDF 页处理结束后停止。'
    );
  };

  $('clear').onclick = () => {
    if (running) return;

    queue = [];
    outputs = [];
    previewPages = [];

    previewPdf?.destroy();
    previewPdf = null;
    previewKey = '';

    renderQueue();
    renderOutputs();

    $('bar').style.width = '0';
    status(lang === 'en' ? 'Queue cleared.' : '队列已清空。', 0);
    loadPreview();
  };

  async function saveToFolder() {
    if (!outputs.length || running) return;

    if (!window.showDirectoryPicker) {
      status(
        lang === 'en'
          ? 'Direct folder saving is not supported in this browser. Please use ZIP download.'
          : '当前浏览器不支持直接保存到文件夹，请使用 ZIP 下载。',
        0
      );
      return;
    }

    try {
      const root = await window.showDirectoryPicker({ mode: 'readwrite' });
      const used = new Map();

      for (let i = 0; i < outputs.length; i++) {
        const o = outputs[i];
        let dir = root;

        for (const part of (o.folderPath || [])) {
          dir = await dir.getDirectoryHandle(safeName(part), { create: true });
        }

        const baseName = o.name;
        let finalName = baseName;
        let k = 2;
        const folderKey = (o.folderPath || []).join('/').toLowerCase();
        const usedKey = `${folderKey}/${finalName.toLowerCase()}`;

        while (used.has(usedKey) || await fileExists(dir, finalName)) {
          finalName = baseName.replace(/(\.[^.]+)$/i, ` (${k++})$1`);
        }
        used.set(`${folderKey}/${finalName.toLowerCase()}`, true);

        const fileHandle = await dir.getFileHandle(finalName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(o.blob);
        await writable.close();

        status(
          lang === 'en'
            ? `Saving files: ${i + 1}/${outputs.length} — ${finalName}`
            : `正在保存文件：${i + 1}/${outputs.length} — ${finalName}`,
          ((i + 1) / outputs.length) * 100
        );
      }

      status(
        lang === 'en'
          ? `Saved ${outputs.length} file(s) to the selected folder.`
          : `已将 ${outputs.length} 个文件保存到所选文件夹。`,
        100
      );
    } catch (e) {
      if (e.name !== 'AbortError') {
        status((lang === 'en' ? 'Folder save failed: ' : '保存到文件夹失败：') + e.message, 0);
      }
    }
  }

  async function fileExists(dir, name) {
    try {
      await dir.getFileHandle(name);
      return true;
    } catch (e) {
      if (e.name === 'NotFoundError') return false;
      throw e;
    }
  }

  const folderButton = $('folderDownload');
  if (folderButton) {
    folderButton.onclick = saveToFolder;
  } else {
    // Keep this JS compatible with the current page even if the button is absent.
    const zipButton = $('zip');
    const button = document.createElement('button');
    button.id = 'folderDownload';
    button.className = 'secondary';
    button.disabled = true;
    button.textContent = tr('folderDownload');
    button.setAttribute('data-i18n', 'folderDownload');
    button.onclick = saveToFolder;
    zipButton.insertAdjacentElement('afterend', button);
  }

  $('zip').onclick = async () => {
    if (!window.JSZip || !outputs.length) return;

    const z = new window.JSZip();
    const used = new Set();

    for (const o of outputs) {
      const folder = (o.folderPath || []).join('/');
      let n = folder ? `${folder}/${o.name}` : o.name;
      let k = 2;
      const original = n;

      while (used.has(n.toLowerCase())) {
        n = original.replace(/(\.[^.]+)$/i, ` (${k++})$1`);
      }

      used.add(n.toLowerCase());
      z.file(n, o.blob);
    }

    status(
      lang === 'en' ? 'Building ZIP…' : '正在打包 ZIP…',
      0
    );

    const blob = await z.generateAsync(
      { type: 'blob', compression: 'STORE' },
      m => {
        $('bar').style.width = m.percent + '%';
      }
    );

    download(blob, 'X3-original-style-test-results.zip');

    status(
      lang === 'en'
        ? `ZIP ready: ${outputs.length} file(s).`
        : `ZIP 打包完成：${outputs.length} 个文件。`,
      100
    );
  };

  renderQueue();
  renderOutputs();
  applyLang();

  if (pdfjsLoadError) {
    status(
      (lang === 'en'
        ? 'PDF.js could not load. Check your network/CDN and refresh. Details are in the browser console. '
        : 'PDF.js 加载失败。请检查网络/CDN 后刷新，具体原因请查看浏览器控制台。') +
      (pdfjsLoadError.message || pdfjsLoadError),
      0
    );
  }
})();