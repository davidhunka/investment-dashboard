import https from 'https';

const API_HOST = 'connection.north-europe.azure.keboola.com';
const API_TOKEN = '67-324-tgyGN1yOzYuKF6DfZ5gXLzsCHE2o5VRj16tacaGW';

const configPayload = {
  "parameters": {
    "autoSuspendAfterSeconds": 900,
    "dataApp": {
      "slug": "investment-dashboard-js",
      "git": {
        "repository": "https://github.com/davidhunka/investment-dashboard.git",
        "private": true,
        "username": "davidhunka",
        "#password": "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",
        "branch": "main"
      }
    }
  },
  "authorization": {
    "app_proxy": {
      "auth_providers": [
        {
          "id": "simpleAuth",
          "type": "password"
        }
      ],
      "auth_rules": [
        {
          "type": "pathPrefix",
          "value": "/",
          "auth_required": true,
          "auth": [
            "simpleAuth"
          ]
        }
      ]
    }
  },
  "storage": {
    "input": {
      "tables": [
        {
          "source": "out.c-investice.PORTFOLIO",
          "destination": "PORTFOLIO.csv",
          "where_column": "",
          "where_values": [],
          "where_operator": "eq",
          "columns": [],
          "keep_internal_timestamp_column": false
        }
      ]
    }
  },
  "runtime": {
    "backend": {
      "size": "tiny"
    }
  }
};

const postData = new URLSearchParams({
  name: 'Investment Dashboard JS',
  description: 'Custom React single-page dashboard for investment tracking',
  configuration: JSON.stringify(configPayload)
}).toString();

const options = {
  hostname: API_HOST,
  path: '/v2/storage/components/keboola.data-apps/configs',
  method: 'POST',
  headers: {
    'X-StorageApi-Token': API_TOKEN,
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Response:', data);
  });
});

req.on('error', (e) => {
  console.error('Error:', e);
});

req.write(postData);
req.end();
