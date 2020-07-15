'use strict'

const { test } = require('tap')
const { Client } = require('..')
const { createServer } = require('http')

test('pipeline pipelining', (t) => {
  t.plan(7)

  const server = createServer((req, res) => {
    t.strictDeepEqual(req.headers['transfer-encoding'], undefined)
    res.end()
  })

  t.teardown(server.close.bind(server))
  server.listen(0, () => {
    const client = new Client(`http://localhost:${server.address().port}`, {
      pipelining: 2
    })
    t.teardown(client.close.bind(client))

    client.on('disconnect', () => {
      t.fail()
    })

    client.pipeline({
      method: 'GET',
      path: '/'
    }, ({ body }) => body)
      .end()
      .resume()
      .on('end', () => {
        t.strictEqual(client.running, 0)
        client.pipeline({
          method: 'GET',
          path: '/'
        }, ({ body }) => body).end().resume()
        t.strictEqual(client.busy, false)
        client.pipeline({
          method: 'GET',
          path: '/'
        }, ({ body }) => body).end().resume()
        t.strictEqual(client.busy, true)
        t.strictEqual(client.running, 2)
      })
  })
})