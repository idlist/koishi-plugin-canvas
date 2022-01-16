import { Context, Service, Logger, Schema } from 'koishi'
import skiaCanvas from 'skia-canvas'

declare module 'koishi' {
  namespace Context {
    interface Services {
      canvas: ServiceCanvas
    }
  }
}

interface FontOptions {
  family: string
  weight?: string
  style?: string
}

interface FontOptionsConfig extends FontOptions {
  path: string
}

Context.service('canvas')
const logger = new Logger('canvas')

// Extend default behavior Canvas.
class Canvas extends skiaCanvas.Canvas {
  async renderResize(factor :number) {
    const outputCanvas = new Canvas()
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

// Re-package skia-canvas.
// Using node-canvas style, although I don't know why I'm doing this.
class ServiceCanvas extends Service {
  constructor(ctx: Context, config: ServiceCanvas.Config) {
    super(ctx, 'canvas', true)

    if (config.fonts && Array.isArray(config.fonts)) {
      config.fonts.forEach(font => this.registerFont(font.path, { family: font.family }))
    }
  }

  createCanvas(width?: number, height?: number) {
    return new Canvas(width, height)
  }

  registerFont(path: string, options: FontOptions) {
    const result = skiaCanvas.FontLibrary.use(options.family, [path])[0]
    logger.info(
      `font registered: ${result.family} (${result.file}) / ` +
      `weight: ${result.weight}, style: ${result.style}, width: ${result.width}`
    )
  }

  loadImage = skiaCanvas.loadImage
}

namespace ServiceCanvas {
  export interface Config {
    fonts?: FontOptionsConfig[]
  }

  export const Config = Schema.object({
    fonts: Schema.array(Schema.object({
      path: Schema.string().required(),
      family: Schema.string().required(),
      weight: Schema.union([Schema.string(), Schema.number()]),
      style: Schema.string()
    })).default([])
  })
}

// Export modified koishi services.
export { Canvas }
export default ServiceCanvas

// Re-export skia-canvas itself.
export * from 'skia-canvas'
