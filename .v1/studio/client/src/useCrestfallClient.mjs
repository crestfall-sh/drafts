// @ts-check

/**
 * @typedef {import('modules/hs256').token_data} token_data
 */

import React from 'react';
import * as crestfall from '../../../client/index.mjs';

const auth_protocol = window.location.protocol === 'https:' ? 'https' : 'http';
const auth_hostname = window.location.hostname;
const auth_port = 9090;
const anon_token = window['CRESTFALL_ANON_TOKEN'];

// console.log(auth_protocol, auth_hostname, auth_port, anon_token);

const client = crestfall.initialize(auth_protocol, auth_hostname, auth_port, anon_token);

export const useCrestfallClient = () => {

  /**
   * @type {[string, React.Dispatch<string>]}
   */
  const [token, set_token] = React.useState(null);

  /**
   * @type {[token_data, React.Dispatch<token_data>]}
   */
  const [token_data, set_token_data] = React.useState(null);

  React.useEffect(() => {
    /**
     * @type {import('../../../client/index').callback}
     */
    const callback = (current_token, current_token_data) => {
      set_token(current_token);
      set_token_data(current_token_data);
    };
    client.subscribe(callback);
    return () => {
      client.unsubscribe(callback);
    };
  }, []);

  const crestfall_client = React.useMemo(() => ({ client, token, token_data }), [token, token_data]);

  return crestfall_client;
};

export default useCrestfallClient;