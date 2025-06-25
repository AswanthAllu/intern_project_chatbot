// server/utils/fileUtils.js
const path = require('path');

// This mapping should be the single source of truth for file types.
const allowedMimeTypes = {
    'application/pdf': 'docs',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docs',
    'application/msword': 'docs',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'docs',
    'application/vnd.ms-powerpoint': 'docs',
    'text/plain': 'docs',
    'text/x-python': 'code',
    'application/javascript': 'code',
    'text/javascript': 'code',
    'text/markdown': 'code',
    'text/html': 'code',
    'application/xml': 'code',
    'text/xml': 'code',
    'application/json': 'code',
    'text/csv': 'code',
    'image/jpeg': 'images',
    'image/png': 'images',
    'image/bmp': 'images',
    'image/gif': 'images',
};

// This function can now be used by any route to reliably find a file's subfolder.
const determineFileTypeSubfolder = (originalFilename) => {
    const ext = path.extname(originalFilename).toLowerCase();
    // A simple mapping for extensions to mimetypes to find the folder
    const mimeTypeMap = {
        '.pdf': 'application/pdf',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.doc': 'application/msword',
        '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        '.ppt': 'application/vnd.ms-powerpoint',
        '.txt': 'text/plain',
        '.py': 'text/x-python',
        '.js': 'application/javascript',
        '.md': 'text/markdown',
        '.html': 'text/html',
        '.xml': 'application/xml',
        '.json': 'application/json',
        '.csv': 'text/csv',
        '.jpeg': 'image/jpeg',
        '.jpg': 'image/jpeg',
        '.png': 'image/png',
        '.bmp': 'image/bmp',
        '.gif': 'image/gif',
    };
    const mimeType = mimeTypeMap[ext];
    return allowedMimeTypes[mimeType] || 'others';
};

module.exports = { determineFileTypeSubfolder };