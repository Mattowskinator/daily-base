

class LinearCurve {
    constructor(start, end) {
        this.start = start;
        this.end = end;
    }

    at(t) {
        return BABYLON.Vector3.Lerp(this.start, this.end, t);
    }
}

class QuadraticCurve {
    constructor(start, control, end) {
        this.start = start;
        this.control = control;
        this.end = end;

        this.curveA = new LinearCurve(this.start, this.control);
        this.curveB = new LinearCurve(this.control, this.end);
    }

    at(t) {
        return BABYLON.Vector3.Lerp(
            this.curveA.at(t), this.curveB.at(t), t);
    }
}