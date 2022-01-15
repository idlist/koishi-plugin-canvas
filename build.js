const esbuild = require('esbuild')

// Basically copied from here:
// https://github.com/koishijs/koishi/blob/master/build/compile.ts
esbuild.build({
  entryPoints: ['src/index.ts'],
  outdir: 'dist',
  bundle: true,
  platform: 'node',
  sourcemap: 'both',
  format: 'cjs',
  plugins: [
    {
      name: 'external library',
      setup(build) {
        build.onResolve({ filter: /^[@/\w-]+$/ }, () => ({ external: true }))
      },
    }
  ]
})