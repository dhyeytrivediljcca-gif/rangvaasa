import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(200).json({ stalls: [] });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase
      .from('stall_registrations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message, stalls: [] });
    }

    const stalls = (data || []).map((row: any) => ({
      id: String(row.id),
      registration_category: row.registration_category,
      stall_name: row.stall_name,
      owner_full_name: row.owner_full_name,
      stall_type: row.stall_type,
      createdAt: row.created_at,
    }));

    return res.status(200).json({ stalls });
  } catch (err: any) {
    return res.status(500).json({ error: err.message, stalls: [] });
  }
}
