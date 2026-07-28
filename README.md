# Settlement Excel Converter

一个纯浏览器运行的 Excel 转换工具，包含两个独立入口：

- `Moderator & QA` → 模板中的 `Monthly Details`
- `Management` → 模板中的 `Non-biliable Invoice`

源文件按字段名称匹配，因此列顺序可以变化。导出的工作簿保留模板列顺序、空白字段、公式和单元格格式。Management 数据会按模板规则汇总。

## 本地运行

```bash
pnpm install
pnpm dev
```

## 校验

```bash
pnpm exec tsc --noEmit -p tsconfig.check.json
pnpm build
```

所有 Excel 处理均在浏览器本地完成，上传文件不会发送到服务器。
