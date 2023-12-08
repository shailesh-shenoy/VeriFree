
import { updateAllowListInSubnet, validAllowList } from '@/helpers/subnet-helper';
import { AllowListSchema } from '@/types';
import { NextApiRequest, NextApiResponse } from 'next';

const updateSubnetAllowlist = async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
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

        const message = req.body?.message;
        // Validate the allowListToUpdate object
        if (!message) {
            return res.status(400).json({ message: 'Bad Request: Invalid message' });
        }

        const updatedAllowlist = await updateAllowListInSubnet(message);

        res.status(200).json({ message: 'Subnet Allowlist updated.' });
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to update allowlist: ', error: error.message });
    }
};

export default updateSubnetAllowlist;
