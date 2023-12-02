'use client'

import { VerificationQRCodeData, getVerificationQRCodeSrc } from '@/helpers/verifier-helper';
import {
  Flex,
  Stack,
  Heading,
  Text,
  Input,
  Button,
  Image,
  useColorModeValue,
  createIcon,
  Tooltip,
} from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { fromHex } from 'viem';
import { useAccount } from 'wagmi';

export default function PublishOnchainProof() {
  const { address, isConnected } = useAccount();
  // Convert the ethereum address to a BigNumber and get last 15 digits
  const addressBigInt = address
    ? BigInt(fromHex(address, "bigint"))
    : BigInt(0);
  const addressLast15 = Number(
    addressBigInt ? addressBigInt % BigInt(1000000000000000) : BigInt(0)
  );
  const [loading, setLoading] = useState(false);
  const [verificationQRData, setVerificationQRData] = useState<VerificationQRCodeData>({
    verificationQRCodeJson: 'Connect your wallet to generate a QR code.',
    verificationQRCodeSrc: '',
  });

  useEffect(() => {
    if (addressLast15 > 0) {
      setLoading(true);
      getVerificationQRCodeSrc(addressLast15).then((data) => {
        setVerificationQRData(data);
        setLoading(false);
      });
    }
    else {
      setVerificationQRData({
        verificationQRCodeJson: 'Connect your wallet to generate a QR code.',
        verificationQRCodeSrc: '',
      });
    }
  }
    , [addressLast15]);


  return (
    <Flex
      minH={'100vh'}
      align={'center'}
      justify={'center'}
      p={8}
      bg='gray.50'>
      <Stack
        boxShadow={'2xl'}
        bg="white"
        rounded={'xl'}
        p={10}
        spacing={8}
        align={'center'}>
        <Tooltip
          hasArrow
          p={4}
          placement={'right-start'}
          label={verificationQRData.verificationQRCodeJson}
          bg="gray.700"
          color="white"

        >
          <Image src={verificationQRData.verificationQRCodeSrc} alt={"Verification QR Code"} w={300} h={300} fallbackSrc='https://via.placeholder.com/300' />
        </Tooltip><Stack align={'center'} spacing={2}>
          <Heading
            fontSize={'2xl'}
          >
            On-chain verification
          </Heading>
          <Text fontSize={'lg'} color={'gray.500'}>
            Scan the above QR code with your PolygonID wallet to verify your student credential on-chain.
          </Text>
          <Text fontSize={'lg'} color={'gray.500'}>
            You will be prompted to connect and sign the transaction via Metamask.
          </Text>
        </Stack>
        <Stack spacing={4} direction={{ base: 'column' }} w={'full'}>
          <Tooltip
            hasArrow
            p={4}
            placement={'right-start'}
            label={`Ensure that you use the correct wallet address as only this address will be able to verify the proof on-chain.`}
            bg="gray.700"
            color="white"

          ><Input
              type={'text'}
              readOnly
              placeholder={'Wallet Address'}
              color='gray.800'
              bg='gray.100'
              rounded={4}
              value={address || ''}
              _focus={{
                bg: 'gray.200',
                outline: 'none',
              }}
            />
          </Tooltip>
          <Tooltip
            hasArrow
            p={4}
            placement={'right-start'}
            label={`The last 15 digits of your wallet address' BigInt representation. 
            This number is unique to your wallet address and will be used to prove your Verified Student Credential on-chain.`}
            bg="gray.700"
            color="white"

          ><Input
              type={'text'}
              readOnly
              placeholder={'Address Last 15 digits'}
              color='gray.800'
              bg='gray.100'
              rounded={4}
              value={addressLast15 || ''}
              _focus={{
                bg: 'gray.200',
                outline: 'none',
              }}
            />
          </Tooltip>
        </Stack>
      </Stack>
    </Flex >
  )
}
