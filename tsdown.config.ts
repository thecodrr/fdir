import { defineConfig } from 'tsdown/config'

export default defineConfig({
  entry: 'src/index.ts',
  format: ['cjs', 'esm'],
  target: 'node12',
  removeNodeProtocol: true,
  dts: true,
  exports: true,
  publint: true,
  fixedExtension: true
})