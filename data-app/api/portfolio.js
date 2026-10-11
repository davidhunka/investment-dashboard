export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const token = process.env.KBC_STORAGE_API_TOKEN || process.env.KBC_TOKEN;

  if (!token) {
    return res.status(500).json({
      error: 'Keboola token missing',
      details: 'Please set KBC_STORAGE_API_TOKEN environment variable in Vercel project settings.'
    });
  }

  try {
    const keboolaUrl = 'https://connection.north-europe.azure.keboola.com/v2/storage/tables/out.c-investice.PORTFOLIO/data-preview?limit=1000';
    const response = await fetch(keboolaUrl, {
      headers: {
        'X-StorageApi-Token': token
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        error: `Keboola Storage API responded with HTTP ${response.status}`,
        details: errorText
      });
    }

    const csvData = await response.text();

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    return res.status(200).send(csvData);
  } catch (err) {
    console.error('Failed to fetch data from Keboola Storage:', err);
    return res.status(502).json({
      error: 'Failed to proxy Keboola portfolio data',
      details: err.message
    });
  }
}
