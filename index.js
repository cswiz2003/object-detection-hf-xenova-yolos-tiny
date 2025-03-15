import { pipeline } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.8.0'

// Reference the HTML elements
const status = document.getElementById('status')
const image = document.getElementById('image')
const detectObjectsButton = document.getElementById('detect-objects')
const sampleImageButton = document.getElementById('sample-image-btn')
const uploadImageButton = document.getElementById('upload-image-btn')
const imageInput = document.getElementById('imageInput')
const imageContainer = document.getElementById('image-container')
const progressBar = document.getElementById('progress-bar')
const progressContainer = document.getElementById('progressContainer');
const inputImageContainer = document.getElementById('inputImageContainer');
const outputImageContainer = document.getElementById('outputImageContainer');
const result = document.getElementById('result');

// Disable all buttons initially
sampleImageButton.disabled = true
uploadImageButton.disabled = true
detectObjectsButton.disabled = true

// Clear any existing boxes
function clearDetections() {
    const boxes = imageContainer.querySelectorAll('.bounding-box')
    boxes.forEach(box => box.remove())
}

// Update progress and status
function updateProgress(percent, message) {
    progressBar.style.width = `${percent}%`
    status.textContent = message
}

// Create a new object detection pipeline
updateProgress(0, 'Loading AI model (approx. 20MB)...')

const detector = await pipeline('object-detection', 'Xenova/yolos-tiny', {
    progress_callback: (progress) => {
        if (progress.status === 'downloading') {
            const percent = Math.round(progress.progress * 100)
            updateProgress(percent, `Downloading model: ${percent}% (approx. 20MB)`)
        } else if (progress.status === 'loading') {
            updateProgress(90, 'Almost ready...')
        }
    }
}).then(model => {
    // Enable sample and upload buttons after model is loaded
    sampleImageButton.disabled = false
    uploadImageButton.disabled = false
    updateProgress(100, 'Model loaded! Choose an image to begin.')
    return model
})

// Handle sample image button
sampleImageButton.addEventListener('click', () => {
    image.src = 'meeting.jpg'
    clearDetections()
    updateProgress(100, 'Sample image loaded! Click "Detect Objects" to begin')
    detectObjectsButton.disabled = false
})

// Handle image upload button
uploadImageButton.addEventListener('click', () => {
    imageInput.click()
})

// Handle file selection
imageInput.addEventListener('change', (event) => {
    const file = event.target.files[0]
    if (file) {
        const reader = new FileReader()
        reader.onload = function(e) {
            image.src = e.target.result
            clearDetections()
            updateProgress(100, 'Image uploaded! Click "Detect Objects" to begin')
            detectObjectsButton.disabled = false
        }
        reader.readAsDataURL(file)
    }
})

// Enable Object Detection
detectObjectsButton.addEventListener('click', async () => {
    // Disable all buttons during detection
    sampleImageButton.disabled = true
    uploadImageButton.disabled = true
    detectObjectsButton.disabled = true
    clearDetections()
    
    try {
        // Update progress for detection
        updateProgress(30, 'Analyzing image...')
        
        // Detect Objects
        const detectedObjects = await detector(image.src, {
            threshold: 0.95,
            percentage: true
        });
        
        // Update progress for drawing
        updateProgress(60, 'Processing results...')
        
        // Draw Detected Objects
        detectedObjects.forEach(obj => {
            drawObjectBox(obj)
        })
        
        // Complete
        updateProgress(100, `Found ${detectedObjects.length} objects!`)
        
        // Reset progress after a delay
        setTimeout(() => {
            updateProgress(0, 'Ready for next detection')
        }, 2000)
    } catch (error) {
        console.error('Detection error:', error)
        updateProgress(0, 'Error during detection. Please try again.')
    } finally {
        // Re-enable buttons after detection
        sampleImageButton.disabled = false
        uploadImageButton.disabled = false
        detectObjectsButton.disabled = false
    }
})

// Helper function that draws boxes for every detected object in the image
function drawObjectBox(detectedObject) {
    const { label, score, box } = detectedObject
    const { xmax, xmin, ymax, ymin } = box

    // Generate a random color for the box
    const color = '#' + Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, 0)
    
    // Draw the box
    const boxElement = document.createElement('div')
    boxElement.className = 'bounding-box'
    Object.assign(boxElement.style, {
        borderColor: color,
        left: 100 * xmin + '%',
        top: 100 * ymin + '%',
        width: 100 * (xmax - xmin) + '%',
        height: 100 * (ymax - ymin) + '%',
    })

    // Draw label
    const labelElement = document.createElement('span')
    labelElement.textContent = `${label}: ${Math.floor(score * 100)}%`
    labelElement.className = 'bounding-box-label'
    labelElement.style.backgroundColor = color

    boxElement.appendChild(labelElement)
    imageContainer.appendChild(boxElement)
}
