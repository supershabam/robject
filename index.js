var redis = require('redis');

function Robject(name, config) {
  var self = this;
  
  this.name = name;
  this.redisClient = redis.createClient(config.port, config.host);
  this.subscriber = redis.createClient(config.port, config.host);
  this.subscriber.subscribe('__ROBJECT__:UPDATE:' + name);
  this.subscriber.on('message', function(channel, message) {
    self.update.call(self);
  });
  
  this.object = {};
}

Robject.prototype.update = function() {
  var self = this;
  this.redisClient.hgetall('__ROBJECT__:' + this.name, function(err, result) {
    self.object = result;
  });
}

Robject.prototype.set = function(key, value, cb) {
  var self = this;
  cb = cb || function() {};
  
  this.redisClient.hset('__ROBJECT__:' + this.name, key, value, function(err) {
    if (err) return cb(err);
    self.redisClient.publish('__ROBJECT__:UPDATE:' + self.name, '', function(err) {
      if (err) return cb(err);
      cb();
    });
  });
}

Robject.prototype.unset = function(key, cb) {
  var self = this;
  cb = cb || function() {};
  
  this.redisClient.hdel('__ROBJECT__:' + this.name, key, function(err) {
    if (err) return cb(err);
    
    self.redisClient.publish('__ROBJECT__:UPDATE:' + self.name, '', cb);
  });
}

Robject.prototype.get = function(key) {
  return this.object[key];
}

module.exports = Robject;
