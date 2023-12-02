
import { getValidDomains } from '@/helpers/email-helper';
import { get } from 'http';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'GET') {
        const validDomains = await getValidDomains();
        return res.status(200).json(validDomains);
    } else {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }
}
