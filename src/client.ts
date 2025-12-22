import assert from 'assert';
import got, {Got, type BeforeRequestHook, type AfterResponseHook} from 'got';
import type {Logging} from 'homebridge';
import {DEFAULT_APP_ID, DEFAULT_HOSTNAME, DEFAULT_USER_AGENT, HOMEBRIDGE_FRISQUET_CONNECT_PASSWORD} from './config/env';
import {FrisquetConnectPlatformConfig} from './platform';
import {asyncWait, calculateDelay} from './utils/async';
import debug from './utils/debug';
import {decode} from './utils/hash';

export type Client = Got & {
  login: () => Promise<{token: string; utilisateur: Record<string, unknown>}>;
};

type LoginResponse = {utilisateur: Record<string, unknown>; token: string};

const clientFactory = (log: Logging, config: FrisquetConnectPlatformConfig): Client => {
  const {hostname = DEFAULT_HOSTNAME, username, password: configPassword} = config;
  assert(hostname, 'Missing "hostname" config field for platform');
  assert(username, 'Missing "username" config field for platform');
  const password = HOMEBRIDGE_FRISQUET_CONNECT_PASSWORD ? decode(HOMEBRIDGE_FRISQUET_CONNECT_PASSWORD) : configPassword;
  assert(password, 'Missing "password" config field for platform');
  debug(`Creating FrisquetConnect client with username="${username}" and hostname="${hostname}"`);

  const retryState = {attemptCount: 0};

  const instance = got.extend({
    prefixUrl: hostname,
    headers: {
      'user-agent': DEFAULT_USER_AGENT
    },
    hooks: {
      beforeRequest: [
        ((options) => {
          const {method, url} = options;
          debug(`About to request url="${url}" with method="${method}"`);
        }) satisfies BeforeRequestHook
      ],
      afterResponse: [
        (async (response, retryWithMergedOptions) => {
          const {statusCode, url} = response;
          debug(`Received a statusCode=${statusCode} for request url="${url}"`);
          // Unauthorized
          if ([401, 403].includes(statusCode)) {
            log.warn(`Encountered an UnauthorizedError with statusCode="${statusCode}", will retry`);
            try {
              retryState.attemptCount++;
              await asyncWait(calculateDelay(retryState));
              debug(`About to retry for the ${retryState.attemptCount}-th time`);
              // Attempt a new login
              const {token} = await instance.login();
              const updatedOptions = setDefaultToken(token);
              debug(`About to retry with token=${token}, updatedOptions=${JSON.stringify(updatedOptions)}`);
              // Make a new retry
              await asyncWait(500);
              return retryWithMergedOptions(updatedOptions);
            } catch (err) {
              const error = err as Error;
              log.warn(`Failed to retry with error: ${error.name}`);
              log.debug(error.stack || String(error));
            }
          } else if (![200, 201].includes(statusCode)) {
            log.warn(`Encountered an UnknownError with statusCode="${statusCode}"`);
          }
          // No changes otherwise
          return response;
        }) satisfies AfterResponseHook
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

  const setDefaultToken = (token: string) => {
    // Prepare updated options
    const updatedOptions = {
      searchParams: {
        token
      }
    };
    // Save for further requests
    instance.defaults.options.merge(updatedOptions);
    return updatedOptions;
  };

  const clearDefaultToken = () => {
    const {searchParams} = instance.defaults.options;
    if (searchParams instanceof URLSearchParams) {
      searchParams.delete('token');
    }
  };

  instance.login = async () => {
    const searchParams = {appId: DEFAULT_APP_ID};
    clearDefaultToken();
    const {body} = await instance.post<LoginResponse>('authentifications', {
      json: {
        locale: 'fr',
        email: username,
        password,
        type_client: 'IOS'
      },
      searchParams
    });
    assert(body.token, 'Unexpected missing token in body response');
    setDefaultToken(body.token);
    return body;
  };

  return instance;
};

export default clientFactory;
