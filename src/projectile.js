import { Explosion } from "./effect.js";


class Projectile extends BABYLON.TransformNode {
    constructor(options = {}) {
        super("projectile");
        Projectile.onCreate(this);

        // this.gravity = options.gravity || new BABYLON.Vector3(0,-1,0);
        // this.velocity = options.velocity || new BABYLON.Vector3(0,0,0);
        // if (options.position) {
        //     this.position.copyFrom(options.position);
        // }
        this.startPosition = options.startPosition || new BABYLON.Vector3(0,0,0);
        this.endPosition = options.endPosition || new BABYLON.Vector3(0,0,0);
        this.middlePosition = options.middlePosition || BABYLON.Vector3.Lerp(this.startPosition, this.endPosition, .5);
        if (options.middleHeight) {
            this.middlePosition.y = options.middleHeight;
        }


        // this.curve = BABYLON.Curve3.CreateQuadraticBezier(this.startPosition, this.middlePosition, this.endPosition, )
        this.curve = new QuadraticCurve(this.startPosition, this.middlePosition, this.endPosition);

        this.progress = 0;
        this.travelTime = options.travelTime || 2000; // ms
        this.timer = 0;

        this.mesh = BABYLON.MeshBuilder.CreateSphere("projectileMesh", {segments: 8});
        this.mesh.material = new BABYLON.StandardMaterial("projectileMeshMaterial");
        this.mesh.material.diffuseColor = new BABYLON.Color3(1,1,0);
        this.mesh.parent = this;
    }

    update() {
        const delta = this.getEngine().getDeltaTime();

        if (this.progress >= 1) {
            // console.log("projectile destroyed")
            const explosion = new Explosion({position: this.endPosition});
            this.dispose();
            return;
        }

        this.progress = this.timer / this.travelTime;
        const newPosition = this.curve.at(this.progress);
        this.position.copyFrom(newPosition);
        
        // this.velocity.addInPlace(this.gravity.scale(delta));
        // this.position.addInPlace(this.velocity.scale(delta));

        this.timer += delta;
    }
}


export { Projectile };