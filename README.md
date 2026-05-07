# 通规简转繁 · 网页

本仓库通过 **GitHub Pages** 提供在线页面：在浏览器中将**简体中文**转为**大陆标准繁体（通用规范汉字表，OpenCC `s2tg`）**。转换由 [opencc-wasm](https://www.npmjs.com/package/opencc-wasm) 在**你的浏览器内**完成，页面托管在 GitHub 静态站点上，**不会把正文发到我们的服务器**（仅加载页面与词典等静态资源）。

词典与配置位于 `opencc/`（`s2tg.json` 与 `STG*.ocd2`）。词典来源与修订说明见上游 [opencc-tonggui](https://github.com/amorphobia/opencc-tonggui)。

## 许可

词典与 OpenCC 相关文件遵循上游仓库许可；网页代码以仓库内声明为准。
