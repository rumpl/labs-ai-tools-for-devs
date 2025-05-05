import { useMutation, useQuery } from '@tanstack/react-query';
import { v1 } from '@docker/extension-api-client-types';
import {
  authorizeOAuthApp,
  listOAuthApps,
  unauthorizeOAuthApp,
} from '../utils/OAuth';

const useOAuthProvider = (client: v1.DockerDesktopClient) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['oauth-providers'],
    queryFn: async () => listOAuthApps(client),
    refetchInterval: 1000,
  });
  const authorizeOAuthProvider = useMutation({
    mutationFn: (appId: string) => authorizeOAuthApp(client, appId),
  });
  const unauthorizeOAuthProvider = useMutation({
    mutationFn: (appId: string) => unauthorizeOAuthApp(client, appId),
  });

  return {
    data,
    isLoading,
    error,
    authorizeOAuthProvider: authorizeOAuthProvider.mutateAsync,
    unauthorizeOAuthProvider: unauthorizeOAuthProvider.mutateAsync,
  };
};

export default useOAuthProvider;
