# Test page 1

```javascript
function bannerView () {
    return html`<div> Here is my banner ${model.counter}</div>`
}
```

Standard markup text **here!**


This part demonstrates an explorable code block that has general purpose stuff in it (doesn't return a view):

```javascript explorable
const model = {
    counter: 0,
    derps: [ ],
    b: Math.random()
}

function randomInt (max) {
    return Math.round(Math.random() * max)
}
```


When an explorable ends with an `html` call, we give this explorable a view in the page:

```javascript explorable
function clicky () {
    model.counter++
    model.derps.push(randomInt(99))
    update()
}

html`
<div>
    <style>
        button {
            padding: 10px;
            border-radius: 4px;
            cursor: pointer;
        }
    </style>
    <h3>Counter</h3>
    ${bannerView()}
    <button @on:click=${clicky}>count: ${model.counter}</button>
    ${model.derps.map((d) => html`<p>${d}</p>`)}
</div>`
```


### Dependencies

Javascript will hoist import statements, so they actually don't need to be at the top of the document.
We can put imports at the end if we like, much like references in a more traditional document.

We can also import stuff directly from npm without needing to `npm install`! skypack is amazing!

```javascript
import constraintSolver from 'https://cdn.skypack.dev/constraint-solver@^3.0.1'
```

You can import other explorables too
```javascript
import randomInt from './test2.explorable.md'
```


And then of course since this is a module, we should probably export something:

```javascript
export default bannerView
```
