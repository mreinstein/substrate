import autoprefixer      from 'autoprefixer'
import buildModule       from './build-module.js'
import fs                from 'fs'
import postcss           from 'postcss'
import serve             from 'koa-static'
import Koa               from 'koa'
import { dirname }       from 'path'
import { fileURLToPath } from 'url'


const __dirname = dirname(fileURLToPath(import.meta.url))

const app = new Koa()
 

const cache = { } // key is url, value is content to serve
const mtime = { } // key is url, value is timestamp that the file was last changed


function cacheUpdate (url, t, content) {
    cache[url] = content
    mtime[url] = t
} 


async function processCss (url) {
    //const css = fs.createReadStream(__dirname + url)
    const css = fs.readFileSync(__dirname + url, 'utf8')
    const result = await postcss([ autoprefixer ]).process(css)
    result.warnings().forEach(warn => { console.warn(warn.toString()) })

    return `const css = \`${result.css}\`\nexport default css`
}


async function getCss (url) {
    const s = fs.statSync(__dirname + url)
    const t = s.mtimeMs

    // cache the css and only update when file modification time changes
    if (cache[url]) {
        if (t > mtime[url]) {
            // file has changed since it was cached
            const r = await processCss(url)
            cacheUpdate(url, t, r)
        }
    } else {
        const r = await processCss(url)
        cacheUpdate(url, t, r)
    }

    return cache[url]
}


app.use(async (ctx, next) => {
    if (ctx.url.endsWith('.css')) {
        ctx.response.type = 'text/javascript'
        // run the css through autoprefixer, and send the content as a module
        ctx.response.body = await getCss(ctx.url)
    } else if (ctx.url.endsWith('.explorable.md')) {
        // TODO: cache built module result like we do for css
        const s = fs.readFileSync(__dirname + ctx.url, 'utf8')

        ctx.response.type = 'text/javascript'
        // run the explorable through substrate, and send the content as a javascript module
        ctx.response.body = buildModule(s)

    } else {
        await next()
    }
   
})


app.use(serve('.'));
 
app.listen(5000);
 
console.log('listening on port 5000');
