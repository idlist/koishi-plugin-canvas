import { Context, Service, Logger, Schema as S } from 'koishi'
import skiaCanvas from 'skia-canvas'

declare module 'koishi' {
  interface Context {
    canvas: Canvas
  }
}

interface FontOptions {
  /**
   * 字体注册成的名字。
   */
  family: string
  /**
   * 字体注册成的字重，如 `700` 者 `bold`。
   */
  weight?: string
  /**
   * 字体注册成的样式，如斜体、花体等。
   */
  style?: string
}

interface FontOptionsConfig extends FontOptions {
  /**
   * 字体对于工作路径的相对路径。
   */
  path: string
}

Context.service('canvas')
const log = new Logger('canvas')

// Extend default behavior Canvas.
class CanvasInstance extends skiaCanvas.Canvas {
  async renderResize(factor: number) {
    const outputCanvas = new CanvasInstance()
    const outputCtx = outputCanvas.getContext('2d')

    outputCanvas.width = this.width * factor
    outputCanvas.height = this.height * factor

    const rendered = this.toBufferSync('png')
    outputCtx.drawImage(await skiaCanvas.loadImage(rendered), 0, 0, outputCanvas.width, outputCanvas.height)

    return outputCanvas
  }

  toBase64() {
    return this.toBufferSync('png').toString('base64')
  }
}

// Wrap skia-canvas inside the service.
// Using node-canvas style, although I don't know why either.
class Canvas extends Service {
  constructor(ctx: Context, config: Canvas.Config) {
    super(ctx, 'canvas', true)

    if (config.fonts && Array.isArray(config.fonts)) {
      config.fonts.forEach(font => this.registerFont(font.path, { family: font.family }))
    }
  }

  createCanvas(width?: number, height?: number) {
    return new CanvasInstance(width, height)
  }

  registerFont(path: string, options: FontOptions) {
    const result = skiaCanvas.FontLibrary.use(options.family, [path])[0]
    log.info(
      `Font registered: ${result.family} (${result.file}) / ` +
      `weight: ${result.weight}, style: ${result.style}, width: ${result.width}.`,
    )
  }

  loadImage = skiaCanvas.loadImage
}

namespace Canvas {
  export interface Config {
    /**
     * 字体列表。
     *
     * @default []
     */
    fonts?: FontOptionsConfig[]
  }

  export const Config = S.object({
    fonts: S.array(
      S.object({
        path: S.string().required()
          .description('字体对于工作路径的相对路径。'),
        family: S.string().required()
          .description('字体注册成的名字。'),
        weight: S.string()
          .description('（可选）字体注册成的字重，如 `700` 或 `bold`。'),
        style: S.string()
          .description('（可选）字体注册成的样式，如斜体、花体等。'),
      }),
    ).default([])
      .description('字体列表。格式参照 [README](https://github.com/idlist/koishi-plugin-canvas#%E6%8F%92%E4%BB%B6%E9%85%8D%E7%BD%AE%E9%A1%B9)。'),
  })
}

// Export modified koishi services.
export { CanvasInstance as Canvas }
export default Canvas

// Re-export skia-canvas itself for fail-safe.
export * from 'skia-canvas'
