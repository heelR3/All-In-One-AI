import { Trash2 } from 'lucide-react';
import React, { useState } from 'react'
import Markdown from 'react-markdown'

const CreationItem = ({item, onDelete}) => {
    
    const [expanded, setExpanded] = useState(false);

    const [showConfirm, setShowConfirm] = useState(false);

    const handleDeleteConfirm = () => {
        onDelete(item.id);
        setShowConfirm(false);
    };

    const handleDeleteCancel = (e) => {
        e.stopPropagation();
        setShowConfirm(false);
    };


    return (
        <div onClick={()=> setExpanded(!expanded)} className='p-4 max-w-5xl text-sm bg-white border border-gray-200 rounded-lg cursor-pointer'>

            <div className='flex justify-between items-center gap-4'>
                <div>
                    <h2> {item.prompt} </h2>
                    <p> {item.type} - {new Date(item.created_at).toLocaleDateString()} </p>
                </div>
                <div className='flex justify-between items-center gap-4'>
                    <button className='bg-[#EFF6FF] border border-[#BFDBFE] text-[#1E40AF] px-4 py-1 rounded-full'>{item.type}</button>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowConfirm(true);
                            }}
                        title="Delete Creation"
                        className="cursor-pointer text-red-500 hover:text-red-700">
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
            </div>
            {
                expanded && (
                    <div> 
                        {item.type === 'image' ? (
                            <div>
                                <img src={item.content}  alt="image" className='mt-3 w-full max-w-md' />
                            </div>
                        ) : (
                            <div className='mt-3 h-full overflow-y-scroll text-sm text-slate-700'>
                                <div className='reset-tw'>
                                    <Markdown>
                                        {item.content}
                                    </Markdown>
                                    
                                </div>
                            </div>
                        )}
                    </div>
                )
            }

            {/* Custom Confirmation Modal */}
            {showConfirm && (
                <div
                onClick={(e) => e.stopPropagation()}
                className="absolute inset-0 bg-black/40 flex justify-center items-center z-20 rounded-lg"
                >
                <div className="bg-white p-4 rounded-lg shadow-lg text-center">
                    <p className="mb-4 text-sm text-gray-700">Are you sure you want to delete this creation?</p>
                    <div className="flex justify-center gap-4">
                    <button
                        onClick={handleDeleteConfirm}
                        className="px-4 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm cursor-pointer"
                    >
                        Yes
                    </button>
                    <button
                        onClick={handleDeleteCancel}
                        className="px-4 py-1 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-sm cursor-pointer"
                    >
                        No
                    </button>
                    </div>
                </div>
                </div>
            )}
        </div>
    )
}

export default CreationItem
