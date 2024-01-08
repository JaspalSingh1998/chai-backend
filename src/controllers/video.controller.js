import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    
    try {
        let videoQuery = {};
        if (userId) {
            videoQuery = { ...videoQuery, userId: userId };
        }

        const videos = await Video.find(videoQuery)
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit))
            .sort({ [sortBy]: sortType });

        const totalVideos = await Video.countDocuments(videoQuery);

        const response = {
            videos: videos,
            pageInfo: {
                totalVideos: totalVideos,
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalVideos / parseInt(limit))
            }
        };

        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({ message: 'Something went wrong!' });
    }
})

const publishAVideo = asyncHandler(async (req, res) => {
    try {
        const { title, description} = req.body
        const videoUrl = await uploadOnCloudinary(req.files['videoFile'][0].path);
        const thumbnail = await uploadOnCloudinary(req.files['thumbnail'][0].path)
        
        const data = {
            title,
            description,
            videoFile: videoUrl.url,
            thumbnail: thumbnail.url,
            duration: videoUrl.duration / 100 

        }
        const newVideo = await Video.create(data);
        return res.status(201).json({video: newVideo})
    } catch (error) {
        return res.status(500).json({message: 'Something went wrong!'});
    }
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    try {
        const video = await Video.findById(videoId);
        if(!video) {
            return res.status(404).json({message: 'Video does not exist'});
        }

        return res.status(200).json({video})

    } catch (error) {
        res.status(500).json({message: 'Something went wrong!'})
    }
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const {title, description} = req.body;
    const dataToUpdate = {}

    try {
        const video = await Video.findById(videoId);
        if(!video) {
            return res.status(404).json({message: 'Video does not exist'});
        }

        if(title) {
            dataToUpdate.title = title
        }
        if(description) {
            dataToUpdate.description = description
        }

        const updatedThumbnail = await uploadOnCloudinary(req.file.path)
        if(req.file) {
            dataToUpdate.thumbnail = updatedThumbnail.url
        }

        const updatedVideo = await Video.findByIdAndUpdate(videoId, dataToUpdate, {new: true});

        return res.status(200).json({video: updatedVideo});

    } catch (error) {
        res.status(500).json({message: 'Something went wrong!'})
    }

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    try {
        const video = await Video.findById(videoId);
        if(!video) {
            return res.status(404).json({message: 'Video does not exist'});
        }

        const deletedId = await Video.findByIdAndDelete(videoId);
        return res.status(200).json({message: 'Deleted Video Sucessfully!'})
    } catch (error) {
        res.status(500).json({message: 'Something went wrong!'})
    }
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    try {
        const video = await Video.findById(videoId);
        if(!video) {
            return res.status(404).json({message: 'Video does not exist'});
        }
        const toggledPublish = await Video.findByIdAndUpdate(videoId, {isPublished: !video.isPublished}, {new: true})
        return res.status(200).json({video: toggledPublish});
    } catch (error) {
        res.status(500).json({message: 'Something went wrong!'})
    }
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
