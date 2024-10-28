import { Button, ButtonProps } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";

// Define the rainbow animation keyframes
const rainbowAnimation = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

// Create a Rainbow Button component
const RainbowButton = ({ onClick, children, ...props }: ButtonProps) => {
  return (
    <Button
      {...props}
      onClick={onClick}
      backgroundSize="300% 300%"
      backgroundImage="linear-gradient(
        50deg,
        #ff0000,
        #ff7300,
        #fffb00,
        #48ff00,
        #00ffd5,
        #002bff,
        #7a00ff,
        #ff00c8,
        #ff0000
      )"
      _hover={{
        transform: "scale(1.05)",
        animation: `${rainbowAnimation} 3s ease infinite`,
      }}
      transition="transform 0.2s ease"
      color="white"
      fontWeight="bold"
      px={8}
      py={4}
      rounded="md"
    >
      {children}
    </Button>
  );
};

export default RainbowButton;
