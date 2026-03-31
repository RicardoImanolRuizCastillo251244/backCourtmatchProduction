const { expect } = require('chai');
const ioClient = require('socket.io-client');
const jwt = require('jsonwebtoken');
const { server, io } = require('../src/app');

describe('Socket.IO integration', function () {
  this.timeout(10000);

  let srv;
  before((done) => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret';
    srv = server.listen(0, () => done());
  });

  after((done) => {
    try {
      io.close();
    } catch (e) {}
    srv.close(() => done());
  });

  it('should allow authenticated client to join partido room', (done) => {
    const port = srv.address().port;
    const token = jwt.sign({ id: 42, usuario: 'tester' }, process.env.JWT_SECRET);

    const socket = ioClient(`http://localhost:${port}`, {
      auth: { token },
      reconnection: false,
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      socket.emit('joinPartido', { idMatch: 1 }, (ack) => {
        try {
          expect(ack).to.be.an('object');
          expect(ack.ok).to.equal(true);
        } catch (err) {
          socket.close();
          return done(err);
        }
        socket.close();
        done();
      });
    });

    socket.on('connect_error', (err) => done(err));
  });
});
