import { v1 } from '@docker/extension-api-client-types';
import CheckOutlined from '@mui/icons-material/CheckOutlined';
import Close from '@mui/icons-material/Close';
import CloseOutlined from '@mui/icons-material/CloseOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import Launch from '@mui/icons-material/Launch';
import {
  Alert,
  Avatar,
  Badge,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Link,
  Paper,
  Stack,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ASSIGNED_SECRET_PLACEHOLDER,
  getUnsupportedSecretMessage,
  MCP_POLICY_NAME,
} from '../../Constants';
import { useCatalogOperations } from '../../queries/useCatalog';
import { useConfig } from '../../queries/useConfig';
import useDDInfo from '../../queries/useDDInfo';
import { useSecrets } from '../../queries/useSecrets';
import { CatalogItemRichened } from '../../types/catalog';
import ConfigEditor from './ConfigEditor';
import { isEmpty, set } from 'lodash-es';
import getCatalogIconPath from '../../utils/getCatalogIconPath';
import useOAuthProvider from '../../queries/useOAuthProvider';
import { derive } from '../../utils/OAuth';
import { useQueryClient } from '@tanstack/react-query';
import Secrets from '../../Secrets';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`configuration-tabpanel-${index}`}
      aria-labelledby={`configuration-tab-${index}`}
      {...other}
      style={{ padding: '16px 0' }}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

interface ConfigurationModalProps {
  open: boolean;
  onClose: () => void;
  catalogItem: CatalogItemRichened;
  client: v1.DockerDesktopClient;
  registryLoading: boolean;
}

const ConfigurationModal = ({
  open,
  onClose,
  catalogItem,
  client,
  registryLoading,
}: ConfigurationModalProps) => {
  // For some unknown reason, item.registered is not updated right away when the user toggles the switch.
  // This `toggled` state is used to control the switch in the UI. Its main purpose is to do optimistic UI updates.
  // When the user toggles the switch. The `useEffect` hook is used to synchronize the `toggled` state with the `item.registered`
  // prop, which is the source of truth for the registration status of the item. This way, if the `item.registered` prop changes
  // (e.g., due to a successful registration or unregistration), the switch will reflect the correct state.
  const [toggled, setToggled] = useState(catalogItem.registered);
  const { ddInfo, ddInfoLoading } = useDDInfo(client);
  const inputRefs = useRef<HTMLInputElement[]>([]);
  const [localSecrets, setLocalSecrets] = useState<
    { [key: string]: string | undefined } | undefined
  >(undefined);
  const { isLoading: secretsLoading, mutate: mutateSecret } =
    useSecrets(client);

  useEffect(() => {
    setLocalSecrets(
      catalogItem.secrets.reduce(
        (acc, secret) => {
          acc[secret.name] = secret.assigned ? ASSIGNED_SECRET_PLACEHOLDER : '';
          return acc;
        },
        {} as { [key: string]: string | undefined },
      ),
    );
  }, [catalogItem.secrets]);

  const theme = useTheme();

  const { registerCatalogItem, unregisterCatalogItem } =
    useCatalogOperations(client);
  const { configLoading } = useConfig(client);

  useEffect(() => {
    if (!catalogItem.canRegister) {
      setTabValue(1);
    }
  }, [catalogItem.canRegister]);

  const [image, setImage] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (catalogItem.icon) {
      getCatalogIconPath(catalogItem.icon).then((icon) => {
        setImage(icon);
      });
    }
  }, [catalogItem.icon]);

  const toolChipStyle = {
    padding: '2px 8px',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    color: theme.palette.docker.grey[700],
    background: theme.palette.docker.grey[100],
    border: 1,
    borderColor: theme.palette.docker.grey[200],
    textAlign: 'center',
    borderRadius: 1,
    fontFamily: 'Roboto Mono',
    fontSize: 12,
    fontStyle: 'normal',
    fontWeight: 400,
    width: 'fit-content',
  };

  // State for tabs
  const [tabValue, setTabValue] = useState(0);

  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const contributesNoConfigOrSecrets =
    isEmpty(catalogItem.configSchema) && isEmpty(catalogItem.secrets); // TODO(rumpl): add oauth

  if (secretsLoading || registryLoading || configLoading || !localSecrets) {
    return null;
  }

  return (
    <Dialog
      open={open}
      // When onClose is defined, clicking outside the dialog should close it
      onClose={onClose}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>
        <Stack
          direction="row"
          spacing={1}
          sx={{
            width: '100%',
            alignItems: 'center',
          }}
        >
          {
            // TODO: Figure out if catalog icon is actually optional, and if so, find a good fallback.
            catalogItem.icon && (
              <Avatar
                variant="square"
                src={image}
                alt={catalogItem.name}
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 1,
                }}
              />
            )
          }
          {catalogItem.title}
          <Tooltip
            placement="right"
            title={
              !catalogItem.canRegister
                ? 'You must configure the item before it can be used.'
                : ''
            }
          >
            <span>
              <Switch
                disabled={!catalogItem.canRegister}
                checked={toggled}
                onChange={(_event, checked) => {
                  setToggled(checked);
                  catalogItem.registered
                    ? unregisterCatalogItem(catalogItem)
                    : registerCatalogItem(catalogItem);
                }}
              />
            </span>
          </Tooltip>
          <Chips item={catalogItem} />
        </Stack>
      </DialogTitle>
      <IconButton
        onClick={onClose}
        sx={(theme) => ({
          position: 'absolute',
          right: 8,
          top: 8,
          color: theme.palette.grey[500],
        })}
        size="small"
      >
        <Close fontSize="small" />
      </IconButton>
      <DialogContent dividers>
        <Typography
          sx={{ overflow: 'auto', color: 'text.secondary' }}
          variant="body2"
        >
          {catalogItem.description}
        </Typography>
        {catalogItem.readme !== undefined && (
          <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
            <Link
              onClick={() => client.host.openExternal(catalogItem.readme || '')}
              href={catalogItem.readme || ''}
              target="_blank"
            >
              {catalogItem.readme || ''}
              <Launch />
            </Link>
          </Typography>
        )}

        {configLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <CircularProgress />
              <Typography>Loading config...</Typography>
            </Stack>
          </Box>
        ) : (
          <>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 2 }}>
              <Tabs value={tabValue} onChange={handleTabChange}>
                <Tab
                  label={
                    <Typography sx={[tabValue === 0 && { fontWeight: 'bold' }]}>
                      {`Tools (${catalogItem?.tools?.length})`}
                    </Typography>
                  }
                />
                {!contributesNoConfigOrSecrets && (
                  <Tab
                    label={
                      <Badge
                        invisible={catalogItem.canRegister}
                        sx={{ pl: 1, pr: 1 }}
                        variant="dot"
                        color="error"
                      >
                        <Typography
                          sx={[tabValue === 1 && { fontWeight: 'bold' }]}
                        >
                          Configuration
                        </Typography>
                      </Badge>
                    }
                  />
                )}
              </Tabs>
            </Box>
            <TabPanel value={tabValue} index={0}>
              {!catalogItem?.tools?.length && (
                <Typography>No tools available for this item.</Typography>
              )}
              <TableContainer
                component={Paper}
                sx={{ height: 'calc(80vh - 200px)' }}
              >
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(catalogItem.tools || []).map((tool) => (
                      <TableRow key={tool.name}>
                        <TableCell>
                          <Typography
                            key={tool.name}
                            variant="body2"
                            sx={toolChipStyle}
                          >
                            {tool.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {(catalogItem.readme && (
                            <Link
                              onClick={() =>
                                client.host.openExternal(
                                  `${catalogItem.readme}#tool-${tool.name.replaceAll(' ', '-')}`,
                                )
                              }
                              href="#"
                              target="_blank"
                              sx={{ fontSize: 12 }}
                            >
                              Documentation
                              <Launch />
                            </Link>
                          )) || (
                            <Link
                              onClick={() =>
                                client.host.openExternal(
                                  `https://raw.githubusercontent.com/docker/labs-ai-tools-for-devs/refs/heads/main/${new URLSearchParams(catalogItem.ref.split('?')[1]).get('path')}`,
                                )
                              }
                              href="#"
                              target="_blank"
                              sx={{ fontSize: 12 }}
                            >
                              Documentation
                              <Launch />
                            </Link>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </TabPanel>
            <TabPanel value={tabValue} index={1}>
              <Stack
                spacing={1}
                sx={{
                  padding: 1,
                  overflow: 'auto',
                  height: 'calc(80vh - 200px)',
                  minHeight: '180px',
                }}
              >
                <Stack direction="column" spacing={2}>
                  <ConfigEditor catalogItem={catalogItem} client={client} />
                  {catalogItem.secrets && catalogItem.secrets.length > 0 && (
                    <Stack spacing={1}>
                      <Typography variant="subtitle2">Secrets</Typography>
                      {!ddInfo && !ddInfoLoading && (
                        <Alert severity="error">
                          Failed to get Docker Desktop version
                        </Alert>
                      )}
                      {ddInfo && !ddInfo?.hasSecretSupport && (
                        <Alert severity="error">
                          {getUnsupportedSecretMessage(ddInfo?.parsedVersion)}
                        </Alert>
                      )}
                      <Stack>
                        {ddInfo?.hasSecretSupport &&
                          catalogItem.secrets &&
                          catalogItem.secrets?.length > 0 &&
                          catalogItem.secrets.map((secret, index) => {
                            const secretEdited =
                              (secret.assigned &&
                                localSecrets[secret.name] !==
                                  ASSIGNED_SECRET_PLACEHOLDER) ||
                              (!secret.assigned &&
                                localSecrets[secret.name] !== '');
                            return (
                              <Stack
                                key={secret.name}
                                direction="row"
                                spacing={2}
                                sx={{
                                  alignItems: 'center',
                                }}
                              >
                                <TextField
                                  size="small"
                                  inputRef={(element) =>
                                    (inputRefs.current[index] = element)
                                  }
                                  disabled={secret.assigned}
                                  key={secret.name}
                                  label={`${secret.name} (required)`}
                                  value={localSecrets[secret.name]}
                                  fullWidth
                                  onChange={(e) => {
                                    setLocalSecrets({
                                      ...localSecrets,
                                      [secret.name]: e.target.value,
                                    });
                                  }}
                                  type="password"
                                />
                                {secret.assigned && !secretEdited && (
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      setLocalSecrets({
                                        ...localSecrets,
                                        [secret.name]: '',
                                      });
                                      // We need to enable the input to be able to focus on it
                                      inputRefs.current[index].disabled = false;
                                      inputRefs.current[index].focus();
                                      mutateSecret.mutateAsync({
                                        name: secret.name,
                                        value: undefined,
                                        policies: [MCP_POLICY_NAME],
                                      });
                                    }}
                                  >
                                    <EditOutlinedIcon fontSize="small" />
                                  </IconButton>
                                )}
                                {secretEdited &&
                                  localSecrets[secret.name] !== '' && (
                                    <Stack direction="row" spacing={1}>
                                      <IconButton
                                        size="small"
                                        onClick={async () => {
                                          await mutateSecret.mutateAsync({
                                            name: secret.name,
                                            value: localSecrets[secret.name]!,
                                            policies: [MCP_POLICY_NAME],
                                          });
                                        }}
                                      >
                                        <CheckOutlined
                                          fontSize="small"
                                          sx={{ color: 'success.main' }}
                                        />
                                      </IconButton>
                                      <IconButton
                                        size="small"
                                        onClick={async () => {
                                          inputRefs.current[index].focus();
                                          setLocalSecrets({
                                            ...localSecrets,
                                            [secret.name]: '',
                                          });
                                        }}
                                      >
                                        <CloseOutlined
                                          fontSize="small"
                                          sx={{ color: 'error.main' }}
                                        />
                                      </IconButton>
                                    </Stack>
                                  )}
                              </Stack>
                            );
                          })}
                      </Stack>
                      <Authorization
                        client={client}
                        item={catalogItem}
                        image={image}
                      />
                    </Stack>
                  )}
                </Stack>
              </Stack>
            </TabPanel>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

function Chips({ item }: { item: CatalogItemRichened }) {
  const config = item.missingConfig;
  const secrets =
    (item.missingSecrets &&
      item.auth !== undefined &&
      item.missingAuthorization) ||
    item.auth === undefined;
  const auth =
    item.auth !== undefined && item.missingAuthorization && item.missingSecrets;

  return (
    <>
      {secrets && <Chip label="Requires secrets" color="warning" />}
      {config && <Chip label="Requires configuration" color="warning" />}
      {auth && <Chip label="Requires authorization" color="warning" />}
    </>
  );
}

function Authorization({
  client,
  item,
  image,
}: {
  item: CatalogItemRichened;
  client: v1.DockerDesktopClient;
  image: string | undefined;
}) {
  const [working, setWorking] = useState(false);
  const queryClient = useQueryClient();
  const { authorizeOAuthProvider, unauthorizeOAuthProvider } =
    useOAuthProvider(client);

  useEffect(() => {
    function deriveSecret(e: any) {
      derive(client, `oauth2_${e.detail.app}`, item.auth?.target || '');

      queryClient.invalidateQueries({ queryKey: ['catalog'] });
    }

    document.addEventListener('oauth-event', deriveSecret);
    return () => {
      document.removeEventListener('oauth-event', deriveSecret);
    };
  }, [item]);

  if (item.auth === undefined) {
    return null;
  }

  const unauthorize = useCallback(
    async (target: string, provider: string) => {
      setWorking(true);
      await Secrets.deleteSecret(client, `oauth2_${target}`);

      await unauthorizeOAuthProvider(provider).then(() => {
        queryClient.invalidateQueries({ queryKey: ['catalog'] });
      });
      setWorking(false);
    },
    [item],
  );

  return (
    <Stack spacing={1}>
      <Typography variant="subtitle2">OAuth</Typography>
      <Box sx={{ flexGrow: 1 }}>
        <Stack direction="row" spacing={1} width={'100%'} alignItems="center">
          {item.icon && (
            <Avatar
              variant="square"
              src={image}
              alt={item.name}
              sx={{
                width: 40,
                height: 40,
                borderRadius: 1,
              }}
            />
          )}

          <Typography variant="subtitle2">{item.title}</Typography>

          {item.missingAuthorization && (
            <Button
              variant="outlined"
              onClick={() => authorizeOAuthProvider(item.auth?.provider || '')}
            >
              Authorize
            </Button>
          )}

          {!item.missingAuthorization && (
            <Button
              variant="outlined"
              onClick={() =>
                unauthorize(item.auth?.target || '', item.auth?.provider || '')
              }
            >
              Unauthorize
            </Button>
          )}
          {working && <CircularProgress size={16} sx={{ ml: 1 }} />}
        </Stack>
      </Box>
    </Stack>
  );
}

export default ConfigurationModal;
