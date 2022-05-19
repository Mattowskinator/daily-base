
class PointIndicator extends BABYLON.TransformNode {
    constructor(options) {
        super("pointIndicator");
        this.mesh = BABYLON.MeshBuilder.CreatePlane("pointIndicatorMesh", {size: 1});
        this.mesh.rotation.x = Math.PI * .5;
        this.mesh.isPickable = false;
        this.mesh.parent = this;
        this.mesh.position.y = .1;

        if (!PointIndicator.material) {
            const mat = new BABYLON.StandardMaterial("pointIndicatorMaterial", undefined);
            const texture = new BABYLON.Texture("res/images/point-indicator.png");
            // mat.emissiveTexture = texture;
            mat.opacityTexture = texture;
            mat.diffuseColor = new BABYLON.Color3(1,0,0);
            mat.emissiveColor = mat.diffuseColor;
            mat.disableLighting = true;
            PointIndicator.material = mat;

        }   

        this.mesh.material = PointIndicator.material;


        if (options.position) {
            this.setPosition(options.position);
        }

        this.progress = 0;
    }

    setPosition(position) {
        this.position.copyFrom(position);
        // this.position.y += .1;
    }

    update() {
        const delta = this.mesh.getEngine().getDeltaTime() * .001;
        if (this.progress < 1) {
            this.progress += delta * 8;
        } else {
            this.finished = true;
            this.dispose();
        }
        const scale = this.progress * 2;

        this.mesh.scaling.set(scale, scale, 1);
    }
}

class Effect extends BABYLON.TransformNode {
    constructor(options) {
        super("effect");
        

        this.timer = 0;
        this.duration = options.duration || 2000;
        this.attackDamage = options.attackDamage || 0;

        if (options.position) {
            this.position.copyFrom(options.position);
        }

        this.range = options.range || 0;
        this.attackDuration = options.attackDuration || this.duration;
        this.attackInterval = options.attackInterval || -1;
        this.attackIntervalTimer = this.attackInterval;
        this.attackOnce = options.attackOnce || false;
        this.attacked = false;
        this.targets = options.targets || Effect.targets || [];

        if (options.attackFunction) {
            this.attackFunction = options.attackFunction;
        } else {
            this.attackFunction = (effect, args) => {
                return effect.attackDamage;
            };
        }


        Effect.onCreate(this);
    }

    attack(targets) {
        // console.log("explosion attacking targets", targets)
        for (const target of targets) {
            const distance = BABYLON.Vector3.Distance(target.position, this.position);
            if (distance <= this.range) {
                const amount = this.attackFunction(this, {distance});
                console.log("damage", amount)
                target.damage(amount);
            }
        }
    }

    update() {

        const delta = this.getEngine().getDeltaTime();

        if (this.isDisposed()) {
            return;
        }

        if (this.attackOnce && this.attacked) {
            
        } else {
            // console.log(this.attackIntervalTimer, this.attackInterval)
            if (this.attackIntervalTimer >= this.attackInterval) {
                this.attackIntervalTimer -= this.attackInterval;
                this.attack(this.targets);
                this.attacked = true;
            }
        }  

        this.attackIntervalTimer += delta;

        if (this.timer >= this.duration) {
            this.dispose();
            return;
        }

        this.timer += delta;
    }
}

class Explosion extends Effect {
    constructor(options) {

        options.attackDamage = options.attackDamage || 30;
        options.range = options.range || 10;
        options.attackOnce = options.attackOnce || true;
        options.attackFunction = (effect, args) => {
            return effect.attackDamage * ((effect.range - args.distance) / effect.range);
        }

        super(options);

        this.mesh = BABYLON.MeshBuilder.CreateCylinder("explosionMesh",{diameter: this.range * 2, height: 1})
        this.mesh.material = new BABYLON.StandardMaterial("explosionMaterial");
        this.mesh.material.alpha = .1;
        this.mesh.material.diffuseColor = new BABYLON.Color3(1,0,0);
        this.mesh.parent = this;

    }

    update() {
        super.update();

        this.mesh.material.alpha = ((this.duration - this.timer) / this.duration) * .1;
    }
}


export { PointIndicator, Effect, Explosion };