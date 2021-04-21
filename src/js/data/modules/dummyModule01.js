const moduleData = {
    id: 'dummyModule01',
    name: 'Dummy module 01',
    turn: 0,
    boundingDims: [1, 6, 6],
    tiles: [
        [
            [{t:1},{t:1},{t:1},{t:1},{t:1},{t:1},],
            [{t:1},{t:2},{t:2},{t:2},{t:2},{t:1},],
            [{t:1},{t:2},{t:2},{t:1},{t:2},{t:1},],
            [{t:1},{t:2},{t:1},{t:1},{t:2},{t:1},],
            [{t:1},{t:2},{t:2},{t:2},{t:2},{t:1},],
            [{t:1},{t:1},{t:1},{t:3},{t:1},{t:1},],
        ],
    ],
    path: '/models/dlo02/',
    models: [
        {
            exterior: 'ext-dlo02.glb',
            interior: 'int-dlo02.glb',
            roof: 'roof-dlo02.glb',
            bottom: 'bottom-dlo02.glb',
            details: null, // maybe..
        },
    ],
    textures: [
        {
            exterior: 'dlo02-ext-diff.png',
            interior: 'dlo02-int-diff.png',
            roof: 'dlo02-roof-diff.png',
            bottom: 'dlo02-bottom-diff.png',
            details: null, // maybe..
        },
    ],
};

export default moduleData;