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

    getScreenResolution() {
        return {
            x: Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0),
            y: Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)
        };
    }

    getCommonPIs(pi) {
        return this.commonPIs[pi];
    }
}

export default Utils;