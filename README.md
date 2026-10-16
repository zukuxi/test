# X3 PDF → XTC / XTCH 原版逐页渲染测试版

这是一个独立的 GitHub Pages 静态网页项目，用于与现有的“长图按 792 像素切片”转换工具做 A/B 对比。不会修改你的原仓库。

## 主要区别

- 每个 PDF 原始页面单独渲染，使用 PDF.js `scale: 2.0`。
- 每一页按比例缩放并居中放入 528 × 792 白色画布。
- 不把一个长 PDF 页面切成多个 792 像素高的页面。
- 支持多选 PDF、选择整个文件夹、按 N 个 PDF 合并、章节标题连续合并。
- 支持 XTC（黑白）和 XTCH（4 灰阶）、Atkinson / Floyd–Steinberg / Stucki 抖动、亮度、对比度、阈值、抖动强度、前 5 页预览、中英文界面、ZIP 下载。
- 所有 PDF 在浏览器本地处理，不会上传。

## 部署

1. 解压 ZIP。
2. 在 GitHub 新建一个**独立**仓库，例如 `x3-pdf-xtc-original-style-test`。
3. 上传 `index.html`、`app.js`、`README.md`。
4. 仓库 Settings → Pages → Deploy from a branch → `main` / `root`。
5. 等待 GitHub Pages 发布后打开网址测试。

## 测试建议

使用同一份 PDF 分别在旧工具和本测试版转换，尽量选相同输出格式（建议先用 XTCH），对比：
- 每页黑度是否还会周期性变深 / 变浅；
- 文字和细线是否更清晰；
- 是否有页面被缩得过小（尤其是超长页面）；
- 文件能否在 X3 正常打开。

## 注意

本项目是实验对照版，不保证输出一定优于旧工具。它有意采用“PDF 原始页逐页缩放”的路径；若 PDF 每页本身是一张超长条漫图，整页缩进 528 × 792 会让内容变小，因此它与按长图切片的旧工具用途不同。当前版依赖 PDF.js、JSZip 的 CDN，需要联网加载依赖。

转换流程参考公开项目 [varo6/xtcjs](https://github.com/varo6/xtcjs) 的 PDF 页渲染方式。此项目为独立实现，不是官方 XTC.js。
