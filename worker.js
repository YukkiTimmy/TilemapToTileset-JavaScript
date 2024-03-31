onmessage = function(event) {
    const { imageUrl, tileWidth, tileHeight } = event.data;
    
    fetch(imageUrl)
      .then(response => response.blob())
      .then(blob => createImageBitmap(blob))
      .then(image => {
        const result = computeTileMap(image, tileWidth, tileHeight);
        postMessage(result);
      })
      .catch(error => {
        console.error('Fehler beim Laden des Bildes:', error);
    });
};


class Tile {
    constructor(id, tileData) {
        this.id = id;
        this.tileData = tileData;

        this.amount = 1;

        this.north = [];
        this.east = [];
        this.south = [];
        this.west = [];
    };
}


const dirX = [0, 1, 0, -1];
const dirY = [-1, 0, 1, 0];

function computeTileMap(loadedImage, tileWidth, tileHeight) {
    let unique_tiles = [];

    const canvas = new OffscreenCanvas(loadedImage.width, loadedImage.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(loadedImage, 0, 0);
    const imageData = ctx.getImageData(0, 0, loadedImage.width, loadedImage.height);
    const pixels = new Uint8ClampedArray(imageData.data.buffer);

    const rows = Math.floor(loadedImage.width / tileWidth);
    const cols = Math.floor(loadedImage.height / tileHeight);

    let count = 0;


    // go through every tile in the Tilemap
    for (let y = 0; y < cols; y++) {
        for (let x = 0; x < rows; x++) {
            const tileData = getTileData(pixels, loadedImage.width, x * tileWidth, y * tileHeight, tileWidth, tileHeight);

            let currentTile = null;

            // Check if the tile i unique
            let isUnique = true;
            for (const [i, tile] of unique_tiles.entries()) {
                if (compareTiles(tile.tileData, tileData)) {
                    isUnique = false;
                    unique_tiles[i].amount++;
                    currentTile = unique_tiles[i];
                    break;
                }
            }

            // Add it to the list of tiles if it is unique
            if (isUnique) {
                currentTile = new Tile(unique_tiles.length, tileData);
                unique_tiles.push(currentTile);
            }

            // Check every neighbouring tile and add them to the tile 
            for (let d = 0; d < 4; d++) {
                let dx = x + dirX[d];
                let dy = y + dirY[d];

                if (dx < 0 ||
                    dx >= rows ||
                    dy < 0 ||
                    dy >= cols) continue;
                                
                const touchingTileData = getTileData(pixels, loadedImage.width, dx * tileWidth, dy * tileHeight, tileWidth, tileHeight);

                isUnique = true;
                let neighbouringTile = null;

                // Check if the neighbour is already in the list of unique tiles
                for (const [i, tile] of unique_tiles.entries()) 
                {
                    neighbouringTile = tile;
                    if (compareTiles(tile.tileData, touchingTileData)) {
                        isUnique = false;
                        break;
                    }  
                }


                // if it is a new Tile, add it to the unique list and the direction lists
                if (isUnique) {
                    let newTile = new Tile(unique_tiles.length, touchingTileData);
                    unique_tiles.push(newTile);
                    
                    if (d == 0) currentTile.north.push(newTile);
                    else if (d == 1) currentTile.east.push(newTile);
                    else if (d == 2) currentTile.south.push(newTile);
                    else if (d == 3) currentTile.west.push(newTile); 
                    newTile.amount--; // account for amount calculation above
                } else {
                    // if its not a unique tile, add it to the direction lists
                    let isAlreadyInList;
                    if (d == 0) isAlreadyInList = currentTile.north.find(tile => tile.id === neighbouringTile.id) !== undefined;
                    else if (d == 1) isAlreadyInList = currentTile.east.find(tile => tile.id === neighbouringTile.id) !== undefined;
                    else if (d == 2) isAlreadyInList = currentTile.south.find(tile => tile.id === neighbouringTile.id) !== undefined;
                    else if (d == 3) isAlreadyInList = currentTile.west.find(tile => tile.id === neighbouringTile.id) !== undefined;

                    if (!isAlreadyInList) {
                        if (d == 0) currentTile.north.push(neighbouringTile);
                        else if (d == 1) currentTile.east.push(neighbouringTile);
                        else if (d == 2) currentTile.south.push(neighbouringTile);
                        else if (d == 3) currentTile.west.push(neighbouringTile);
                    }
                }
            
            }
        
        }
    }

    count++;
    console.log(unique_tiles);
    return unique_tiles;
}

function getTileData(pixels, width, startX, startY, tileWidth, tileHeight) {
    const tileData = new Uint8ClampedArray(tileWidth * tileHeight * 4);

    for (let y = 0; y < tileHeight; y++) {
        for (let x = 0; x < tileWidth; x++) {
            const sourceIndex = ((startY + y) * width + startX + x) * 4;
            const destIndex = (y * tileWidth + x) * 4;
            for (let i = 0; i < 4; i++) {
                tileData[destIndex + i] = pixels[sourceIndex + i];
            }
        }
    }

    return tileData;
}

function compareTiles(tileData1, tileData2) {
    if (tileData1.length !== tileData2.length) {
        return false;
    }
    for (let i = 0; i < tileData1.length; i++) {
        if (tileData1[i] !== tileData2[i]) {
            return false;
        }
    }
    return true;
}
