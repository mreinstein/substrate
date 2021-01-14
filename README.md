# <img alt="Substrate" src="substrate.svg" width="24px"> substrate

literate programming with javascript, markdown, and explorables


## Why another literate programming paradigm?

The internet is jam-packed with various attempts at implementing Donald Knuth's vision of literate programming.

**While there are many interesting projects, they tend to be hard to use in real, production, non-toy code.**

I think the reason for this is they are independent systems. When you create literate programming in those systems,
they don't interoperate with the gigantic universe of pre-existing code running out in the wild.


Substrate makes some practical tradeoffs to make it usable today, in production code, without much pain:
* only works with javascript currently (no multi language support)
* there is a 1:1 mapping between a substrate document and a produced javascript file
* there is no runtime environment; a substrate document is a pretty simple transformation into a javascript file


A substrate document is a markdown file. The files are named like `somedoc.explorable.md`.

Like many literate programming tools, it is possible to put code into fenced blocks, like this:

```
\`\`\`javascript
// some javascript code declared here
\`\`\`
```

These blocks get included as part of the weaved output.

Substrate adds another block type henceforth referred to as an `explorable`. A an explorable is also a javascript code block,
but it is excluded from the weaved output. An explorable block is useful in providing working, interactive examples of the code 
in the document when viewing the rich view.

```
\`\`\`javascript explorable
// code you want to run when viewing the human readable file (excluded from output)
\`\`\`
```

When an explorable file is weaved into runnable code, it produces a javascript file.

**Because an explorable file has a 1:1 mapping with an output javascript file, it means you can incrementally add literate programming to your production code!**

explorable documents can:
* import modern es modules. e.g., `import clamp from https://cdn.skypack.dev/clamp`
* import other explorable files. e.g., `import something from './my-explorable.md'`


## Integrating substrate into you current build process

I've written a rollup plugin that is able to import `explorable.md` files and weave them into usable javascript modules.

here's how you might include substrate support in rollup.config.js:
```javascript
import commonjs  from '@rollup/plugin-commonjs'
import resolve   from '@rollup/plugin-node-resolve'
import substrate from 'rollup-plugin-substrate'


export default {
	input: 'app.js',
    output: {
        file: 'app-bundle.js'
    },
	plugins: [
		resolve(),
	    commonjs(),
	    substrate()
	]
}
```

and then your app's entry point `app.js`:

```javascript
import foo from './foo.explorable.md'  // a substrate explorable which outputs an es module
import bar from './bar.js'             // a typical javascript module

// can use foo and bar like regular modules here
```

Other build systems (webpack, etc.) shouldn't be hard to add, but I just haven't gotten to that yet.

TODO: explain how `javascript explorable` blocks work in more detail.
