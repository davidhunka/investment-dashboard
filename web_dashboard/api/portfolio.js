export default async function handler(req, res) {
  // Získáme tajné proměnné z Vercelu
  const token = process.env.KEBOOLA_API_TOKEN;
  const tableId = process.env.KEBOOLA_TABLE_ID;
  // Výchozí doména, pokud není nastavena jiná
  const host = process.env.KEBOOLA_HOST || 'connection.eu-central-1.keboola.com';

  if (!token || !tableId) {
    return res.status(500).json({ error: 'Chybí nastavení KEBOOLA_API_TOKEN nebo KEBOOLA_TABLE_ID ve Vercel Environment Variables.' });
  }

  try {
    const url = `https://${host}/v2/storage/tables/${tableId}/data-preview?format=csv`;
    
    // Zavoláme Keboola API
    const response = await fetch(url, {
      headers: {
        'X-StorageApi-Token': token
      }
    });

    if (!response.ok) {
      throw new Error(`Keboola API vrátilo chybu ${response.status}: ${response.statusText}`);
    }

    // Přečteme data z Kebooly jako text
    const csvData = await response.text();
    
    // Vrátíme data dashboardu ve formátu CSV
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    // Nastavíme malou cache (1 minutu), abychom nevolali Keboolu zbytečně moc často při rychlém znovunačtení
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    res.status(200).send(csvData);

  } catch (error) {
    console.error('Chyba při stahování dat z Kebooly:', error);
    res.status(500).json({ error: 'Nepodařilo se stáhnout data z Kebooly.' });
  }
}
