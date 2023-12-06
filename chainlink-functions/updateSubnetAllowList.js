// Get arguments from the smart contract
const addressToUpdate = args[0];
const transactionsAllowed = args[1];
const transactionsAdmin = args[2];
const contractsAllowed = args[3];
const contractsAdmin = args[4];
const mintSubnetVSBT = args[5];

// Get the API key from secrets
if (!secrets.apiKey) {
  throw Error(
    "VERIFREE API KEY not set as a secret"
  );
}

// build HTTP request object

const verifreeRequest = Functions.makeHttpRequest({
  url: `https://verifree.vercel.app/api/update-allowlist`,
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-KEY": secrets.apiKey,
  },
  data: {
    address: addressToUpdate,
    transactionsAllowed: transactionsAllowed,
    transactionsAdmin: transactionsAdmin,
    contractsAllowed: contractsAllowed,
    contractsAdmin: contractsAdmin,
    mintSubnetVSBT: mintSubnetVSBT
  },
  timeout: 5000
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
