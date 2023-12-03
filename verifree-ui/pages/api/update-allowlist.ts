
import { updateSubnetAllowList, validAllowList } from '@/helpers/subnet-helper';
import { AllowListSchema } from '@/types';
import { NextApiRequest, NextApiResponse } from 'next';

const updateAllowlist = async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method != 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const ALLOWED_API_KEY = process.env.VERIFREE_API_KEY;
        if (!ALLOWED_API_KEY) {
            return res.status(500).json({ message: 'API key not set' });
        }

        // Check if the API key in header is valid
        const apiKey = req.headers['x-api-key'];
        if (apiKey !== ALLOWED_API_KEY) {
            return res.status(401).json({ message: 'Please send a valid API key' });
        }
        // Example code to update the allowlist
        const allowListToUpdate: AllowListSchema = req.body;
        // Validate the allowListToUpdate object
        if (!validAllowList(allowListToUpdate)) {
            return res.status(400).json({ message: 'Bad Request: Invalid allowlist' });
        }

        // Sleep for random time between 0 and 5 seconds
        const sleepTime = Math.floor(Math.random() * 5000);
        await new Promise((resolve) => setTimeout(resolve, sleepTime));

        const updatedAllowlist = await updateSubnetAllowList(allowListToUpdate);

        res.status(200).json({ message: 'Allowlist updated successfully', allowlist: updatedAllowlist });
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to update allowlist: ', error: error.message });
    }
};

export default updateAllowlist;
