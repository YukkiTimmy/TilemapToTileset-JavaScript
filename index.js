const inputImageContainer = document.getElementById("input-image");
const outputImageContainer = document.getElementById("output-image");

const fileUpload = document.getElementById("upload-file");

let tileWidth = 16;
let tileHeight = 16;

let loadedImage = null;


fileUpload.addEventListener("change", handleFiles, false);

function handleFiles(event) {
  let reader = new FileReader();
  reader.onload = function(){
    let upload = new Image();
    upload.onload = function() {
      inputImageContainer.src = upload.src;
      loadedImage = upload;
      startTiling(upload);
    };
    upload.src = reader.result;
  }

  reader.readAsDataURL(event.target.files[0]);
}

function startTiling(image) {
  const worker = new Worker('worker.js');

  worker.onmessage = function(event) {
    const unique_tiles = event.data;

    // Berechne die Größe des quadratischen Bildes basierend auf der Anzahl der Tiles
    const numTiles = unique_tiles.length;
    const tilesPerRow = Math.ceil(Math.sqrt(numTiles));
    const imageSize = Math.ceil(Math.sqrt(unique_tiles.length)) * tileWidth;

    // Ein temporäres Canvas-Element erstellen
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = imageSize;
    tempCanvas.height = imageSize;
    const ctx = tempCanvas.getContext('2d');

    // Zeichne jedes Tile auf das Canvas
    unique_tiles.forEach((tile, index) => {
        const tileX = (index % tilesPerRow) * tileWidth;
        const tileY = Math.floor(index / tilesPerRow) * tileHeight;
        const tileImageData = new ImageData(tile, tileWidth, tileHeight);
        ctx.putImageData(tileImageData, tileX, tileY);
    });

    // Das Canvas-Element in ein Bild umwandeln
    const imageURL = tempCanvas.toDataURL();
    const img = new Image();
    outputImageContainer.src = imageURL;
};

  worker.postMessage({ imageUrl: image.src, tileWidth, tileHeight });
}
