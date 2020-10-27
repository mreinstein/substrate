
```javascript
function init (options) {
    return {
        elm: undefined,
        dragging: false,
        renderWidth: 400,
        id: Math.random()
    }
}
```


```javascript
function view (model, content, update) {

    const _mouseMove = throttle(function (ev) {
        const rect = model.elm.getBoundingClientRect()
        model.renderWidth = clamp(ev.clientX - rect.left - 20, 0, model.elm.clientWidth) //x position within the element.
        update()
    }, 1000 / 60)

    const _mouseUp = function () {
        model.dragging = undefined
        document.removeEventListener('mouseup', _mouseUp)
        document.removeEventListener('mousemove', _mouseMove)
        update()
    }

    const _mousedown = function (ev) {
        document.addEventListener('mousemove', _mouseMove, { passive: true })
        document.addEventListener('mouseup', _mouseUp)
    }

    const _insertHook = function (vnode) {
        model.elm = vnode.elm
    }

    const c = '#ddd'

    return html`<div @key=${model.id} @hook:insert=${_insertHook}
     @style:width=${model.renderWidth + 'px'}
     style="padding: 10px; border: 1px solid ${c}; position: relative;">
    ${content}
    <div @on:mousedown=${_mousedown}
         title="drag me"
         style="width: 10px; height: 10px; position: absolute; right: 0px; height: 100%; bottom: 0px; background-color: ${c}; opacity: 0.8; user-select: none; cursor: ew-resize;"></div>
</div>`
}
```


```javascript
export default { init, view }

import clamp    from 'https://cdn.jsdelivr.net/gh/mreinstein/math-gap/src/clamp.js'
import html     from 'https://cdn.skypack.dev/snabby'
import throttle from 'https://cdn.skypack.dev/lodash.throttle'
```
