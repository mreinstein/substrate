import { escape, escodegen, acorn, marked } from '/deps.js'


function translateNpmImportsToUrls (source) {
    const npmUrl = 'https://cdn.skypack.dev/'
    const npmModuleRegx = RegExp('(^\/)|(^\.\/)|(^\..\/)|(^http)') /** find imports that do not begin with  "/", "./", or "../"   */

    const program = acorn.parse(source, { ecmaVersion: 9, sourceType: 'module' })

    // find node imports and replace with url for cdn
    // work from the bottom up to avoid positional index math due to changing the length of the string
    Object.keys(program.body).reverse().forEach((idx) => {
        const elem = program.body[idx]
        
        if (elem.type === 'ImportDeclaration' && !npmModuleRegx.test(elem.source.value)) {
            const val = `${npmUrl}${elem.source.value}`;
            elem.source.value = val
            elem.source.raw = "\'" + val +"\'"
            source = source.slice(0,elem.source.start) + `'${val}'` + source.slice(elem.source.end, source.length)
        }
    });

    return source
}


// @param Object program  representation of a javascript program produced from acorn
function endsWithSnabbyBlock (program) {
    const lastEntry = program.body[program.body.length-1]
    return (lastEntry?.type === 'ExpressionStatement' &&
        lastEntry.expression.type === 'TaggedTemplateExpression' &&
        (lastEntry.expression.tag.name === 'html' || lastEntry.expression.tag.name === 'md'))
}


// build a runnable html page from literate markdown. 
export default function build ({ source, translateNpmToUrl }) {
    let explorableViewCount = 0
    let explorableViewIdx = 0
    
    let scriptContent = `
        import { html as __html, marked as __marked } from '/deps.js'
       

        const __vnodes = [ ]
        const __viewFns = [ ]

        function md(...args) {
            const s = args.shift()
            let result = ''

            for (let i=0; i < s.length; i++) {
                result += s[i]
                result += (args[i] || '')
            }

            const h = __marked(result)
            return __html\`<div @props:innerHTML=\${h}></div>\`
        }


        function __createExplorableView (explorableViewId) {
            const e = document.querySelector('#explorable-view-' + explorableViewId)
            e.attachShadow({ mode: 'open' })
            const d = document.createElement('div')
            e.shadowRoot.appendChild(d)
            __vnodes.push(d)
        }


        // re-draw all explorable views
        function update () {
            __vnodes.forEach((oldVnode, idx) => {
                const newVnode = __viewFns[idx]()
                __vnodes[idx] = __html.update(oldVnode, newVnode)
            })
        }
    `

    const npmUrl = 'https://cdn.skypack.dev/'
    const npmModuleRegx = RegExp('(^\/)|(^\.\/)|(^\..\/)|(^http)') /** find imports that do not begin with  "/", "./", or "../"   */


    const walkTokens = (token) => {
        if (token.type === 'code') {
            const langParts = token.lang.split(' ')
            const isJavascript = [ 'js', 'javascript' ].indexOf(langParts[0].trim().toLowerCase()) >= 0

            if (!isJavascript)
                return
            
            try {
                const program = acorn.parse(token.text, { ecmaVersion: 9, sourceType: 'module' })

                if (translateNpmToUrl)
                    token.text = translateNpmImportsToUrls(token.text)

                const isExplorable = (langParts[1] === 'explorable')

                if (isExplorable && endsWithSnabbyBlock(program)) {

                    const snabbyExpression = program.body[program.body.length-1]

                    // remove the snabby expression from the end of the program since we're re-writing that line
                    program.body.pop() 

                    explorableViewCount++
                    scriptContent += `
                        __createExplorableView(${explorableViewCount});
                        __viewFns.push(() => {
                            ${escodegen.generate(program)}

                            return ${escodegen.generate(snabbyExpression)}
                        });\n\n`

                } else {
                    // does not contain a snabby view so just append it as noraml script
                    scriptContent += `${token.text}\n\n`
                }

            } catch (er) {
                // omit invalid javascript programs from the actual output
                console.error('error:', er)
            }

        }
    }


    const renderer = {
        code (code, infostring, escaped) {
            const [ lang, explorable ] = infostring.split(' ')
            const isJavascript = [ 'js', 'javascript' ].indexOf(lang.trim().toLowerCase()) >= 0

            if (!isJavascript)
                return `<pre><code class="language-${lang}">${escape(code)}</code></pre>`
     
            try {
                const program = acorn.parse(code, { ecmaVersion: 9, sourceType: 'module' })

                const isExplorable = (explorable === 'explorable')
                let result = ''

                // if the code ends with a snabby html element, prepend the div where that view will render
                if (isExplorable && endsWithSnabbyBlock(program)) {
                    explorableViewIdx++
                    result = `<div id="explorable-view-${explorableViewIdx}"></div>` 
                }

                if (isExplorable)
                    return result + `<details> <summary style="color: #888">Explorable Source</summary> <pre><code class="language-javascript">${escape(code)}</code></pre> </details>`

                return result + `<pre><code class="language-javascript">${escape(code)}</code></pre>`

            } catch (er) {
                return `<div class="javascript-formatted">
                    <pre><code class="language-javascript">${escape(code)}</code></pre>
                    <div class="javascript-error">${er}</div>
                </div>`
            }
            
        }
    }

    marked.use({ walkTokens, renderer })

    const html = marked(source)

    scriptContent += `\nupdate()\n`

    const errorColor = '#f31b64'
    const bgColor = 'whitesmoke'

    return `<!DOCTYPE html>
        <html>
        <head>
            <style>
                html {
                    scroll-behavior: smooth;
                }
                
                body {
                    font-family: "HelveticaNeue-Light", "Helvetica Neue Light", "Helvetica Neue", Helvetica, Arial, "Lucida Grande", sans-serif;
                }

                .javascript-formatted {
                    border: 1px solid ${errorColor};
                    background-color: ${bgColor};
                    margin-bottom: 10px;
                    padding: 8px;
                }

                .javascript-error {
                    color: ${errorColor};
                }

                code, code * {
                    font-family: Consolas, Monaco, monospace;
                }

                pre code {
                    font-size: 10pt;
                }

            </style>
            
            <link rel="stylesheet" href="/highlightjs-10.7.2/arduino-light.min.css">
            <script src="/highlightjs-10.7.2/highlight.min.js"></script>
            <script charset="UTF-8" src="/highlightjs-10.7.2/javascript.min.js"></script>

        </head>
        <body>
        ${html}
        <script type="module">
            hljs.highlightAll()
            ${scriptContent}
        </script>
        </body>
        </html>`
}
