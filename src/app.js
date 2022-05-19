import { Navigation } from "./navigation.js";
import { GridMap } from "./gridmap.js";
import { BuildingBuilder, Building, Defense } from "./building.js";
import { Prando } from "../lib/prando/prando.js";
import { UnitCreator } from "./unit.js";
import { UI, Card } from "./ui.js";
import { PointIndicator, Effect } from "./effect.js";
import { Projectile } from "./projectile.js";

class App {
    constructor(_canvas = undefined) {
        if (_canvas) {
            this.canvas = _canvas;
        } else {
            const canvas = document.createElement("canvas");
            canvas.style.width = "100%";
            canvas.style.height = "100%";
            canvas.id = "renderCanvas";
            document.body.appendChild(canvas);
            this.canvas = canvas;
        }

        const armyCounts = {};
        let selectedCard = undefined;

        const unitCreator = new UnitCreator();
        const armyCards = [];
        const trainCards = [];
        for (const unitData of unitCreator.getTypes()) {
            
            armyCounts[unitData.type] = 0;

            const trainCard = new Card({
                hideRemoveButton: true,
                hideArmyCount: true,
                container: UI.trainContainer,
                imageURL: unitData.thumbnailURL,
                data: unitData,
                title: unitData.title,
                price: unitData.price,
                size: unitData.size
            });

            trainCard.buttonElement.addEventListener("click", (e) => {
                // console.log(trainCard.data);
                armyCounts[trainCard.data.type] += 1;
                trainCard.associatedArmyCard.setArmyCount(armyCounts[trainCard.data.type]);
                // trainCard.associatedArmyCard.count += 1;
                if (trainCard.associatedArmyCard.isHidden()) {
                    trainCard.associatedArmyCard.setHidden(false);
                }
            });

            trainCards.push(trainCard);

            const armyCard = new Card({
                hideInfoButton: true,
                container: UI.armyContainer,
                imageURL: unitData.thumbnailURL,
                data: unitData,
                title: unitData.title,
                price: unitData.price,
                size: unitData.size,
                hidePrice: true,
                isSquare: true
            });
            armyCard.setHidden(true);
            trainCard.associatedArmyCard = armyCard;

            // armyCard.count = 0;

            armyCard.buttonElement.addEventListener("click", (e) => {
                if (armyCard.selectable) {
                    if (selectedCard) {
                        selectedCard.setSelected(false);
                    }
                    selectedCard = armyCard;
                    armyCard.setSelected(true);
                }
            });

            armyCard.removeButton.addEventListener("click", (e) => {
                armyCounts[armyCard.data.type] -= 1;
                armyCard.setArmyCount(armyCounts[trainCard.data.type]);
                if (armyCounts[armyCard.data.type] === 0) {
                    armyCard.setHidden(true);
                }
            });

            armyCards.push(armyCard);
        }


        const gl = this.canvas.getContext("webgl2");
        const engine = new BABYLON.Engine(gl);
        BABYLON.activeEngine = engine;
        const scene = new BABYLON.Scene(engine);
        // scene.enablePhysics();

        window.addEventListener("resize", function() {
            engine.resize();
        });

        const inputMap = {};
        scene.onKeyboardObservable.add(function(kbInfo) {
            inputMap[kbInfo.event.key] = kbInfo.type == BABYLON.KeyboardEventTypes.KEYDOWN;
        });


        const cameraTarget = new BABYLON.Vector3(0,0,0);
        // const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 3, new BABYLON.Vector3(0, 0, 0));
        const camera = new BABYLON.TargetCamera("camera", new BABYLON.Vector3(60,60,60));
        // camera.attachControl(this.canvas, true);
        camera.setTarget(cameraTarget);
        // future: limit rotation to prevent going underground
        camera.rotateAmountX = 0;
        camera.rotateAmountY = 0;
        let sensitivity = .005
        let cameraDistance = 60;
        
        const cameraRotateEvent = (e) => {
            if (e) {
                camera.rotateAmountX += e.movementX * sensitivity;
                camera.rotateAmountY += e.movementY * sensitivity;
            }
            // const cameraDistance = 60;
            camera.position.x = Math.sin(camera.rotateAmountX);
            camera.position.y = 1;
            camera.position.z = Math.cos(camera.rotateAmountX);
            camera.position.scaleInPlace(cameraDistance);
            camera.setTarget(cameraTarget);
            // camera.position.z = 
        }

        document.addEventListener("mousewheel", (e) => {
            if (e.target === this.canvas) {
                cameraDistance += e.deltaY * .05;
                cameraRotateEvent();
            }
        });

        cameraRotateEvent();


        const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(.6, 1, .5));

        const ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 100, height: 100});
        ground.position.y = -.1; // to show foundations
        const groundMaterial = new BABYLON.StandardMaterial("groundMaterial");
        groundMaterial.diffuseColor = new BABYLON.Color3(.3,.4,.2);
        ground.material = groundMaterial;

        // const box = BABYLON.MeshBuilder.CreateBox("box", {});



        const gridMap = new GridMap(100, 100, {
            offsetX: -50,
            offsetY: -50
        });

        unitCreator.gridMap = gridMap;
        BuildingBuilder.gridMap = gridMap;

        const seed = 0;
        const rng = new Prando(seed);

        const buildingBuilder = new BuildingBuilder();

        
        const defenses = [];
        const buildings = [];

        for (let qX = -1; qX <= 1; qX += 2) {
            for (let qY = -1; qY <= 1; qY += 2) {
                const blocks = [];

                for (let i = 0; i < 10; i++) {
                    blocks.push(buildingBuilder.createBlock("house"));
                }
        
                for (let i = 0; i < 5; i++) {
                    blocks.push(buildingBuilder.createBlock("oilContainer"));
                }

                for (let i = 0; i < 1; i++) {
                    const area = buildingBuilder.createBlockArea({
                        w:4,
                        h:4,
                        foundationEnabled: true,
                        mode:"grid",
                        rows: 3,
                        columns: 2,
                        columnGap: 1,
                        rowGap: 0,
                        // paddingTop: 1,
                        // paddingBottom: 2,
                        // paddingLeft: 3,
                        // paddingRight: 1
                    }, "house");
                    // console.log(area);
                    blocks.push(area);
                }

                for (let i = 0; i < 1; i++) {
                    blocks.push(buildingBuilder.createBlock("turret"));
                }

                for (let i = 0; i < 1; i++) {
                    blocks.push(buildingBuilder.createBlock("artillery"));
                }
        
                shuffle(blocks, rng);

                if (qX === 1 && qY === 1) {
                    // blocks.unshift(buildingBuilder.createBlock("headquarters"));
                    const area = buildingBuilder.createBlockArea({
                        w:4,
                        h:4,
                        foundationEnabled: true,
                        mode:"grid",
                        paddingTop: 1,
                        paddingBottom: 1,
                        paddingLeft: 1,
                        paddingRight: 1
                    }, "headquarters");
                    // console.log(area);
                    blocks.unshift(area);
                }

                gridMap.packBlocks(blocks);


                let fitCount = 0;
                for (const block of blocks) {
                    if (!block.fit) {
                        continue;
                    }

                    fitCount += 1;
                    block.qX = qX;
                    block.qY = qY;

                    if (block.isBlockArea) {
                        const areaBuildings = buildingBuilder.createBuildingAreaFromBlock(block);
                        for (const building of areaBuildings) {
                            buildings.push(building); // consider not doing this for foundation-only areas
                            gridMap.setCellsFromBuilding(building, {
                                building
                            });
                            // navigation.addObstacleFromBuilding(building);
                        }
                    } else {
                        const building = buildingBuilder.createBuildingFromBlock(block);
                        // navigation.addObstacleFromBuilding(building);
                        gridMap.setCellsFromBuilding(building, {
                            building
                        });

                        if (building.foundation) {
                            building.foundation.material.diffuseColor.set(rng.next(),rng.next(),rng.next()); // for testing
                        }

                        // console.log(building);
                        if (building instanceof Defense) {
                            // console.log("defense building")
                            defenses.push(building);
                            buildings.push(building);
                        } else {
                            buildings.push(building);
                        }
                    }
                    
                }
                
                console.log("number of non fitting blocks:",blocks.length - fitCount);
            }
        }

        // gridmap test
        
        // gridMap.createDebugMesh();

        // for (let x = -3; x < 3; x++) {
        //     for (let y = -3; y < 3; y++) {
        //         console.log(gridMap.getCellFromPosition(x, y))
        //     }
        // }

        
        

        const units = [];
        const army = [];
        
        Effect.targets = army;
        const effects = [];
        Effect.onCreate = (effect) => {
            effect.targets = army;
            effects.push(effect);
        }

        const projectiles = [];
        Projectile.onCreate = (projectile) => {
            projectiles.push(projectile);
            // console.log("new projectile registered",projectile.position)
        }


        engine.runRenderLoop(() => {
            
            for (let i = 0; i < buildings.length; i++) {
                const building = buildings[i];
                if (building.isDisposed()) {
                    buildings.splice(i, 1);
                    i -= 1;
                } else {
                    building.update(army);
                }
                
            }

            for (let i = 0; i < army.length; i++) {
                const unit = army[i];
                unit.update(buildings);
                if (unit.health <= 0) {
                    unit.dispose();
                    army.splice(i, 1);
                    i -= 1;
                }
            }


            for (let i = 0; i < projectiles.length; i++) {
                const projectile = projectiles[i];
                if (projectile.isDisposed()) {
                    projectiles.splice(i, 1);
                    i -= 1;
                } else {
                    projectile.update();
                }
            }

            for (let i = 0; i < effects.length; i++) {
                const effect = effects[i];
                if (effect.isDisposed()) {
                    effects.splice(i, 1);
                    i -= 1;
                }
                effect.update();
            }

            scene.render()
        });

        
        this.engine = engine;
        this.scene = scene;
        this.inputMap = inputMap;

        let lastPosition = undefined;//new BABYLON.Vector3(0,0,0);
        
        let pathLine;//BABYLON.MeshBuilder.CreateDashedLines("ribbon", {points: pathPoints, updatable: true, instance: pathLine});
        

        let holdTimeout;
        let holding = false;
        const holdTimeoutDelay = 200;

        let rightHolding = false;

        let holdInterval;
        const holdIntervalDelay = 100;

        const pointerEvent = (e) => {
            
            const normal = screenToWorld( // normalized in the function
                new BABYLON.Vector3(scene.pointerX, scene.pointerY, 1), // mouse position
                scene
            );
            const pickInfo = raycast(camera.position, normal, scene);
            
            if (pickInfo?.pickedPoint) {
                
                const pointIndicator = new PointIndicator({position: pickInfo.pickedPoint})
                effects.push(pointIndicator);


                if (selectedCard) {
                
                    const unitData = selectedCard.data;
                    const unit = unitCreator.createUnit(unitData.type, {
                        position: pickInfo.pickedPoint
                    });
    
                    army.push(unit);
                }

            }
 
        }

        

        scene.onPointerDown = (e, pickInfo) => {
            
            if (e.button === 0) { // left click
                clearTimeout(holdTimeout);
                clearInterval(holdInterval);
                holdTimeout = setTimeout(() => {
                    console.log("hold");
                    holding = true;
                    holdInterval = setInterval(() => {
                        pointerEvent(e);
                    }, holdIntervalDelay);
                }, holdTimeoutDelay);
    
                pointerEvent(e);
            }

            if (e.button === 2) {
                rightHolding = true;
                // console.log("rightholding on")
            }
        }

        scene.onPointerUp = (e, pickInfo) => {
            
            if (e.button === 0) {
                clearTimeout(holdTimeout);
                clearInterval(holdInterval);
                holding = false;
            }
            
            if (e.button === 2) {
                rightHolding = false;
                // console.log("rightholding off")
            }
        }

        scene.onPointerMove = (e) => {
            if (rightHolding) {
                cameraRotateEvent(e);
            }
        }


        const initializeGame = function() {
            console.log("initializing");

        }

        let initializeGameTimeout;

        UI.startButton.addEventListener("click", () => {
            if (!initializeGameTimeout) {
                console.log("starting initialization")

                UI.startButton.classList.toggle("disappear", true);
                UI.trainPanel.hidden = true; // doesnt work
                UI.trainPanel.style.display = "none";
                setTimeout(() => {
                    UI.startButton.hidden = true;
                    UI.startButton.disabled = true;
                }, 200);
                initializeGameTimeout = setTimeout(initializeGame, 1000);

                for (const card of armyCards) {
                    card.removeButton.hidden = true;
                    card.selectable = true;
                }

            }
        });

    }
}

export {App};