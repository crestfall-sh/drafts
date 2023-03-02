// @ts-check

/**
 * @param {import('../../server/index').uws.TemplatedApp} app
 * @param {import('../../server/index').default} server
 */
export const bind = (app, server) => {

  /**
   * Request Method: GET
   * Request URL Pathname: /
   * Response Status: 200
   * Response Headers Content-Type: text/plain
   * CURL Test: curl http://localhost:8080/
   */
  app.get('/', server.use(async (response) => {
    response.text = 'Hello world!';
  }));

  /**
   * Request Method: POST
   * Request URL Pathname: /example
   * Response Status: 200
   * Response Headers Content-Type: application/json
   * CURL Test: curl -X POST http://localhost:8080/example
   */
  app.post('/example', server.use(async (response, request) => {
    response.json = { request };
  }));

};