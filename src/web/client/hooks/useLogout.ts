import { graphql, useMutation, useRelayEnvironment } from "react-relay";
import { useNavigate } from "react-router-dom";

const useLogoutMutation = graphql`
  mutation useLogoutMutation {
    logout {
        success
    }
  }
`;

export function useLogout() {
    const navigate = useNavigate();
    const environment = useRelayEnvironment();
    const [commitLogout, isLogoutInFlight] = useMutation(useLogoutMutation);

    const handleLogout = () => {
        if (isLogoutInFlight) return;
        commitLogout({
            variables: {},
            onCompleted: () => {
                const store = environment.getStore();
                navigate("/auth/login", { replace: true });
            },
            onError: () => console.error("Failed to log out. Try again."),
        });
    };

    return { handleLogout, isLogoutInFlight };
}
