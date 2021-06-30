
class ModulePhysics {
    constructor(sceneState, moduleData, moduleIndex) {
        this._createFloor(sceneState, moduleData, moduleIndex);
        console.log('MOD DATA', moduleData);
    }

    _createFloor(sceneState, moduleData, moduleIndex) {
        const COMP_FLOOR_ID = 'levelCompoundFloors';
        const tiles = moduleData.tiles;
        const floors = moduleData.boundingDims[0];
        const rows = moduleData.boundingDims[1];
        const cols = moduleData.boundingDims[2];
        const totalTilesPerFloor = rows * cols;
        let floorIndex = 0;

        // This algorithm is O(floors*tiles³) / O(ft³), this could propably be optimised with a recursion or some other type of algorithm..
        for(let f=0; f<floors; f++) {
            let x = 0, z = 0,
                startXSet = false, endXSet = false, startX, endX = cols-1, startZ = 0,
                tilesDone = 0,
                endRect = false;
            while(totalTilesPerFloor !== tilesDone) {
                for(let r=0; r<rows; r++) {
                    for(let c=0; c<cols; c++) {
                        if(!tiles[f][r][c].p) {
                            if(!startXSet) {
                                startX = c;
                                startZ = r;
                                startXSet = true;
                            }
                            if(c >= startX && c <= endX) {
                                tiles[f][r][c].p = true;
                                tilesDone++;
                                if(tiles[f][r][c].t === 0) {
                                    if(!endXSet) {
                                        endX = c-1;
                                        endXSet = true;
                                        x = endX - startX + 1;
                                        z++;
                                    } else if(endX > c-1) {
                                        for(let i=c; i>=startX; i--) {
                                            if(tiles[f][r][i].p) {
                                                tiles[f][r][i].p = false;
                                                tilesDone--;
                                            }
                                        }
                                        endRect = true;
                                    }
                                } else if(!endXSet && c+1 === cols) {
                                    endX = c;
                                    endXSet = true;
                                    x = endX - startX + 1;
                                    z++;
                                } else {
                                    if(c === endX) z++;
                                }
                            }
                        } else if(startXSet && !endXSet) {
                            endX = c-1;
                            endXSet = true;
                            x = endX - startX + 1;
                            z++;
                        }
                        if(endRect) break;
                    }
                    if(endRect) break;
                }
                startXSet = false;
                endXSet = false;
                endX = cols-1;
                endRect = false;
                const colors = [0xff4400, 0xff0000, 0x44ee00, 0xccaa00, 0xaa00cc, 0xf200a9];
                if(x > 0 && z > 0) {
                    sceneState.physicsClass.addShape({
                        id: 'floorShape_' + moduleData.id + '_' + moduleIndex + '_' + floorIndex,
                        compoundParentId: COMP_FLOOR_ID,
                        type: 'box',
                        size: [x / 2, 0.5 / 2, z / 2],
                        position: [
                            x / 2 + moduleData.pos[2] + startX,
                            -0.25,
                            z / 2 + moduleData.pos[1] + startZ,
                        ],
                        sleep: {
                            allowSleep: true,
                            sleeSpeedLimit: 0.1,
                            sleepTimeLimit: 1,
                        },
                        helperColor: colors[floorIndex > 5 ? 0 : floorIndex],
                    });
                    floorIndex++;
                }
                x = 0;
                z = 0;
            }
        }
    }

    _createWalls(sceneState, moduleData, moduleIndex) {
        const COMP_WALLS_ID = 'levelCompoundWalls';
    }
}

export default ModulePhysics;