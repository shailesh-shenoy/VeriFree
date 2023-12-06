// Get arguments from the smart contract
const domainName = args[0];

// Get the API key from secrets
if (!secrets.apiKey) {
  throw Error(
    "VERIFREE API KEY not set as a secret"
  );
}

// build HTTP request object

const verifreeRequest = Functions.makeHttpRequest({
  url: `https://verifree.vercel.app/api/update-validdomains`,
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-KEY": secrets.apiKey,
  },
  data: {
    "domain": domainName,
  },
  timeout: 8000
});

// Make the HTTP request
const verifreeResponse = await verifreeRequest;

// Check for error
if (verifreeResponse.error) {
  throw new Error(`Error while adding ${domainName} to allowed domains via API: ${verifreeResponse.message}`);
}
console.log(`Response: ${verifreeResponse.data.message}`);

// return 1 if request was successful
return Functions.encodeUint256(1);
