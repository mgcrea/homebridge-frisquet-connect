import got, {Got} from 'got';
import {FrisquetConnectPlatformConfig} from './platform';
import {DEFAULT_USER_AGENT, DEFAULT_APP_ID, DEFAULT_HOSTNAME} from './config/env';
import assert from 'assert';
import debug from 'src/utils/debug';

export type Client = Got & {
  login: () => Promise<{token: string; utilisateur: Record<string, unknown>}>;
};

const clientFactory = (log: typeof console, config: FrisquetConnectPlatformConfig): Client => {
  const {hostname = DEFAULT_HOSTNAME, username, password} = config;
  assert(hostname, 'Missing "hostname" config field for platform');
  assert(username, 'Missing "username" config field for platform');
  assert(password, 'Missing "password" config field for platform');
  debug(`Creating FrisquetConnect client with username="${username}" and hostname="${hostname}"`);

  const instance = got.extend({
    prefixUrl: hostname,
    headers: {
      'user-agent': DEFAULT_USER_AGENT
    },
    hooks: {
      beforeRequest: [
        options => {
          const {method, url} = options;
          log.info(`About to request url="${url}" with method="${method}"`);
        }
      ],
      afterResponse: [
        async (response, retryWithMergedOptions) => {
          // Unauthorized
          if ([401, 403].includes(response.statusCode)) {
            log.warn(`Encountered an UnauthorizedError with statusCode="${response.statusCode}"`);
            // Attempt a new login
            const {token} = await instance.login();
            // Prepare updated options
            const updatedOptions = {
              searchParams: {
                token
              }
            };
            // Save for further requests
            instance.defaults.options = got.mergeOptions(instance.defaults.options, updatedOptions);
            // Make a new retry
            return retryWithMergedOptions(updatedOptions);
          } else if (response.statusCode !== 200) {
            log.warn(`Encountered an UnknownError with statusCode="${response.statusCode}"`);
          }

          // No changes otherwise
          return response;
        }
      ]
      // beforeRetry: [
      //   (options, error, retryCount) => {
      //     // This will be called on `retryWithMergedOptions(...)`
      //   }
      // ]
    },
    responseType: 'json',
    mutableDefaults: true
  }) as Client;

  instance.login = async () => {
    const searchParams = {appId: DEFAULT_APP_ID};
    const {body} = await instance.post('authentifications', {
      json: {
        locale: 'fr',
        email: username,
        password,
        type_client: 'IOS' // eslint-disable-line @typescript-eslint/camelcase
      },
      searchParams
    });
    assert(body.token, 'Unexpected missing token in body response');
    return body;
  };

  return instance;
};

export default clientFactory;
