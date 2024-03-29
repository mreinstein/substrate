#!/usr/bin/env node

import autoprefixer         from 'autoprefixer'
import buildModule          from 'substrate-build'
import chalk                from 'chalk'
import chokidar             from 'chokidar'
import fs                   from 'fs'
import postcss              from 'postcss'
import serve                from 'koa-static'
import translateNpm         from './translate-npm-modules.js'
import Koa                  from 'koa'
import { PassThrough }      from 'stream'
import { fileURLToPath }    from 'url'
import { dirname, relative, resolve, sep } from 'path'


console.log('\n')

const __dirname = dirname(fileURLToPath(import.meta.url))
const DEFAULT_PORT = 5000
const args = process.argv.slice(2)

if (args.includes('--help') || args.includes('-h')) {
    printGeneralUsage()
    process.exit(0)
}


function printGeneralUsage () {
    console.log('Run a server that makes explorables viewable in a web browser.')
    console.log(`\n  ${chalk.whiteBright.bold('substrate')} ${chalk.dim('[options]')}\n`);
    console.log(chalk.dim('  Options:\n'))
    console.log(`    ${chalk.underline.bold.whiteBright('path')}              where to search for explorable files (default is current directory)`)
    console.log(`    --port ${chalk.underline.bold.whiteBright('length')}     port to run on (default is ${DEFAULT_PORT})`)
    console.log(' ')

    console.log(chalk.dim('\nExamples:\n'))

    console.log('– Host the current path\n')
    console.log(chalk.cyan('  $ substrate') + '\n')

    console.log('– Host a custom path\n')
    console.log(chalk.cyan('  $ substrate ~/projects/explorables') + '\n')

    console.log('– Specify the port\n')
    console.log(chalk.cyan('  $ substrate --port 5001') + '\n')
}


function readConfigFromCommandLineArgs () {
    let initialPath = '', port = DEFAULT_PORT

    let inPort = false
    for (const a of args) {
        if (inPort) {
            port = parseInt(a, 10)
            inPort = false
        } else {
            if (a === '--port' || a === '-p')
                inPort = true
            else
                initialPath = a
        }
    }

    return { servePath: resolve(initialPath), port }
}


const { servePath, port } = readConfigFromCommandLineArgs()

if (Number.isNaN(port)) {
    console.error(`${chalk.red('Error!')} Invalid port specified.  Run ${chalk.whiteBright('substrate --help')} for usage instructions.\n`)
    process.exit(1)
}

if (!fs.existsSync(servePath)) {
    console.error(`${chalk.red('Error!')} The input path ${chalk.redBright(servePath)} does not exist.  Run ${chalk.whiteBright('substrate --help')} for usage instructions.`)
    process.exit(1)
}

console.log(chalk.gray(`Searching ${servePath} for .explorable.md modules:\n`))

const cache  = { } // key is url, value is content to serve
const mtime  = { } // key is url, value is timestamp that the file was last changed
const assets = { } // key is path to explorable file, value is last modified time


const watcher = chokidar.watch(`${servePath}/**/*.explorable.md`, { ignored: '**/node_modules/**' }).on('all', (event, path) => {
     // translate windows path for url
    const relativePath = relative(servePath, path).replace(/\\/g,'/')

    if (!path.endsWith('.explorable.md'))
        return

    if (event === 'add') {
        console.log(`${chalk.green('      [found]')} ${chalk.whiteBright(relativePath)}`)
        const s = fs.statSync(path)
        assets[relativePath] = s.mtimeMs

    } else if (event === 'unlink') {
        console.log(chalk.red('    [removed]'), chalk.whiteBright(relativePath))
        delete assets[relativePath]

    } else if (event === 'change') { 
        console.log(chalk.yellowBright('    [changed]'), chalk.whiteBright(relativePath))
        const s = fs.statSync(path)
        assets[relativePath] = s.mtimeMs

    } else {
        console.log(chalk.yellowBright('event:'), event, ' path:', relativePath)
    }
})


const app = new Koa()


function cacheUpdate (url, t, content) {
    cache[url] = content
    mtime[url] = t
} 


async function processCss (url) {
    //const css = fs.createReadStream(servePath + url)
    const css = fs.readFileSync(servePath + url, 'utf8')
    const result = await postcss([ autoprefixer ]).process(css, { from: undefined })
    result.warnings().forEach(warn => { console.warn(warn.toString()) })

    return `const css = \`${result.css}\`\nexport default css`
}


async function getCss (url) {
    const s = fs.statSync(servePath + url)
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


// adapted from https://medium.com/trabe/server-sent-events-sse-streams-with-node-and-koa-d9330677f0bf
app.use(async (ctx, next) => {
    if (ctx.path !== '/sse')
      return await next()

    ctx.request.socket.setTimeout(0)
    ctx.req.socket.setNoDelay(true)
    ctx.req.socket.setKeepAlive(true)

    ctx.set({
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      'X-Accel-Buffering': 'no'
    });

    const stream = new PassThrough()

    ctx.status = 200
    ctx.body = stream

    // send the initial state immediately
    stream.write(`data: ${JSON.stringify(assets)}\n\n`)

    // TODO: rather than poll, only send data when the watched files actually change
    setInterval(() => {
        stream.write(`data: ${JSON.stringify(assets)}\n\n`)
    }, 1000)
})

app.use(async (ctx, next) => {
    if (ctx.url === '/') { 
        ctx.response.type = 'text/html'
        ctx.response.body = fs.readFileSync(__dirname + sep + 'list.html', 'utf8')

    } else if (ctx.url === '/substrate-draggable.js') {
        ctx.response.type = 'text/javascript'
        ctx.response.body = fs.readFileSync(__dirname + sep + 'substrate-draggable.js', 'utf8')

    }
    else if (ctx.url === '/build-html.js') {
        ctx.response.type = 'text/javascript'
        ctx.response.body = fs.readFileSync(__dirname + sep + 'build-html.js', 'utf8')

    } else if (ctx.url === '/constants.js') {
        ctx.response.type = 'text/javascript'
        ctx.response.body = fs.readFileSync(__dirname + sep + 'constants.js', 'utf8')

    } else if (ctx.url === '/deps.js') {
        ctx.response.type = 'text/javascript'
        ctx.response.body = fs.readFileSync(__dirname + sep + 'deps.js', 'utf8')

    } else if (ctx.url === '/highlightjs-11.5.1/default.min.css') {
        ctx.response.type = 'text/css'
        ctx.response.body = fs.readFileSync(__dirname + sep + 'highlightjs-11.5.1/default.min.css', 'utf8')

    } else if (ctx.url === '/highlightjs-11.5.1/custom.min.css') {
        ctx.response.type = 'text/css'
        ctx.response.body = fs.readFileSync(__dirname + sep + 'highlightjs-11.5.1/custom.min.css', 'utf8')

    } else if (ctx.url === '/highlightjs-11.5.1/highlight.min.js') {
        ctx.response.type = 'text/javascript'
        ctx.response.body = fs.readFileSync(__dirname + sep + 'highlightjs-11.5.1/highlight.min.js', 'utf8')

    } else if (ctx.url === '/highlightjs-11.5.1/javascript.min.js') {
        ctx.response.type = 'text/javascript'
        ctx.response.body = fs.readFileSync(__dirname + sep + 'highlightjs-11.5.1/javascript.min.js', 'utf8')

    } else if (ctx.url === '/highlightjs-11.5.1/json.min.js') {
        ctx.response.type = 'text/javascript'
        ctx.response.body = fs.readFileSync(__dirname + sep + 'highlightjs-11.5.1/json.min.js', 'utf8')

    } else if (ctx.url === '/tree-view.js') {
        ctx.response.type = 'text/javascript'
        ctx.response.body = fs.readFileSync(__dirname + sep + 'tree-view.js', 'utf8')

    } else if (ctx.url === '/substrate.svg') {
        ctx.response.type = 'image/svg+xml'
        ctx.response.body = fs.readFileSync(__dirname + sep + 'substrate.svg', 'utf8')

    } else if (ctx.url === '/favicon-32x32.png') {
        ctx.response.type = 'image/png'
        ctx.response.body = fs.readFileSync(__dirname + sep + 'favicon-32x32.png')

    } else if (ctx.url === '/favicon-16x16.png') {
        ctx.response.type = 'image/png'
        ctx.response.body = fs.readFileSync(__dirname + sep + 'favicon-16x16.png')

    } else if (ctx.url.endsWith('.css')) {
        ctx.response.type = 'text/javascript'
        // run the css through autoprefixer, and send the content as a module
        ctx.response.body = await getCss(ctx.url)

    } else if (ctx.url.endsWith('.js')) {
        const targetPath = servePath + ctx.url
        const source = fs.readFileSync(targetPath, 'utf8')

        ctx.response.type = 'text/javascript'
        ctx.response.body = translateNpm(source)


    } else if (ctx.url.endsWith('.explorable.md')) {
        const targetPath = servePath + ctx.url

        if (!fs.existsSync(targetPath)) {
            console.error(chalk.red('        [404]'), chalk.redBright(targetPath), 'does not exist.')
            return
        }

        // TODO: it seems sec-fetch-dest header isn't set when requesting over non-localhost address.non-localhost
        //       is there some other http header we can check? or maybe we can set a header in the frontend?
        //       perhaps the accept header is what we want.
        // 
        // https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#Supplying_request_options

        if (ctx.request.header['sec-fetch-dest'] === 'script') {
            // the requester wants javascript  (imported as module)
            const source = fs.readFileSync(targetPath, 'utf8')
            ctx.response.type = 'text/javascript'
            ctx.response.body = buildModule({ source, translateNpmToUrl: true })

        } else {
            // the requeser wants the raw explorable
            const s = fs.readFileSync(targetPath, 'utf8')
            ctx.response.type = 'text/plain'
            ctx.response.body = s
        }

        // TODO: cache built module result like we do for css

    } else {
        // translate to windows path
        ctx.url.replace(/\/g,'\\'/);
        const targetPath = servePath + ctx.url + '.explorable.md'
        if (fs.existsSync(targetPath)) {
            const derp = ctx.url + '.explorable.md'
            const pageHtml = fs.readFileSync(__dirname + sep + 'viewer.html', 'utf8').replace('__SOURCE__', derp)
            ctx.response.type = 'text/html'
            ctx.response.body = pageHtml
            return
        }
        await next()

    }
   
})


app.use(serve(servePath))
 
app.listen(port)
 
console.log(`Substrate server listening on port ${port}`)
