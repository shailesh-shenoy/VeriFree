'use client'

import { IssueRequest } from '@/types'
import {
    Box,
    Flex,
    Stack,
    Heading,
    Text,
    Container,
    Input,
    Button,
    SimpleGrid,
    Avatar,
    AvatarGroup,
    useBreakpointValue,
    IconProps,
    Icon,
    InputGroup,
    InputRightAddon,
    Select,
    Tooltip,
    useToast,
} from '@chakra-ui/react'
import axios from 'axios'
import { useEffect, useState } from 'react'
import { fromHex } from 'viem'
import { useAccount } from 'wagmi'

const avatars = [
    {
        name: 'PolygonID',
        url: '/polygon-id-logo.png',
    },
    {
        name: 'Chainlink',
        url: '/chainlink-logo.png',
    },
    {
        name: 'Avalanche',
        url: '/avalanche-logo.png',
    }
]

const Blur = (props: IconProps) => {
    return (
        <Icon
            width={useBreakpointValue({ base: '40vw', md: '40vw', lg: '30vw' })}
            zIndex={useBreakpointValue({ base: -1, md: -1, lg: 0 })}
            height="560px"
            viewBox="0 0 528 560"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            {...props}>
            <circle cx="1" cy="1" r="300" fill="#7b3fe4" />
            <circle cx="244" cy="106" r="120" fill="#e84142" />
            <circle cy="291" r="120" fill="#3c5ecb" />

        </Icon>
    )
}

export default function GetVerified() {
    const { address, isConnected } = useAccount();
    // Convert the ethereum address to a BigNumber and get last 15 digits
    const addressBigInt = address
        ? BigInt(fromHex(address, "bigint"))
        : BigInt(0);
    const addressLast15 = Number(
        addressBigInt ? addressBigInt % BigInt(1000000000000000) : BigInt(0)
    );
    const [studentEmail, setStudentEmail] = useState("");
    const [emailDomain, setEmailDomain] = useState("");
    const [emailDomains, setEmailDomains] = useState(["@northeastern.edu", "@mit.edu", "@harvard.edu", "@umass.edu"]);
    const [loading, setLoading] = useState(false);
    const toast = useToast();

    useEffect(() => {
        axios.get("/api/valid-domains", { timeout: 60000 }).
            then((res) => {
                if (res.data?.length > 0) {
                    setEmailDomains(res.data);
                } else {
                    toast({
                        title: "Error while fetching valid email domains.",
                        description: "The email domain list might not be up to date.",
                        status: "error",
                        duration: 5000,
                        isClosable: true,
                    })
                }
            }).catch((error) => {
                toast({
                    title: "Error while fetching valid email domains.",
                    description: `The email domain list might not be up to date: ${error?.message}`,
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                })
            });
    }, [toast]);

    async function handleSubmit(e: any) {
        e.preventDefault();
        setLoading(true);
        const studentFullEmail = studentEmail + emailDomain;
        console.log(`isConnected: ${isConnected}`);
        const issueRequest: IssueRequest = {
            studentEmail: studentFullEmail,
            address: address?.toString() ?? "",
            addressLast15,
        };
        try {
            const response = await axios.post("/api/verify-email", issueRequest, { timeout: 60000, validateStatus: (status) => status < 500 });
            if (response.status === 200) {
                toast({
                    title: "Email sent successfully!",
                    description: "Please check your student email for further instructions.",
                    status: "success",
                    duration: 5000,
                    isClosable: true,
                })
            } else {
                toast({
                    title: "Email verification failed.",
                    description: response?.data?.message ?? `Email while sending verification email. Status: ${response.statusText}`,
                    status: "warning",
                    duration: 5000,
                    isClosable: true,
                })
            }
        } catch (error: any) {
            toast({
                title: "Email verification failed.",
                description: `Error while sending verification mail: ${error?.response?.data?.message ?? error?.message}`,
                status: "error",
                duration: 5000,
                isClosable: true,
            })
        }
        finally {
            setLoading(false);
        }
    }


    return (
        <Box position={'relative'}>
            <Container
                as={SimpleGrid}
                maxW={'7xl'}
                columns={{ base: 1, md: 2 }}
                spacing={{ base: 10, lg: 32 }}
                py={{ base: 10, sm: 20, lg: 32 }}>
                <Stack spacing={{ base: 10, md: 20 }}>
                    <Heading
                        lineHeight={1.1}
                        fontSize={{ base: '3xl', sm: '4xl', md: '5xl', lg: '6xl' }}>
                        Get verified using PolygonID{' '}
                        <Text as={'span'} bgGradient="linear(to-r, #7b3fe4,#e84142)" bgClip="text">
                            &
                        </Text>{' '}
                        access the VeriFree DAO.
                    </Heading>
                    <Stack direction={'row'} spacing={4} align={'center'}>
                        <AvatarGroup>
                            {avatars.map((avatar) => (
                                <Avatar
                                    key={avatar.name}
                                    name={avatar.name}
                                    src={avatar.url}
                                    // eslint-disable-next-line react-hooks/rules-of-hooks
                                    size={useBreakpointValue({ base: 'xl', md: '2xl' })}
                                    position={'relative'}
                                    zIndex={2}
                                />
                            ))}
                        </AvatarGroup>

                    </Stack>
                </Stack>
                <Stack
                    bg={'gray.50'}
                    rounded={'xl'}
                    p={{ base: 4, sm: 6, md: 8 }}
                    spacing={{ base: 8 }}
                    maxW={{ base: '2xl', md: '2xl' }}>
                    <Stack spacing={4}>
                        <Heading
                            color={'gray.800'}
                            lineHeight={1.1}
                            fontSize={{ base: '2xl', sm: '3xl', md: '4xl' }}>
                            Verification Request

                        </Heading>
                        <Text color={'gray.500'} fontSize={{ base: 'sm', sm: 'md' }}>
                            Your wallet address and email will be used to generate your PolygonID Verified Student Credential.
                            An email will be sent to your student email address with further instructions.
                        </Text>
                    </Stack>
                    <Box as={'form'} mt={4} onSubmit={handleSubmit}>
                        <Stack spacing={4}>
                            <Tooltip
                                hasArrow
                                p={4}
                                placement={'right-start'}
                                label={`Ensure that you use the correct wallet address as only this address will be able to verify the proof on-chain and join the VeriFree DAO.`}
                                bg="gray.700"
                                color="white"

                            >
                                <InputGroup>
                                    <Input placeholder="Wallet Address"
                                        variant={'filled'}
                                        required
                                        bg={'gray.100'}
                                        isReadOnly
                                        color={'gray.500'}
                                        _placeholder={{
                                            color: 'gray.500',
                                        }} value={isConnected ? address : ""} />
                                </InputGroup>
                            </Tooltip>
                            <Tooltip
                                hasArrow
                                p={4}
                                placement={'right-start'}
                                label={`The last 15 digits of your wallet address' BigInt representation. 
                                This number is unique to your wallet address and will be used to prove your Verified Student Credential on-chain.`}
                                bg="gray.700"
                                color="white"
                            >
                                <Input
                                    variant={'filled'}
                                    placeholder="Address Last 15 Digits"
                                    value={addressLast15 ? addressLast15.toString() : ""}
                                    bg={'gray.100'}
                                    color={'gray.500'}
                                    _placeholder={{
                                        color: 'gray.500',
                                    }}
                                    isReadOnly
                                /></Tooltip>
                            <Tooltip
                                hasArrow
                                p={4}
                                placement={'right-start'}
                                label={`Enter a valid email address to receive your Verified Student Credential. Only the listed domain names are allowed.`}
                                bg="gray.700"
                                color="white"
                            >
                                <InputGroup>
                                    <Input
                                        variant={'outline'}
                                        placeholder="email"
                                        color={'gray.500'}
                                        _placeholder={{
                                            color: 'gray.500',
                                        }}
                                        value={studentEmail}
                                        onChange={(e) => setStudentEmail(e.target.value)}
                                        autoComplete="none"
                                    />
                                    <InputRightAddon p={0}><Select bg={'gray.200'} value={emailDomain} onChange={(e: any) => {
                                        setEmailDomain(e.target.value)
                                    }}>
                                        <option value="" disabled>Select Domain</option>
                                        {emailDomains.map((domain) => (
                                            <option key={domain} value={domain}
                                            >{domain}</option>
                                        ))}
                                    </Select></InputRightAddon>
                                </InputGroup>
                            </Tooltip>
                        </Stack>
                        <Tooltip
                            hasArrow
                            p={4}
                            placement={'right-start'}
                            label={`You will receive an email with further instructions to receive your Verified Student Credential if the entered details are valid.`}
                            bg="gray.700"
                            color="white"
                        >
                            <Button
                                type="submit"
                                fontFamily={'heading'}
                                isLoading={loading}
                                mt={8}
                                isDisabled={
                                    addressLast15 === 0 ||
                                    studentEmail.length === 0 ||
                                    !isConnected ||
                                    emailDomain.length === 0
                                }
                                w={'full'}
                                bgGradient="linear(to-r, #7b3fe4,#e84142)"
                                color={'white'}
                                _hover={{
                                    bgGradient: 'linear(to-r, #7b3fe4,#e84142)',
                                    boxShadow: 'xl',
                                }}>
                                Get Verification Email
                            </Button>
                        </Tooltip>
                    </Box>
                </Stack>
            </Container>
            <Blur position={'absolute'} top={-10} left={-10} style={{ filter: 'blur(70px)' }} />
        </Box>
    )
}