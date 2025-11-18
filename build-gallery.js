const fs = require('fs');
const path = require('path');

// Paths
const furPath = path.join(__dirname, 'images', 'Gallery', 'Fur');
const otherPath = path.join(__dirname, 'images', 'Gallery', 'Other');
const furThumbPath = path.join(furPath, 'Thumbnails');
const otherThumbPath = path.join(otherPath, 'Thumbnails');

// Function to determine aspect ratio category
function getAspectRatio(width, height) {
    const ratio = width / height;
    
    if (Math.abs(ratio - 1) < 0.1) return '1x1'; // Square
    if (Math.abs(ratio - (3/4)) < 0.1) return '3x4'; // Portrait
    if (Math.abs(ratio - (4/3)) < 0.1) return '4x3'; // Landscape
    if (Math.abs(ratio - (5/4)) < 0.1) return '5x4'; // Slightly portrait
    if (Math.abs(ratio - (4/5)) < 0.1) return '4x5'; // Slightly landscape
    if (ratio >= 1.8) return '2x1'; // Wide panorama
    
    // Default to closest match
    if (ratio > 1) return '4x3';
    return '3x4';
}

// Function to get image dimensions using Node.js (simple approach)
function getImageDimensions(imagePath) {
    try {
        // For now, we'll use a placeholder - you'll need sharp package for actual dimensions
        // This is a simplified version
        return { width: 1000, height: 667 }; // Placeholder
    } catch (error) {
        console.error(`Error reading ${imagePath}:`, error);
        return { width: 1000, height: 667 };
    }
}

// Function to extract date from filename or use file modification date
function extractDate(filename, filePath) {
    const stat = fs.statSync(filePath);
    return stat.mtime.toISOString().split('T')[0];
}

// Scan directory and build gallery array
function scanDirectory(dirPath, thumbPath, category) {
    const files = fs.readdirSync(dirPath).filter(file => 
        /\.(jpg|jpeg|png)$/i.test(file) && fs.statSync(path.join(dirPath, file)).isFile()
    );
    
    return files.map(file => {
        const fullPath = path.join(dirPath, file);
        const thumbFile = path.join(thumbPath, file);
        
        // Check if thumbnail exists
        if (!fs.existsSync(thumbFile)) {
            console.warn(`Warning: Thumbnail missing for ${file}`);
        }
        
        const dimensions = getImageDimensions(fullPath);
        const aspectRatio = getAspectRatio(dimensions.width, dimensions.height);
        const date = extractDate(file, fullPath);
        
        return {
            path: `images/Gallery/${category === 'furry' ? 'Fur' : 'Other'}/${file}`,
            thumbnail: `images/Gallery/${category === 'furry' ? 'Fur' : 'Other'}/Thumbnails/${file}`,
            category: category,
            date: date,
            aspect: aspectRatio
        };
    });
}

// Build gallery
console.log('Building gallery configuration...');

const furryImages = scanDirectory(furPath, furThumbPath, 'furry');
const otherImages = scanDirectory(otherPath, otherThumbPath, 'non-furry');

const allImages = [...furryImages, ...otherImages];

// Sort by date (newest first)
allImages.sort((a, b) => new Date(b.date) - new Date(a.date));

console.log(`Found ${furryImages.length} furry images`);
console.log(`Found ${otherImages.length} non-furry images`);
console.log(`Total: ${allImages.length} images`);

// Write to JavaScript file that can be included in the HTML
const jsOutput = `// Auto-generated gallery configuration
// Last updated: ${new Date().toISOString()}

const galleryImages = ${JSON.stringify(allImages, null, 2)};
`;

fs.writeFileSync(path.join(__dirname, 'gallery-config.js'), jsOutput);
console.log('Gallery configuration written to gallery-config.js');

// Also create a JSON version for potential API use
fs.writeFileSync(
    path.join(__dirname, 'gallery-config.json'), 
    JSON.stringify(allImages, null, 2)
);
console.log('Gallery configuration written to gallery-config.json');

console.log('\nDone! Include gallery-config.js in your photography.html file.');
