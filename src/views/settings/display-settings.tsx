import { useFormContext } from "react-hook-form";
import { Link as RouterLink } from "react-router-dom";
import {
  Flex,
  FormControl,
  FormLabel,
  Switch,
  AccordionItem,
  AccordionPanel,
  AccordionButton,
  Box,
  AccordionIcon,
  FormHelperText,
  Input,
  Select,
  Textarea,
  Link,
} from "@chakra-ui/react";

import { AppSettings } from "../../services/settings/migrations";
import { AppearanceIcon } from "../../components/icons";

export default function DisplaySettings() {
  const { register } = useFormContext<AppSettings>();

  return (
    <AccordionItem>
      <h2>
        <AccordionButton fontSize="xl">
          <AppearanceIcon mr="2" />
          <Box as="span" flex="1" textAlign="left">
            Display
          </Box>
          <AccordionIcon />
        </AccordionButton>
      </h2>
      <AccordionPanel>
        <Flex direction="column" gap="4">
          <FormControl>
            <FormLabel htmlFor="colorMode" mb="0">
              Color Mode
            </FormLabel>
            <Select id="colorMode" {...register("colorMode")}>
              <option value="system">System Default</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </Select>
          </FormControl>
          <FormControl>
            <Flex alignItems="center">
              <FormLabel htmlFor="blurImages" mb="0">
                Blur media from strangers
              </FormLabel>
              <Switch id="blurImages" {...register("blurImages")} />
            </Flex>
            <FormHelperText>
              <span>Enabled: blur media from people you aren't following</span>
            </FormHelperText>
          </FormControl>
          <FormControl>
            <Flex alignItems="center">
              <FormLabel htmlFor="hideUsernames" mb="0">
                Hide Usernames (anon mode)
              </FormLabel>
              <Switch id="hideUsernames" {...register("hideUsernames")} />
            </Flex>
            <FormHelperText>
              <span>
                Enabled: hides usernames and pictures.{" "}
                <Link
                  as={RouterLink}
                  color="blue.500"
                  to="/n/nevent1qqsxvkjgpc6zhydj4rxjpl0frev7hmgynruq027mujdgy2hwjypaqfspzpmhxue69uhkummnw3ezuamfdejszythwden5te0dehhxarjw4jjucm0d5sfntd0"
                >
                  Details
                </Link>
              </span>
            </FormHelperText>
          </FormControl>
          <FormControl>
            <Flex alignItems="center">
              <FormLabel htmlFor="show-content-warning" mb="0">
                Show content warning
              </FormLabel>
              <Switch id="show-content-warning" {...register("showContentWarning")} />
            </Flex>
            <FormHelperText>
              <span>Enabled: shows a warning for notes with NIP-36 Content Warning</span>
            </FormHelperText>
          </FormControl>
          <FormControl>
            <FormLabel htmlFor="muted-words" mb="0">
              Muted words
            </FormLabel>
            <Textarea id="muted-words" {...register("mutedWords")} placeholder="Broccoli, Spinach, Artichoke..." />
            <FormHelperText>
              <span>
                Comma separated list of words, phrases or hashtags you never want to see in notes. (case insensitive)
              </span>
              <br />
              <span>Be careful its easy to hide all notes if you add common words.</span>
            </FormHelperText>
          </FormControl>
        </Flex>
      </AccordionPanel>
    </AccordionItem>
  );
}
