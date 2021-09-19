const levelData = {
    id: 'ship01',
    name: 'ship01',
    type: 'ship',
    boundingDims: [1, 64, 64],
    pos: [0, 0, 0],
    modules: [
        {
            id: 'CabinL1',
            turn: 1,
            pos: [0, 2, 11],
        },
        // {
        //     id: 'HallWay01L1',
        //     turn: 1,
        //     pos: [0, 10, 11], 
        // },
        {
            id: 'HallWay01L1',
            turn: 1,
            pos: [0, 10, 10], 
        },
        {
            id: 'CockpitL1',
            turn: 2,
            pos: [0, 10, 4],
        },
        {
            id: 'AirLockL1',
            turn: 1,
            pos: [0, 15, 13],
        },
        {
            id: 'CargoHallL1',
            turn: 3,
            pos: [0, 7, 19],
        },
        {
            id: 'EngineRoomL1',
            turn: 0,
            pos: [0, 7, 27],
        },
    ],
};

export default levelData;