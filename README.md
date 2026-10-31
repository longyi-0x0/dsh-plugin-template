# dsh-plugin-template

DSH 插件骨架：TypeScript 宿主入口 + React TSX 空设置页 + 中英双语 + esbuild 构建 + vitest。**没有业务接口，也没有示例业务逻辑**——只保留一个可安装、可构建、可测试的最小插件。

## 目录

```
package.json               exports、dsh 清单、脚本与开发依赖
cordis.patch.yml           把插件挂进 DSH 配置树的一行
src/host/index.ts          宿主入口：name / inject / apply
src/host/context.ts        宿主侧最小结构化类型
src/client/index.tsx       React TSX：空设置页 + inject/apply
src/client/i18n.ts         从 locale JSON 导入的类型化字典
src/client/styles.ts       主题变量样式
src/client/context.ts      Slots / Locale / SlotProps 类型
scripts/build.mjs          esbuild：host → target/index.js，client → target/client.js
target/index.js            宿主产物（提交，不要手改）
target/client.js           浏览器产物（提交，不要手改）
locale/{zh,en}.json        meta（插件页标题/简介）+ ui（界面字典）
icon.svg                   插件图标
test/                      vitest：i18n + client 冒烟
tsconfig.base.json         公共 TypeScript 配置
tsconfig.host.json         宿主类型检查
tsconfig.client.json       TSX + DOM 类型检查
```

入口路径由 `package.json` 的 `exports['.']` / `exports['./client']` 决定；这里放在 `target/`，换成别的目录也可以。

## 开始

1. GitHub 上点 **Use this template** 建新仓库。
2. 改名字：

| 位置 | 改什么 |
| --- | --- |
| `package.json` → `name` | 你的包名，建议 `dsh-plugin-<名字>` |
| `cordis.patch.yml` → `name` | 必须与包名完全一致 |
| `src/client/i18n.ts` → `NS` | 字典命名空间 |
| `locale/*.json` → `meta` / `ui` | 插件页文案与界面文案 |
| `icon.svg` | 图标 |

3. 加业务：

- **宿主**：在 `src/host/index.ts` 的 `apply` 里注册服务、路由、工具或监听器；需要宿主服务时往 `inject` 加名字，并把 `src/host/context.ts` 补成你用到的结构。
- **浏览器**：在 `src/client/index.tsx` 里改成你的页面/组件，继续用 `ctx.slots` 和 `ctx.locale`；需要别的插槽时把对应平台包加进 `dsh.client.inject`。

4. 构建并提交：

```bash
npm install
npm run build
npm test
```

`target/index.js` / `target/client.js` 是产物，要提交；CI 用 `build:check` 防止过期。

## 安装

```bash
# macOS，profile 名 desktop
"/Applications/DeepSeek Harness.app/Contents/Resources/runtime/cli/bin/dsh" \
  plugin --profile desktop add "link:/path/to/your-plugin"

# 或从 GitHub 安装
dsh plugin --profile desktop add "github:your-name/your-plugin"
```

Windows：

```powershell
& "$env:LOCALAPPDATA\Programs\DeepSeek Harness\resources\runtime\cli\bin\dsh.cmd" `
  plugin --profile desktop add "link:C:\path\to\your-plugin"
```

产物已提交，所以 `link:` / GitHub 安装都不需要现场构建。装完重启 DSH；`target/client.js` 改动要重启应用（浏览器 bundle 在启动时装配）。

## 构建

```bash
npm install        # 只用于开发与 CI
npm run build      # 生成 target/index.js、target/client.js
npm run dev        # 监听 src/ 自动重建
npm run build:check# 校验提交的 target/ 与源码一致
npm run typecheck  # host + client 两套 tsc
npm run check      # build:check + typecheck + test
```

- 宿主：esbuild 打包 `src/host/index.ts` → `target/index.js`，ESM、Node 内置模块 external。
- 浏览器：esbuild 打包 `src/client/index.tsx` → CJS，`react` / `react/jsx-runtime` external，再套 `window.__ModuleLoader__.load({ id: <package name>, factory })`。

`target/client.js` 是生成文件，文件头有 “Generated … do not edit by hand”。

## 文案

`locale/{zh,en}.json` 是唯一文案来源：

- `meta.title` / `meta.description`：插件列表展示，宿主直接读；
- `ui`：界面字典，`src/client/i18n.ts` 通过 `import` 读取，esbuild 构建时内联进 `target/client.js`。

`en.ui` 的键自动成为 `MessageKey`，`zh.ui` 必须补齐同样的键，`t('key')` 在编译期检查。

## 测试

```bash
npm test           # vitest run
npm run check      # build:check + typecheck + test
```

覆盖：中英字典键一致性、浏览器 bundle 的模块 id / factory / 插槽注册。组件不渲染；需要渲染测试时加 jsdom + Testing Library。

CI 在 `.github/workflows/test.yml` 里跑 `npm ci` + `npm run check`。

## 清单字段

```json
"dsh": {
  "manifestVersion": 1,
  "bundle": { "patch": "./cordis.patch.yml" },
  "client": {
    "platform": "web",
    "inject": ["@deepseek-ai/dsh-client-locale", "@deepseek-ai/dsh-client-ui-settings"]
  }
}
```

`client.inject` 只控制平台包激活顺序，不是运行期 import。用到别的插槽时把对应平台包加进来；插槽清单可装 `dsh-slot-explorer` 查看。

## 限制

- 浏览器半区最终是一个 `target/client.js`；`locale/*.json` 的 `ui` 会被内联进去。
- 默认没有 CSS Modules；样式用主题变量和 React style 对象。
- 不 import 任何 DSH Client 运行期包；UI 结构、主题和可访问性按 DSH 规范自己实现。
- 组件渲染和安装后的最终外观仍需在运行中的 DSH 里验证。

## 许可

MIT，见 [LICENSE](LICENSE)。
