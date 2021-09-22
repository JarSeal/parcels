const moduleData = {
    id: 'HallWay01L1',
    level: 1,
    levelType: 'level1',
    name: 'Hallway 1',
    boundingDims: [1, 5, 9],
    tiles: [
        [
            [{t:1},{t:1},{t:3},{t:4},{t:3},{t:1},{t:1},{t:1},{t:1},],
            [{t:3},{t:2},{t:2},{t:2},{t:2},{t:2},{t:2},{t:2},{t:3},],
            [{t:4},{t:2},{t:2},{t:2},{t:2},{t:2},{t:2},{t:2},{t:4},],
            [{t:3},{t:2},{t:2,noRoof:true},{t:2},{t:2},{t:2},{t:2},{t:2},{t:3},],
            [{t:1},{t:1},{t:1},{t:1},{t:3},{t:4},{t:3},{t:1},{t:1},],
        ],
    ],
    path: '/models/modules/L1/',
    models: [
        {
            exterior: 'HallWay01_L1_EXT.glb',
            interior: 'HallWay01_L1_INT.glb',
            roof: null,
            bottom: null,
            detailsInt: 'HallWay01_L1_INTDET.glb',
        },
    ],
    textures: [
        {
            exterior: 'HallWay01_L1_EXT',
            interior: 'HallWay01_L1_INT',
            roof: null,
            bottom: null,
            detailsInt: 'HallWay01_L1_INTDET',
        },
    ],
    textureExt: 'png',
    textureSizes: [512, 1024, 2048, 4096],
    physics: [
        {
            id: 'pipe01',
            type: 'box',
            size: [0.2, 0.2, 1.87],
            position: [0.72, 2.55, 1.62],
            helperColor: 0x777777,
        },
        {
            id: 'pipe02',
            type: 'box',
            size: [0.2, 0.2, 1.87],
            position: [8.3, 2.55, 1.62],
            helperColor: 0x777777,
        },
        {
            id: 'pipe03',
            type: 'box',
            size: [0.2, 0.2, 0.5],
            position: [3.5, 2.55, 0.7],
            helperColor: 0x777777,
        },
        {
            id: 'pipe04',
            type: 'box',
            size: [0.2, 0.2, 0.8],
            position: [6.53, 2.55, 1.2],
            helperColor: 0x777777,
        },
        {
            id: 'pipe05',
            type: 'box',
            size: [0.2, 0.2, 2.1],
            position: [5.5, 2.55, 3.6],
            helperColor: 0x777777,
        },
        {
            id: 'pipe06',
            type: 'box',
            size: [7.6, 0.2, 0.2],
            position: [4.5, 2.55, 0.72],
            helperColor: 0x777777,
        },
        {
            id: 'pipe07',
            type: 'box',
            size: [0.2, 0.2, 1.55],
            position: [6.02, 2.55, 2.07],
            rotation: [0, Math.PI/-4, 0],
            helperColor: 0x777777,
        },
        {
            id: 'wire01',
            type: 'box',
            size: [0.1, 0.1, 1.58],
            position: [1, 2.55, 4.08],
            rotation: [0, Math.PI/4 + 0.1, 0],
            helperColor: 0x777777,
        },
    ],
};

export default moduleData;