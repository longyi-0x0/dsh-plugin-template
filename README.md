# dsh-plugin-template

DSH（DeepSeek Harness）插件的起点：宿主半区一条 HTTP 接口，浏览器半区一页设置，中英双语，外加三条 `node --test` 测试。纯 JS，无构建步骤。

用 GitHub 的 **Use this template** 起新仓库，按下面的改名清单换成自己的名字，再 `link:` 进 profile 就能跑。

## 目录

```
package.json          main 指 lib/index.js，exports['./client'] 指 lib/client.js，dsh 清单在这里
cordis.patch.yml      把插件挂进 DSH 配置树的一行
lib/index.js          宿主入口：inject ['webServer']，注册前缀路由
lib/client.js         浏览器入口：3 行信封 + 顶层 createClient(React)
lib/routes.js         /plugin-template/api 的前缀路由：回环 + 同源围栏、405/404、JSON 封套
lib/service.js        业务逻辑，换插件先改这里
locale/{zh,en}.json   插件页显示的名字与简介（只有 meta.title / meta.description）
icon.svg              插件图标
test/                 service / routes / client 三条测试
```

宿主半区与浏览器半区是分开加载的：`lib/index.js` 由 DSH 的 Loader 当普通 Node 插件跑；`lib/client.js` 由 `package.json` 的 `dsh.client` 声明变成浏览器 bundle，按需加载。

## 用模板起一个新插件

1. GitHub 上点 **Use this template → Create a new repository**。
2. 改这几处名字（其余可以后改）：

| 位置 | 改什么 |
| --- | --- |
| `package.json` → `name` | `dsh-plugin-template` → 你的包名，建议 `dsh-plugin-<名字>` |
| `cordis.patch.yml` → `name` | 必须与上面的包名**完全一致**，否则表现为“装上了但设置页不出现” |
| `lib/client.js` → `load({ id })` | 浏览器模块 id，用包名或自己的唯一串 |
| `lib/client.js` → `NS` | 字典命名空间，同时是 `ctx.locale.bind(NS)` 用的键 |
| `lib/routes.js` → `PREFIX` | 接口前缀，避免与别的插件撞 |
| `package.json` → `description` / `locale/*.json` | 插件页上的简介 |
| `icon.svg` | 自己的图标 |

3. 把示例业务换成真实业务：`lib/service.js` 写逻辑，`lib/routes.js` 加路由，`lib/client.js` 改界面。

## 安装

### 本地开发（改代码立即生效）

用桌面版自带的 CLI 把仓库 `link:` 进 profile（以 macOS、profile 名 `desktop` 为例）：

```bash
"/Applications/DeepSeek Harness.app/Contents/Resources/runtime/cli/bin/dsh" \
  plugin --profile desktop add "link:/path/to/your-plugin"
```

Windows：

```powershell
& "$env:LOCALAPPDATA\Programs\DeepSeek Harness\resources\runtime\cli\bin\dsh.cmd" `
  plugin --profile desktop add "link:C:\path\to\your-plugin"
```

装完重启 DSH，设置里会出现这一页。宿主半区改动通常由插件重载生效；`lib/client.js` 改动要重启应用（浏览器 bundle 在启动时装配）。

### 从 GitHub 安装

```bash
dsh plugin --profile desktop add "github:your-name/your-plugin"
```

`github:` 依赖在锁文件里钉住安装时的 commit，上游 push 之后本地不会自动跟着变。

### 手动接入 profile

profile 的 `package.json` 需要两样东西，缺一不可：

```json
{
  "dependencies": {
    "dsh-plugin-template": "link:/path/to/your-plugin"
  },
  "dsh": {
    "profile": {
      "bundles": ["dsh-plugin-template"]
    }
  }
}
```

`node_modules/<包名>` 要指向插件目录（`dsh plugin add` 会自己建；手改时用 junction / symlink）。

## 两半区各做什么

### 宿主半区（`lib/index.js`）

```js
export const name = 'dsh-plugin-template'
export const inject = ['webServer']

export function apply(ctx) {
  ctx.effect(() => registerRoutes(ctx, service), 'plugin-template: routes')
}
```

- `inject` 声明依赖的宿主服务；只写真正用到的。
- `ctx.effect(fn, label)` 接管注册与注销：fn 返回的注销函数在插件卸载时调用。
- 接口挂在宿主已有的 `webServer` 上，不自己开端口。
- 路由只接受本机回环 Host 的同源请求：DSH 的 Web 端口在 `127.0.0.1`，但浏览器里任何网页都能向它发请求，不加围栏等于把接口开放给所有页面。

### 浏览器半区（`lib/client.js`）

```js
window.__ModuleLoader__.load({
  id: 'dsh-plugin-template',
  factory: (require) => createClient(require('react')),
})

function createClient(React) {
  // …组件、样式、ctx.slots.register…
  return { inject: ['slots', 'locale'], apply(ctx) { /* … */ } }
}
```

信封只做三件事：模块 id、宿主注入的 `require`、把 React 交给模块体。模块体在顶层，不塞进 factory 闭包。

- `require('react')` 取宿主共享的 React；`react/jsx-runtime`、`@deepseek-ai/dsh-client-ui-slots` 等也在共享模块表里。表外的依赖要么内联，要么在 `dsh.client.external` 里声明并确认有提供方。
- 界面文案走 `ctx.locale.bind(NS)`，返回的 `t` 每次调用都按当前语言取词；字典用 `ctx.locale.register(NS, { zh, en })` 注册（同命名空间同一语言重复注册会抛错，所以注册放在 `ctx.effect` 里）。
- 样式只用 `--dsw-alias-*` 主题变量，不引 CSS 文件，跟随明暗主题。
- 插槽的 `id` 用自己的：复用内置项的 id 会顶掉内置那一项。

## 接口

宿主半区挂 `/plugin-template/api`：

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/greeting?name=` | 返回 `{ greeting, serverTime }`；`name` 留空按 `world` |
| POST | `/echo` | 收 JSON 对象，返回 `{ received, keys }`；非对象或空对象回 400 |

所有响应都是 JSON。非本机同源请求一律 403；未知路径 404；方法不对 405；未带 `status` 的错误按 500 返回。远程访问模式（Host 不是回环地址）下这些接口全部拒绝。

## 常用插槽

| 插槽 | 类型 | 用途 |
| --- | --- | --- |
| `settings.section` | list | 设置里的一页，本模板用的就是它 |
| `sidebar.footer.action` | list | 侧栏底部、设置按钮旁的按钮 |
| `plugins.tab` | list | 插件页「已安装」后面的标签页 |
| `plugins.detail.actions` / `.section` / `.badge` | list | 别的组合包详情页上的按钮 / 明细 / 徽标 |
| `conversation.composer` / `conversation.header` | single | 会话输入区与头部 |

完整清单（0.2.x 共 103 个插槽，带 props 与可复制的注册示例）装 `dsh-slot-explorer` 看。

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

- `bundle.patch`：一个路径或按顺序应用的路径列表。
- `client.inject`：用到的平台包，保证声明插槽的包先于本插件加载。用到别的插槽时把对应包加进来。
- `engines.dsh`（本模板未写）：声明兼容的宿主版本，例如 `"^0.2.1-rc.3"`。目标宿主明确时再加，写错范围会让安装被拦。

## 测试

```bash
node --test        # 或 npm test
npm run check      # 对四个 JS 文件做语法检查
```

覆盖：业务函数、路由的信任围栏与状态码、浏览器模块的装载与插槽登记。组件本身不渲染——渲染需要 DSH 的 React 与主题环境，属于运行期验证。

推上去后 `.github/workflows/test.yml` 会在 push 与 PR 上跑同一套测试。

## 长大后要构建

无构建的代价是浏览器半区只能是一个文件，不能用 JSX、CSS Modules、拆模块。界面变复杂时再切构建：

1. 源码搬到 `src/client/index.jsx`，写普通 ESM（`export const inject` / `export function apply`）；
2. 加一个 `scripts/build-client.mjs`，用 esbuild 打成 CJS，再套上 `__ModuleLoader__.load` 信封，产物仍写 `lib/client.js`；
3. `react`、`react/jsx-runtime` 等保持 external，只留模块表里的行。

参照 `dsh-workspace-sidebar` 的 `build/build.mjs`。DSH 只读 `lib/client.js`，加不加构建对宿主透明。

## 限制

- 浏览器半区单文件，不能相对 `require` 同级文件（模块系统只认已登记 factory 与异步 chunk）。
- 示例接口只演示读 / 写两种形状，没有存储；要持久化自己接 `~/.dsh` 下的文件或宿主存储服务。
- 插件页上的标题与简介来自 `locale/*.json` 的 `meta`；界面文案在 `lib/client.js` 的 `STRINGS` 里，两处分开维护。

## 许可

MIT，见 [LICENSE](LICENSE)。
