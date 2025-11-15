import User from '../models/User.js';
import { AppError } from '../middleware/errorHandler.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const createUser = asyncHandler(async (req, res) => {
    const { username, email, password, full_name, phone, role, shop_id, status } = req.body;

    if (!username || !email || !password) {
        throw new AppError('Username, email, and password are required', 400);
    }

    const result = await User.create({ username, email, password, full_name, phone, role, shop_id, status });

    res.status(201).json({
        success: true,
        message: result.message,
        data: result.data
    });
});

export const getUsers = asyncHandler(async (req, res) => {
    const filters = {
        shop_id: req.query.shop_id,
        role: req.query.role,
        status: req.query.status,
        page: req.query.page,
        limit: req.query.limit
    };

    const result = await User.getAll(filters);

    res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination
    });
});

export const getUserById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await User.getById(id);

    if (!result.success) {
        throw new AppError(result.message, 404);
    }

    res.status(200).json({
        success: true,
        data: result.data
    });
});

export const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new AppError('Email and password are required', 400);
    }

    const result = await User.login(email, password);

    if (!result.success) {
        throw new AppError(result.message, 401);
    }

    // Set refresh token as httpOnly cookie for better security
    const refreshTokenExpires = new Date();
    refreshTokenExpires.setDate(refreshTokenExpires.getDate() + 7); // 7 days

    res.cookie('refreshToken', result.data.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        expires: refreshTokenExpires,
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
    });

    res.status(200).json({
        success: true,
        message: result.message,
        data: {
            user: result.data.user,
            accessToken: result.data.accessToken
            // refreshToken is sent as httpOnly cookie, not in response body
        }
    });
});

export const refreshToken = asyncHandler(async (req, res) => {
    // Get refresh token from body or cookie
    const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;

    if (!refreshToken) {
        throw new AppError('Refresh token is required', 400);
    }

    const result = await User.refreshToken(refreshToken);

    if (!result.success) {
        throw new AppError(result.message, 401);
    }

    // Set new refresh token as httpOnly cookie
    const refreshTokenExpires = new Date();
    refreshTokenExpires.setDate(refreshTokenExpires.getDate() + 7); // 7 days

    res.cookie('refreshToken', result.data.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        expires: refreshTokenExpires,
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
    });

    res.status(200).json({
        success: true,
        message: result.message,
        data: {
            user: result.data.user,
            accessToken: result.data.accessToken
            // refreshToken is sent as httpOnly cookie, not in response body
        }
    });
});

export const updateUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    const result = await User.update(id, updateData);

    if (!result.success) {
        throw new AppError(result.message, 404);
    }

    res.status(200).json({
        success: true,
        message: result.message
    });
});

export const deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await User.delete(id);

    if (!result.success) {
        throw new AppError(result.message, 404);
    }

    res.status(200).json({
        success: true,
        message: result.message
    });
});

