import React, { useEffect, useState } from 'react'
import { useUser } from '@clerk/clerk-react';
import { dummyPublishedCreationData } from '../assets/assets';
import { Heart, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import Markdown from 'react-markdown';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

const Community = () => {

  const [creations, setCreations] = useState([]);
  const {user} = useUser();
  const [loading, setLoading] = useState(true);

  const {getToken} = useAuth();
  

  const fetchCreations = async () => {
    try {
      const {data} = await axios.get('/api/user/get-published-creations', {
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
    setLoading(false)
  }

  const imageLikeToggle = async (id) => {
    try {
      const {data} = await axios.post('/api/user/toggle-like-creation', {id}, {
        headers : {Authorization: `Bearer ${await getToken()}`}
      })

      if(data.success){
        toast.success(data.message)
        await fetchCreations()
      }
      else{
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(data.message)
    }
  }

  useEffect(() => {
    if(user){
      fetchCreations()
    }
  }, [user])

  return !loading ? (
    <div className='flex-1 h-full flex flex-col gap-4 p-6'>
      <div className='flex items-center gap-3'>
          <Sparkles className='w-6 text-[#f23558]'/>
          <h1 className='text-xl font-semibold '> Creations </h1>
      </div>

      <div className='bg-white h-full w-full rounded-xl overflow-y-scroll'>
        {
          creations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500 text-sm">
              <img src="/illution.png" alt="No creations" className="w-40 h-40 mb-4 opacity-60" />
              <p>No community creations yet.</p>
              <p className="text-xs text-gray-400 mt-1">Published creations will appear here when users share their content.</p>
            </div>
          ) : (
            creations.map((creation, index) => (
              <div key={index} className='relative group inline-block pl-3 pt-3 w-full sm:max-w-1/2 lg:max-w-1/3'>
                <img src={creation.content} alt="" className='w-full h-full object-cover rounded-lg' />
                <div className='absolute bottom-0 top-0 right-0 left-3 flex gap-2 items-end justify-end group-hover:justify-between p-3 group-hover:bg-gradient-to-b from-transparent to-black/80 text-white rounded-lg'>
                  <p className='text-sm hidden group-hover:block'> {creation.prompt} </p>
                  <div className='flex gap-1 items-center'>
                    <p> {creation.likes.length} </p>
                    <Heart
                      onClick={() => imageLikeToggle(creation.id)}
                      className={`min-w-5 h-5 hover:scale-110 cursor-pointer ${creation.likes.includes(user.id) ? 'fill-red-500 text-red-600' : 'text-white'}`}
                    />
                  </div>
                </div>
              </div>
            ))
          )
        }

      </div>
    </div>
  ) : (
    <div className='flex justify-center items-center h-full'>
      <span className='w-10 h-10 my-1 rounded-full border-3 border-primary border-t-transparent animate-spin'></span>
    </div>
  )

}

export default Community

