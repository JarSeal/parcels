import modulesData from './modulesData';
import levelDummy01 from './levels/levelDummy01';

class LevelsData {
    constructor() {
        // This class represents the back end
        // and emulates what is being done to the data
        // and how it serves the data to the front end.
    }

    getLevelsData(id) {
        const levelsData = {
            levelDummy01
        };
        return this._unpackData(levelsData[id]);
    }

    _unpackData(data) {
        let newData = { ...data, tiles: [] };
        const modules = data.modules;
        for(let i=0; i<modules.length; i++) {
            const mParams = modules[i];
            const moduleData = modulesData[mParams.id];
            this._placeModules(moduleData, mParams.pos, newData);
        }
        console.log('newData', newData);
        return newData;
    }

    _placeModules(mData, mPos, lData) {
        const lDims = lData.boundingDims;
        const mDims = mData.boundingDims;
        const tiles = mData.tiles;
        let nextTile = [0, 0, 0];
        for(let floor=0; floor<lDims[0]; floor++) {
            if(!lData.tiles[floor]) lData.tiles.push([]);
            nextTile[1] = 0;
            for(let row=0; row<lDims[1]; row++) {
                if(!lData.tiles[floor][row]) lData.tiles[floor].push([]);
                nextTile[2] = 0;
                for(let col=0; col<lDims[2]; col++) {
                    if (floor < mPos[0] + mDims[0] && floor >= mPos[0] &&
                        row < mPos[1] + mDims[1] && row >= mPos[1] &&
                        col < mPos[2] + mDims[2] && col >= mPos[2]) {
                        if(lData.tiles[floor][row][col] && lData.tiles[floor][row][col].t > 0) {
                            console.error('Tile at [' + row + ', ' + col + '] (floor: ' + floor + ') already has an assigned tile.');
                        }
                        lData.tiles[floor][row].push(tiles[nextTile[0]][nextTile[1]][nextTile[2]]);
                        nextTile[2]++;
                    } else {
                        if(!lData.tiles[floor][row][col]) {
                            lData.tiles[floor][row].push({t:0});
                        }
                    }
                }
                if (floor < mPos[0] + mDims[0] && floor >= mPos[0] &&
                    row < mPos[1] + mDims[1] && row >= mPos[1]) {
                    nextTile[1]++;
                }
            }
            if (floor < mPos[0] + mDims[0] && floor >= mPos[0]) {
                nextTile[0]++;
            }
        }
    }
}

export default LevelsData;