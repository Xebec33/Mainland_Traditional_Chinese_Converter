# 大陆标准繁体在线转换器

本仓库通过 **GitHub Pages** 提供在线页面：在浏览器中将**简体中文**转为**大陆标准繁体（通用规范汉字表，OpenCC `s2tg`）**。转换由 [opencc-wasm](https://www.npmjs.com/package/opencc-wasm) 在**你的浏览器内**完成，页面托管在 GitHub 静态站点上，**不会把正文发到我们的服务器**（仅加载页面与词典等静态资源）。

词典与配置位于 `opencc/`（通规：`s2tg.json` 与 `STG*.ocd2`；古籍：`s2g.json` 与 `SG*.ocd2`）。通规词典来源与修订说明见上游 [opencc-tonggui](https://github.com/amorphobia/opencc-tonggui)。

## 本地运行

1. 安装 [Node.js](https://nodejs.org/)（建议 LTS）。
2. 在终端进入本仓库的 `web` 目录，安装依赖并启动静态服务（会先执行 `sync-dicts` 把 `opencc/` 同步进 `opencc-wasm`）：

```bash
cd web
npm install
npm start
```

3. 浏览器打开终端里提示的地址（默认可访问 `http://localhost:5173`）。

## 许可

词典与 OpenCC 相关文件遵循上游仓库许可；网页代码以仓库内声明为准。
