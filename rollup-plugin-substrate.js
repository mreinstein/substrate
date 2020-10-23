import buildModule from './build-module.js'


export default function substrate () {
    return {
        name: 'substrate',

        transform (code, id) {
            if (!id.endsWith('.explorable.md'))
                return;

            return {
                code: buildModule(code),
                map: { mappings: '' }
            };
        }
    };
}
