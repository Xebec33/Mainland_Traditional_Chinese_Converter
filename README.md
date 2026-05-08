# 大陆标准繁体在线转换器

面向研究人员和爱好者的静态网页转换器，支持把**简体中文**转换成**大陆标准繁体**（《通用规范汉字表》，以下简称《通规》）和**古籍规范字形**（《古籍印刷通用字规范字形表》，以下简称《古籍》）。

转换引擎基于 OpenCC，通过 WebAssembly 在本地浏览器中运行；托管于 GitHub Pages，只分发页面与词典等静态资源，正文内容不会上传到服务器。

《通规》的相关词典与说明可参考上游项目 [opencc-tonggui](https://github.com/amorphobia/opencc-tonggui)；《古籍》可参考 [GujiCC](https://github.com/forfudan/GujiCC)。古籍模式下可选用 [源古黑体](https://zhuanlan.zhihu.com/p/1897044158293717296) 以更接近规范字形显示（因版权问题，不便采用官方的 [方正古籍规范宋](https://www.foundertype.com/index.php/FontInfo/index/id/6659)）。

## 建站原因

站长发现，目前，大陆标准繁体的地位式微，大多数人都只知台标港标，而完全不知大陆也有官方的繁体标准，网上甚至缺少一个优秀的陆标繁体在线转换器。因此 Vibe Coding 了本站，希望让更多人了解规范的大陆繁体字。

## 相关链接

- 简体转大陆标准繁体的 OpenCC：[opencc-tonggui（GitHub）](https://github.com/amorphobia/opencc-tonggui)
- 简体转古籍规范字形的 OpenCC：[GujiCC（GitHub）](https://github.com/forfudan/GujiCC)
- 源古黑体背景介绍：[知乎专栏](https://zhuanlan.zhihu.com/p/1897044158293717296)
- 《通用规范汉字表》：[维基百科词条](https://zh.wikipedia.org/zh-cn/%E9%80%9A%E7%94%A8%E8%A7%84%E8%8C%83%E6%B1%89%E5%AD%97%E8%A1%A8)
- 《古籍印刷通用字规范字形表》：[维基百科词条](https://zh.wikipedia.org/wiki/%E5%8F%A4%E7%B1%8D%E5%8D%B0%E5%88%B7%E9%80%9A%E7%94%A8%E5%AD%97%E8%A7%84%E8%8C%83%E5%AD%97%E5%BD%A2%E8%A1%A8)

感谢以上开源项目与贡献者！

转换器在线使用：[大陆标准繁体在线转换器](https://xebec33.github.io/Mainland_Traditional_Chinese_Converter/)
