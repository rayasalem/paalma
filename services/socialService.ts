
import { db } from './core/storage';
import { Follow, Like, Comment, Role } from '../types';
import { authService } from './authService';

/**
 * Social Service
 * Handles interactions between Customers and Merchants/Products.
 */
export const socialService = {
  
  // --- Following System ---

  followUser(followerId: string, followingId: string): boolean {
    if (followerId === followingId) return false;
    
    // Check duplication
    const exists = db.follows.some(f => f.followerId === followerId && f.followingId === followingId);
    if (exists) return false;

    const newFollow: Follow = {
      id: `FLW-${Date.now()}`,
      followerId,
      followingId,
      createdAt: Date.now()
    };
    
    db.addItem('follows', newFollow);
    return true;
  },

  unfollowUser(followerId: string, followingId: string): boolean {
    const follow = db.follows.find(f => f.followerId === followerId && f.followingId === followingId);
    if (follow) {
      db.deleteItem('follows', follow.id);
      return true;
    }
    return false;
  },

  isFollowing(followerId: string, followingId: string): boolean {
    return db.follows.some(f => f.followerId === followerId && f.followingId === followingId);
  },

  getFollowersCount(userId: string): number {
    return db.follows.filter(f => f.followingId === userId).length;
  },

  // --- Like System ---

  toggleLike(userId: string, productId: string): boolean {
    const existing = db.likes.find(l => l.userId === userId && l.productId === productId);
    
    if (existing) {
      db.deleteItem('likes', existing.id);
      return false; // unliked
    } else {
      const newLike: Like = {
        id: `LIKE-${Date.now()}`,
        userId,
        productId,
        createdAt: Date.now()
      };
      db.addItem('likes', newLike);
      return true; // liked
    }
  },

  isLiked(userId: string, productId: string): boolean {
    return db.likes.some(l => l.userId === userId && l.productId === productId);
  },

  getLikesCount(productId: string): number {
    return db.likes.filter(l => l.productId === productId).length;
  },

  // --- Comment System ---

  addComment(userId: string, productId: string, text: string): Comment | null {
    if (!text.trim()) return null;
    
    const user = authService.getUserById(userId);
    if (!user || user.role !== Role.CUSTOMER) return null;

    const newComment: Comment = {
      id: `CMT-${Date.now()}`,
      userId,
      productId,
      text: text.trim(),
      createdAt: Date.now(),
      userName: user.name
    };

    db.addItem('comments', newComment);
    return newComment;
  },

  getComments(productId: string): Comment[] {
    return db.comments
      .filter(c => c.productId === productId)
      .sort((a, b) => b.createdAt - a.createdAt)
      .map(c => {
        const u = authService.getUserById(c.userId);
        return { ...c, userName: u ? u.name : 'Unknown User' };
      });
  }
};
