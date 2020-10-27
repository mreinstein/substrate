import espree from 'espree'


export default function translateNpm (source) {
    const npmUrl = 'https://cdn.skypack.dev/'
    const npmModuleRegx = RegExp('(^\/)|(^\.\/)|(^\..\/)|(^http)') /** find imports that do not begin with  "/", "./", or "../"   */

    const program = espree.parse(source, { ecmaVersion: 9, sourceType: 'module' })

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
