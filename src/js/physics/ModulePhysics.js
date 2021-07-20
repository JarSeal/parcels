import levelTypes from './levelTypes/index';

class ModulePhysics {
    constructor(sceneState, moduleData, moduleIndex) {
        this._createFloor(sceneState, moduleData, moduleIndex);
        this._createWalls(sceneState, moduleData, moduleIndex);
    }

    _createFloor(sceneState, moduleData, moduleIndex) {
        const COMP_FLOOR_ID = 'levelCompoundFloors';
        const tiles = moduleData.tiles;
        const floors = moduleData.boundingDims[0];
        const rows = moduleData.boundingDims[1];
        const cols = moduleData.boundingDims[2];
        const totalTilesPerFloor = rows * cols;
        let floorIndex = 0;

        // This algorithm is O(floors*tilesPerFloor*rows*cols),
        // this could propably be optimised with a recursion or some other type of algorithm.
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
                if(x > 0 && z > 0) {
                    levelTypes(moduleData.levelType, 'floor', sceneState, {
                        compId: COMP_FLOOR_ID,
                        floor: f,
                        moduleData,
                        moduleIndex,
                        floorIndex,
                        x,
                        z,
                        startX,
                        startZ,
                    });
                    floorIndex++;
                }
                x = 0;
                z = 0;
            }
        }

        // reset processed data
        for(let f=0; f<floors; f++) {
            for(let r=0; r<rows; r++) {
                for(let c=0; c<cols; c++) {
                    tiles[f][r][c].p = false;
                }
            }
        }
    }

    _createWalls(sceneState, moduleData, moduleIndex) {
        const COMP_WALLS_ID = 'levelCompoundWalls';
        const tiles = moduleData.tiles;
        const floors = moduleData.boundingDims[0];
        const rows = moduleData.boundingDims[1];
        const cols = moduleData.boundingDims[2];
        const totalTilesPerFloor = rows * cols;
        for(let f=0; f<floors; f++) {
            let tilesDone = 0,
                wallLength = 0,
                startX = 0,
                startZ = 0,
                directionSet = false,
                horisontal = true,
                endWall = false,
                wallIndex = 0,
                doorTile = false,
                cargoDoor = false,
                floorNeighbors = {
                    left: false,
                    right: false,
                    top: false,
                    bottom: false,
                },
                doorNeighbor = {
                    left: false,
                    right: false,
                    top: false,
                    bottom: false,
                };
            while(totalTilesPerFloor !== tilesDone) {
                for(let r=0; r<rows; r++) {
                    for(let c=0; c<cols; c++) {
                        if(!tiles[f][r][c].p) {
                            if(directionSet && !horisontal && startX !== c) continue;
                            if((horisontal || !directionSet) &&
                                tiles[f][r][c].t === 1 && tiles[f][r][c+1] && tiles[f][r][c+1].t === 1 && !tiles[f][r][c+1].p) {
                                if(!directionSet) {
                                    horisontal = true;
                                    directionSet = true;
                                    startX = c;
                                    startZ = r;
                                    if(tiles[f][r][c-1] && tiles[f][r][c-1].t === 1) {
                                        wallLength++;
                                        startX = c-1;
                                    }
                                } else {
                                    if(tiles[f][r-1] && tiles[f][r-1][c].t === 2) {
                                        floorNeighbors.top = true;
                                    }
                                    if(tiles[f][r+1] && tiles[f][r+1][c].t === 2) {
                                        floorNeighbors.bottom = true;
                                    }
                                }
                                wallLength++;
                            } else if((!horisontal || !directionSet)
                                      && tiles[f][r][c].t === 1 && tiles[f][r+1] && tiles[f][r+1][c].t === 1 && !tiles[f][r+1][c].p) {
                                if(!directionSet) {
                                    horisontal = false;
                                    directionSet = true;
                                    startX = c;
                                    startZ = r;
                                    if(tiles[f][r-1] && tiles[f][r-1][c].t === 1) {
                                        wallLength++;
                                        startZ = r-1;
                                    }
                                } else {
                                    if(tiles[f][r][c-1] && tiles[f][r][c-1].t === 2) {
                                        floorNeighbors.left = true;
                                    }
                                    if(tiles[f][r][c+1] && tiles[f][r][c+1].t === 2) {
                                        floorNeighbors.right = true;
                                    }
                                }
                                wallLength++;
                            } else if(tiles[f][r][c].t === 1 || tiles[f][r][c].t === 3) {
                                // Single wall tile, last wall tile, or door frame tile
                                if(!directionSet) {
                                    directionSet = true;
                                    startX = c;
                                    startZ = r;
                                    if(tiles[f][r][c-1] && tiles[f][r][c-1].t === 1) {
                                        wallLength++;
                                        startX = c-1;
                                        horisontal = true;
                                    } else if(tiles[f][r-1] && tiles[f][r-1][c].t === 1) {
                                        wallLength++;
                                        startZ = r-1;
                                        horisontal = false;
                                    }
                                    // Door frame tile and checking for door tile direction
                                    if(tiles[f][r][c].t === 3) {
                                        if(tiles[f][r][c+1] && tiles[f][r][c+1].t === 4) {
                                            doorNeighbor.right = true;
                                            if(tiles[f][r][c+1].cargoDoor) cargoDoor = true;
                                        } else if(tiles[f][r][c-1] && tiles[f][r][c-1].t === 4) {
                                            doorNeighbor.left = true;
                                            if(tiles[f][r][c-1].cargoDoor) cargoDoor = true;
                                        } else if(tiles[f][r+1] && tiles[f][r+1][c].t === 4) {
                                            doorNeighbor.bottom = true;
                                            if(tiles[f][r+1][c].cargoDoor) cargoDoor = true;
                                        } else if(tiles[f][r-1] && tiles[f][r-1][c].t === 4) {
                                            doorNeighbor.top = true;
                                            if(tiles[f][r-1][c].cargoDoor) cargoDoor = true;
                                        }
                                    }
                                }
                                if(tiles[f][r-1] && tiles[f][r-1][c].t === 2) {
                                    floorNeighbors.top = true;
                                }
                                if(tiles[f][r+1] && tiles[f][r+1][c].t === 2) {
                                    floorNeighbors.bottom = true;
                                }
                                if(tiles[f][r][c-1] && tiles[f][r][c-1].t === 2) {
                                    floorNeighbors.left = true;
                                }
                                if(tiles[f][r][c+1] && tiles[f][r][c+1].t === 2) {
                                    floorNeighbors.right = true;
                                }
                                wallLength++;
                                endWall = true;
                            } else if(tiles[f][r][c].t === 4) {
                                // Door opening
                                if(!directionSet && wallLength === 0) {
                                    directionSet = true;
                                    startX = c;
                                    startZ = r;
                                    if(tiles[f][r][c-1] && (tiles[f][r][c-1].t === 3 || tiles[f][r][c-1].t === 1 || tiles[f][r][c-1].t === 4)) {
                                        horisontal = true;
                                    } else {
                                        horisontal = false;
                                    }
                                    if(tiles[f][r][c].cargoDoor) {
                                        console.log('CARGOIDOOR', tiles[f][r][c]);
                                        cargoDoor = true;
                                    }
                                    doorTile = true;
                                    wallLength = 1;
                                    endWall = true;
                                }
                            }
                            if(endWall && !doorTile) {
                                if((horisontal && tiles[f][r][c+1] && tiles[f][r][c+1].t === 1) || 
                                    (!horisontal && tiles[f][r+1] && tiles[f][r+1][c].t === 1)) {
                                    wallLength++;
                                }
                            }
                            tiles[f][r][c].p = true;
                            tilesDone++;
                        }
                        if(endWall) break;
                    }
                    if(endWall) break;
                }
                if(wallLength > 0) {
                    this._checkFloorNeighbors(floorNeighbors, horisontal, tiles, wallLength, f, startX, startZ);
                    levelTypes(moduleData.levelType, 'wall', sceneState, {
                        compId: COMP_WALLS_ID,
                        floor: f,
                        moduleData,
                        moduleIndex,
                        wallIndex,
                        horisontal,
                        floorNeighbors,
                        doorNeighbor,
                        wallLength,
                        doorTile,
                        cargoDoor,
                        startX,
                        startZ,
                    });
                    wallIndex++;
                }
                endWall = false;
                directionSet = false;
                wallLength = 0;
                doorTile = false;
                cargoDoor = false;
                floorNeighbors = {
                    left: false,
                    right: false,
                    top: false,
                    bottom: false,
                };
                doorNeighbor = {
                    left: false,
                    right: false,
                    top: false,
                    bottom: false,
                };
            }
        }
    }

    _checkFloorNeighbors(obj, horisontal, tiles, wallLength, floor, startX, startZ) {
        if(!obj.top && !obj.bottom && !obj.left && !obj.right) {
            for(let i=0; i<wallLength; i++) {
                if(horisontal) {
                    if(tiles[floor][startZ+1] && tiles[floor][startZ+1][startX+i].t === 2) {
                        obj.bottom = true;
                    }
                    if(tiles[floor][startZ-1] && tiles[floor][startZ-1][startX+i].t === 2) {
                        obj.top = true;
                    }
                } else {
                    if(tiles[floor][startZ+i][startX+1] && tiles[floor][startZ+i][startX+1].t === 2) {
                        obj.right = true;
                    }
                    if(tiles[floor][startZ+i][startX-1] && tiles[floor][startZ+i][startX-1].t === 2) {
                        obj.left = true;
                    }
                }
            }
        }
    }
}

export default ModulePhysics;