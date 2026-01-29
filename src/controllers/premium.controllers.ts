import { Request, Response } from 'express';

import User from '../models/user.model.ts';

interface AuthenticatedRequest extends Request {
  user?: any;
}

export const updatePremiumStatus = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { isPremium, premiumPlan } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // Update premium status
    user.isPremium = isPremium;
    user.subscriptionActive = isPremium;

    if (premiumPlan && ['basic', 'premium', 'enterprise'].includes(premiumPlan)) {
      user.premiumPlan = premiumPlan;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Premium status updated successfully',
      data: {
        isPremium: user.isPremium,
        premiumPlan: user.premiumPlan,
        subscriptionActive: user.subscriptionActive,
      },
    });
  } catch (error) {
    console.error('Error updating premium status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getPremiumStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const user = await User.findById(userId).select('isPremium premiumPlan subscriptionActive');

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        isPremium: user.isPremium || false,
        premiumPlan: user.premiumPlan,
        subscriptionActive: user.subscriptionActive || false,
      },
    });
  } catch (error) {
    console.error('Error getting premium status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
