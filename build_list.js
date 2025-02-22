const fs = require('fs');
const path = require('path');

const artFolder = path.join(__dirname, 'public', 'art');
const imagesFilePath = path.join(__dirname, 'images.json');
const metaFilePath = path.join(__dirname, 'image_meta.json');

// Function to scan the folder and build the images array
function buildImagesArray(folderPath) {
    const images = [];
    const files = fs.readdirSync(folderPath);

    files.forEach(file => {
        const filePath = path.join(folderPath, file);
        const stat = fs.statSync(filePath);

        if (stat.isFile() && /\.(png|jpg|jpeg|gif)$/i.test(file)) {
            images.push(file);
        }
    });

    return images;
}

// Build the JSON object
const imagesArray = buildImagesArray(artFolder);

// Write the JSON object to a file
fs.writeFileSync(imagesFilePath, JSON.stringify(imagesArray, null, 2), 'utf-8');

// Read the existing image_meta.json file
let imageMeta = {};
if (fs.existsSync(metaFilePath)) {
    imageMeta = JSON.parse(fs.readFileSync(metaFilePath, 'utf-8'));
}

// Update image_meta.json with new keys from images.json
imagesArray.forEach(image => {
    if (!imageMeta.hasOwnProperty(image)) {
        const imageNameWithoutExtension = image.replace(/\.[^/.]+$/, "");
        imageMeta[image] = imageNameWithoutExtension.replace(/_/g, " ");
    }
});

// Write the updated image_meta.json back to the file
fs.writeFileSync(metaFilePath, JSON.stringify(imageMeta, null, 2), 'utf-8');

console.log('images.json and image_meta.json have been updated successfully.');