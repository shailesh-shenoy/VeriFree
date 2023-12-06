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
};

export default Home;
