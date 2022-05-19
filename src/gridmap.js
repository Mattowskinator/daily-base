
import { BinaryHeap } from "../lib/astar/binary-heap.js";



// pathfinding based on Brian Grinstead's A* path finder

/**
 * @param {Number} w width
 * @param {Number} h height (length)
 */ 

class GridMap {
    constructor(w, h, options) {
        this.graph = {};
        
        this.width = w;
        this.height = h;
        this.offsetX = options.offsetX || -w * .5;
        this.offsetY = options.offsetY || -h * .5;
        this.cellOffsetX = options.cellOffsetX || .5;
        this.cellOffsetY = options.cellOffsetY || .5;

        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                const cell = this.setCell(x, y, {
                    x, y, 
                    worldX: x + this.offsetX + this.cellOffsetX, worldY: y + this.offsetY + this.cellOffsetY,
                    weight: 1
                });
                this.cleanCell(cell);
            }
        }

        this.dirtyCells = [];
        

        const mata = new BABYLON.StandardMaterial("cellMaterialA");
        mata.emissiveColor = new BABYLON.Color3(1,.7,.5);
        mata.backFaceCulling = true;
        mata.depthFunction = BABYLON.activeEngine._gl.ALWAYS;
        mata.disableLighting = true;
        // mata.alpha = .5;
        mata.wireframe = true;
        this.debugCellMaterialA = mata;

        const matb = new BABYLON.StandardMaterial("cellMaterialB");
        matb.emissiveColor = new BABYLON.Color3(.3,.5,1);
        matb.backFaceCulling = true;
        matb.depthFunction = BABYLON.activeEngine._gl.ALWAYS;
        matb.disableLighting = true;
        // mata.alpha = .5;
        matb.wireframe = true;
        this.debugCellMaterialB = matb;

        this.debugCellMeshA = new BABYLON.MeshBuilder.CreatePlane("cellPlaneA", {size: 1});
        this.debugCellMeshA.rotation.x = Math.PI * .5;
        this.debugCellMeshA.material = this.debugCellMaterialA;
        this.debugCellMeshA.position.y = 0;
        this.debugCellMeshA.setEnabled(false);

        this.debugCellMeshB = new BABYLON.MeshBuilder.CreatePlane("cellPlaneB", {size: 1});
        this.debugCellMeshB.rotation.x = Math.PI * .5;
        this.debugCellMeshB.material = this.debugCellMaterialB;
        this.debugCellMeshB.position.y = 0;
        this.debugCellMeshB.setEnabled(false);

        // this.createDebugMesh();
    }

    createDebugMesh() {
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                const cell = this.getCell(x, y);
                let instance;
                if (cell.building) {
                    instance = this.debugCellMeshA.createInstance("");
                } else {
                    instance = this.debugCellMeshB.createInstance("");
                }
                instance.position.set(cell.worldX, 0, cell.worldY);
                instance.setEnabled(true);
            }
        }
    }

    // packs blocks from top left to bottom right
    // blocks is an array represented as [{w:, h:},...]
    packBlocks(blocks) {
        // const packer = new Packer(1000,1000); // new GrowingPacker();
        const packer = new GrowingPacker();

        packer.fit(blocks);

        // let string = "";

        for(var n = 0 ; n < blocks.length ; n++) {
            var block = blocks[n];
            if (block.fit) {
                // DrawRectangle(block.fit.x, block.fit.y, block.w, block.h);
                
                // string += block.fit.x.toString() + "," + block.fit.y.toString() + ","  + block.w.toString() + ","  + block.h.toString() + "\n";
                // console.log(block.fit.x, block.fit.y, block.w, block.h)
                block.x = block.fit.x;
                block.y = block.fit.y;
                block.centerX = block.fit.x + block.w * .5;
                block.centerY = block.fit.y + block.h * .5;
                block.gridCenterX = block.fit.x + Math.floor(block.w * .5);
                block.gridCenterY = block.fit.y + Math.floor(block.h * .5);
            }
        }
        // console.log(string);

        return blocks;
    }

    setCell(x, y, dictionary = {}) {
        if (!this.graph[x]) {
            this.graph[x] = {};
        }
        if (this.graph[x][y] === undefined) {
            this.graph[x][y] = {};
        }
        const data = this.graph[x][y];
        for (const [key, value] of Object.entries(dictionary)) {
            data[key] = value;
        }
        return data;
    }

    setCellFromPosition(x, y, dictionary) {
        // console.log("setin cell at ", x - this.offsetX, y - this.offsetY)
        return this.setCell(x - this.offsetX, y - this.offsetY, dictionary);
    }

    getCell(x, y, key = undefined) {
        if (this.graph[x] === undefined) {
            return;
        }
        if (key === undefined) {
            return this.graph[x][y];
        }
        return this.graph[x][y][key];
    }

    getCellFromPosition(x, y, key = undefined) {
        // console.error(x - this.offsetX, y - this.offsetY)
        return this.getCell(x - this.offsetX, y - this.offsetY, key);
    }

    setCellsFromBuilding(building, dictionary) {
        // console.log("setting cells for ", building, building.width, building.length)
        for (let x = 0; x < building.width; x++) {
            for (let y = 0; y < building.length; y++) {
                // console.log(building.cornerX + x, building.cornerY + y);
                this.setCellFromPosition(building.cornerX + x, building.cornerY + y, dictionary);
            }
        }
        
    }


    getNeighbors(x, y, diagonal = true) {
        const cells = [];

        let cell = this.getCell(x - 1, y);
        if (cell) {cells.push(cell);}
        cell = this.getCell(x + 1, y);
        if (cell) {cells.push(cell);}
        cell = this.getCell(x, y - 1);
        if (cell) {cells.push(cell);}
        cell = this.getCell(x, y + 1);
        if (cell) {cells.push(cell);}

        if (diagonal) {
            cell = this.getCell(x - 1, y - 1);
            if (cell) {cells.push(cell);}
            cell = this.getCell(x + 1, y - 1);
            if (cell) {cells.push(cell);}
            cell = this.getCell(x - 1, y + 1);
            if (cell) {cells.push(cell);}
            cell = this.getCell(x + 1, y + 1);
            if (cell) {cells.push(cell);}
        }

        return cells
    }

    // resets astar data in cell
    cleanCell(cell) {
        cell.f = 0;
        cell.g = 0;
        cell.h = 0;
        cell.visited = false;
        cell.closed = false;
        cell.parent = null;
    }

    cleanDirty() {
        // for (let i = 0; i < this.dirtyNodes.length; i++) {
        //     astar.cleanNode(this.dirtyNodes[i]);
        // }
        // this.dirtyNodes = [];
        for (const cell of this.dirtyCells) {
            this.cleanCell(cell);
        }
        this.dirtyCells = [];
    }

    markDirty(cell) {
        this.dirtyCells.push(cell);
    }

    getCost(cell, fromNeighbor) {
        if (fromNeighbor && fromNeighbor.x != cell.x && fromNeighbor.y != cell.y) {
            return cell.weight * 1.41421;
        }
        return cell.weight;
    }

    findPathFromPositions(startPosition, endPosition) {
        console.log("finding path from positions")
        return this.findPath(
            Math.floor(startPosition.x - this.offsetX),// + this.cellOffsetX), 
            Math.floor(startPosition.z - this.offsetY),// + this.cellOffsetY),
            Math.floor(endPosition.x - this.offsetX),// + this.cellOffsetX), 
            Math.floor(endPosition.z - this.offsetY)// + this.cellOffsetY)
        )
    }

    findPath(x1, y1, x2, y2) {
        const openHeap = new BinaryHeap(function(cell) {
            return cell.f;
        });
        
        const start = this.getCell(x1, y1);
        const end = this.getCell(x2, y2);
        if (!start || !end) {
            return [];
        }

        this.cleanDirty();
        // options = options || {};
        const heuristic = function(pos0, pos1) {
            var D = 1;
            var D2 = Math.sqrt(2);
            var d1 = Math.abs(pos1.x - pos0.x);
            var d2 = Math.abs(pos1.y - pos0.y);
            return (D * (d1 + d2)) + ((D2 - (2 * D)) * Math.min(d1, d2));
        } //options.heuristic || astar.heuristics.manhattan;
        const closest = true;//options.closest || false;

        let closestCell = start; // set the start node to be the closest if required
        // console.log(start, end)
        start.h = heuristic(start, end);
        this.markDirty(start);

        openHeap.push(start);

        while (openHeap.size() > 0) {

            // Grab the lowest f(x) to process next.  Heap keeps this sorted for us.
            const currentCell = openHeap.pop();

            // End case -- result has been found, return the traced path.
            if (currentCell === end) {
                return this.pathTo(currentCell);
            }

            // Normal case -- move currentCell from open to closed, process each of its neighbors.
            currentCell.closed = true;

            // Find all neighbors for the current node.
            const neighbors = this.getNeighbors(currentCell.x, currentCell.y);

            for (var i = 0, il = neighbors.length; i < il; ++i) {
                const neighbor = neighbors[i];

                // if (neighbor.closed || neighbor.isWall()) { // old
                // console.log(neighbor.building)
                if (neighbor.closed || (neighbor.building && !neighbor.building.isDisposed())) {
                    // Not a valid node to process, skip to next neighbor.
                    continue;
                }

                // The g score is the shortest distance from start to current node.
                // We need to check if the path we have arrived at this neighbor is the shortest one we have seen yet.
                const gScore = currentCell.g + this.getCost(neighbor, currentCell);
                const beenVisited = neighbor.visited;

                if (!beenVisited || gScore < neighbor.g) {

                    // Found an optimal (so far) path to this node.  Take score for node to see how good it is.
                    neighbor.visited = true;
                    neighbor.parent = currentCell;
                    neighbor.h = neighbor.h || heuristic(neighbor, end);
                    neighbor.g = gScore;
                    neighbor.f = neighbor.g + neighbor.h;
                    this.markDirty(neighbor);
                    if (closest) {
                        // If the neighbour is closer than the current closestNode or if it's equally close but has
                        // a cheaper path than the current closest node then it becomes the closest node
                        if (neighbor.h < closestCell.h || (neighbor.h === closestCell.h && neighbor.g < closestCell.g)) {
                            closestCell = neighbor;
                        }
                    }

                    if (!beenVisited) {
                        // Pushing to heap will put it in proper place based on the 'f' value.
                        openHeap.push(neighbor);
                    } else {
                        // Already seen the node, but since it has been rescored we need to reorder it in the heap
                        openHeap.rescoreElement(neighbor);
                    }
                }
            }
        }

        if (closest) {
            return this.pathTo(closestCell);
        }

        // No result was found - empty array signifies failure to find path.
        return [];
    }

    pathTo(cell) {
        var curr = cell;
        var path = [];
        while (curr.parent) {
            path.unshift(curr);
            curr = curr.parent;
        }
        return path;
    }
    
}


export {GridMap};