/**
 * Passport Configuration
 * Sets up OAuth strategies (GitHub, Google) and local authentication
 */

import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { config } from './index.js';
import { Player } from '../models/Player.js';

/**
 * GitHub OAuth Strategy
 */
passport.use(
  new GitHubStrategy(
    {
      clientID: config.oauth.github.clientID,
      clientSecret: config.oauth.github.clientSecret,
      callbackURL: config.oauth.github.callbackURL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Try to find existing user by GitHub ID
        let player = await Player.findOne({
          'oauthProviders.github.id': profile.id,
        });

        if (!player) {
          // Try to find by email
          player = await Player.findOne({ email: profile.emails?.[0]?.value });
          if (player) {
            // Link GitHub to existing account
            player.oauthProviders.github = {
              id: profile.id,
              username: profile.username,
              avatar: profile.photos?.[0]?.value,
            };
            await player.save();
            return done(null, player);
          }

          // Create new player from GitHub profile
          const newPlayer = new Player({
            username: profile.username || `user_${Date.now()}`,
            email: profile.emails?.[0]?.value || `${profile.username}@github.com`,
            displayName: profile.displayName || profile.username,
            avatar: profile.photos?.[0]?.value,
            oauthProviders: {
              github: {
                id: profile.id,
                username: profile.username,
                avatar: profile.photos?.[0]?.value,
              },
            },
          });

          player = await newPlayer.save();
        }

        return done(null, player);
      } catch (error) {
        return done(error);
      }
    }
  )
);

/**
 * Google OAuth Strategy
 */
passport.use(
  new GoogleStrategy(
    {
      clientID: config.oauth.google.clientID,
      clientSecret: config.oauth.google.clientSecret,
      callbackURL: config.oauth.google.callbackURL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Try to find existing user by Google ID
        let player = await Player.findOne({
          'oauthProviders.google.id': profile.id,
        });

        if (!player) {
          // Try to find by email
          player = await Player.findOne({ email: profile.emails?.[0]?.value });
          if (player) {
            // Link Google to existing account
            player.oauthProviders.google = {
              id: profile.id,
              email: profile.emails?.[0]?.value,
              avatar: profile.photos?.[0]?.value,
            };
            await player.save();
            return done(null, player);
          }

          // Create new player from Google profile
          const newPlayer = new Player({
            username: profile.displayName?.toLowerCase().replace(/\s+/g, '_') || `user_${Date.now()}`,
            email: profile.emails?.[0]?.value,
            displayName: profile.displayName,
            avatar: profile.photos?.[0]?.value,
            oauthProviders: {
              google: {
                id: profile.id,
                email: profile.emails?.[0]?.value,
                avatar: profile.photos?.[0]?.value,
              },
            },
          });

          player = await newPlayer.save();
        }

        return done(null, player);
      } catch (error) {
        return done(error);
      }
    }
  )
);

/**
 * Serialize user for session
 */
passport.serializeUser((player, done) => {
  done(null, player._id);
});

/**
 * Deserialize user from session
 */
passport.deserializeUser(async (id, done) => {
  try {
    const player = await Player.findById(id);
    done(null, player);
  } catch (error) {
    done(error);
  }
});

export default passport;
