import { Button, Flex, Heading, Stack, Text, useBreakpointValue, Image } from "@chakra-ui/react";
import NextLink from "next/link";

export default function Hero() {
    return (
        <Stack
            as={"section"}
            minH={"100vh"}
            direction={{ base: "column", md: "row" }}
            bg="secondary.100"
            color="gray.900"
        >
            <Flex p={8} flex={1} align={"center"} justify={"center"}>
                <Stack spacing={6} w={"full"} maxW={"lg"}>
                    <Heading
                        fontSize={"6xl"}
                        textAlign={{ base: "center", md: "inherit" }}
                    >
                        <Text
                            as={"span"}
                            position={"relative"}
                            fontWeight={700}
                            zIndex={1}
                            _after={{
                                content: "''",
                                width: "full",
                                height: useBreakpointValue({ base: "20%" }),
                                position: "absolute",
                                bottom: 6,
                                left: 0,
                                bg: "primary.400",
                                zIndex: -1,
                            }}
                        >
                            VeriFree -
                        </Text>
                        <br />
                        <Text color={"primary.400"} fontWeight={400} as={"span"}>
                            Free blockchain for Verified Students.
                        </Text>
                    </Heading>
                    <Text fontSize={{ base: "md", lg: "lg" }} color={"gray.600"}>
                        VeriFree is a multi-chain platform with the goal of verifying students on-chain while preserving privacy and empowering them to own a semi-permissioned blockchain.
                    </Text>
                    <Stack direction={{ base: "column", md: "row" }} spacing={4}>
                        <Button
                            as={NextLink}
                            href="/get-verified"
                            rounded={"full"}
                            bg={"gray.800"}
                            color={"white"}
                            _hover={{
                                bg: "green.600",
                            }}
                        >
                            Get Verified
                        </Button>
                        <Button
                            as={NextLink}
                            href="/access-verifree-blockchain"
                            rounded={"full"}
                            variant="outline"
                            colorScheme="gray.900"
                            _hover={{ color: "green.600" }}
                        >
                            Access VeriFree  Blockchain
                        </Button>
                    </Stack>
                </Stack>
            </Flex>
            <Flex flex={1}>
                <Image alt={"Hero Image"} objectFit={"cover"} src={"/hero-image.jpg"} />
            </Flex>
        </Stack>
    )
}