import * as esbuild from 'esbuild'
import {copyToAppPlugin, copyManifestPlugin, commonConfig} from "./build.helpers.mjs"
import parseArgs from "minimist"

const outDir = `dist/TestExtension`
const appDir = "C:\\Users\\FrankSchutte\\Mendix\\StudioProExtension"
const extensionApiVersion = "0.2.4-mendix.11.2.0"

const entryPoints = [
    {
        in: 'src/main/index.js',
        out: 'main'
    }   
]

entryPoints.push({
    in: 'src/ui/index.jsx',
    out: 'tab'
})

const args = parseArgs(process.argv.slice(2))
const buildContext = await esbuild.context({
  ...commonConfig,
  outdir: outDir,
  plugins: [copyManifestPlugin(outDir), copyToAppPlugin(appDir, outDir, extensionApiVersion)],
  entryPoints
})

if('watch' in args) {
    await buildContext.watch();
} 
else {
    await buildContext.rebuild();
    await buildContext.dispose();
}
