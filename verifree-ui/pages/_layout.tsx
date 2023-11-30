import { Box } from "@chakra-ui/react";

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <Box as="main" minH="100vh" bg="gray.100" pb="8">
                {children}
            </Box>
            <footer>Footer</footer>
        </>
    )
}