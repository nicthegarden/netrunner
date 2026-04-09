/**
 * MongoDB Connection Manager
 * Handles database connection, reconnection logic, and event handling
 */

import mongoose from 'mongoose';
import { config } from '../config/index.js';

let db = null;

/**
 * Connect to MongoDB
 */
export async function connectDB() {
  try {
    if (db) {
      console.log('✓ MongoDB already connected');
      return db;
    }

    console.log(`🔗 Connecting to MongoDB at ${config.mongodb.uri.split('@')[1] || config.mongodb.uri}...`);

    mongoose.connection.on('connected', () => {
      console.log('✓ MongoDB connected successfully');
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠ MongoDB disconnected');
    });

    mongoose.connection.on('error', (err) => {
      console.error('✗ MongoDB connection error:', err.message);
    });

    db = await mongoose.connect(config.mongodb.uri, config.mongodb.options);
    return db;
  } catch (error) {
    console.warn('⚠ MongoDB connection failed (will continue in dev mode):', error.message);
    console.warn('  For production, ensure MongoDB is running.');
    // Don't throw in development, allow server to start without DB
    if (config.isProd) {
      throw error;
    }
    return null;
  }
}

/**
 * Disconnect from MongoDB
 */
export async function disconnectDB() {
  try {
    if (db) {
      await mongoose.disconnect();
      db = null;
      console.log('✓ MongoDB disconnected');
    }
  } catch (error) {
    console.error('✗ Failed to disconnect from MongoDB:', error.message);
    throw error;
  }
}

/**
 * Get current database connection status
 */
export function getDBStatus() {
  return {
    connected: mongoose.connection.readyState === 1,
    state: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState],
    host: mongoose.connection.host,
    database: mongoose.connection.db?.databaseName,
  };
}

export default { connectDB, disconnectDB, getDBStatus };
