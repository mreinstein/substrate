import { html } from '/deps.js'


export default function treeView (filenames) {
    // convert flat filenames into a tree structure
    const tree = { }

    for (const f of filenames) {
        let currentNode = tree
        const parts = f.split('/');
        for (const part of parts) {
            if (part.endsWith('.explorable.md')) {
                currentNode[part] = f
            } else {
                if (!currentNode[part])
                    currentNode[part] = { }
                currentNode = currentNode[part]
            }
        }
    }

    const renderNode = function (key, node) {
        const isLeaf = (typeof node === 'string')
        if (isLeaf) {
            const k = '/' + node.replace('.explorable.md', '')
            const isCurrentPage = window.location.pathname === k

            const label = key.replace('.explorable.md', '')
            const inner = isCurrentPage ? label : html`<a href="${k}">${label}</a>`

            return html`<li @class:current=${isCurrentPage}>${inner}</li>`
        }
        
        const results = [ ]
        for (const childName in node)
            results.push(renderNode(childName, node[childName]))

        return html`<li><span style="font-weight: bold; color: #333;">${key+'/'}</span><ul class="explorables" data-key=${key}>${results}</ul></li>`
    }

    const nodes = [ ]
    for (const key in tree)
        nodes.push(renderNode(key, tree[key]))

    return html`<ul class="explorables-outer">${nodes}</ul>`
}
