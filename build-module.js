import espree from 'espree'
import marked from 'marked'


// Build a pure es module from literate markdown.

export default function buildModule (src) {
    let scriptContent = ''

    const walkTokens = (token) => {
        if (token.type === 'code') {
            const langParts = token.lang.split(' ')
            const isJavascript = [ 'js', 'javascript' ].indexOf(langParts[0].trim().toLowerCase()) >= 0

            if (!isJavascript)
                return

            try {
                const program = espree.parse(token.text, { ecmaVersion: 6, sourceType: 'module' })

                const isExplorable =(langParts[1] === 'explorable')

                if (!isExplorable)
                    scriptContent += `${token.text}\n\n`

            } catch (er) {
                // omit invalid javascript programs from the actual output
            }

        }
    }

    marked.use({ walkTokens })

    const html = marked(src)

    return scriptContent
}
