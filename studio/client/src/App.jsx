// @ts-check

import React from 'react';
import './App.css';
import * as crestfall from '../../../client/index.mjs';

const protocol = window.location.protocol === 'https:' ? 'https' : 'http';
const host = window.location.host;
const port = 5433;

const client = crestfall.initialize(protocol, host, port, '');

const App = () => {
  const [username, set_username] = React.useState('');
  const [password, set_password] = React.useState('');
  const [token, set_token] = React.useState('');
  const sign_in = React.useCallback(() => {
    try {
      alert(`${username} : ${password}`);
    } catch (e) {
      console.error(e);
    }
  }, [username, password]);
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
              placeholder="username"
              className="p-1 border border-slate-800 bg-slate-50 focus:bg-white outline-none"
              value={username}
              onChange={(e) => set_username(e.target.value)}
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
