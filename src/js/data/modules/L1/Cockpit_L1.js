const moduleData = {
    id: 'CockpitL1',
    level: 1,
    levelType: 'level1',
    name: 'Cockpit',
    boundingDims: [1, 5, 6],
    tiles: [
        [
            [{t:1},{t:1},{t:1},{t:1},{t:1},{t:1},],
            [{t:3},{t:2},{t:2},{t:2},{t:2},{t:1},],
            [{t:4},{t:2},{t:2},{t:2},{t:2},{t:1},],
            [{t:3},{t:2},{t:2},{t:2},{t:2},{t:1},],
            [{t:1},{t:1},{t:1},{t:1},{t:1},{t:1},],
        ],
    ],
    path: '/models/modules/L1/',
    models: [
        {
            exterior: 'Cockpit_L1_EXT.glb',
            interior: 'Cockpit_L1_INT.glb',
            roof: null,
            bottom: null,
            detailsInt: 'Cockpit_L1_INTDET.glb',
        },
    ],
    textures: [
        {
            exterior: 'Cockpit_L1_EXT',
            interior: 'Cockpit_L1_INT',
            roof: null,
            bottom: null,
            detailsInt: 'Cockpit_L1_INTDET',
        },
    ],
    textureExt: 'png',
    textureSizes: [512, 1024, 2048, 4096],
    physics: [
        {
            id: 'pipe01',
            type: 'box',
            size: [0.2, 0.2, 2],
            position: [0.72, 2.55, 3.45],
            helperColor: 0x777777,
        },
        {
            id: 'pipe02',
            type: 'box',
            size: [1, 0.2, 0.2],
            position: [1.25, 2.55, 4.4],
            helperColor: 0x777777,
        },
    ],
};

export default moduleData;