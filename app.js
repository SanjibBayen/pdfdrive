pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js';

const uploadForm = document.getElementById('uploadForm');
const pdfUpload = document.getElementById('pdfUpload');
const fileList = document.getElementById('fileList');
const pdfViewer = document.getElementById('pdfViewer');
const searchInput = document.getElementById('searchInput');
const prevPageButton = document.getElementById('prevPage');
const nextPageButton = document.getElementById('nextPage');
const backButton = document.getElementById('backButton');
const homeInterface = document.getElementById('homeInterface');
const pdfViewerInterface = document.getElementById('pdfViewerInterface');

let currentPage = 1;
let pdfDocument = null;
let currentFile = "";

// Function to fetch and display the list of uploaded PDFs
function loadFileList() {
    fetch('/files')
        .then(response => response.json())
        .then(files => {
            fileList.innerHTML = '';
            files.forEach(file => {
                const div = document.createElement('div');
                div.classList.add('pdf-item');
                div.innerHTML = `
                    <img src="/uploads/${file}.jpg" class="pdf-thumbnail" onclick="viewPDF('${file}')">
                    <a href="#" onclick="viewPDF('${file}')">${file}</a>
                    <a href="/uploads/${file}" download>Download</a>
                `;
                fileList.appendChild(div);
            });
        })
        .catch(err => console.error('Error fetching files:', err));
}

// Function to display a selected PDF
function viewPDF(file) {
    currentFile = file;
    homeInterface.style.display = 'none';
    pdfViewerInterface.style.display = 'flex';

    // Clear previous viewer and set current page to 1
    pdfViewer.innerHTML = '';
    currentPage = 1;
    window.location.hash = file;  // Store the file name in the URL hash
    const url = `/uploads/${file}`;
    pdfjsLib.getDocument(url).promise.then(pdf => {
        pdfDocument = pdf;
        renderPage(currentPage);
    });
}

// Function to render a specific page
function renderPage(pageNum) {
    pdfDocument.getPage(pageNum).then(page => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const viewport = page.getViewport({ scale: 1.5 });

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        page.render({ canvasContext: ctx, viewport: viewport });

        // Clear viewer and append the new canvas
        pdfViewer.innerHTML = '';
        pdfViewer.appendChild(canvas);

        // Disable buttons if on first or last page
        prevPageButton.disabled = (pageNum <= 1);
        nextPageButton.disabled = (pageNum >= pdfDocument.numPages);
    });

    // Apply fade-in animation
    pdfViewer.classList.add('fade');
}

// Handle PDF upload
function uploadPDF() {
    const formData = new FormData();
    formData.append('pdf', pdfUpload.files[0]);

    fetch('/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        alert('PDF uploaded successfully');
        loadFileList(); // Refresh the file list
    })
    .catch(error => console.error('Error uploading PDF:', error));
}

// Navigate to next or previous page
function goToPage(direction) {
    if (direction === 'next' && currentPage < pdfDocument.numPages) {
        currentPage++;
    } else if (direction === 'prev' && currentPage > 1) {
        currentPage--;
    }
    renderPage(currentPage);
}

// Go back to the home interface
function backToHome() {
    homeInterface.style.display = 'block';
    pdfViewerInterface.style.display = 'none';
    pdfViewer.innerHTML = '';
    window.location.hash = '';
}
// Search PDFs based on input
function searchPDFs() {
    const query = searchInput.value.toLowerCase();
    const pdfItems = document.querySelectorAll('.pdf-item');
    let hasResults = false; // Track if any file matches the search query

    pdfItems.forEach(item => {
        const fileName = item.querySelector('a').textContent.toLowerCase();
        if (fileName.includes(query)) {
            item.style.display = 'block';
            hasResults = true; // Set to true if a matching file is found
        } else {
            item.style.display = 'none';
        }
    });

    // Display "No files found" message if no files match the search query
    const noResultsMessage = document.getElementById('noResultsMessage');
    if (!hasResults) {
        if (!noResultsMessage) {
            const message = document.createElement('div');
            message.id = 'noResultsMessage';
            message.textContent = 'No files found';
            message.style.textAlign = 'center';
            message.style.marginTop = '20px';
            fileList.appendChild(message); // Append the message to the file list container
        }
    } else {
        // Remove the "No files found" message if there are results
        if (noResultsMessage) {
            noResultsMessage.remove();
        }
    }
}


// Load the file list on page load
loadFileList();
