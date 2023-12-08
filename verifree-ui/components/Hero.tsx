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
                            fontSize={"7xl"}
                            zIndex={1}
                            bgGradient="linear(to-r, #7b3fe4,#e84142)"
                            bgClip="text"
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
                            bg={"#7b3fe4"}
                            color={"white"}
                            _hover={{
                                bg: "#512997",
                            }}
                        >
                            Get Verified
                        </Button>
                        <Button
                            as={NextLink}
                            href="/access-verifree-blockchain"
                            rounded={"full"}
                            variant="outline"
                            colorScheme={"red"}

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