// Get arguments from the smart contract
const message = args[0];

// Get the API key from secrets
if (!secrets.apiKey) {
  throw Error(
    "VERIFREE API KEY not set as a secret"
  );
}

// build HTTP request object

const verifreeRequest = Functions.makeHttpRequest({
  url: `https://verifree.vercel.app/api/update-subnet-allowlist`,
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-KEY": secrets.apiKey,
  },
  data: {
    "message": message,
  },
  timeout: 7000
});

// Make the HTTP request
const verifreeResponse = await verifreeRequest;

// Check for error
if (verifreeResponse.error) {
  throw new Error(`Error while updating subnet access for ${address} via API: ${verifreeResponse.message}`);
}
console.log(`Response: ${verifreeResponse.data.message}`);

// return 2 if request was successful
return Functions.encodeUint256(2);
