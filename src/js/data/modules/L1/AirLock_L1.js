const moduleData = {
    id: 'AirLockL1',
    level: 1,
    name: 'Air Lock',
    boundingDims: [1, 5, 8],
    tiles: [
        [
            [{t:1},{t:1},{t:1},{t:1},{t:1},{t:1},{t:1},{t:1},],
            [{t:1},{t:2},{t:2},{t:2},{t:2},{t:2},{t:2},{t:1},],
            [{t:1},{t:2},{t:2},{t:2},{t:2},{t:2},{t:2},{t:1},],
            [{t:1},{t:2},{t:2},{t:2},{t:2},{t:2},{t:2},{t:1},],
            [{t:1},{t:1},{t:1},{t:1},{t:2},{t:1},{t:1},{t:1},],
        ],
    ],
    path: '/models/modules/L1/',
    models: [
        {
            exterior: 'AirLock_L1_EXT.glb',
            interior: 'AirLock_L1_INT.glb',
            roof: null,
            bottom: null, // maybe..
            details: null, // maybe..
        },
    ],
    textures: [
        {
            exterior: 'AirLock_L1_EXT',
            interior: 'AirLock_L1_INT',
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
            size: [8, 0.5, 5],
            position: [4, -0.25, 2.5],
            helperColor: 0xffcc00,
        },
    ],
};

export default moduleData;