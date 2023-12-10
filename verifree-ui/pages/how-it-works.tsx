import { Box, Text, Container, Heading, List, ListItem, OrderedList, Link, Image } from "@chakra-ui/react";
import NextLink from "next/link";
import NextImage from "next/image";
import { NAV_ITEMS } from "@/types";

export default function HowItWorks() {
    return (
        <Container maxW="container.4xl" p={{ sm: 16, md: 20 }}>
            <Heading as="h1" size="xl">How VeriFree Works</Heading>
            <OrderedList py={4} spacing={4}>
                <ListItem>
                    <Text size="lg">Download and install the
                        <Link color={"purple"} href="https://devs.polygonid.com/docs/quick-start-demo/#set-up-a-polygon-id-wallet" target="_blank"> PolygonID Wallet </Link>
                        and
                        <Link color={"orange.600"} href="https://support.metamask.io/hc/en-us/articles/360015489531-Getting-started-with-MetaMask" target="_blank"> Metamask Wallet </Link> on your mobile.</Text>
                </ListItem>
                <ListItem>
                    <Text size="lg">Follow the official instruction for both of these wallets.</Text>
                    <Text size="lg">Change the network on the PolygonID wallet to polygon mumbai:</Text>
                    <Image m={4} alt={"PolygonID Switch to Mumbai"} width={250} src={"/polygon-id-sc1.png"} border="1px solid purple" />
                </ListItem>
                <ListItem>
                    <Text size="lg"><Link href="https://wiki.polygon.technology/docs/tools/wallets/metamask/config-polygon-on-metamask/#add-the-polygon-network-manually" target="_blank" color="purple">Add the polygon mumbai testnet to your metamask mobile</Link></Text>
                    <Text size="lg"><Link href="https://faucet.polygon.technology/" target="_blank" color="purple" >Get some testnet MATIC from Polygon mumbai faucet</Link></Text>
                </ListItem>
                <ListItem>
                    <Text size="lg">You can optionally get the <Link color={"orange.600"} href="https://support.metamask.io/hc/en-us/articles/360015489531-Getting-started-with-MetaMask" target="_blank"> Metamask Wallet </Link> browser extension,
                        set up with your <Link href="https://support.metamask.io/hc/en-us/articles/360015489331-How-to-import-an-account" target="_blank" color="orange.600">Private Key</Link> from your Metamask mobile wallet, and add Polygon Mumbai testnet to it.
                    </Text>
                    <Text size="lg">Ensure that you are using the same wallet address/private key for mobile wallet and extension when using VeriFree.</Text>
                </ListItem>
                <ListItem>
                    <Text size="lg">Now you are ready to get verified on VeriFree!</Text>
                    <Text size="lg">Go to the <Link as={NextLink} href="/get-verified" target="_blank" color="blue">Get Verified</Link> page.</Text>
                    <Text size="lg">Connect to VeriFree using your mobile wallet by scanning the RainbowKit Metamask QR Code, or using the metamask browser extension.</Text>
                    <Text size="lg">Enter your email address (before the @), select on of the supported domains, and click on the Get Verified button.</Text>
                    <Text size="lg">Hovering over the Input component will provide helpful tips. Your inputs will look like this.</Text>
                    <Image m={4} alt={"Get Verified"} width={"auto"} src={"/get-verified-sc1.png"} border="1px solid purple" />
                    <Text size="lg">You will receive an email wil further instructions. Note that you cannot use the same email multiple times.</Text>
                    <Text size="lg">Your email is only used to generate a polygonid proof, and the email is not saved or associated with on-chain data.</Text>
                </ListItem>
                <ListItem>
                    <Text size="lg">The email will contain a QR code (only supported by outlook client, you may need to unblock images from the email). Scan the QR code with your PolygonID wallet.</Text>
                    <Text size="lg">You will receive a push notification from PolygonID which will provide a VerifiedStudentCredential to your PolygonID wallet these are kept confidential and not shared with other applications.</Text>
                </ListItem>
                <ListItem>
                    <Text size="lg">Now that you have a VerifiedStudentCredential in your PolygonID wallet, go to the <Link as={NextLink} href="/public-onchain-proof" target="_blank" color="blue">Publish On-Chain Proof</Link> page.</Text>
                    <Text size="lg">Reconnect the same wallet (if not already connected) that you use to generatethe VerifiedStudentCredential and you should see a QR Code and your wallet details: </Text>
                    <Image m={4} alt={"Publish On-Chain Proof"} width={"auto"} src={"/publish-onchain-proof-sc1.png"} border="1px solid purple" />
                </ListItem>
                <ListItem>
                    <Text size="lg">Before scanning the QR code with your PolygonID wallet, ensure that you have selected the same address as specified in the process of getting the VerifiedStudentCredential, or the transaction will fail. </Text>
                    <Text size="lg">Scan the QR code with your Polygon ID wallet and you will be prompted to connect your Metamask wallet and sign the proof submit transaction.</Text>
                    <Text size="lg">Note that you can only publish proof once, and each email is tied up to the address in the VerifiedStudentCredential. So 1 email = 1 address = 1 proof published on chain.</Text>
                </ListItem>
                <ListItem>
                    <Text size="lg">You can verify the transaction on <Link href="https://mumbai.polygonscan.com/" target="_blank" color="purple">Polygon Mumbai Scan</Link> and
                        <Link href="https://ccip.chain.link/" target="_blank" color="blue"> CCIP explorer </Link> the cross-chain tracking using the transaction hash.
                    </Text>
                    <Text size="lg">After around 20-25 minutes, the CCIP message should go through and mint you a VerifiedStudent SoulBoundToken on the Avalanche C-Chain. You can view your VSBT on <Link href="https://testnet.avascan.info/blockchain/c/token/0x06d494344d71Af2146611aA6FAFf8e46959D2292/inventory" target="_blank" color="purple">Avascan</Link>.</Text>
                </ListItem>
                <ListItem>
                    <Text size="lg">You can now use your VSBT to participate in the <Link href={process.env.NEXT_PUBLIC_VERIFREE_DAO_URL ?? "#"} target="_blank" color="red">VeriFree DAO</Link> and
                        <Link as={NextLink} href="/access-verifree-subnet" target="_blank" color="red"> Access the VeriFree Subnet</Link>.</Text>
                </ListItem>
            </OrderedList>
        </Container >
    )
}