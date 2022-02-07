# koishi-plugin-canvas

使用 [skia-canvas](https://github.com/samizdatco/skia-canvas) 提供的简陋的 `ctx.canvas` 接口，主要是我自己用着方便（虽然其实并没有多方便）。

## 为什么？

这个服务主要是为了解决 **字体注册** 的问题。为了使用本地字体，需要使用 `registerFont` (`node-canvas`) 或者 `Fontlibrary.use` (`skia-canvas`) 注册字体，但是这么做有个问题：同一个字体在不同的插件中会需要以不同的名字重复注册，因为不知道其他插件是否注册过这个字体。同名重复注册会导致报错，而且就算 `try catch` 了报错，也不知道其他插件用这个名字注册的字体是不是就是想用的字体。

将 `canvas` 独立成服务能一定程度上解决这个问题，因为可以在 `canvas` 服务的配置项中统一注册字体，然后在其他需要用到字体的插件中将字体暴露为配置项，进行统一配置。

## 安装方法

```shell
npm i koishi-plugin-canvas
```

然后在配置文件或入口文件中将插件添加至你的机器人中。

## 插件配置项

这个插件提供了以下配置项：

| 配置项 | 默认值 | 说明 |
| - | - | - |
| `fonts` | `[]` **\*1**  | 注册字体 |

**\*1** 这个列表的每个元素的类型为

```ts
interface {
  path: string
  family: string
  weight?: string | number
  style?: string
}
```

- `path`: 字体对于工作路径的相对路径

- `family`: 字体注册成的名字

- `weight`（可选）: 字体注册成的字重，如 700 或者 bold

- `style`（可选）：字体注册成的样式，如斜体、花体等

而且实际上，`skia-canvas` 注册字体的时候是 **无法提供** `weight` 和 `style` 的，所以不填也没关系。我也不知道为什么要留这两个选项在这里。

成功注册字体时，控制台会提示字体注册成功，以及字体的名字、字重和样式。

## 服务拓展方法

以下方法通过 `ctx.canvas` 暴露给插件：

#### `canvas.createCanvas(width?: number, height?: number)`

- `width`（可选）: 画布的宽度

- `height`（可选）: 画布的高度

- 返回值: `Canvas`

新建一个 `Canvas` 对象并返回它。下面是一个一般的新建样例，因为 `canvas` 的 `ctx` 和 `koishi` 的 `ctx` 重名，你需要在代码中给其中一个赋予不同的名字。

```js
const canvas = ctx.canvas.createCanvas // 这里的 ctx 是 koishi 的 ctx
const canvasCtx = canvas.getContext('2d')
```

`Canvas` 的用法请参照 MDN。

#### `canvas.registerFont(path: string, options: FontOptions)`

- `path`: 字体对于工作路径的相对路径

- `options`: 字体详情，各属性的意义和 **插件配置项** 中的意义一致。

```ts
interface FontOptions {
  family: string
  weight?: string
  style?: string
}
```

注册本地字体。配置项中的 `fonts` 也是通过这个方法进行注册。

#### `loadImage(url: string)`

加载图片，详情见 [这里](https://github.com/samizdatco/skia-canvas#loadimage) 。简单地说，可以快速加载网络图片或者本地图片为 `canvas` 可用的对象。

## `Canvas` 拓展方法

以下方法扩展由 `ctx.createCanvas` 所创建的 `Canvas` 对象，并非标准方法，基本是我自己用起来方便所以整出来的。

#### `Canvas.renderResize(factor: number)`

- `factor`: 倍率

- 返回值：`Canvas`

将当前 `Canvas` 按一定倍率（`factor`）缩放渲染，然后返回选然后的新的 `Canvas`。这个方法的意义在于通过在创建的时候按 N 倍于设计大小作图，然后输出时缩放回设计大小，达成不同平台之间渲染结果在一定程度上的一致。

#### `Canvas.toBase64()`

- 返回值：`string` 被 Base64 编码的图片

将图片转化为 Base64 编码以供发送。

## 最终手段

这个插件也重新导出了 `skia-canvas` 本身。在有需要的情况下，可以直接从插件中获取原始方法。反正一时半会这玩意成不了规范，先随便写了。

```js
const { FontLibrary } = require('koishi-plugin-canvas')
```

## Q&A

- 这玩意怎么实现得这么粗糙？

因为就是这么粗糙。