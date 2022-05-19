import { Projectile } from "./projectile.js";

class Building extends BABYLON.TransformNode {
    constructor(options = {}) {
        super("building");
        // game properties
        this.health = 100;

        // visual properties
        if (options.mesh !== undefined) {
            this.mesh = options.mesh;
            // console.log("mesh there")
            if (this.mesh.getBoundingInfo !== undefined) {
                // console.log("moving mesh")
                const boundingBox = this.mesh.getBoundingInfo().boundingBox;
                const height = boundingBox.maximum.y - boundingBox.minimum.y;
                this.mesh.position.y = height * .5;
                // console.log(height)
                // console.log(this.mesh.position.y)
                // console.log(this.mesh.getBoundingInfo())
            }

            this.mesh.parent = this;
        }

        if (options.foundationEnabled === undefined) {
            options.foundationEnabled = true;
        }

        if (options.foundationEnabled) {
            this.foundation = BABYLON.MeshBuilder.CreateBox("buildingFoundation",{
                width: options.width, 
                height: 2, 
                depth: options.length
            });
            this.foundation.position.y = -1;
            const mat = new BABYLON.StandardMaterial("defaultBuildingMaterial", undefined);
            mat.diffuseColor = new BABYLON.Color3(.5,.5,.5);
            this.foundation.material = mat;

            this.foundation.parent = this;
        }


        // world properties
        // this.position = new BABYLON.Vector3(0,0,0);
        this.centerPosition = new BABYLON.Vector2(0,0);
        this.width = options.width;
        this.length = options.length;

        // array of 2d positions representing the cells which the building occupies on the grid
        // the 2d posiitons are relative to the center of the building
        this.relativeCells = [
            new BABYLON.Vector2(0,0),
        ];

        this.variantIndex = undefined;
        this.buildingData = undefined;

        // this.gridMap = options.gridMap;
    }

    dispose() {
        BuildingBuilder.gridMap.setCellsFromBuilding(this, {
            building: undefined
        });

        super.dispose();
        // if (this.foundation) {
        //     if (this.foundation.material) {
        //         this.foundation.material.dispose(); // if unique
        //     }
        //     this.foundation.dispose();
        // }
        
        // this.foundation.dispose();
        // if (this.mesh) {
        //     if (this.mesh.material) {
        //         this.mesh.material.dispose(); // if unique
        //     }
        //     this.mesh.dispose();
        // }
    }

    get box() {
        return {w: this.buildingData.width, h: this.buildingData.length, building: this};
    }

    setPosition(x = this.position.x, y = this.position.y, z = this.position.z) {
        // if (this.foundation) {
        //     this.foundation.position.x = (x !== undefined) ? x : this.foundation.position.x;
        //     this.foundation.position.y = (y !== undefined) ? y : this.foundation.position.y;
        //     this.foundation.position.z = (z !== undefined) ? z : this.foundation.position.z;
        // }

        // if (this.mesh) {
        //     this.mesh.position.x = (x !== undefined) ? x : this.mesh.position.x;
        //     this.mesh.position.y = (y !== undefined) ? y : this.mesh.position.y;
        //     this.mesh.position.z = (z !== undefined) ? z : this.mesh.position.z;
        // }

        this.position.set(x, y, z);

        this.cornerX = Math.floor(this.position.x - this.width * .5);
        this.cornerY = Math.floor(this.position.z - this.length * .5);
    }

    

    getPosition() {
        return this.position;
    }

    destroyEvent() {
        console.log("building was destroyed:", this);
        
    }

    damage(amount) {
        this.health -= amount;
        // console.log("damaged, new health: ", this.health);

        if (this.health <= 0) {
            this.destroyEvent();
            this.dispose();
        }
    }

    update() {
        
    }
}


class House extends Building {
    constructor(variant = 0) {
        const dimensions = {w:4,l:6,h:2};
        switch (variant) {
            case 0:
                dimensions.w = 4;
                dimensions.l = 6;
                break;
            case 1:
                dimensions.w = 6;
                dimensions.l = 4;
            default:
                break;
        }
        super({
            width: dimensions.w,
            length: dimensions.l,
            height: dimensions.h
        });
    }
    
    update() {
        super.update();
    }
}

class Defense extends Building {
    constructor(options) {
        super(options);

        this.target = undefined;
        this.targetPosition = new BABYLON.Vector3(0,0,0);
        this.targetSpeed = 0;
        this.targetPredictedPosition = new BABYLON.Vector3(0,0,0);
        this.targetPreviousPosition = new BABYLON.Vector3(0,0,0);

        this.minRange = 0;
        this.maxRange = 20;

        this.active = true;
        
        this.attackIntervalTimer = 0;
        this.attackInterval = 1000; //ms

        this.attackDamage = 20;
    }


    clearTarget() {
        this.target = undefined;
    }

    attackEvent(target) {
        
    }

    attack(target) {
        // console.log("attacking target",target)
        if (this.attackDelay !== undefined && this.attackDelay !== 0) {
            if (this.attackDelay < 0) { // -1 - infinite delay

            } else {
                setTimeout(() => {
                    if (!target.isDisposed()) {
                        target.damage(this.attackDamage);
                    }
                }, this.attackDelay);
            }
        } else {
            target.damage(this.attackDamage);
        }
        
        this.attackEvent(target);
    }

    update(targets) {
        super.update();
        const delta = this.mesh.getEngine().getDeltaTime();//  * .001; default is in MS, multiply by .001 for seconds

        if (this.target?.isDisposed()) {
            this.target = undefined;
        }

        if (this.target === undefined) {
            this.attackIntervalTimer = 0;

            let closestDistance = this.maxRange;
            let closestTarget = undefined;
            for (const target of targets) {
                const targetDistance = BABYLON.Vector3.Distance(target.position, this.position);
                if (targetDistance < closestDistance && targetDistance > this.minRange) {
                    closestTarget = target;
                }
            }
            this.target = closestTarget;
            if (closestTarget) {
                this.targetPosition.copyFrom(this.target.position);
                this.targetPreviousPosition.copyFrom(this.targetPosition);
                // closestTarget.targetsOf.push(this);
            }
        } //else 
        if (this.target !== undefined) { // consider just using a seaparate if (to calculate onthe same framE?)
            this.targetPosition.copyFrom(this.target.position);
            if (BABYLON.Vector3.Distance(this.targetPosition, this.position) > this.maxRange) {
                this.target = undefined;
            }

            const differenceVector = this.targetPosition.subtract(this.targetPreviousPosition);
            const difference = differenceVector.length();
            differenceVector.normalize();
            differenceVector.scaleInPlace(difference * 10);

            // this.targetSpeed = difference;

            this.targetPredictedPosition.copyFrom(this.targetPosition.add(differenceVector));
            // this.targetPredictedPosition.copyFrom()

            this.targetPreviousPosition.copyFrom(this.targetPosition);


            if (this.attackIntervalTimer >= this.attackInterval) {
                this.attackIntervalTimer -= this.attackInterval;
                this.attack(this.target);
            }
            // console.log(this.attackIntervalTimer);
            this.attackIntervalTimer += delta;
        }
        
    }
}

class Turret extends Defense {
    constructor(options) {
        super(options);
        
        this.lookProgress = 0;
        this.lookStart = new BABYLON.Vector3(0,0,0);

        this.pivot = new BABYLON.TransformNode("turretPivot");
        // this.pivot.position.copyFrom(this.position)
        // this.pivot.position.y = 3
        this.barrel = BABYLON.MeshBuilder.CreateBox("turretBarrel",{width: .5, height: .5, depth: 2});
        this.barrel.parent = this.pivot;
        this.barrel.position.z = 1;
        
        this.particles = new BABYLON.GPUParticleSystem("particles", { capacity:1000 });
        this.particles.emitter = this.barrel;
        this.particles.particleEmitterType = new BABYLON.PointParticleEmitter();
        this.particles.direction1 = BABYLON.Vector3.Forward();
        this.particles.direction2 = BABYLON.Vector3.Forward();
        this.particles.particleTexture = new BABYLON.Texture("https://playground.babylonjs.com/textures/flare.png");
        this.particles.minEmitPower = 100; // 100 units in 1 second
        this.particles.maxEmitPower = 100;
        this.particles.maxLifeTime = 1;
        this.particles.minLifeTime = 1;
        this.particles.emitRate = 100;
        this.particles.color1 = new BABYLON.Color3(1,0,0);
        this.particles.color2 = this.particles.color1;
        this.particles.colorDead = this.particles.color1;

        // with a lifetime of 1, and 100 units in a second, its end will reach 100 units
        
        // this.particles.start();
        
        this.firing = false;
        this.firingTime = 100; // ms
        this.firingTimer = 0;
        this.cooldownTime = 1000; // ms

        this.attackDamage = 20;
    }

    setPosition(x, y, z) {
        super.setPosition(x, y, z);
        // this.position.set(x, y, z);
        this.pivot.position.copyFrom(this.position);
        this.pivot.position.y += 4;
        
    }

    attackEvent(target) {
        // console.log(target);
        super.attackEvent(target);
        // let lifeTime = BABYLON.Vector3.Distance(this.position, target.position) * .01;
        // lifeTime = lifeTime.toFixed(2)
        // console.log(lifeTime);
        // this.particles.maxLifeTime = lifeTime;
        // this.particles.minLifeTime = lifeTime;
        // this.particles.reset();
        this.particles.start();
        this.firing = true;
        this.firingTimer = 0;
    }

    update(targets) {
        super.update(targets);

        const delta = this.getEngine().getDeltaTime();

        if (this.active) {
            if (this.target) {
                // console.log(this.lookProgress)
                const direction = this.pivot.getDirection(BABYLON.Vector3.Forward());
                const lookPosition = this.target.position.clone(); // maybe dont use predicted position lol
                // if (this.lookProgress === 0) {
                //     this.lookStart.copyFrom(direction.add(this.pivot.position));
                // }
                // if (this.lookProgress < 1) {
                //     BABYLON.Vector3.LerpToRef(this.lookStart, this.targetPredictedPosition, this.lookProgress, lookPosition);
                //     this.lookProgress += .01;
                // } else if (this.lookProgress > 1) {
                //     this.lookProgress = 1;
                // }
                this.pivot.lookAt(lookPosition);              


            } else {
                this.lookProgress = 0;
            }
        }
    
        if (this.firingTimer >= this.firingTime || this.target === undefined) {
            // this.firingTimer -= this.firingTime;
            this.particles.stop();
            this.firing = false;
            this.firingTimer = 0;
        }

        if (this.firing) {
            this.firingTimer += delta;
        }
    
    }

    dispose() {
        this.pivot.dispose();
        this.particles.dispose();

        super.dispose();
    }
}



// fires projectile at targets last position, causing area damage
class Artillery extends Defense {
    constructor(options) {
        super(options);

        this.attackInterval = 2500;
        this.pivot = new BABYLON.TransformNode("artilleryPivot");
        this.pivot.parent = this;
        this.pivot.position.y = 2;
        // this.attackDelay = -1;

        this.minRange = 5;
        this.maxRange = 40;
    }

    attack(target) {
        // target.damage(this.attackDamage);
        this.pivot.lookAt(new BABYLON.Vector3(
            target.position.x,
            0,
            target.position.z
        ));
        const startPosition = this.position.clone();
        startPosition.y += 2;
        const projectile = new Projectile({
            startPosition,
            endPosition: target.position.clone(),
            middleHeight: 20
        });

        // console.log("artillery attack")
    }

}


class BuildingData {
    constructor(options) {
        this.variants = [];
        this.associatedClass = (options.associatedClass !== undefined) ? options.associatedClass : Building;
        if (options !== undefined) {

            for (const variant of options.variants) {
                this.addVariant(
                    variant.width,
                    variant.length,
                    variant.height,
                    variant.mesh
                )
            }
        }

        
    }

    addVariant(width, length, height, mesh=undefined) {
        if (mesh === undefined) {
            mesh = BABYLON.MeshBuilder.CreateBox("buildingMesh",{width: width - .1, height, depth: length - .1});
        }
        mesh.setEnabled(false);
        const variant = {width, length, height, mesh};
        this.variants.push(variant);
        return variant;
    }
}

class BuildingBuilder {
    constructor() {
        this.buildingData = {
            house: new BuildingData({
                variants: [
                    {width: 4, length: 6, height: 2, mesh: undefined}
                ]
            }),

            headquarters: new BuildingData({
                variants: [
                    {width: 6, length: 6, height: 3, mesh: undefined}
                ]
            }),
            
            oilRig: new BuildingData({
                variants: [
                    {width: 2, length: 2, height: 2, mesh: undefined}
                ]
            }),
            oilContainer: new BuildingData({
                variants: [
                    {width: 3, length: 3, mesh: BABYLON.MeshBuilder.CreateCylinder("oilContainer",{diameter: 3, height: 1.5})}
                ]
            }),

            turret: new BuildingData({
                variants: [
                    {width: 2, length: 2, mesh: BABYLON.MeshBuilder.CreateBox("turretBase",{width: 2, height: 4, depth: 2})}
                ],
                associatedClass: Turret
            }),
            artillery: new BuildingData({
                variants: [
                    {width: 2, length: 2, mesh: BABYLON.MeshBuilder.CreateBox("mortarBase",{width: 2, height: 2, depth: 2})}
                ],
                associatedClass: Artillery
            })
        }   
    }

    getBuildingData(type) {
        const buildingData = this.buildingData[type];
        if (buildingData === undefined) {
            console.log("no such building of type", type);
            return undefined;
        }
        return buildingData;
    }

    createBlock(type, variantIndex = 0) {
        const buildingData = this.buildingData[type];
        if (buildingData === undefined) {
            console.log("no such building of type", type);
            return undefined;
        }
        const data = buildingData.variants[variantIndex];

        return {w: data.width, h: data.length, type, variantIndex, buildingData};
    }

    createBlockArea(options, type = undefined, variantIndex = 0) {
        let data;
        let buildingData;
        if (type) {
            buildingData = this.buildingData[type];
            if (buildingData === undefined) {
                console.log("no such building of type", type);
                return undefined;
            }
            data = buildingData.variants[variantIndex];
        }
        

        const block = {type, variantIndex, buildingData, isBlockArea: true, foundationEnabled: options.foundationEnabled};

        if (options.mode === undefined) {
            options.mode = "area";
        }
            
        switch (options.mode) {
            case "area":
                block.w = (options.w !== undefined) ? options.w : 1;
                block.h = (options.h !== undefined) ? options.h : 1;
                block.mode = "area";
                break;
            case "grid":
                const rows = (options.rows !== undefined) ? options.rows : 1;
                const columns = (options.columns !== undefined) ? options.columns : 1;
                const rowGap = (options.rowGap !== undefined) ? options.rowGap : 0;
                const columnGap = (options.columnGap !== undefined) ? options.columnGap : 0;
                const paddingTop = (options.paddingTop !== undefined) ? options.paddingTop : 0;
                const paddingBottom = (options.paddingBottom !== undefined) ? options.paddingBottom : 0;
                const paddingLeft = (options.paddingLeft !== undefined) ? options.paddingLeft : 0;
                const paddingRight = (options.paddingRight !== undefined) ? options.paddingRight : 0;
                block.w = columns * data.width + (columnGap * (columns - 1)) + paddingLeft + paddingRight;
                block.h = rows * data.length + (rowGap * (rows - 1)) + paddingTop + paddingBottom;
                block.rows = rows;
                block.columns = columns;
                block.rowGap = rowGap;
                block.columnGap = columnGap;
                block.paddingTop = paddingTop;
                block.paddingBottom = paddingBottom;
                block.paddingLeft = paddingLeft;
                block.paddingRight = paddingRight;
                block.mode = "grid";
                break;
            default:
                block.w = (options.w !== undefined) ? options.h : 1;
                block.h = (options.h !== undefined) ? options.h : 1;
                block.mode = "area";
                break;
        }

        return block;
    }
    

    createBuilding(type, variantIndex = 0) {
        const buildingData = this.buildingData[type];
        if (buildingData === undefined) {
            console.log("no such building of type", type);
            return undefined;
        }
        const data = buildingData.variants[variantIndex];
        
        const building = new buildingData.associatedClass({
            width: data.width,
            length: data.length,
            height: data.height,
            mesh: data.mesh.createInstance(type + "Instance"),
            foundationEnabled: true
        });
        building.variantIndex = variantIndex;
        building.buildingData = data;
        building.type = type;
        return building;
    }

    createBuildingFromBlock(block) {
        const building = this.createBuilding(block.type, block.variantIndex);
        if (building) {
            building.setPosition(
                block.centerX * block.qX,
                undefined,
                block.centerY * block.qY
            );

            // building.cornerX = block.x * block.qX;
            // building.cornerY = block.y * block.qY;
        }
        return building;
    }

    createBuildingAreaFromBlock(block) {
        const buildings = [];
        switch (block.mode) {
            case "area":
                if (block.foundationEnabled) {
                    const building = new Building({width: block.w, length: block.h});
                    building.setPosition(
                        block.centerX * block.qX,
                        undefined,
                        block.centerY * block.qY
                    );
                    buildings.push(building);
                }
                break;
            case "grid":
                for (let row = 0; row < block.rows; row++) {
                    for (let column = 0; column < block.columns; column++) {
                        const building = this.createBuilding(block.type, block.variantIndex);
                        building.setPosition(
                            block.centerX * block.qX - block.w * .5 + block.paddingLeft + building.width * .5 + column * (building.width + block.columnGap),
                            undefined,
                            block.centerY * block.qY - block.h * .5 + block.paddingTop + building.length * .5 + row * (building.length + block.rowGap)
                        );

                        buildings.push(building);
                    }
                }
                break;
            default:
                break;
        }

        return buildings;
    }
}

export {
    BuildingBuilder,
    Building,
    Defense
};