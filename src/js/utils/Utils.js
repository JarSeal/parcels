class Utils {
    constructor() {
        this.commonPIs = {
            pi: Math.PI,
            neg: -Math.PI,
            half: Math.PI / 2,
            negHalf: Math.PI / -2,
            quarter: Math.PI / 4,
            negQuarter: Math.PI / -4,
            threeFourths: Math.PI * 0.75,
            negThreeFourths: Math.PI * -0.75,
            threeHalves: Math.PI + Math.PI / 2,
            piAndQuarter: Math.PI / 4 + Math.PI,
            piAndThreeFourths: Math.PI * 0.75 + Math.PI,
            twoPi: Math.PI * 2,
        };
    }

    randomIntFromInterval(min, max) { // min and max included 
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    getScreenResolution() {
        return {
            x: Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0),
            y: Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)
        };
    }

    getCommonPIs(pi) {
        return this.commonPIs[pi];
    }

    turnTiles(tiles, times) {
        let newTiles = [];
        for(let f=0; f<tiles.length; f++) {
            newTiles.push(this.rotate(tiles[f], times));
        }
        return newTiles;
    }

    rotate = (matrix, times) => {
        let copy = matrix.slice();
        for(let n=0; n<times; n++) {
            copy = copy.slice();
            copy = this._transpose(copy);
        }
        return copy;
    };

    _transpose = (matrix) => {
        return matrix.reduce((prev, next) => next.map((item, i) =>
            (prev[i] || []).concat(next[i])
        ), []).reverse();
    };
}

export default Utils;