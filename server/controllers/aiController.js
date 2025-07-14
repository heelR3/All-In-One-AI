import OpenAI from "openai";
import sql from "../configs/db.js";
import { clerkClient } from "@clerk/express";
import axios from "axios";
import {v2 as cloudinary} from 'cloudinary'
import fs from 'fs'
import pdf from 'pdf-parse/lib/pdf-parse.js'
import { Cloudinary } from '@cloudinary/url-gen';
import { generativeRemove } from "@cloudinary/url-gen/actions/effect";
import { format } from "@cloudinary/url-gen/actions/delivery";

const AI = new OpenAI({
    apiKey: process.env.GEMINI_API_KEY,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
});


// Generate Article
export const generateArticle = async (req, res)=>{
    try {
        const { userId} = req.auth();
        const { prompt, length} = req.body;
        const plan = req.plan;
        const free_usage = req.free_usage;
        if(plan !== 'premium' && free_usage >= 10) {
            return res.json({ success: false, message: "Limit reached. Upgrade to continue."})
        }

        const response = await AI.chat.completions.create({
            model: "gemini-2.0-flash",
            messages: [
                {
                    role: "user",
                    content: prompt,
                },
            ],
            temperature: 0.7,
            max_tokens: length,
        });

        const content = response.choices[0].message.content;
        await sql` INSERT INTO creations (user_id, prompt, content, type) VALUES (${userId}, ${prompt}, ${content}, 'article')`;

        if(plan !== 'premium'){
            await clerkClient.users.updateUserMetadata(userId, {privateMetadata:{
                free_usage: free_usage + 1
                }
            })
        }

        res.json({success: true, content});
    }
    catch (error) {
        console.log(error.message)
        res.json({success: false, message: error.message});
    }
}

// Generate Blog Title
export const generateBlogTitle = async (req, res)=>{
    try {
        const { userId} = req.auth();
        const { prompt} = req.body;
        const plan = req.plan;
        const free_usage = req.free_usage;

        if(plan !== 'premium' && free_usage >= 10) {
            return res.json({ success: false, message: "Limit reached. Upgrade to continue."})
        }

        const response = await AI.chat.completions.create({
            model: "gemini-2.0-flash",
            messages: [{role: "user", content: prompt,}],
            temperature: 0.7,
            max_tokens: 100,
        });

        const content = response.choices[0].message.content;

        await sql` INSERT INTO creations (user_id, prompt, content, type) VALUES (${userId}, ${prompt}, ${content}, 'blog-title')`;

        if(plan !== 'premium'){
            await clerkClient.users.updateUserMetadata(userId, {privateMetadata:{
                free_usage: free_usage + 1
                }
            })
        }

        res.json({success: true, content});
    }
    catch (error) {
        console.log(error.message)
        res.json({success: false, message: error.message});
    }
}


// Generate Image
export const generateImage = async (req, res)=>{
    try {
        const { userId } = req.auth();
        const { prompt, publish } = req.body;
        const plan = req.plan;

        if(plan !== 'premium') {
            return res.json({ success: false, message: "This feature is only for premium subscription. Upgrade to continue."})
        }

        const formData = new FormData()
        formData.append('prompt', prompt)
        const {data} = await axios.post('https://clipdrop-api.co/text-to-image/v1', formData, {
            headers: {'x-api-key': process.env.CLIPDROP_API_KEY,},
            responseType: "arraybuffer",
        })

        const base64Image = `data:image/png;base64,${Buffer.from(data, 'binary').toString('base64')}`;

        const {secure_url} = await cloudinary.uploader.upload(base64Image)

        await sql` INSERT INTO creations (user_id, prompt, content, type, publish) VALUES (${userId}, ${prompt}, ${secure_url}, 'image', ${publish ?? false})`;


        res.json({success: true, content: secure_url});
    }
    catch (error) {
        console.log(error.message)
        res.json({success: false, message: error.message});
    }
}


// Remove Background
export const removeImageBackground = async (req, res)=>{
    try {
        const { userId } = req.auth();
        const image = req.file;
        const plan = req.plan;

        if(plan !== 'premium') {
            return res.json({ success: false, message: "This feature is only for premium subscription. Upgrade to continue."})
        }

        const {secure_url} = await cloudinary.uploader.upload(image.path, {
            transformation: [
                {
                    effect: 'background_removal',
                    background_removal: 'remove_the_background'
                }
            ]
        })

        await sql` INSERT INTO creations (user_id, prompt, content, type) VALUES (${userId}, 'Remove background from the image', ${secure_url}, 'image')`;

        res.json({success: true, content: secure_url});
    }
    catch (error) {
        console.log(error.message)
        res.json({success: false, message: error.message});
    }
}


// Remove Object
const cld = new Cloudinary({
    cloud: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    },
});

export const removeImageObject = async (req, res)=>{
    try {
        const { userId } = req.auth();
        const { object } = req.body;
        const image = req.file;
        const plan = req.plan;


        if(plan !== 'premium') {
            return res.json({ success: false, message: "This feature is only for premium subscription. Upgrade to continue."})
        }

        const {public_id} = await cloudinary.uploader.upload(image.path)

        const cldImage = cld.image(public_id)
            .effect(generativeRemove().prompt(object).detectMultiple()) // apply object removal
            .delivery(format('auto'));
        
        const imageUrl = cldImage.toURL();
    

        await sql` INSERT INTO creations (user_id, prompt, content, type) VALUES (${userId}, ${`Removed ${object} from image`}, ${imageUrl}, 'image')`;

        res.json({success: true, content: imageUrl});
    }
    catch (error) {
        console.log(error.message)
        res.json({success: false, message: error.message});
    }
}


// Resume Review
export const resumeReview = async (req, res)=>{
    try {
        const { userId } = req.auth();
        const resume = req.file;
        const plan = req.plan;


        if(plan !== 'premium') {
            return res.json({ success: false, message: "This feature is only for premium subscription. Upgrade to continue."})
        }

        if(resume.size > 5 * 1024 * 1024){
            return res.json({success: false, message: "Resume file size exceeds allowed size (5MB)."})
        }

        const dataBuffer = fs.readFileSync(resume.path);
        const pdfData = await pdf(dataBuffer);

        const prompt = `Review the following resume and provide constructive feedback on its strengths, weaknesses, and areas for improvement. Resume Content:\n\n${pdfData.text}`

        const response = await AI.chat.completions.create({
            model: "gemini-2.0-flash",
            messages: [
                {
                    role: "user",
                    content: prompt,
                },
            ],
            temperature: 0.7,
            max_tokens: 1000,
        });

        const content = response.choices[0].message.content

        await sql` INSERT INTO creations (user_id, prompt, content, type) VALUES (${userId}, 'Review the uploaded resume', ${content}, 'resume-review')`;

        res.json({success: true, content});
    }
    catch (error) {
        console.log(error.message)
        res.json({success: false, message: error.message});
    }
}