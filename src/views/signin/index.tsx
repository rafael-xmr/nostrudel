import { Avatar, Flex, Heading } from "@chakra-ui/react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { ReloadPrompt } from "../../components/reload-prompt";
import useSubject from "../../hooks/use-subject";
import accountService from "../../services/account";

export default function LoginView() {
  const current = useSubject(accountService.current);
  const location = useLocation();

  if (current) return <Navigate to={location.state?.from ?? "/"} replace />;

  return (
    <>
      <ReloadPrompt />
      <Flex w="full" justifyContent="center">
        <Flex direction="column" alignItems="center" gap="2" maxW="md" w="full" px="4" py="10">
          <Avatar src="/transparent.jpeg" size="lg" flexShrink={0} />
          <Heading size="lg" mb="2">
            Sign in
          </Heading>
          <Outlet />
        </Flex>
      </Flex>
    </>
  );
}
