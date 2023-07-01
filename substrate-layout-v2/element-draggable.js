// TODO: build a custom element for a draggable element
// TODO: implement expandable section
// ⯆


const template = document.createElement('template');


template.innerHTML = `
    <style>
        .explorable-container {
            width: 100%;
            background-color: hsl(0 0% 97%);
            display: flex;
            align-items: center;
            flex-direction: column;
        }

        .explorable-inner {
            position: relative;
            inset-inline-start: 0px;
            inset-block-start: 0px;
            block-size: 200px;
            inline-size: 300px;
            background-color: white;
            display: grid;
            grid-template-columns: 20px 1fr 20px;
            border: solid 1px hsl(240 5.9% 90%);

            max-inline-size: 100%;
            --draggable-border: 1px solid hsl(240 5.9% 90%);
        }

        .explorable-container, .explorable-inner {
            border-radius: 3px;
        }

        .draggable {
            background-color: white;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            cursor: ew-resize;
            user-select: none;
        }

        .content {
            background-color: white;
            min-block-size: 20px;
            padding: 6px;
        }

        .controls {
            border-top-left-radius: 3px;
            border-right: var(--draggable-border);
            display: flex;
            align-items: flex-end;
        }

        .controls > button {
            border: none;
            background: transparent;
            width: 18px;
            cursor: pointer;
            margin: 0;
            padding: 0;
            height: 18px;
        }
    </style>

    <div class="explorable-container">
        <div class="explorable-inner">
            
            <div class="controls" style="border-top-left-radius: 3px; border-right: var(--draggable-border);">
                <button> ⯈ </button>
            </div>

            <div class="content">
                <slot> </slot>
            </div>

            <div class="draggable" style="border-top-right-radius: 3px; border-left: var(--draggable-border);">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-grip-vertical" viewBox="0 0 16 16" part="svg">
                    <path d="M7 2a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-3 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-3 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"></path>
                </svg>
            </div>
        </div>
    </div>
`;


class Draggable extends HTMLElement {

    constructor (el) {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.appendChild(template.content.cloneNode(true));
        this._model = {
            handlers: { }
        };
    }

    /*
    // invoked when one of the custom element's attributes is added, removed, or changed
    attributeChangedCallback (name, oldValue, newValue) {
        const hasValue = newValue !== null;
    }
    */


    // invoked each time the custom element is appended into a document-connected element
    connectedCallback () {
        
        const handleResizerDrag = function (event) {
            console.log('clicky :)')
            
            const preview = event.target.shadowRoot?.querySelector('.explorable-inner');
               
            // I don't know why, but closest() doesn't work in this custom element, so using querySelector instead
            //const resizer = event.target.shadowRoot.closest('.draggable');
            //const preview = event.target.shadowRoot.closest('.explorable-inner');

            if (!preview)
                return;

            const resizer = event.composedPath().find((p) => p.classList?.contains('draggable'))

            if (!resizer)
                return
            
            const parentHalfWidth = preview.parentNode.offsetWidth / 2;

            if (event.cancelable)
                event.preventDefault();

            document.documentElement.addEventListener('mousemove', dragMove);
            document.documentElement.addEventListener('touchmove', dragMove);
            document.documentElement.addEventListener('mouseup', dragStop);
            document.documentElement.addEventListener('touchend', dragStop);

            function dragMove (event) {
                const newX = event.changedTouches ? event.changedTouches[0].pageX : event.pageX;
                const width = (newX - parentHalfWidth) * 2;
                preview.style.width = `${width}px`;
            }

            function dragStop () {
                document.documentElement.removeEventListener('mousemove', dragMove);
                document.documentElement.removeEventListener('touchmove', dragMove);
                document.documentElement.removeEventListener('mouseup', dragStop);
                document.documentElement.removeEventListener('touchend', dragStop);
            }
        }

        this._model.handlers.resizerDrag = handleResizerDrag

        document.addEventListener('mousedown', this._model.handlers.resizerDrag);
        document.addEventListener('touchstart', this._model.handlers.resizerDrag, { passive: true });
    }


    // invoked each time the custom element is removed from a document-connected element
    disconnectedCallback () {
        document.removeEventListener('mousedown', this._model.handlers.resizerDrag);
        document.removeEventListener('touchstart', this._model.handlers.resizerDrag, { passive: true });
        this._model.handlers.resizerDrag = null
    }

    /*
    // provide the list of attribute names to listen for changes to
    static get observedAttributes () {
        return [ ];
    }
    */
}


window.customElements.define('ui-draggable', Draggable);
