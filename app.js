(async function () {
  let pdfjsLib = null;
  let pdfjsLoadError = null;

  // Try two CDNs so one failed CDN does not immediately break the app.
  const pdfjsSources = [
    {
      main: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs',
      worker: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs'
    },
    {
      main: 'https://unpkg.com/pdfjs-dist@4.10.38/build/pdf.min.mjs',
      worker: 'https://unpkg.com/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs'
    }
  ];

  for (const source of pdfjsSources) {
    try {
      pdfjsLib = await import(source.main);
      pdfjsLib.GlobalWorkerOptions.workerSrc = source.worker;
      pdfjsLoadError = null;
      break;
    } catch (error) {
      pdfjsLoadError = error;
      console.error('PDF.js CDN failed:', source.main, error);
    }
  }

  const W = 528;
  const H = 792;
  const $ = id => document.getElementById(id);

  const dict = {
    zh: {
      heading: 'X3 PDF → XTC / XTCH 连续拼接测试版',
      lead: '独立测试项目：PDF 页面按宽度缩放后连续拼接，重叠率为 0%，每累计 792 像素输出一页；最后不足 792 像素的内容放在页面顶部，底部补白。文件只在本机浏览器处理。',
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
      methodHint: '处理方式：PDF 页面按比例缩放到 528 像素宽后连续拼接；每 792 像素切成一页，不重叠。最后不足 792 像素的内容置顶，底部补白。预览和正式转换使用相同的拼接逻辑。',
      previewTitle: '前 5 个输出页面预览',
      previewHint: '显示首个 PDF 连续拼接后产生的前 5 个输出页面。页面之间不留额外间隔、不重叠；调整参数可刷新当前页预览。',
      downloadModeTitle: '下载方式（转换前选择）',
      downloadModeLabel: '选择转换完成后的保存方式',
      individualMode: '单独下载',
      individualModeHint: '转换完成后，在结果列表逐本下载。',
      zipMode: '打包 ZIP',
      zipModeHint: '转换完成后，将所有结果打包成一个 ZIP。',
      folderMode: '自动保存到文件夹',
      folderModeHint: '先选择目标文件夹，每本完成后自动保存。',
      chooseFolder: '选择保存文件夹',
      folderNotChosen: '尚未选择保存文件夹。',
      folderChosen: '已选择保存文件夹：',
      outputsTitle: '转换结果',
      start: '开始转换',
      cancel: '取消',
      zipDownload: '下载全部结果 ZIP',
      clear: '清空队列',
      remove: '删除',
      queueTitle: '源 PDF 队列',
      queueHint: '可调整文件顺序，也可以删除不需要转换的文件。',
      languageLabel: '语言 / Language',
      selectFirst: '请先选择 PDF 文件或文件夹。',
      noPdf: '没有找到 PDF 文件。',
      alreadyAdded: '文件已在队列中。',
      added: '已加入',
      pdfUnit: '个 PDF。',
      waiting: '等待转换',
      converting: '转换中',
      done: '完成',
      failed: '失败',
      removed: '已从队列删除该 PDF。',
      cleared: '队列已清空。',
      completedHint: '转换完成后显示结果。',
      pdfRemoved: '已从队列删除该 PDF。',
      noFolderSupport: '当前浏览器不支持直接保存到文件夹。请使用支持此功能的 Chrome/Edge，或改用单独下载/ZIP。',
      folderCancelled: '已取消选择保存文件夹。',
      folderReady: '保存文件夹已选择：',
      needFolder: '请先选择保存文件夹，再开始转换。',
      folderSaveFailed: '保存到文件夹失败：',
      folderSaved: '已保存：',
      saving: '正在保存文件：',
      zipBuilding: '正在打包 ZIP…',
      zipReady: 'ZIP 打包完成：',
      zipUnit: '个文件。',
      convertingGroup: '第',
      group: '组',
      pdfPage: 'PDF 页',
      x3Page: 'X3 页面',
      previewFailed: '预览失败：',
      pdfjsFailed: 'PDF.js 加载失败。请检查网络/CDN 后刷新，具体原因请查看浏览器控制台。',
      cancelRequested: '已请求取消，当前 PDF 页处理结束后停止。',
      cancelled: '已取消。成功',
      finished: '转换结束。成功',
      successUnit: '组，失败',
      groupUnit: '组。',
      conversionFailed: '转换失败：',
      browserFolderPermission: '浏览器没有获得保存文件夹的写入权限，请重新选择文件夹并允许访问。',
      autoZipFailed: 'ZIP 生成失败：',
      saveFailed: '文件转换成功，但保存失败：'
    },
    en: {
      heading: 'X3 PDF → XTC / XTCH — Continuous stitching test',
      lead: 'Independent test project. PDF pages are scaled to 528 pixels wide and stitched continuously with 0% overlap. One output page is emitted for every 792 rows; the final partial page is top-aligned and padded white at the bottom. Files stay in your browser.',
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
      methodHint: 'Scale each PDF page proportionally to 528 pixels wide, then stitch pages continuously with 0% overlap. Emit one output page per 792 rows; top-align and white-pad the final partial page. Preview and conversion use the same stitching logic.',
      previewTitle: 'First 5 output pages preview',
      previewHint: 'Shows the first five output pages after continuously stitching the first PDF. No extra gaps or overlap are added between source pages. Adjust settings to refresh the preview.',
      downloadModeTitle: 'Download method (choose before conversion)',
      downloadModeLabel: 'Choose how to save the converted files',
      individualMode: 'Download individually',
      individualModeHint: 'Download each book separately from the results list.',
      zipMode: 'Create a ZIP',
      zipModeHint: 'Package all results into one ZIP after conversion.',
      folderMode: 'Automatically save to a folder',
      folderModeHint: 'Choose a destination folder first. Each book is saved as soon as it is ready.',
      chooseFolder: 'Choose destination folder',
      folderNotChosen: 'No destination folder selected.',
      folderChosen: 'Destination folder selected: ',
      outputsTitle: 'Output files',
      start: 'Start conversion',
      cancel: 'Cancel',
      zipDownload: 'Download all results as ZIP',
      clear: 'Clear queue',
      remove: 'Remove',
      queueTitle: 'Source PDF queue',
      queueHint: 'Reorder files or remove PDFs you do not want to convert.',
      languageLabel: 'Language',
      selectFirst: 'Select PDF files or a folder first.',
      noPdf: 'No PDF files found.',
      alreadyAdded: 'Files are already in the queue.',
      added: 'Added',
      pdfUnit: 'PDF(s).',
      waiting: 'Waiting',
      converting: 'Converting',
      done: 'Done',
      failed: 'Failed',
      removed: 'PDF removed from the queue.',
      cleared: 'Queue cleared.',
      completedHint: 'Completed files will appear here.',
      pdfRemoved: 'PDF removed from the queue.',
      noFolderSupport: 'Direct folder saving is not supported in this browser. Use a compatible Chrome/Edge browser or download individually/ZIP.',
      folderCancelled: 'Folder selection cancelled.',
      folderReady: 'Destination folder selected: ',
      needFolder: 'Choose a destination folder before starting conversion.',
      folderSaveFailed: 'Folder save failed: ',
      folderSaved: 'Saved: ',
      saving: 'Saving file: ',
      zipBuilding: 'Building ZIP…',
      zipReady: 'ZIP ready: ',
      zipUnit: 'file(s).',
      convertingGroup: 'Group',
      group: '',
      pdfPage: 'PDF page',
      x3Page: 'X3 pages',
      previewFailed: 'Preview failed: ',
      pdfjsFailed: 'PDF.js could not load. Check your network/CDN and refresh. Details are in the browser console.',
      cancelRequested: 'Cancellation requested; the current PDF page will finish first.',
      cancelled: 'Cancelled. Completed ',
      finished: 'Finished. Successful ',
      successUnit: ', failed ',
      groupUnit: '.',
      conversionFailed: 'Conversion failed: ',
      browserFolderPermission: 'The browser does not have write permission for this folder. Select it again and allow access.',
      autoZipFailed: 'ZIP creation failed: ',
      saveFailed: 'Conversion succeeded, but saving failed: '
    }
  };

  let lang = 'zh';
  let queue = [];
  let outputs = [];
  let cancelled = false;
  let running = false;
  let previewPdf = null;
  let previewPages = [];
  let previewIndex = 0;
  let previewKey = '';
  let previewRequestId = 0;
  let outputDirectoryHandle = null;
  let savingFolder = false;

  const collator = new Intl.Collator('zh-CN', {
    numeric: true,
    sensitivity: 'base'
  });

  function tr(key) {
    return dict[lang][key] ?? dict.zh[key] ?? key;
  }

  function status(message, progress) {
    $('status').textContent = message;

    if (progress !== undefined) {
      $('bar').style.width =
        Math.max(0, Math.min(100, progress)) + '%';
    }
  }

  function applyLang() {
    lang = $('language').value === 'en' ? 'en' : 'zh';
    document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN';

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      el.textContent = tr(key);
    });

    updateFolderStatus();
    renderQueue();
    renderOutputs();
    updatePageLabel();

    // Do not replace an active progress message just because the language changed.
    if (pdfjsLoadError) {
      status(tr('pdfjsFailed') + ' ' + pdfjsLoadError.message, 0);
    }
  }

  $('language').addEventListener('change', applyLang);

  function selectedDownloadMode() {
    return document.querySelector(
      'input[name="downloadMode"]:checked'
    )?.value || 'individual';
  }

  function updateFolderStatus() {
    const el = $('folderStatus');
    if (!el) return;

    el.textContent = outputDirectoryHandle
      ? tr('folderChosen') + outputDirectoryHandle.name
      : tr('folderNotChosen');
  }

  function safeName(value) {
    return (value || 'converted')
      .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_')
      .replace(/[. ]+$/, '')
      .trim() || 'converted';
  }

  function fileKey(file) {
    return `${file.name}|${file.size}|${file.lastModified}|${file.webkitRelativePath || ''}`;
  }

  function sourceFolderPath(group) {
    const path = group[0]?.file.webkitRelativePath || '';
    const parts = path.split('/').filter(Boolean);
    return parts.slice(0, -1).map(safeName);
  }

  function addFiles(files) {
    const known = new Set(queue.map(item => fileKey(item.file)));

    const arr = [...files]
      .filter(file => /\.pdf$/i.test(file.name))
      .sort((a, b) => collator.compare(
        a.webkitRelativePath || a.name,
        b.webkitRelativePath || b.name
      ));

    let added = 0;

    for (const file of arr) {
      const key = fileKey(file);

      if (!known.has(key)) {
        // Internal states are language-independent.
        queue.push({
          file,
          state: 'waiting'
        });
        known.add(key);
        added++;
      }
    }

    if (added) {
      status(`${tr('added')} ${added} ${tr('pdfUnit')}`, 0);
      loadPreview();
    } else if (arr.length) {
      status(tr('alreadyAdded'), 0);
    } else {
      status(tr('noPdf'), 0);
    }

    renderQueue();
  }

  $('file').addEventListener('change', event => {
    addFiles(event.target.files);
    event.target.value = '';
  });

  $('folder').addEventListener('change', event => {
    addFiles(event.target.files);
    event.target.value = '';
  });

  function renderQueue() {
    const ul = $('queue');
    ul.replaceChildren();
    $('queueCount').textContent = String(queue.length);

    if (!queue.length) {
      const li = document.createElement('li');
      li.className = 'hint';
      li.textContent = tr('selectFirst');
      ul.append(li);
    }

    queue.forEach((item, index) => {
      const li = document.createElement('li');
      const info = document.createElement('div');
      info.className = 'file-info';

      const name = document.createElement('div');
      name.className = 'filename';
      name.textContent =
        `${index + 1}. ${item.file.webkitRelativePath || item.file.name}`;

      const detail = document.createElement('div');
      detail.className = 'file-detail';
      detail.textContent =
        `${(item.file.size / 1024 / 1024).toFixed(2)} MB`;

      info.append(name, detail);

      const state = document.createElement('span');
      state.className = 'file-state ' +
        (item.state === 'done'
          ? 'ok'
          : item.state === 'failed'
            ? 'err'
            : '');

      state.textContent = tr(item.state);
      li.append(info, state);

      const controls = document.createElement('span');
      controls.className = 'file-controls';

      if (!running) {
        for (const [symbol, direction] of [['↑', -1], ['↓', 1]]) {
          const button = document.createElement('button');
          button.className = 'secondary small';
          button.textContent = symbol;
          button.disabled = direction < 0
            ? index === 0
            : index === queue.length - 1;

          button.title = lang === 'en'
            ? (direction < 0 ? 'Move up' : 'Move down')
            : (direction < 0 ? '上移' : '下移');

          button.onclick = () => {
            const target = index + direction;

            if (target < 0 || target >= queue.length) return;

            [queue[index], queue[target]] =
              [queue[target], queue[index]];

            renderQueue();
            loadPreview();
          };

          controls.append(button);
        }

        const removeButton = document.createElement('button');
        removeButton.className = 'secondary small';
        removeButton.textContent = tr('remove');
        removeButton.title = lang === 'en'
          ? 'Remove this PDF from the queue'
          : '从队列移除此 PDF';

        removeButton.onclick = () => {
          if (running) return;

          const wasPreviewFile = index === 0;
          queue.splice(index, 1);

          if (wasPreviewFile) {
            previewKey = '';
            previewPages = [];
            previewIndex = 0;
            previewRequestId++;

            if (previewPdf) {
              previewPdf.destroy();
              previewPdf = null;
            }
          }

          renderQueue();
          loadPreview();
          status(tr('removed'), 0);
        };

        controls.append(removeButton);
      }

      li.append(controls);
      ul.append(li);
    });

    const hasPending = queue.some(item =>
      item.state === 'waiting' || item.state === 'failed'
    );

    $('go').disabled = running || !hasPending;
    $('clear').disabled = running || (!queue.length && !outputs.length);
    $('cancel').disabled = !running;
    $('zip').disabled = running || savingFolder || !outputs.length;

    const chooseFolderButton = $('chooseFolder');
    if (chooseFolderButton) {
      chooseFolderButton.disabled = running || savingFolder;
    }
  }

  function renderOutputs() {
    const ul = $('outputs');
    ul.replaceChildren();
    $('outCount').textContent = String(outputs.length);

    if (!outputs.length) {
      const li = document.createElement('li');
      li.className = 'hint';
      li.textContent = tr('completedHint');
      ul.append(li);
      return;
    }

    outputs.forEach((output, index) => {
      const li = document.createElement('li');
      const info = document.createElement('div');
      info.className = 'file-info';

      const name = document.createElement('div');
      name.className = 'filename';
      name.textContent = `${index + 1}. ${output.name}`;

      const detail = document.createElement('div');
      detail.className = 'file-detail';
      detail.textContent =
        `${output.pdfs} PDF · ${output.pages} X3 pages · ` +
        `${(output.blob.size / 1024 / 1024).toFixed(2)} MB`;

      info.append(name, detail);

      const button = document.createElement('button');
      button.className = 'small';
      button.textContent = lang === 'en' ? 'Download' : '下载';
      button.disabled = running || savingFolder;
      button.onclick = () => download(output.blob, output.name);

      li.append(info, button);
      ul.append(li);
    });
  }

  function download(blob, name) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = name;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();

    setTimeout(() => URL.revokeObjectURL(url), 15000);
  }

  function parseChapter(file) {
    const stem = file.name.replace(/\.pdf$/i, '');
    const match = stem.match(
      /(?:^|[\s\[【(（])(?:第\s*)?(\d+)\s*(?:话|話|章|回)\s*[\]】)）]?\s*[-_.、：:]?\s*(.*?)\s*$/i
    );

    if (!match) return null;

    const title = match[2].trim();

    return {
      n: Number(match[1]),
      title,
      key: title.replace(/\s+/g, ' ').toLowerCase()
    };
  }

  function groupsOf(items) {
    if (!$('chapterMode').checked) {
      const count = Math.max(1, Number($('mergeCount').value) || 1);
      const result = [];

      for (let index = 0; index < items.length; index += count) {
        result.push(items.slice(index, index + count));
      }

      return result;
    }

    const result = [];

    for (const item of items) {
      const chapter = parseChapter(item.file);
      const lastGroup = result.at(-1);
      const previousItem = lastGroup?.at(-1);
      const previousChapter = previousItem
        ? parseChapter(previousItem.file)
        : null;

      if (
        chapter &&
        previousChapter &&
        chapter.key === previousChapter.key &&
        chapter.n === previousChapter.n + 1
      ) {
        lastGroup.push(item);
      } else {
        result.push([item]);
      }
    }

    return result;
  }

  function outputName(group, index) {
    const customTitle = $('title').value.trim();
    const chapters = group.map(item => parseChapter(item.file));
    const extension = Number($('depth').value) === 2 ? '.xtch' : '.xtc';

    if ($('chapterMode').checked && chapters.every(Boolean)) {
      const first = chapters[0].n;
      const last = chapters.at(-1).n;
      const title = chapters[0].title;

      return safeName(
        `${first === last ? first : `${first}-${last}`}${title ? ' ' + title : ''}`
      ) + extension;
    }

    if (customTitle) {
      const numbers = group.map(item => {
        const match = item.file.name.match(/(\d+)(?!.*\d)/);
        return match ? Number(match[1]) : null;
      });

      const first = numbers[0] ?? index * Number($('mergeCount').value) + 1;
      const last = numbers.at(-1) ?? first + group.length - 1;

      return safeName(
        group.length === 1
          ? `${customTitle}${first}`
          : `${customTitle}${first}-${last}`
      ) + extension;
    }

    const stems = group.map(item =>
      item.file.name.replace(/\.pdf$/i, '')
    );

    let name;

    if (stems.length === 1) {
      name = stems[0];
    } else {
      const matches = stems.map(stem => stem.match(/^(.*?)(\d+)$/));

      name = matches.every(Boolean) &&
        matches.every(match => match[1] === matches[0][1])
        ? `${matches[0][1]}${matches[0][2]}-${matches.at(-1)[2]}`
        : `${stems[0]}_等${stems.length}个PDF`;
    }

    return safeName(name) + extension;
  }

  function clamp(value) {
    return Math.max(0, Math.min(255, value));
  }

  function contrastPixels(array, level) {
    if (!level) return;

    let min = 0;
    let max = 255;
    const histogram = new Uint32Array(256);

    for (const value of array) {
      histogram[Math.round(value)]++;
    }

    const length = array.length;
    const cut = level === 1 ? 0.003 : level === 2 ? 0.008 : 0.02;

    let count = 0;

    for (let index = 0; index < 256; index++) {
      count += histogram[index];

      if (count > length * cut) {
        min = index;
        break;
      }
    }

    count = 0;

    for (let index = 255; index >= 0; index--) {
      count += histogram[index];

      if (count > length * cut) {
        max = index;
        break;
      }
    }

    if (max > min) {
      for (let index = 0; index < array.length; index++) {
        array[index] = clamp(
          (array[index] - min) * 255 / (max - min)
        );
      }
    }
  }

  function quant(value, depth, threshold) {
    if (depth === 1) return value < threshold ? 0 : 255;

    return value < 42 ? 0
      : value < 127 ? 85
      : value < 212 ? 170
      : 255;
  }

  function processGray(
    gray,
    mode,
    depth,
    threshold,
    contrast,
    brightness,
    strength
  ) {
    const array = new Float32Array(gray.length);

    for (let index = 0; index < array.length; index++) {
      array[index] = clamp(gray[index] + brightness * 1.5);
    }

    contrastPixels(array, contrast);

    if (mode === 'none' || strength === 0) {
      return Uint8Array.from(
        array,
        value => quant(value, depth, threshold)
      );
    }

    const output = new Uint8Array(array.length);
    const work = new Float32Array(array);
    const scale = strength / 100;

    function add(x, y, error) {
      if (x >= 0 && x < W && y >= 0 && y < H) {
        work[y * W + x] += error * scale;
      }
    }

    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const index = y * W + x;
        const old = clamp(work[index]);
        const value = quant(old, depth, 128);

        output[index] = value;

        const error = old - value;

        if (mode === 'atkinson') {
          add(x + 1, y, error / 8);
          add(x + 2, y, error / 8);
          add(x - 1, y + 1, error / 8);
          add(x, y + 1, error / 8);
          add(x + 1, y + 1, error / 8);
          add(x, y + 2, error / 8);
        } else if (mode === 'stucki') {
          [
            [1, 0, 8], [2, 0, 4],
            [-2, 1, 2], [-1, 1, 4], [0, 1, 8],
            [1, 1, 4], [2, 1, 2],
            [-2, 2, 1], [-1, 2, 2], [0, 2, 4],
            [1, 2, 2], [2, 2, 1]
          ].forEach(([dx, dy, weight]) => {
            add(x + dx, y + dy, error * weight / 42);
          });
        } else {
          add(x + 1, y, error * 7 / 16);
          add(x - 1, y + 1, error * 3 / 16);
          add(x, y + 1, error * 5 / 16);
          add(x + 1, y + 1, error / 16);
        }
      }
    }

    return output;
  }

  function md5(input) {
    const K = new Uint32Array(64);
    const S = [
      7, 12, 17, 22, 5, 9, 14, 20,
      4, 11, 16, 23, 6, 10, 15, 21
    ];

    for (let i = 0; i < 64; i++) {
      K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296) >>> 0;
    }

    const length = input.length;
    const bitLength = length * 8;
    const total = ((length + 9 + 63) >> 6) << 6;
    const message = new Uint8Array(total);

    message.set(input);
    message[length] = 128;

    const view = new DataView(message.buffer);
    view.setUint32(total - 8, bitLength >>> 0, true);
    view.setUint32(
      total - 4,
      Math.floor(bitLength / 4294967296),
      true
    );

    let a0 = 0x67452301;
    let b0 = 0xefcdab89;
    let c0 = 0x98badcfe;
    let d0 = 0x10325476;

    for (let offset = 0; offset < total; offset += 64) {
      const words = new Uint32Array(16);
      const block = new DataView(message.buffer, offset, 64);

      for (let i = 0; i < 16; i++) {
        words[i] = block.getUint32(i * 4, true);
      }

      let a = a0;
      let b = b0;
      let c = c0;
      let d = d0;

      for (let i = 0; i < 64; i++) {
        let f;
        let g;

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

        const shift = S[
          i < 16 ? i % 4
            : i < 32 ? 4 + i % 4
            : i < 48 ? 8 + i % 4
            : 12 + i % 4
        ];

        const z = (a + f + K[i] + words[g]) | 0;
        const rotated = (z << shift) | (z >>> (32 - shift));

        a = d;
        d = c;
        c = b;
        b = (b + rotated) | 0;
      }

      a0 = (a0 + a) | 0;
      b0 = (b0 + b) | 0;
      c0 = (c0 + c) | 0;
      d0 = (d0 + d) | 0;
    }

    const output = new Uint8Array(16);
    const outputView = new DataView(output.buffer);

    [a0, b0, c0, d0].forEach((value, index) => {
      outputView.setUint32(index * 4, value, true);
    });

    return output;
  }

  function makePage(magic, width, height, data) {
    const output = new Uint8Array(22 + data.length);
    const view = new DataView(output.buffer);

    for (let i = 0; i < 4; i++) {
      output[i] = magic.charCodeAt(i);
    }

    view.setUint16(4, width, true);
    view.setUint16(6, height, true);
    view.setUint32(10, data.length, true);
    output.set(data, 22);
    output.set(md5(data).slice(0, 8), 14);

    return output;
  }

  function packPage(pixels, depth) {
    if (depth === 1) {
      const rowBytes = Math.ceil(W / 8);
      const data = new Uint8Array(rowBytes * H);

      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          if (pixels[y * W + x] >= 128) {
            data[y * rowBytes + (x >> 3)] |= 0x80 >> (x & 7);
          }
        }
      }

      return makePage('XTG\0', W, H, data);
    }

    const columnBytes = Math.ceil(H / 8);
    const plane = columnBytes * W;
    const plane0 = new Uint8Array(plane);
    const plane1 = new Uint8Array(plane);

    for (let x = 0; x < W; x++) {
      const offset = (W - 1 - x) * columnBytes;

      for (let y = 0; y < H; y++) {
        const pixel = pixels[y * W + x];
        const value = pixel >= 212 ? 0
          : pixel >= 127 ? 1
          : pixel >= 42 ? 2
          : 3;

        const index = offset + (y >> 3);
        const bit = 7 - (y & 7);

        if (value & 1) plane0[index] |= 1 << bit;
        if (value & 2) plane1[index] |= 1 << bit;
      }
    }

    const data = new Uint8Array(plane * 2);
    data.set(plane0);
    data.set(plane1, plane);

    return makePage('XTH\0', W, H, data);
  }

  function buildBook(pages, is2, title) {
    const metaOffset = 56;
    const indexOffset = 312;
    const dataOffset = indexOffset + pages.length * 16;
    const total = dataOffset +
      pages.reduce((sum, page) => sum + page.length, 0);

    const output = new Uint8Array(total);
    const view = new DataView(output.buffer);
    const magic = is2 ? 'XTCH' : 'XTC\0';

    for (let i = 0; i < 4; i++) {
      output[i] = magic.charCodeAt(i);
    }

    view.setUint16(4, 1, true);
    view.setUint16(6, pages.length, true);
    view.setUint32(8, 0x01000100, true);
    view.setUint32(12, 1, true);
    view.setBigUint64(16, BigInt(metaOffset), true);
    view.setBigUint64(24, BigInt(indexOffset), true);
    view.setBigUint64(32, BigInt(dataOffset), true);
    view.setBigUint64(40, 0n, true);
    view.setBigUint64(48, 0n, true);

    new TextEncoder().encode(title).slice(0, 127).forEach((byte, index) => {
      output[metaOffset + index] = byte;
    });

    let position = dataOffset;

    pages.forEach((page, index) => {
      const entry = indexOffset + index * 16;

      view.setBigUint64(entry, BigInt(position), true);
      view.setUint32(entry + 8, page.length, true);
      view.setUint16(entry + 12, W, true);
      view.setUint16(entry + 14, H, true);

      output.set(page, position);
      position += page.length;
    });

    return output;
  }

  // Continuously stitch scaled PDF pages into 528 × 792 output pages.
  // Overlap is fixed at 0%; only the final partial page is white-padded.
  function createStitcher() {
    function newWhitePage() {
      const page = new Uint8Array(W * H);
      page.fill(255);
      return page;
    }

    let buffer = newWhitePage();
    let usedRows = 0;

    function appendCanvas(sourceCanvas, onPage, maxPages = Infinity) {
      if (!sourceCanvas.width || !sourceCanvas.height) {
        throw Error('源页面尺寸无效。');
      }

      if (typeof onPage !== 'function') {
        throw Error('拼接输出回调无效。');
      }

      const scaleX = W / sourceCanvas.width;
      const scaledHeight = Math.max(
        1,
        Math.ceil(sourceCanvas.height * scaleX)
      );
      // Use the rounded target height as the global vertical scale so adjacent
      // tiles map to the same row coordinates without gaps.
      const scaleY = scaledHeight / sourceCanvas.height;

      // A two-row bleed above and below each tile avoids visible seams caused
      // by interpolation at crop boundaries. Memory remains bounded (~794 rows).
      const temp = document.createElement('canvas');
      temp.width = W;
      temp.height = H + 2;

      const context = temp.getContext('2d', {
        willReadFrequently: true
      });

      if (!context) {
        temp.width = 1;
        temp.height = 1;
        throw Error('无法创建拼接画布上下文。');
      }

      let sourceRow = 0;
      let emitted = 0;

      try {
        while (sourceRow < scaledHeight && emitted < maxPages) {
          const rows = Math.min(
            H,
            scaledHeight - sourceRow,
            H - usedRows
          );

          if (rows <= 0) {
            throw Error('拼接过程遇到无效的行数。');
          }

          // Include one output row of bleed on each side where available.
          const tileStart = Math.max(0, sourceRow - 1);
          const tileEnd = Math.min(scaledHeight, sourceRow + rows + 1);
          const tileRows = tileEnd - tileStart;
          const tileOrigin = sourceRow - 1;
          const destY = tileStart - tileOrigin;
          const sourceY = tileStart / scaleY;
          const sourceHeight = (tileEnd - tileStart) / scaleY;

          context.fillStyle = '#fff';
          context.fillRect(0, 0, W, temp.height);
          context.drawImage(
            sourceCanvas,
            0, sourceY,
            sourceCanvas.width, sourceHeight,
            0, destY,
            W, tileRows
          );

          // The requested source rows begin one row into the temporary tile.
          const rgba = context.getImageData(0, 1, W, rows).data;

          for (let y = 0; y < rows; y++) {
            const sourceOffset = y * W * 4;
            const targetOffset = (usedRows + y) * W;

            for (let x = 0; x < W; x++) {
              const pixel = sourceOffset + x * 4;
              buffer[targetOffset + x] = Math.round(
                0.299 * rgba[pixel] +
                0.587 * rgba[pixel + 1] +
                0.114 * rgba[pixel + 2]
              );
            }
          }

          sourceRow += rows;
          usedRows += rows;

          if (usedRows === H) {
            const completePage = buffer;
            buffer = newWhitePage();
            usedRows = 0;
            emitted++;
            onPage(completePage);
          }
        }
      } finally {
        temp.width = 1;
        temp.height = 1;
      }

      return {
        pagesEmitted: emitted,
        remainingRows: sourceRow < scaledHeight
      };
    }

    function finish(onPage) {
      if (usedRows === 0) return false;
      if (typeof onPage !== 'function') {
        throw Error('拼接输出回调无效。');
      }

      // The buffer was initialized white, so remaining rows are padded at bottom.
      const lastPage = buffer;
      buffer = newWhitePage();
      usedRows = 0;
      onPage(lastPage);
      return true;
    }

    return { appendCanvas, finish };
  }

  function settings() {
    return {
      depth: Number($('depth').value),
      mode: $('dither').value,
      threshold: Number($('threshold').value),
      contrast: Number($('contrast').value),
      brightness: Number($('brightness').value),
      strength: Number($('strength').value)
    };
  }

  function paintPreview(gray) {
    const current = settings();
    const pixels = processGray(
      gray,
      current.mode,
      current.depth,
      current.threshold,
      current.contrast,
      current.brightness,
      current.strength
    );

    const canvas = $('preview');
    const context = canvas.getContext('2d');
    const imageData = context.createImageData(W, H);

    for (let i = 0, j = 0; i < pixels.length; i++, j += 4) {
      imageData.data[j] = pixels[i];
      imageData.data[j + 1] = pixels[i];
      imageData.data[j + 2] = pixels[i];
      imageData.data[j + 3] = 255;
    }

    context.putImageData(imageData, 0, 0);
canvas.classList.add('has-preview');
  }

  function clearPreviewCanvas() {
    const canvas = $('preview');
    const context = canvas.getContext('2d');

    context.clearRect(0, 0, canvas.width, canvas.height);
canvas.classList.remove('has-preview');
  }

  function updatePageLabel() {
    const count = previewPages.length;

    $('pageLabel').textContent = lang === 'en'
      ? `Page ${count ? previewIndex + 1 : 0} / ${count}`
      : `第 ${count ? previewIndex + 1 : 0} / ${count} 页`;

    $('prev').disabled = !count || previewIndex <= 0;
    $('next').disabled = !count || previewIndex >= count - 1;
  }

  async function loadPreview() {
    const requestId = ++previewRequestId;

    try {
      const file = queue[0]?.file;

      if (!file) {
        previewKey = '';
        previewPages = [];
        previewIndex = 0;

        if (previewPdf) {
          await previewPdf.destroy();
          previewPdf = null;
        }

        clearPreviewCanvas();
        updatePageLabel();
        return;
      }

      if (!pdfjsLib) {
        throw Error(
          tr('pdfjsFailed') +
          (pdfjsLoadError?.message
            ? ' ' + pdfjsLoadError.message
            : '')
        );
      }

      const key = fileKey(file);

      if (key !== previewKey || !previewPages.length) {
        const task = pdfjsLib.getDocument({
          data: await file.arrayBuffer()
        });
        const newPdf = await task.promise;
        const newPages = [];
        const stitcher = createStitcher();

        try {
          for (
            let number = 1;
            number <= newPdf.numPages && newPages.length < 5;
            number++
          ) {
            if (requestId !== previewRequestId) {
              await newPdf.destroy();
              return;
            }

            const page = await newPdf.getPage(number);
            const viewport = page.getViewport({ scale: 2 });
            const canvas = document.createElement('canvas');
            canvas.width = Math.ceil(viewport.width);
            canvas.height = Math.ceil(viewport.height);

            const context = canvas.getContext('2d', {
              willReadFrequently: true
            });

            if (!context) {
              throw Error('无法创建预览画布上下文。');
            }

            context.fillStyle = '#fff';
            context.fillRect(0, 0, canvas.width, canvas.height);

            await page.render({
              canvasContext: context,
              viewport,
              background: 'rgb(255,255,255)'
            }).promise;

            if (requestId !== previewRequestId) {
              canvas.width = 1;
              canvas.height = 1;
              await newPdf.destroy();
              return;
            }

            const result = stitcher.appendCanvas(
              canvas,
              gray => newPages.push(gray),
              5 - newPages.length
            );

            page.cleanup?.();
            canvas.width = 1;
            canvas.height = 1;

            if (result.remainingRows) break;
          }

          if (newPages.length < 5) {
            stitcher.finish(gray => newPages.push(gray));
          }

          if (requestId !== previewRequestId) {
            await newPdf.destroy();
            return;
          }

          if (previewPdf) {
            await previewPdf.destroy();
          }

          previewPdf = newPdf;
          previewPages = newPages.slice(0, 5);
          previewIndex = 0;
          previewKey = key;
        } catch (error) {
          await newPdf.destroy();

          if (requestId === previewRequestId) {
            previewKey = '';
            previewPages = [];
            previewIndex = 0;
          }

          throw error;
        }
      }

      if (requestId !== previewRequestId) return;

      if (previewPages.length) {
        paintPreview(previewPages[previewIndex]);
      } else {
        clearPreviewCanvas();
      }

      updatePageLabel();
    } catch (error) {
      if (requestId !== previewRequestId) return;

      console.error('Preview failed:', error);
      status(
        tr('previewFailed') +
        (error.message || String(error)),
        0
      );
      updatePageLabel();
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
    previewIndex = Math.min(
      previewPages.length - 1,
      previewIndex + 1
    );

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
      for (const [inputId, outputId] of [
        ['threshold', 'thresholdValue'],
        ['brightness', 'brightnessValue'],
        ['strength', 'strengthValue']
      ]) {
        const output = $(outputId);

        if (output) {
          output.textContent =
            $(inputId).value +
            (inputId === 'strength' ? '%' : '');
        }
      }

      if (previewPages[previewIndex]) {
        paintPreview(previewPages[previewIndex]);
      }
    });
  });

  async function convertGroup(group, groupIndex, total) {
    if (!pdfjsLib) {
      throw Error(
        tr('pdfjsFailed') +
        (pdfjsLoadError?.message
          ? ' ' + pdfjsLoadError.message
          : '')
      );
    }

    const current = settings();
    const pages = [];
    let pageTotal = 0;
    // Keep one continuous buffer across all PDF pages in this output book.
    const stitcher = createStitcher();

    function addOutputGray(gray) {
      const processed = processGray(
        gray,
        current.mode,
        current.depth,
        current.threshold,
        current.contrast,
        current.brightness,
        current.strength
      );
      pages.push(packPage(processed, current.depth));
      pageTotal++;
    }

    function updateProgress(file, fileIndex, pageNumber, pdfPageCount) {
      status(
        `${tr('convertingGroup')} ${groupIndex + 1}/${total} · ` +
        `${file.name} · ` +
        `${tr('pdfPage')} ${pageNumber}/${pdfPageCount} · ` +
        `${tr('x3Page')} ${pageTotal}`,
        (
          (
            groupIndex +
            ((fileIndex + 1) / group.length) *
            pageNumber / pdfPageCount
          ) / total
        ) * 100
      );
    }

    for (let fileIndex = 0; fileIndex < group.length; fileIndex++) {
      if (cancelled) throw Error('Cancelled');

      const item = group[fileIndex];
      item.state = 'converting';
      renderQueue();

      const pdf = await pdfjsLib.getDocument({
        data: await item.file.arrayBuffer()
      }).promise;

      try {
        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
          if (cancelled) throw Error('Cancelled');

          const page = await pdf.getPage(pageNumber);
          const viewport = page.getViewport({ scale: 2 });
          const canvas = document.createElement('canvas');
          canvas.width = Math.ceil(viewport.width);
          canvas.height = Math.ceil(viewport.height);

          const context = canvas.getContext('2d', {
            willReadFrequently: true
          });

          if (!context) {
            throw Error('无法创建转换画布上下文。');
          }

          context.fillStyle = '#fff';
          context.fillRect(0, 0, canvas.width, canvas.height);

          await page.render({
            canvasContext: context,
            viewport,
            background: 'rgb(255,255,255)'
          }).promise;

          stitcher.appendCanvas(canvas, gray => {
            if (cancelled) throw Error('Cancelled');
            addOutputGray(gray);
            updateProgress(item.file, fileIndex, pageNumber, pdf.numPages);
          });

          page.cleanup?.();
          canvas.width = 1;
          canvas.height = 1;

          // Update progress even when this source page did not complete an X3 page.
          updateProgress(item.file, fileIndex, pageNumber, pdf.numPages);
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      } finally {
        await pdf.destroy();
      }

      item.state = 'done';
      renderQueue();
    }

    // Emit the final incomplete page only once, with white padding at the bottom.
    stitcher.finish(gray => addOutputGray(gray));

    const name = outputName(group, groupIndex);
    const data = buildBook(
      pages,
      current.depth === 2,
      name.replace(/\.(xtc|xtch)$/i, '')
    );

    status(
      `${tr('convertingGroup')} ${groupIndex + 1}/${total} · ` +
      `${tr('x3Page')} ${pageTotal}`,
      ((groupIndex + 1) / total) * 100
    );

    return {
      name,
      blob: new Blob([data], {
        type: 'application/octet-stream'
      }),
      pdfs: group.length,
      pages: pageTotal,
      folderPath: sourceFolderPath(group)
    };
  }

  async function getUniqueFileName(directory, baseName, usedNames) {
    let candidate = baseName;
    let number = 2;

    while (
      usedNames.has(candidate.toLowerCase()) ||
      await fileExists(directory, candidate)
    ) {
      candidate = baseName.replace(
        /(\.[^.]+)$/i,
        ` (${number++})$1`
      );
    }

    usedNames.add(candidate.toLowerCase());
    return candidate;
  }

  async function fileExists(directory, name) {
    try {
      await directory.getFileHandle(name);
      return true;
    } catch (error) {
      if (error.name === 'NotFoundError') return false;
      throw error;
    }
  }

  async function saveOutputToFolder(output) {
    if (!outputDirectoryHandle) {
      throw Error(tr('needFolder'));
    }

    let directory = outputDirectoryHandle;

    for (const part of output.folderPath || []) {
      directory = await directory.getDirectoryHandle(
        safeName(part),
        { create: true }
      );
    }

    if (!saveOutputToFolder.usedNames) {
      saveOutputToFolder.usedNames = new Map();
    }

    const key = (output.folderPath || []).join('/').toLowerCase();

    if (!saveOutputToFolder.usedNames.has(key)) {
      saveOutputToFolder.usedNames.set(key, new Set());
    }

    const usedNames = saveOutputToFolder.usedNames.get(key);
    const finalName = await getUniqueFileName(
      directory,
      output.name,
      usedNames
    );

    const fileHandle = await directory.getFileHandle(
      finalName,
      { create: true }
    );

    const writable = await fileHandle.createWritable();

    try {
      await writable.write(output.blob);
    } finally {
      await writable.close();
    }

    return finalName;
  }

  async function chooseOutputFolder() {
    if (running || savingFolder) return false;

    if (!window.showDirectoryPicker) {
      status(tr('noFolderSupport'), 0);
      return false;
    }

    try {
      const handle = await window.showDirectoryPicker({
        mode: 'readwrite'
      });

      outputDirectoryHandle = handle;

      if (saveOutputToFolder.usedNames) {
        saveOutputToFolder.usedNames.clear();
      }

      updateFolderStatus();
      status(tr('folderReady') + handle.name, 0);
      return true;
    } catch (error) {
      if (error.name === 'AbortError') {
        status(tr('folderCancelled'), 0);
      } else {
        status(tr('folderSaveFailed') + error.message, 0);
      }

      return false;
    }
  }

  $('chooseFolder').addEventListener('click', chooseOutputFolder);

  async function createAndDownloadZip() {
    if (!window.JSZip) {
      throw Error(
        lang === 'en'
          ? 'JSZip failed to load. Check your network and refresh.'
          : 'JSZip 加载失败，请检查网络后刷新。'
      );
    }

    if (!outputs.length) return;

    const zip = new window.JSZip();
    const used = new Set();

    for (const output of outputs) {
      const folder = (output.folderPath || []).join('/');
      const original = folder
        ? `${folder}/${output.name}`
        : output.name;

      let name = original;
      let number = 2;

      while (used.has(name.toLowerCase())) {
        name = original.replace(
          /(\.[^.]+)$/i,
          ` (${number++})$1`
        );
      }

      used.add(name.toLowerCase());
      zip.file(name, output.blob);
    }

    status(tr('zipBuilding'), 0);

    const blob = await zip.generateAsync(
      {
        type: 'blob',
        compression: 'STORE'
      },
      metadata => {
        $('bar').style.width = metadata.percent + '%';
      }
    );

    download(blob, 'X3-original-style-test-results.zip');

    status(
      tr('zipReady') + outputs.length + ' ' + tr('zipUnit'),
      100
    );
  }

  $('go').onclick = async () => {
    if (running || !queue.length) return;

    const mode = selectedDownloadMode();

    // If folder mode is selected, open the folder picker from the button click.
    if (mode === 'folder' && !outputDirectoryHandle) {
      const selected = await chooseOutputFolder();

      if (!selected || !outputDirectoryHandle) {
        return;
      }
    }

    if (mode === 'folder' && !window.showDirectoryPicker) {
      status(tr('noFolderSupport'), 0);
      return;
    }

    if (!pdfjsLib) {
      status(
        tr('pdfjsFailed') +
        (pdfjsLoadError?.message ? ' ' + pdfjsLoadError.message : ''),
        0
      );
      return;
    }

    running = true;
    cancelled = false;

    if (saveOutputToFolder.usedNames) {
      saveOutputToFolder.usedNames.clear();
    }

    renderQueue();
    renderOutputs();

    const todo = queue.filter(item =>
      item.state === 'waiting' || item.state === 'failed'
    );

    const groups = groupsOf(todo);
    let done = 0;
    let failed = 0;
    let saved = 0;
    let saveFailed = 0;

    try {
      for (let index = 0; index < groups.length; index++) {
        if (cancelled) break;

        try {
          const output = await convertGroup(
            groups[index],
            index,
            groups.length
          );

          outputs.push(output);
          done++;

          // Folder mode writes each book immediately after conversion.
          if (mode === 'folder' && !cancelled) {
            try {
              const finalName = await saveOutputToFolder(output);
              saved++;

              status(
                tr('folderSaved') + finalName,
                ((index + 1) / groups.length) * 100
              );
            } catch (error) {
              saveFailed++;
              console.error('Folder save failed:', error);

              status(
                tr('saveFailed') + output.name + ' — ' + error.message,
                ((index + 1) / groups.length) * 100
              );
            }
          }

          renderOutputs();
        } catch (error) {
          if (error.message === 'Cancelled') {
            cancelled = true;
            break;
          }

          failed++;

          for (const item of groups[index]) {
            item.state = 'failed';
          }

          console.error(error);
          status(tr('conversionFailed') + error.message);
        }

        renderQueue();
      }

      // ZIP mode creates the ZIP automatically after conversion finishes.
      if (mode === 'zip' && !cancelled && outputs.length) {
        try {
          await createAndDownloadZip();
        } catch (error) {
          console.error(error);
          status(tr('autoZipFailed') + error.message);
        }
      }
    } finally {
      running = false;
      renderQueue();
      renderOutputs();
    }

    if (cancelled) {
      status(
        `${tr('cancelled')}${done}${tr('successUnit')}${failed}${tr('groupUnit')}`,
        100
      );
    } else if (mode === 'folder') {
      let message =
        `${lang === 'en' ? 'Finished. Converted ' : '转换结束。成功转换 '}` +
        `${done}${lang === 'en' ? ', failed ' : ' 组，转换失败 '}` +
        `${failed}${tr('groupUnit')}`;

      message += lang === 'en'
        ? ` Saved ${saved}; save failures ${saveFailed}.`
        : ` 已保存 ${saved} 本；保存失败 ${saveFailed} 本。`;

      status(message, 100);
    } else {
      status(
        `${tr('finished')}${done}${tr('successUnit')}${failed}${tr('groupUnit')}`,
        100
      );
    }
  };

  $('cancel').onclick = () => {
    cancelled = true;
    status(tr('cancelRequested'));
  };

  $('clear').onclick = () => {
    if (running) return;

    queue = [];
    outputs = [];
    previewPages = [];
    previewRequestId++;

    if (previewPdf) {
      previewPdf.destroy();
      previewPdf = null;
    }

    previewKey = '';
    previewIndex = 0;

    if (saveOutputToFolder.usedNames) {
      saveOutputToFolder.usedNames.clear();
    }

    renderQueue();
    renderOutputs();

    $('bar').style.width = '0';
    status(tr('cleared'), 0);
    loadPreview();
  };

  $('zip').onclick = async () => {
    if (running || savingFolder || !outputs.length) return;

    try {
      await createAndDownloadZip();
    } catch (error) {
      console.error(error);
      status(tr('autoZipFailed') + error.message, 0);
    }
  };

  // Folder selection is only required when folder mode is selected.
  document.querySelectorAll('input[name="downloadMode"]').forEach(input => {
    input.addEventListener('change', () => {
      if (selectedDownloadMode() === 'folder' && !outputDirectoryHandle) {
        status(tr('needFolder'), 0);
      }
    });
  });

  // Initialise labels and controls.
  renderQueue();
  renderOutputs();
  applyLang();
  updatePageLabel();

  if (pdfjsLoadError) {
    status(
      tr('pdfjsFailed') + ' ' +
      (pdfjsLoadError.message || String(pdfjsLoadError)),
      0
    );
  }
})();
