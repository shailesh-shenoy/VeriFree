import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Box } from "@chakra-ui/react";

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <Navbar />
            <Box as="main" minH="100vh" bg="gray.100" pb="8">
                {children}
            </Box>
            <Footer />
        </>
    )
}