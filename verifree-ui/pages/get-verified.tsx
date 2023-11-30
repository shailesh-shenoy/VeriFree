import { ConnectButton } from "@rainbow-me/rainbowkit";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { fromHex } from "viem";
import { useEffect, useState } from "react";
import axios from "axios";
import { IssueRequest } from "@/types";
import { Box, Heading, Stack, Text } from "@chakra-ui/react";
import GetVerified from "@/components/GetVerified";

const Home: NextPage = () => {
  // Get the current wallet address from wagmi and set in state
  const { address, isConnected } = useAccount();
  const [studentEmail, setStudentEmail] = useState("");
  const [isClient, setIsClient] = useState(false);

  // Check if client side using useEffect
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Convert the ethereum address to a BigNumber and get last 15 digits
  const addressBigInt = address
    ? BigInt(fromHex(address, "bigint"))
    : BigInt(0);
  const addressLast15 = Number(
    addressBigInt ? addressBigInt % BigInt(1000000000000000) : BigInt(0)
  );

  async function handleSubmit(e: any) {
    e.preventDefault();
    const issueRequest: IssueRequest = {
      studentEmail,
      addressLast15,
      address: address?.toString() ?? "",
    };

    try {
      const response = await axios.post("/api/verify-user", issueRequest);

      if (response.status === 200) {
        alert("Email sent successfully!");
      } else {
        alert(`Email failed to send. Status: ${response.statusText}`);
      }
    } catch (error) {
      alert(`Email failed to send. Error: ${error}`);
    }
  }

  return (
    <GetVerified />
  )
  // return (
  //   <Box as="main" minH="100vh" bg="gray.100" pb="8">
  //     <ConnectButton />

  //     <Heading as="h1">
  //       Get a Verified Student Credential in your PolygonID Wallet
  //     </Heading>

  //     <Stack as="section">
  //       {isConnected && isClient ? (
  //         <div>
  //           <Text>Connected to account: {address}</Text>
  //           <Text>
  //             Address will be presented as a 15 digit number in your Student
  //             Verified Credential : {addressLast15.toString()}
  //           </Text>
  //         </div>
  //       ) : (
  //         <Text>
  //           Use the connect button to verify your account address. Your
  //           account address is required to generate your Student Credential.
  //         </Text>
  //       )}
  //     </Stack>

  //     <form onSubmit={handleSubmit}>
  //       <div>
  //         <label>
  //           Student Email Address:
  //           <input
  //             type="email"
  //             placeholder="Enter your student email address."
  //             value={studentEmail}
  //             onChange={(e) => setStudentEmail(e.target.value)}
  //           />
  //         </label>
  //       </div>
  //       <button
  //         type="submit"
  //         disabled={
  //           addressLast15 === 0 || studentEmail.length === 0 || !isClient
  //         }
  //       >
  //         Generate Student Credential
  //       </button>
  //     </form>
  //   </Box>
  // );
};

export default Home;
