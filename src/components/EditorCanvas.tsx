import { ToolsSidebar } from './ToolsSidebar';
import { LoadModal } from './LoadModal';
import { ConfirmModal } from './ConfirmModal';
import { StepsBar } from './StepsBar';
import { TextEditorModal } from './TextEditorModal';
import { useEditorLogic } from './editor/useEditorLogic';
import { Trash2 } from 'lucide-react';
import { RemoteCursorOverlay } from './editor/RemoteCursorOverlay';
interface EditorCanvasProps {
    strategyId: string;
}

export const EditorCanvas = ({ strategyId }: EditorCanvasProps) => {
    // 1. Récupérer toute la logique
    const editorLogic = useEditorLogic(strategyId);


    const {
        // Refs
        mainCanvasRef, tempCanvasRef, containerRef, imgRef, trashRef, contentRef,

        // ZOOM FUNCTION (A AJOUTER DANS useEditorLogic return)
        centerView,

        // Data & State
        steps, currentStepIndex, setCurrentStepIndex, currentMapSrc,
        reverseMapSrc, callsMapSrc, reverseCallsMapSrc,
        reverseMapError, setReverseMapError,
        reverseCallsError, setReverseCallsError,
        isLoading, showLoadModal, setShowLoadModal, savedStrategies,
        isTextModalOpen, setIsTextModalOpen,
        showDeleteModal, setShowDeleteModal,
        editingObj, setEditingTextId,
        folders, currentFolderId,

        // Tools & UI
        currentTool, setCurrentTool,
        strokeType, setStrokeType,
        color, setColor,
        opacity, setOpacity,
        thickness, setThickness,
        selectedAgent, setSelectedAgent,
        showZones, setShowZones,
        showMapCalls, setShowMapCalls,
        iconSize, setIconSize,
        isRotated, setIsRotated,
        isOverTrash, getCursorStyle,

        // Handlers
        handleMouseDown, handleMouseMove, handleMouseUp, handleMouseLeave,
        handleContextMenu, handleDrop, handleDoubleClick,

        // Actions
        handleClearAll, handleClearAgents, handleClearAbilities, handleClearText, handleClearDrawings,
        handleSaveText, handleLoadStrategy, remoteCursors,
        handleAddStep, handleDuplicateStep, handleDeleteStep, handleRenameStep,
        handleFolderChange, handleDeleteRequest, confirmDelete, fetchStrategies
    } = editorLogic;

    const showReverseImage = isRotated && reverseMapSrc && !reverseMapError;

    return (
        <div className="flex flex-col lg:flex-row h-full w-full bg-[#121212]">
            <div className="absolute top-4 left-4 z-30 lg:static lg:h-full lg:w-auto lg:p-4 lg:bg-[#181b1e] lg:border-r lg:border-gray-800">
                <ToolsSidebar
                    currentTool={currentTool} setTool={setCurrentTool}
                    strokeType={strokeType} setStrokeType={setStrokeType}
                    color={color} setColor={setColor}
                    opacity={opacity} setOpacity={setOpacity}
                    thickness={thickness} setThickness={setThickness}
                    selectedAgent={selectedAgent} setSelectedAgent={setSelectedAgent}
                    onSave={() => {}}
                    onLoad={fetchStrategies}
                    showZones={showZones} setShowZones={setShowZones}
                    iconSize={iconSize} setIconSize={setIconSize}
                    folders={folders}
                    currentFolderId={currentFolderId}
                    onFolderChange={handleFolderChange}
                    onDeleteStrategy={handleDeleteRequest}
                    onClearAll={handleClearAll}
                    onClearAgents={handleClearAgents}
                    onClearAbilities={handleClearAbilities}
                    onClearText={handleClearText}
                    onClearDrawings={handleClearDrawings}
                    isRotated={isRotated} setIsRotated={setIsRotated}
                    showMapCalls={showMapCalls} setShowMapCalls={setShowMapCalls}
                />
            </div>

            <div ref={containerRef} className="relative flex-1 w-full h-full overflow-hidden select-none" style={{ cursor: getCursorStyle() }}
                 onMouseDown={handleMouseDown}
                 onMouseMove={handleMouseMove}
                 onMouseUp={handleMouseUp}
                 onMouseLeave={handleMouseLeave}
                 onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; }}
                 onDrop={handleDrop}
                 onContextMenu={handleContextMenu}
                 onDoubleClick={handleDoubleClick}>

                <div ref={contentRef} className="origin-top-left absolute  top-0 left-0">
                    <RemoteCursorOverlay cursors={remoteCursors} />
                    <div ref={trashRef} className={`absolute top-4 right-4 z-50 p-3 rounded-xl border-2 transition-all duration-200 backdrop-blur-sm ${isOverTrash ? 'bg-red-500/30 border-red-500 scale-110 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-black/40 border-white/10 hover:bg-black/60 text-white/50 hover:text-white'}`} title="Glisser ici pour supprimer">
                        <Trash2 size={32} className={isOverTrash ? 'text-red-500 animate-bounce' : 'text-inherit'} />
                    </div>
                    <div style={{ position: 'relative', width: '100%', height: '100%' }}>

                        {currentMapSrc && (
                            <img
                                ref={imgRef}
                                src={(showReverseImage ? reverseMapSrc : currentMapSrc) || undefined}
                                alt="Map"
                                draggable={false}
                                className="block pointer-events-none h-auto shadow-lg  p-10 relative z-0"
                                style={{
                                    width: '100%',
                                    minWidth: '1024px',
                                    transform: (!showReverseImage && isRotated) ? 'rotate(180deg)' : 'none'
                                }}
                                onLoad={() => {
                                    // APPEL DE CENTER VIEW ICI
                                    if (centerView) centerView(0.75);
                                }}
                                onError={() => {
                                    if (showReverseImage) setReverseMapError(true);
                                }}
                            />
                        )}

                        {/* ... reste du code ... */}
                        {showMapCalls && (
                            <img
                                src={((isRotated && reverseCallsMapSrc && !reverseCallsError) ? reverseCallsMapSrc : (callsMapSrc || undefined)) || undefined}
                                alt="Map Calls"
                                draggable={false}
                                className="absolute top-0 left-0 w-full h-full pointer-events-none z-10 p-10"
                                style={{
                                    width: '100%',
                                    minWidth: '1024px',
                                    transform: (isRotated && (!reverseCallsMapSrc || reverseCallsError)) ? 'rotate(180deg)' : 'none'
                                }}
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    if (isRotated) setReverseCallsError(true);
                                }}
                            />
                        )}

                        <div className="absolute inset-0 z-20 pointer-events-none" style={{ transform: isRotated ? 'rotate(180deg)' : 'none' }}>
                            <canvas ref={mainCanvasRef} className="absolute inset-0 w-full h-full" />
                            <canvas ref={tempCanvasRef} className="absolute inset-0 w-full h-full" />
                        </div>
                    </div>
                </div>

                <StepsBar
                    steps={steps}
                    currentIndex={currentStepIndex}
                    onStepChange={setCurrentStepIndex}
                    onAddStep={handleAddStep}
                    onDuplicateStep={handleDuplicateStep}
                    onDeleteStep={handleDeleteStep}
                    onRenameStep={handleRenameStep}
                />

                <LoadModal isOpen={showLoadModal} onClose={() => setShowLoadModal(false)} isLoading={isLoading} strategies={savedStrategies} onLoadStrategy={handleLoadStrategy} />

                <TextEditorModal
                    isOpen={isTextModalOpen} onClose={() => { setIsTextModalOpen(false); setEditingTextId(null); setCurrentTool('cursor'); }} onSave={handleSaveText}
                    initialText={editingObj?.text || ''} initialColor={editingObj?.color || color} initialFontSize={editingObj?.fontSize || 24}
                    initialBold={editingObj?.fontWeight === 'bold'} initialItalic={editingObj?.fontStyle === 'italic'}
                />

                <ConfirmModal
                    isOpen={showDeleteModal}
                    onClose={() => setShowDeleteModal(false)}
                    onConfirm={confirmDelete}
                    title="Supprimer la stratégie"
                    message="Êtes-vous sûr de vouloir supprimer cette stratégie ? Cette action est irréversible."
                    isDangerous={true}
                    confirmText="Supprimer"
                />
            </div>
        </div>
    );
};