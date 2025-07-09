import Hostel from "../models/hostel.model.js";
import { stripe } from "../server.js";

export const createHostelStripeAccount = async (req, res) => {
    try {
        const user = req.user
        const hostel = await Hostel.findOne({ user_id_owners: user._id });

        if (!hostel) {
            return res.status(400).json({
                message: 'Hostel does not exist!',
                success: false,
            });
        }

        const account = await stripe.accounts.create({ type: 'standard' });

        const accountLink = await stripe.accountLinks.create({
            account: account.id,
            refresh_url: `${process.env.EXPO_PUBLIC_SERVER_ADDRESS}/voltar?hostelId=${hostel._id}`,
            return_url: `${process.env.EXPO_PUBLIC_SERVER_ADDRESS}/api/stripe/success?hostelId=${hostel._id}&accountId=${account.id}`,
            type: 'account_onboarding',
        });

        res.send({ url: accountLink.url });
        
    } catch (error) {
        console.error("Error in createHostelStripeAccount controller", error.message);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

export const finalizeStripeConnection = async (req, res) => {
    const { hostelId, accountId } = req.query;
  
    const hostel = await Hostel.findById(hostelId);
    if (!hostel) {
      return res.status(404).json({ message: 'Hostel not found' });
    }
  
    hostel.stripeAccountId = accountId;
    await hostel.save();

    // DEPLOY ACTION TODO: Change url to hostelapp://
    const redirectUrl = `exp://irwsgfw-marinspira-8081.exp.direct/host/(screens)/events/all`;

    return res.redirect(302, redirectUrl);
  };
  