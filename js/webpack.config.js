
import path from 'path'
const __dirname = path.dirname(new URL(import.meta.url).pathname)

import url from 'url'
let module_resolve=async function(name){return url.fileURLToPath(await import.meta.resolve(name)) }

import webpack from "webpack"


let dd=new Date()
let da=new Date(dd.getFullYear(), 0, 0)
let db=new Date(dd.getFullYear()+1, 0, 0)
let dd_yy=(dd.getFullYear()-2000)
let dd_dd=Math.floor( 100000 * (dd-da) / (db-da) )
let dd_version=dd_yy+"."+( ("0000"+dd_dd).slice(-5) )

console.log("VERSION == "+dd_version)

let config={
  plugins: [
	new webpack.DefinePlugin({
		__VERSION__: JSON.stringify(dd_version)
	}),
    new webpack.ProvidePlugin({
      process: 'process/browser',
    }),
  ],
  entry: './seance.js',
  resolve: {
    fallback : {
      fs: false,
      "path": await module_resolve("path-browserify"),
//      buffer: await module_resolve('buffer'),
//      stream: await module_resolve("stream-browserify"),
    },
  },
  performance: {
    hints: false,
    maxEntrypointSize: 555555,
    maxAssetSize: 555555,
  },
  output: {
    path: path.resolve(__dirname, '../docs/js/'),
    filename: 'seance.js',
    globalObject: 'this',
    library: {
      name: 'seance',
      type: 'umd',
    },
  },
}
//console.log(config)

export default config;

