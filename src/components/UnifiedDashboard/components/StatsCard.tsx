import React from 'react';
import {
  Card,
  CardBody,
  HStack,
  VStack,
  Text,
  Icon,
  useColorModeValue,
} from '@chakra-ui/react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  icon: LucideIcon;
  value: number | string;
  label: string;
  color: string;
  isLoading?: boolean;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  icon,
  value,
  label,
  color,
  isLoading = false,
}) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');

  return (
    <Card 
      bg={cardBg} 
      shadow="sm" 
      borderColor={borderColor} 
      flex="1" 
      minW="200px"
      transition="all 0.2s"
      _hover={{ shadow: 'md', transform: 'translateY(-2px)' }}
    >
      <CardBody>
        <HStack spacing={4}>
          <Icon as={icon} color={`${color}.500`} boxSize={6} />
          <VStack align="start" spacing={1}>
            <Text 
              fontSize="2xl" 
              fontWeight="bold" 
              color={textColor}
              opacity={isLoading ? 0.5 : 1}
            >
              {isLoading ? '...' : value}
            </Text>
            <Text fontSize="sm" color={mutedColor} fontWeight="medium">
              {label}
            </Text>
          </VStack>
        </HStack>
      </CardBody>
    </Card>
  );
};