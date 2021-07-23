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
            bottom: null, // maybe..
            details: null, // maybe..
        },
    ],
    textures: [
        {
            exterior: 'Cockpit_L1_EXT',
            interior: 'Cockpit_L1_INT',
            roof: null,
            bottom: null, // maybe..
            details: null, // maybe..
        },
    ],
    textureExt: 'png',
    textureSizes: [512, 1024, 2048, 4096],
    physics: [
        // {
        //     id: 'floor',
        //     section: 'floor',
        //     type: 'box',
        //     size: [8, 0.5, 5],
        //     position: [4, -0.25, 2.5],
        //     helperColor: 0xffcc00,
        // },
    ],
};

export default moduleData;