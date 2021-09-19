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
            section: 'walls',
            type: 'box',
            size: [
                [0.2, 0.2, 1.87],
                [3, 0.3, 3], // TODO
                [0.2, 0.2, 1.87],
                [3, 0.3, 3], // TODO
            ],
            position: [
                [0.72, 2.55, 1.62],
                [0, 2.5, 0], // TODO
                [8.3, 2.55, 3.4],
                [0, 2.5, 0], // TODO
            ],
            helperColor: 0x777777,
        },
        {
            id: 'pipe02',
            section: 'walls',
            type: 'box',
            size: [
                [0.2, 0.2, 1.87],
                [3, 0.3, 3], // TODO
                [0.2, 0.2, 1.87],
                [3, 0.3, 3], // TODO
            ],
            position: [
                [8.3, 2.55, 1.62],
                [0, 2.5, 0], // TODO
                [0.72, 2.55, 3.4],
                [0, 2.5, 0], // TODO
            ],
            helperColor: 0x777777,
        },
        {
            id: 'pipe03',
            section: 'walls',
            type: 'box',
            size: [
                [0.2, 0.2, 1],
                [3, 0.3, 3], // TODO
                [0.2, 0.2, 1],
                [3, 0.3, 3], // TODO
            ],
            position: [
                [3.5, 2.55, 0.44],
                [0, 2.5, 0], // TODO
                [5.5, 2.55, 4.56],
                [0, 2.5, 0], // TODO
            ],
            helperColor: 0x777777,
        },
        {
            id: 'pipe04',
            section: 'walls',
            type: 'box',
            size: [
                [0.2, 0.2, 0.8],
                [3, 0.3, 3], // TODO
                [0.2, 0.2, 0.8],
                [3, 0.3, 3], // TODO
            ],
            position: [
                [6.53, 2.55, 1.2],
                [0, 2.5, 0], // TODO
                [2.477, 2.55, 3.82],
                [0, 2.5, 0], // TODO
            ],
            helperColor: 0x777777,
        },
        {
            id: 'pipe05',
            section: 'walls',
            type: 'box',
            size: [
                [0.2, 0.2, 2.1],
                [3, 0.3, 3], // TODO
                [0.2, 0.2, 2.1],
                [3, 0.3, 3], // TODO
            ],
            position: [
                [5.5, 2.55, 3.6],
                [0, 2.5, 0], // TODO
                [3.5, 2.55, 1.4],
                [0, 2.5, 0], // TODO
            ],
            helperColor: 0x777777,
        },
        {
            id: 'pipe06',
            section: 'walls',
            type: 'box',
            size: [
                [7.6, 0.2, 0.2],
                [3, 0.3, 3], // TODO
                [7.6, 0.2, 0.2],
                [3, 0.3, 3], // TODO
            ],
            position: [
                [4.5, 2.55, 0.72],
                [0, 2.5, 0], // TODO
                [4.5, 2.55, 4.28],
                [0, 2.5, 0], // TODO
            ],
            helperColor: 0x777777,
        },
        {
            id: 'pipe07',
            section: 'walls',
            type: 'box',
            size: [
                [0.2, 0.2, 1.55],
                [3, 0.3, 3], // TODO
                [0.2, 0.2, 1.55],
                [3, 0.3, 3], // TODO
            ],
            position: [
                [6.02, 2.55, 2.07],
                [0, 2.5, 0], // TODO
                [2.98, 2.55, 2.945],
                [0, 2.5, 0], // TODO
            ],
            rotation: [
                [0, Math.PI/-4, 0],
                [0, Math.PI/4, 0], // TODO
                [0, Math.PI/-4, 0],
                [0, Math.PI/4, 0], // TODO
            ],
            helperColor: 0x777777,
        },
        {
            id: 'wire01',
            section: 'walls',
            type: 'box',
            size: [
                [0.1, 0.1, 1.58],
                [3, 0.3, 3], // TODO
                [0.1, 0.1, 1.58],
                [3, 0.3, 3], // TODO
            ],
            position: [
                [1, 2.55, 4.08],
                [0, 2.5, 0], // TODO
                [8, 2.55, 0.93],
                [0, 2.5, 0], // TODO
            ],
            rotation: [
                [0, Math.PI/4 + 0.1, 0],
                [0, Math.PI/4, 0], // TODO
                [0, Math.PI/4 + 0.1, 0],
                [0, Math.PI/4, 0], // TODO
            ],
            helperColor: 0x777777,
        },
    ],
};

export default moduleData;