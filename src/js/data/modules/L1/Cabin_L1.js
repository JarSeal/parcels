const moduleData = {
    id: 'CabinL1',
    level: 1,
    name: 'Cabin',
    boundingDims: [1, 7, 8],
    tiles: [
        [
            [{t:9},{t:1},{t:1},{t:1},{t:1},{t:1},{t:1},{t:9},],
            [{t:1},{t:2},{t:2},{t:2},{t:2},{t:2},{t:2},{t:1},],
            [{t:2},{t:2},{t:2},{t:2},{t:2},{t:2},{t:2},{t:1},],
            [{t:1},{t:2},{t:2},{t:2},{t:2},{t:2},{t:2},{t:1},],
            [{t:1},{t:2},{t:2},{t:2},{t:2},{t:2},{t:2},{t:1},],
            [{t:1},{t:2},{t:2},{t:2},{t:2},{t:2},{t:2},{t:1},],
            [{t:9},{t:1},{t:1},{t:1},{t:1},{t:1},{t:1},{t:9},],
        ],
    ],
    path: '/models/modules/L1/',
    models: [
        {
            exterior: 'Cabin_L1_EXT.glb',
            interior: 'Cabin_L1_INT.glb',
            roof: null,
            bottom: null, // maybe..
            details: null, // maybe..
        },
    ],
    textures: [
        {
            exterior: 'Cabin_L1_EXT',
            interior: 'Cabin_L1_INT',
            roof: null,
            bottom: null, // maybe..
            details: null, // maybe..
        },
    ],
    textureExt: 'png',
    textureSizes: [512, 1024, 2048, 4096],
    physics: [
        {
            id: 'floor',
            section: 'floor',
            type: 'box',
            size: [8, 0.5, 7],
            position: [4, -0.25, 3.5],
            helperColor: 0xffcc00,
        },
    ],
};

export default moduleData;