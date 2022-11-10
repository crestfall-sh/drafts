// @ts-check

import React from 'react';
import './App.css';
import * as crestfall from '../../../client/index.mjs';

const auth_protocol = window.location.protocol === 'https:' ? 'https' : 'http';
const auth_hostname = window.location.hostname;
const auth_port = 9090;
const anon_token = window['CRESTFALL_ANON_TOKEN'];

console.log(auth_protocol, auth_hostname, auth_port, anon_token);

const client = crestfall.initialize(auth_protocol, auth_hostname, auth_port, anon_token);

const App = () => {

  const [email, set_email] = React.useState('');
  const [password, set_password] = React.useState('');

  const sign_in = React.useCallback(async () => {
    try {
      console.log(email, password);
      const response = await client.sign_in(email, password);
      console.log({ response });
    } catch (e) {
      console.error(e);
    }
  }, [email, password]);

  React.useEffect(() => {
    /**
     * @type {import('../../../client/index').listener}
     */
    const listener = (token, token_data) => {
      console.log({ token, token_data });
    };
    client.listeners.add(listener);
    return () => {
      client.listeners.delete(listener);
    };
  });

  return (
    <div className="App">
      <div className="p-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            queueMicrotask(sign_in);
          }}
        >
          <div className="flex flex-row justify-start items-center gap-2">
            <input
              type="text"
              placeholder="email"
              className="p-1 border border-slate-800 bg-slate-50 focus:bg-white outline-none"
              value={email}
              onChange={(e) => set_email(e.target.value)}
            />
            <input
              type="password"
              placeholder="password"
              className="p-1 border border-slate-800 bg-slate-50 focus:bg-white outline-none"
              value={password}
              onChange={(e) => set_password(e.target.value)}
            />
            <button
              type="submit"
              className="p-1 border border-slate-800 bg-slate-50 hover:bg-white outline-none"
            >
              Sign-in
            </button>
          </div>
        </form>
      </div>
      <div className="p-4">
        <div className="p-1 text-left text-base font-normal">
          Hello world!
        </div>
        <div className="p-1 text-left text-base font-normal">
          Hello world!
        </div>
        <div className="p-1 text-left text-base font-normal">
          Hello world!
        </div>
      </div>
    </div>
  );
};

export default App;
