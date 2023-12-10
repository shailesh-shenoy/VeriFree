import { Container, Heading, Link, ListItem, UnorderedList, Text, Image } from "@chakra-ui/react";
import NextLink from "next/link";
export default function AccessVeriFreeSubnet() {
    return (
        <Container maxW="container.4xl" p={{ sm: 16, md: 20 }}>
            <Heading as="h1" size="xl" mb="8">
                Access the VeriFree Subnet
            </Heading>
            <UnorderedList>
                <ListItem>
                    <Text size="lg">If you have not yet verified your student status, please read <Link as={NextLink} href="/how-it-works" target="_blank" color="blue">How it works</Link>, and <Link as={NextLink} href="/get-verified" target="_blank" color="blue">Get Verified</Link>.
                    </Text></ListItem>
                <ListItem>
                    <Text size="lg">Following are the details of the VeriFree Devnet, which is restricted to wallet addresses which have been Verified, and those granted access by the VeriFree DAO.</Text>
                    <Text size="lg">Add a <Link href="https://support.metamask.io/hc/en-us/articles/360043227612-How-to-add-a-custom-network-RPC" color={"orange.600"}>custom network</Link> to your metamask with the following details:
                    </Text>
                    <UnorderedList>
                        <ListItem><strong>Network Name</strong>:VeriFree Subnet</ListItem>
                        <ListItem><strong>RPC URL</strong>: {process.env.NEXT_PUBLIC_SUBNET_RPC_URL}</ListItem>
                        <ListItem><strong>Chain ID</strong>: {process.env.NEXT_PUBLIC_SUBNET_CHAIN_ID}</ListItem>
                        <ListItem><strong>Symbol</strong>: VFT</ListItem>
                        <ListItem><strong>Block Explorer URL</strong>: "(Keep empty)"</ListItem>
                    </UnorderedList>
                </ListItem>
                <ListItem>
                    <Text size="lg">Your metamask network details should look like this:</Text>
                    <Image m={4} alt={"PolygonID Switch to Mumbai"} width={250} src={"/subnet-sc1.png"} border="1px solid orange" />
                </ListItem>
                <ListItem>
                    <Text size="lg">You should have 1000 VFT as balance (FREE) and be able to send transactions or deploy contracts on the VeriFree Subnet once verified!</Text>
                </ListItem>
            </UnorderedList>
        </Container>
    )
}