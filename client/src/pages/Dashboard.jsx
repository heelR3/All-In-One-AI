import React, { useEffect, useState } from 'react'
import { dummyCreationData } from '../assets/assets';
import { FilePen, GemIcon, Sparkles } from 'lucide-react';
import { Protect } from '@clerk/clerk-react';
import CreationItem from '../components/CreationItem';
import toast from 'react-hot-toast';
import Markdown from 'react-markdown';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;


const Dashboard = () => {

  const [creations ,setCreations] = useState([]);
  const [loading, setLoading] = useState(true);

  const {getToken} = useAuth();
  
  
  const getDashboardData = async () => {
    try {
      const {data} = await axios.get('/api/user/get-user-creations', {
        headers : {Authorization: `Bearer ${await getToken()}`}
      })

      if(data.success){
        setCreations(data.creations)
      }
      else{
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(data.message)
    }
    setLoading(false);
  }

  useEffect(() => {
    getDashboardData();
  }, [])

  // deleting a creation
  const handleDelete = async (id) => {
    try {

      const { data } = await axios.delete(`/api/user/delete-creation/${id}`, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });

      if (data.success) {
        toast.success(data.message);
        setCreations((prev) => prev.filter((item) => item.id !== id));
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };


  return (
    <div className='h-full overflow-y-scroll p-6'>
      <div className='flex justify-start gap-4 flex-wrap'>

       {/* Total Creations Card */}
        <div className='flex justify-between items-center w-72 p-4 px-6 bg-white rounded-xl border border-gray-200'>
          <div className='text-slate-600'>
            <p className='text-sm'>Total Creations</p>
            <h2 className='text-xl font-semibold'>{creations.length}</h2>
          </div>
          <div className='w-10 h-10 rounded-lg bg-gradient-to-br from-[#f23558] to-[#d70b63] text-white flex justify-center items-center'>
            <Sparkles className='w-5 text-white' />
          </div>
        </div>

        {/* Active Plan Card */}
        <div className='flex justify-between items-center w-72 p-4 px-6 bg-white rounded-xl border border-gray-200'>
          <div className='text-slate-600'>
            <p className='text-sm'>Active Plan</p>
            <h2 className='text-xl font-semibold'>
              <Protect plan='premium' fallback="Free" >Premium</Protect>
            </h2>
          </div>
          <div className='w-10 h-10 rounded-lg bg-gradient-to-br from-[#ff61c5] to-[#9e53ee] text-white flex justify-center items-center'>
            <GemIcon className='w-5 text-white' />
          </div>
        </div>

      </div>

      {
        loading ? (
          <div className='flex justify-center items-center h-3/4'>
            <div className='animate-spin rounded-full h-11 w-11 border-3 border-purple-500 border-t-transparent'></div>
          </div>
        )
        :
        (
          <div className='space-y-3'>
            <div className='flex items-center gap-2 mt-6 mb-4 text-lg font-medium text-slate-700'>
              <FilePen className='w-5 h-5 text-[#c20c0c]' />
              <p>Recent Creations</p>
            </div>

            {
              creations.length === 0 ? (
                <div className='flex flex-col items-center justify-center py-10 text-gray-500 text-sm bg-white border border-gray-200 rounded-lg'>
                  <img src="/public/empty-state.png" alt="No creations" className="w-32 h-32 mb-4 opacity-60" />
                  <p>No creations found.</p>
                  <p className="text-xs text-gray-400 mt-1">Your creations will show up here once you start using the tools.</p>
                </div>
              ) : (
                creations.map((item) => (
                  <CreationItem key={item.id} item={item} onDelete={handleDelete} />
                ))
              )
            }
          </div>
        )
      }
      
    </div>
  )
}

export default Dashboard
