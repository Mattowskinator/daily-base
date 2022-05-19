
class Navigation {
    constructor(options, onLoad) {
        // const navigationPlugin = new BABYLON.RecastJSPlugin();
        const navigation = this;
        async function buildNav() {
            Recast();
            console.log('recast loaded');
            const navigationPlugin = new BABYLON.RecastJSPlugin();
            console.log('nav plugin loaded');

            const staticMesh = options.staticMesh; // most likely just the ground plane

            navigationPlugin.createNavMesh([staticMesh], {
                cs: 1,
                ch: 1,
                walkableSlopeAngle: 0,
                walkableHeight: 0.0,
                walkableClimb: 0,
                walkableRadius: 1,
                maxEdgeLen: 12.,
                maxSimplificationError: 1.3,
                minRegionArea: 8,
                mergeRegionArea: 20,
                maxVertsPerPoly: 6,
                detailSampleDist: 6,
                detailSampleMaxError: 15,
                borderSize: 1,
                tileSize:20
            });

            // var navmeshdebug = navigationPlugin.createDebugNavMesh();
            // navmeshdebug.position = new BABYLON.Vector3(0, 0.01, 0);

            // var matdebug = new BABYLON.StandardMaterial("matdebug");
            // matdebug.diffuseColor = new BABYLON.Color3(0.1, 0.2, 1);
            // matdebug.alpha = 0.2;
            // navmeshdebug.material = matdebug;


            navigation.navigationPlugin = navigationPlugin;

            if (onLoad) {
                onLoad(navigation);
            }
        }

        buildNav();
    }

    addObstacle(shape, options) {
        const position = new BABYLON.Vector3(options.x, 0, options.y);
        const extent = new BABYLON.Vector3(options.w * .5, 1, options.h * .5);
        const angle = 0;
        const obstacle = this.navigationPlugin.addBoxObstacle(position, extent, angle);
        return obstacle;
    }

    addObstacleFromBlock(block, shape = "rectangle") {
        const obstacle = this.addObstacle(shape, {
            x: block.centerX,
            y: block.centerY,
            w: block.w,
            h: block.h
        });
        return obstacle;
    }

    addObstacleFromBuilding(building, shape = "rectangle") {
        const obstacle = this.addObstacle(shape, {
            x: building.position.x,
            y: building.position.z,
            w: building.width,
            h: building.length
        });
        return obstacle
    }

    removeObstacle(obstacle) {
        this.navigationPlugin.removeObstacle(obstacle);
    }
}

export {Navigation};