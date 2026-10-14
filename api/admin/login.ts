export default async function handler(req: any, res: any) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  const password = body.password;

  if (password === 'ljadmin2020@') {
    return res.status(200).json({
      success: true,
      token: `admin_token_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`,
      expiresAt: Date.now() + 8 * 3600 * 1000,
      message: 'Authenticated successfully.',
    });
  }

  return res.status(401).json({
    success: false,
    error: 'Authentication failed. Incorrect admin password.',
    attemptsRemaining: 2,
  });
}
