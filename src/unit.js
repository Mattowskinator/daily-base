class Unit extends BABYLON.TransformNode {
    constructor(options) {
        super(options.unitData.type);
        this.unitData = options.unitData;

        this.gridMap = options.gridMap;

        this.mesh = new BABYLON.MeshBuilder.CreateBox("unit", {size: 1});
        this.mesh.position.y += .5;
        this.mesh.parent = this;

        this.material = new BABYLON.StandardMaterial("unitMaterial");
        this.mesh.material = this.material;
        this.material.diffuseColor = Unit.defaultColor;
        // this.mesh.parent = 

        if (options.position) {
            this.position = options.position;
            this.position.y = 0;
        }


        this.target;
        // this.targetPosition = new BABYLON.Vector3(0,0,0);

        this.health = 100;

        this.minAttackRange = options.minAttackRange || 0;
        this.maxAttackRange = options.maxAttackRange ||10;

        this.speed = options.speed || 2;

        this.state = Unit.states.IDLING;

        this.currentPathCell = undefined;
        this.currentPathTarget = new BABYLON.Vector3(0,0,0);

        // this.targetsOf = [];

        // this.targets = [];

        this.attackIntervalTimer = 0;
        this.attackInterval = 1000; //ms

        this.attackDamage = 10;

        this.heuristic = undefined // function
    }

    // set position(vector3) {
    //     this.mesh.position.copyFrom(vector3);
    //     this.mesh.position.y += .5;
    // }

    // get position() {
    //     return this.mesh.position;
    // }

    // targets - transformNodes
    // heuristic - function(target);
    getClosestTarget(targets, heuristic = (target) => {return true;}) {
        let closestDistance;
        let closestTarget;
        for (const target of targets) {
            const currentPosition = this.position;
            const targetPosition = target.position;
            const distance = BABYLON.Vector3.Distance(currentPosition, targetPosition);
            if (closestDistance === undefined || distance < closestDistance) {
                if (heuristic(target)) {
                    closestTarget = target;
                    closestDistance = distance;
                }
            }
        }
        return closestTarget;
    }

    // look wrapper that keeps level
    lookAt(position, y) {
        super.lookAt(new BABYLON.Vector3(
            position.x,
            y || this.position.y,
            position.z
        ));
    }

    destroyEvent() {
        console.log("unit was killed:", this);
        this.dispose();
    }

    damage(amount) {
        this.health -= amount;

        clearTimeout(this.damageTimeout);
        this.material.diffuseColor = Unit.damageColor;
        this.damageTimeout = setTimeout(() => {
            this.material.diffuseColor = Unit.defaultColor;
        }, amount * 5);

        if (this.health <= 0) {
            this.destroyEvent();
        }
    }

    attackEvent(target) {
        
    }

    attack(target) {
        // console.log(target);
        target.damage(this.attackDamage);
        this.attackEvent(target);
    }

    update(targets) {

        const delta = this.getEngine().getDeltaTime();

        if (this.health <= 0) {
            return;
        }

        const currentPosition = this.position;
        const targetPosition = this.target?.position.clone() || new BABYLON.Vector3(0,0,0);

        // clear target if target is disposed
        if (this.target?.isDisposed()) {
            // console.log("biulding disposed");
            this.target = undefined;
            return this;
        }
        // console.log(this.target);
        // find target if target is undefined
        if (this.target === undefined) {
            // console.log("no target, looking for path")
            this.state = Unit.states.IDLING;
            this.path = undefined;
            this.target = this.getClosestTarget(targets, this.heuristic);
            // console.log(!this.target);
        }
        
        if (this.target) {

            targetPosition.copyFrom(this.target.position);
            const distanceToTarget = BABYLON.Vector3.Distance(currentPosition, targetPosition);
            if (distanceToTarget > this.maxAttackRange) {
                
            }

            if (this.state === Unit.states.IDLING && (this.path === undefined || this.path.length === 0)) {
                this.path = this.gridMap.findPathFromPositions(currentPosition, targetPosition);
                if (this.path.length > 0) {
                    this.state = Unit.states.MOVING;
                    console.log("set state to MOVING");
                }
            }


            if (this.path !== undefined && this.path.length > 0) {

                let travelDistance = delta * this.speed * .001;

                while (true) {
                    if (!this.currentPathCell) {
                        if (this.path.length === 0) {
                            break;
                        }

                        this.currentPathCell = this.path.shift();
                        this.currentPathTarget.set(
                            this.currentPathCell.worldX,
                            0,
                            this.currentPathCell.worldY
                        );
                    }
    
                    const distanceToPath = BABYLON.Vector3.Distance(currentPosition, this.currentPathTarget);
                    
                    if (travelDistance > distanceToPath) {
                        this.position.copyFrom(this.currentPathTarget);
                        this.currentPathCell = undefined;
                        travelDistance -= distanceToPath;
                        continue;
                    }

                    this.lookAt(this.currentPathTarget);
                    this.position.addInPlace(this.getDirection(BABYLON.Vector3.Forward()).scale(travelDistance));
                    break;
                    // if (distanceToPath > .2) {
                    //     // console.log(BABYLON.Vector3.Distance(currentPosition, this.currentPathTarget));
                        
    
                    // } else {
                    //     this.currentPathCell = undefined;
                    // }
                }   
            }

            if (distanceToTarget >= this.minAttackRange && distanceToTarget <= this.maxAttackRange) {
                if (this.state !== Unit.states.ATTACKING) {
                    this.state = Unit.states.ATTACKING;
                    // console.log("set state to ATTACK")
                    this.lookAt(targetPosition);
                    this.path = [];
                }
            } else {
                // if cant attack target, change state to idle
                if (this.state === Unit.states.ATTACKING) {
                    // this.target = undefined;
                    this.state = Unit.states.IDLING;
                }
            }

            if (this.state === Unit.states.ATTACKING) {
                if (this.attackIntervalTimer >= this.attackInterval) {
                    this.attackIntervalTimer -= this.attackInterval;
                    this.attack(this.target);
                }
                // console.log(this.attackIntervalTimer);
                this.attackIntervalTimer += delta;
            }

        }

        return this;
    }

    dispose() {
        // for (let i = 0; i < this.targetsOf.length; i++) {
        //     const targetOf = this.targetsOf[i];
        //     targetOf.targetNode = undefined; // temp; consider a specific function
        // }
        // this.mesh.dispose();
        super.dispose(); // default behavior recurses into children. use (true) to not recurse
    }
}


class Medic extends Unit {
    constructor(options) {
        super(options);
    }
}




Unit.states = {
    IDLING: 0,
    MOVING: 1,
    ATTACKING: 2
}

Unit.damageColor = new BABYLON.Color3(1,0,0);
Unit.defaultColor = new BABYLON.Color3(.8,1,.8);

class UnitData {
    constructor(options) {
        this.associatedClass = options.associatedClass || Unit;
        this.thumbnailURL = options.thumbnailURL || "res/images/thumb.png";
        this.type = options.type || "unit";
        this.title = options.title || this.type;
        this.price = options.price || 100;
        this.size = options.size || 1;
    }
}


class UnitCreator {
    constructor() {
        this.types = {
            infantry: new UnitData({
                type: "infantry",
                title: "Infantry",
                price: 100,
                size: 1,
                thumbnailURL: "res/images/thumb-infantry.png"
            }),
            engineer: new UnitData({
                type: "engineer",
                title: "Engineer",
                price: 100,
                size: 1,
                thumbnailURL: "res/images/thumb-engineer.png"
            }),
            medic: new UnitData({
                type: "medic",
                title: "Medic",
                price: 200,
                size: 1,
                thumbnailURL: "res/images/thumb-medic.png",
                associatedClass: Medic
            }),
            chopper: new UnitData({
                type: "chopper",
                title: "Chopper",
                price: 100,
                size: 1
            })
        };
    }

    createUnit(type, options = {}) {
        const unitData = this.types[type];
        if (!unitData) {
            console.log("no unit of type", type);
            return;
        }
        options.gridMap = this.gridMap;
        options.unitData = unitData;
        const unit = new unitData.associatedClass(options);
        return unit;
    }

    getTypes() {
        return Object.values(this.types);
    }
}

export { UnitCreator };