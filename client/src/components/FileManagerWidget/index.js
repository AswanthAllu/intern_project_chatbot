<<<<<<< HEAD
<<<<<<< HEAD
// client/src/components/FileManagerWidget.js

import React, { useState } from 'react';
import { Popover } from 'react-tiny-popover';
import { FaTrash, FaEdit, FaFileAudio, FaProjectDiagram, FaEllipsisV } from 'react-icons/fa';
import './index.css';

const FileManagerWidget = ({
=======
=======
// src/components/FileManagerWidget/index.js
>>>>>>> a23a90a7b862494862611e06c52c6a72a196babd
import React, { useState } from 'react';
import { Popover } from 'react-tiny-popover';
import { FaTrash, FaEdit, FaFileAudio, FaProjectDiagram, FaEllipsisV, FaCommentDots } from 'react-icons/fa';
import './index.css';

function FileManagerWidget({
>>>>>>> upstream/main
    files,
    isLoading,
    error,
    onDeleteFile,
    onRenameFile,
    onGeneratePodcast,
    onGenerateMindMap,
    onChatWithFile,
<<<<<<< HEAD
    isProcessing
<<<<<<< HEAD
}) => {
    // State to track which file's menu is currently open
    const [openMenuId, setOpenMenuId] = useState(null);

    const handleRename = (fileId, currentName) => {
        setOpenMenuId(null); // Close the menu first
=======
}) {
    const [openMenuId, setOpenMenuId] = useState(null);

    const handleRename = (fileId, currentName) => {
        setOpenMenuId(null);
>>>>>>> upstream/main
        const newName = prompt("Enter new file name:", currentName);
        if (newName && newName !== currentName) {
            onRenameFile(fileId, newName);
        }
    };

=======
    isProcessing,
    onActionTaken // New prop to notify parent of an action
}) {
    const [openMenuId, setOpenMenuId] = useState(null);

    // This function now wraps all actions to ensure the sidebar can be closed
>>>>>>> a23a90a7b862494862611e06c52c6a72a196babd
    const handleActionClick = (action, fileId, fileName) => {
<<<<<<< HEAD
        setOpenMenuId(null); // Close the menu after any action
=======
        setOpenMenuId(null);
>>>>>>> upstream/main
        action(fileId, fileName);
        if (onActionTaken) {
            onActionTaken();
        }
    };

    return (
        <div className="file-manager-widget">
            <h3>My Files</h3>
            {isLoading ? (
                <div className="file-manager-loading">Loading...</div>
            ) : error ? (
                <div className="file-manager-error">{error}</div>
            ) : (
                <ul className="file-list">
                    {files.map(file => (
                        <li key={file._id} className="file-item">
                            <span className="file-name" title={file.originalname}>
                                {file.originalname}
                            </span>
                            
                            <Popover
                                isOpen={openMenuId === file._id}
                                positions={['right', 'left', 'bottom', 'top']} 
                                align="center"
                                padding={10}
                                onClickOutside={() => setOpenMenuId(null)}
                                containerStyle={{ zIndex: 1100 }}
                                content={
                                    <div className="popover-menu">
<<<<<<< HEAD
<<<<<<< HEAD
=======
                                        {/* --- NEW BUTTON ADDED HERE --- */}
=======
>>>>>>> a23a90a7b862494862611e06c52c6a72a196babd
                                        <button onClick={() => handleActionClick(onChatWithFile, file._id, file.originalname)} disabled={isProcessing} className="popover-menu-item">
                                            <FaCommentDots /> Chat with this File
                                        </button>
                                        <div className="popover-divider" />
>>>>>>> upstream/main
                                        <button onClick={() => handleActionClick(onGeneratePodcast, file._id, file.originalname)} disabled={isProcessing} className="popover-menu-item">
                                            <FaFileAudio /> Generate Podcast
                                        </button>
                                        <button onClick={() => handleActionClick(onGenerateMindMap, file._id, file.originalname)} disabled={isProcessing} className="popover-menu-item">
                                            <FaProjectDiagram /> Generate Mind Map
                                        </button>
                                        <button onClick={() => handleActionClick(onRenameFile, file._id, file.originalname)} disabled={isProcessing} className="popover-menu-item">
                                            <FaEdit /> Rename
                                        </button>
                                        <div className="popover-divider" />
                                        <button onClick={() => handleActionClick(onDeleteFile, file._id, file.originalname)} disabled={isProcessing} className="popover-menu-item danger">
                                            <FaTrash /> Delete
                                        </button>
                                    </div>
                                }
                            >
                                <button 
                                    onClick={() => setOpenMenuId(openMenuId === file._id ? null : file._id)} 
                                    className="icon-button menu-button"
                                    title="More options"
                                >
                                    <FaEllipsisV />
                                </button>
                            </Popover>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default FileManagerWidget;
